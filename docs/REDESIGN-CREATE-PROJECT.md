# Redesign: "Create Project" Workflow

> **Purpose**: This document is an instruction file for a Cursor agent. It contains the
> full analysis of the current project creation flow, the architecture for the new
> mobile-first creation workflow, ChatGPT integration design, edit-feature design,
> and a step-by-step implementation plan.
>
> **Constraint**: Do not break existing functionality. Prefer adding new modules over
> rewriting large files. Maintain TypeScript types. Follow the existing project
> architecture (features/, services/, hooks/, edge functions).

---

## Table of Contents

1. [Current Workflow Analysis](#1-current-workflow-analysis)
2. [New Architecture Proposal](#2-new-architecture-proposal)
3. [ChatGPT Prompt & Payload Design](#3-chatgpt-prompt--payload-design)
4. [UI/UX Improvements for Project Creation](#4-uiux-improvements-for-project-creation)
5. [Edit Feature Design](#5-edit-feature-design)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Current Workflow Analysis

### 1.1 Flow Diagram

```
User clicks "+ Add Project" button (FilterBar)
 → AddProjectDialog opens (Dialog from shadcn/ui)
 → User fills form: title, description (RichTextEditor/TipTap), category,
   status, start date, team members, technologies, project PIN
 → User clicks "Save project"
 → handleSubmit() in AddProjectDialog
   → Splits team/tech strings, builds CreateProjectPayload
   → Calls onCreate(payload) prop
     → useProjects.handleCreateProject(payload)
       → projectService.createProject(payload)
         → supabase.functions.invoke('create-project', { body: payload })
           → Edge Function: create-project/index.ts
             → Hashes deletePin with bcrypt
             → INSERT into projects (title, description, description_html,
               category, status, started_at, delete_pin_hash)
             → INSERT into project_members (project_id, name, initials)
             → INSERT into project_tech (project_id, tech)
             → Returns { projectId }
       → fetchProjects() re-fetches all projects
       → Resets filters to "All"
 → Dialog closes, new project appears in ProjectGrid
```

### 1.2 Image Upload (Separate Step — After Project Exists)

```
User opens ProjectDetail modal → clicks on UploadLink section
 → Enters project PIN → clicks "Generate upload link"
 → uploadService.createUploadSession(projectId, password, origin)
   → Edge Function: create-upload-session/index.ts
     → Validates PIN via bcrypt or admin password
     → INSERT into upload_sessions (project_id, token, expires_at)
     → Returns { token, expiresAt, uploadUrl }
 → QR code displayed (qrcode.react) + copy/share buttons
 → User scans QR / opens URL on phone → /upload/:token route
   → UploadPage component
     → User selects or captures image
     → signUpload(token, fileExt, contentType)
       → Edge Function: sign-upload/index.ts
         → Validates token, checks expiry, checks used_at
         → Creates signed upload URL for project-images bucket
         → INSERT into project_images (project_id, storage_path)
         → UPDATE upload_sessions SET used_at = now()
         → Returns { signedUrl }
     → PUT signedUrl with file body
     → Upload complete
 → Desktop: useProjects subscribes to postgres_changes on project_images INSERT
   → Re-fetches projects → card updates with new image
```

### 1.3 Key Files

| Layer | File | Role |
|-------|------|------|
| UI | `frontend/src/features/projects/components/AddProjectDialog.tsx` | Create form dialog |
| UI | `frontend/src/components/RichTextEditor.tsx` | TipTap rich text editor |
| UI | `frontend/src/features/uploads/components/UploadPage.tsx` | Phone upload page |
| UI | `frontend/src/features/uploads/components/UploadLink.tsx` | QR code + link generator |
| UI | `frontend/src/features/projects/components/ProjectDetail.tsx` | Project detail modal |
| UI | `frontend/src/features/projects/components/ProjectCard.tsx` | Project card in grid |
| UI | `frontend/src/features/projects/components/ProjectGrid.tsx` | Grid layout |
| UI | `frontend/src/features/projects/components/FilterBar.tsx` | Filter bar + add button slot |
| Service | `frontend/src/features/projects/services/projectService.ts` | Fetch/create/delete projects |
| Service | `frontend/src/features/uploads/services/uploadService.ts` | Upload session + sign |
| Hook | `frontend/src/features/projects/hooks/useProjects.ts` | State, CRUD, realtime subscription |
| Types | `frontend/src/features/projects/types.ts` | `Project`, `CreateProjectPayload` |
| Types | `frontend/src/features/projects/supabaseTypes.ts` | `SupabaseProject` |
| Types | `frontend/src/features/uploads/types.ts` | Upload response types |
| Edge Fn | `supabase/functions/create-project/index.ts` | Insert project + members + tech |
| Edge Fn | `supabase/functions/create-upload-session/index.ts` | Create upload session |
| Edge Fn | `supabase/functions/sign-upload/index.ts` | Sign upload URL + insert image row |
| Edge Fn | `supabase/functions/delete-project/index.ts` | Delete project + images |
| Schema | `docs/database/schema.sql` | All table definitions |
| App | `frontend/src/app/App.tsx` | Routes, layout, wiring |

### 1.4 Current Limitations

1. **Images cannot be added during project creation** — the project must exist first, then the user generates an upload link separately.
2. **No edit functionality** — once created, project data (title, description, etc.) cannot be modified.
3. **Desktop-only form** — the creation dialog is a full desktop form; not mobile-friendly.
4. **Upload sessions are single-use** — each token only allows one image upload; user must re-generate for each image.
5. **Description is manually written** — no AI assistance.

---

## 2. New Architecture Proposal

### 2.1 Concept

```
Desktop: User clicks "Add Project"
 → QR code dialog appears (no form on desktop)
 → QR contains URL to mobile creation page with a creation session token

Phone: User scans QR
 → Mobile-optimized creation page opens at /create/:token
 → Step 1: Project info form (title, problem, goal, tech, status, notes, team, PIN)
 → Step 2: Image upload (multi-image, camera capture)
 → Step 3: Review & submit
 → On submit:
   → Images uploaded to Supabase storage
   → Raw info sent to ChatGPT edge function → returns formatted description
   → Project + members + tech + images saved to database
 → Phone shows "Project created!" confirmation

Desktop: Supabase Realtime detects new project INSERT
 → ProjectGrid updates automatically
```

### 2.2 Creation Session

A new concept: **creation sessions** (distinct from the existing `upload_sessions` which are for adding images to existing projects).

#### Database Table: `creation_sessions`

```sql
CREATE TABLE public.creation_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,        -- NULL until project is created
  project_id uuid,                 -- Set when project is created
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creation_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT creation_sessions_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
```

- Token: random hex string (24 bytes = 48 hex chars), same pattern as existing tokens.
- TTL: 30 minutes (longer than upload sessions since user needs time to fill form).
- No authentication needed to create a session — it's initiated from the desktop app.
- The token itself is the auth. Anyone with the link can create one project.

#### Edge Function: `create-creation-session`

```
POST /functions/v1/create-creation-session
Body: { appBaseUrl: string }
Response: { token, expiresAt, createUrl }
```

- Generates token, inserts into `creation_sessions`, returns URL like `{appBaseUrl}/create/{token}`.
- No PIN required — anyone on the desktop can initiate this (the project PIN is set during creation on the phone).

### 2.3 Desktop QR Dialog

Replace the current `AddProjectDialog` form with a simpler dialog:

```
User clicks "+ Add Project"
 → New dialog: "Create from Phone"
   → Calls create-creation-session edge function
   → Shows QR code + copyable link
   → Shows status indicator: "Waiting for project..."
   → Subscribes to Supabase Realtime on creation_sessions table
     (filter: token = current token, listen for UPDATE where completed_at is set)
   → When completed_at is set → fetch the new project → close dialog → show success
```

### 2.4 Mobile Creation Page

New route: `/create/:token`

A mobile-optimized multi-step form:

**Step 1 — Project Info**
- Project title (required)
- Problem statement (what problem does this solve?)
- Project goal (what is the desired outcome?)
- Technologies used (tag input or comma-separated)
- Development status (In Progress / Testing / Completed)
- Category (text input with datalist suggestions)
- Team members (comma-separated)
- Additional notes (free text)
- Project PIN (required, min 4 chars)

**Step 2 — Images**
- Multi-image upload interface (camera capture + file select)
- Preview grid with remove buttons
- Images stored in browser memory until final submit

**Step 3 — Review & Submit**
- Summary of all entered data
- "Create Project" button
- On submit:
  1. Upload all images to Supabase storage via signed URLs
  2. Send project info to `create-project-with-ai` edge function
  3. Edge function calls ChatGPT API, then saves everything
  4. Returns the new project
  5. Update `creation_sessions.completed_at` and `creation_sessions.project_id`

### 2.5 Desktop ↔ Phone Connection

**How the desktop knows the project was created:**

Option A (recommended): **Supabase Realtime subscription**
- The desktop subscribes to `postgres_changes` on the `creation_sessions` table, filtered by the current token.
- When `completed_at` changes from NULL to a timestamp, the desktop knows the project is done.
- The desktop then calls `fetchProjects()` to refresh the grid.
- This approach is already proven in the codebase — `useProjects` already subscribes to `project_images` changes.

Option B (fallback): **Polling**
- Every 3 seconds, query `creation_sessions` by token to check if `completed_at` is set.
- Simpler but less efficient. Only use if Realtime has issues.

**Recommendation: Use Option A (Supabase Realtime).** The codebase already uses this pattern.

### 2.6 Image Upload During Creation

During creation on the phone, images need to be uploaded before the project exists in the database. Two approaches:

**Approach (recommended): Upload after project is created, in a single atomic flow**

1. Phone collects all form data + selected image files.
2. On submit, the edge function `create-project-with-ai` creates the project first (gets `projectId`).
3. The edge function returns the `projectId` along with signed upload URLs for each image.
4. The phone then uploads each image using the signed URLs.
5. The edge function also inserts rows into `project_images` for each file.

This avoids orphaned images and keeps the flow simple.

**Implementation detail:**
- The phone sends the number of images + their extensions/content-types as part of the create request.
- The edge function creates signed URLs for each and returns them.
- The phone uploads in parallel after receiving the response.

### 2.7 Architecture Summary

```
┌─────────────────────────────────────────────────┐
│                   DESKTOP                        │
│                                                  │
│  "+ Add Project" button                          │
│       │                                          │
│       ▼                                          │
│  CreateFromPhoneDialog                           │
│       │                                          │
│       ├─→ POST create-creation-session           │
│       │   └─→ INSERT creation_sessions           │
│       │   └─→ Returns { token, createUrl }       │
│       │                                          │
│       ├─→ Display QR code                        │
│       │                                          │
│       └─→ Subscribe: Realtime on                 │
│           creation_sessions (token = X)          │
│           └─→ On completed_at set:               │
│               fetchProjects() → grid updates     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                    PHONE                         │
│                                                  │
│  /create/:token                                  │
│       │                                          │
│       ▼                                          │
│  MobileCreatePage                                │
│       │                                          │
│       ├─→ Step 1: Project info form              │
│       ├─→ Step 2: Image selection                │
│       ├─→ Step 3: Review                         │
│       │                                          │
│       ▼                                          │
│  Submit                                          │
│       │                                          │
│       ├─→ POST create-project-with-ai            │
│       │   ├─→ Call OpenAI API (format desc)      │
│       │   ├─→ INSERT projects                    │
│       │   ├─→ INSERT project_members             │
│       │   ├─→ INSERT project_tech                │
│       │   ├─→ Generate signed upload URLs        │
│       │   ├─→ INSERT project_images              │
│       │   ├─→ UPDATE creation_sessions           │
│       │   │   (completed_at, project_id)         │
│       │   └─→ Returns { projectId, uploadUrls }  │
│       │                                          │
│       └─→ PUT each image to its signed URL       │
│           └─→ Phone shows success screen         │
└─────────────────────────────────────────────────┘
```

---

## 3. ChatGPT Prompt & Payload Design

### 3.1 Payload from Phone to Edge Function

```typescript
interface MobileCreateProjectPayload {
  token: string;                // creation session token
  title: string;                // required
  problem: string;              // what problem does this solve?
  goal: string;                 // desired outcome
  technologies: string[];       // e.g. ["React", "Supabase", "Arduino"]
  status: 'In Progress' | 'Testing' | 'Completed';
  category: string;             // e.g. "IoT", "Robotics"
  startDate: string;            // ISO date string
  members: Array<{ name: string; initials: string }>;
  notes: string;                // additional free-text info
  deletePin: string;            // min 4 chars
  images: Array<{               // metadata for files to upload
    fileExt: string;            // e.g. "jpg"
    contentType: string;        // e.g. "image/jpeg"
  }>;
}
```

### 3.2 ChatGPT System Prompt

```
You are a technical writer for a university prototyping lab (JHC Protolab).

You receive raw project information from students and staff, and your job is to
produce a well-structured HTML project description suitable for a project database.

Rules:
- Write in clear, professional English.
- Use HTML formatting: <p>, <strong>, <em>, <ul>/<ol>/<li>.
- Do NOT use <h1>-<h6> tags (the title is displayed separately).
- Structure the description into logical sections using <strong> labels, such as:
  "Problem", "Goal", "Approach", "Current Status".
- Keep the tone informative but accessible.
- If certain fields are empty, skip them gracefully — do not mention missing data.
- Keep the total description concise: aim for 100–250 words.
- Do not invent information. Only use what is provided.
```

### 3.3 ChatGPT User Prompt (constructed in edge function)

```
Write a project description based on the following information:

Project Title: {title}
Problem: {problem}
Goal: {goal}
Technologies: {technologies.join(', ')}
Development Stage: {status}
Additional Notes: {notes}
```

### 3.4 ChatGPT API Call (inside edge function)

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  }),
});
```

- Use `gpt-4o-mini` for cost efficiency (descriptions are short).
- Store the API key as `OPENAI_API_KEY` in Supabase Edge Function secrets.
- If the API call fails, fall back to a simple concatenation of the raw fields as plain HTML so the project is still created.

### 3.5 Response Handling

The edge function receives the ChatGPT HTML response and stores it as both:
- `description` — plain text version (strip HTML tags, for search/fallback)
- `description_html` — the full HTML from ChatGPT

---

## 4. UI/UX Improvements for Project Creation

### 4.1 Desktop: CreateFromPhoneDialog

Replace `AddProjectDialog` with `CreateFromPhoneDialog`:

- On open: immediately call `create-creation-session` → show loading spinner.
- Show large QR code (300×300px) centered.
- Below QR: copyable URL + share button.
- Below that: status indicator with animated dots ("Waiting for project to be created...").
- When project is created: green checkmark + "Project created!" + auto-close after 3s.

**Keep the old AddProjectDialog available** as a fallback (e.g., a small "Create from desktop instead" text link at the bottom of the dialog). This ensures the feature isn't broken if QR scanning isn't practical.

### 4.2 Phone: MobileCreatePage

Mobile-first, dark theme (matching existing `bg-slate-950` / `bg-slate-900` palette).

**Step indicator** at the top: `1 ● ● ●` / `● 2 ● ●` / `● ● 3 ●` / `● ● ● 4`

**Step 1 — Basic Info**
| Field | Type | Placeholder / Hint | Required |
|-------|------|--------------------|----------|
| Project Title | text input | "e.g. Smart Greenhouse Monitor" | Yes |
| Category | text input + datalist | "e.g. IoT, Robotics, AR/VR" | No |
| Status | select | In Progress / Testing / Completed | No (default: In Progress) |
| Start Date | date input | defaults to today | No |
| Team Members | text input | "Comma-separated: Ada Lovelace, Alan Turing" | No |
| Technologies | text input | "Comma-separated: React, Arduino, Python" | No |
| Project PIN | password input | "Min 4 characters — needed for edits and uploads" | Yes |

**Step 2 — Describe the Project**
| Field | Type | Placeholder / Hint |
|-------|------|--------------------|
| Problem | textarea | "What problem does this project solve?" |
| Goal | textarea | "What is the desired outcome?" |
| Notes | textarea | "Any extra details, context, or progress updates" |

Show a small note: *"Don't worry about writing perfectly — AI will format your description into a clean summary."*

**Step 3 — Images**
- Large "Add Images" button (full width, dashed border)
- Supports camera capture + file select (same `accept="image/*" capture="environment"` as existing UploadPage)
- Allow multiple images (up to 10)
- Preview grid (2 columns) with remove button on each
- "Skip" link if user doesn't want to add images now

**Step 4 — Review & Submit**
- Card-style summary showing all entered data
- Image thumbnails
- "Create Project" button (large, full width, cyan)
- Loading state with progress: "Generating description..." → "Uploading images..." → "Saving project..."

### 4.3 Shared Components

The phone page reuses:
- `Button` from `ui/button`
- `ImageWithFallback` from `components/ImageWithFallback`
- Dark slate theme colors from Tailwind config

New shared components (if needed):
- `StepIndicator` — shows current step in multi-step form

---

## 5. Edit Feature Design

### 5.1 Overview

Add the ability to edit a project's info and images from the `ProjectDetail` modal.

### 5.2 UI Changes

**ProjectDetail.tsx — Add Edit Button**
- Add an "Edit Project" button in the `DialogFooter`, next to the existing "Delete Project" button.
- Clicking it opens a `PasswordDialog` (reuse existing component) asking for the project PIN.
- On correct PIN, open `EditProjectDialog`.

**EditProjectDialog (new component)**

A dialog/modal similar to `AddProjectDialog` but pre-populated with existing data:

| Field | Pre-filled with | Editable |
|-------|----------------|----------|
| Title | `project.title` | Yes |
| Category | `project.category` | Yes |
| Description | `project.description_html` (in RichTextEditor) | Yes |
| Status | `project.status` | Yes |
| Start Date | `project.startDate` | Yes |
| Team Members | `project.team.join(', ')` | Yes |
| Technologies | `project.technologies.join(', ')` | Yes |

Additional features:
- **"Regenerate description with AI"** button — sends current data to ChatGPT and replaces the description.
  - Opens a sub-form with problem/goal/notes fields (like the mobile creation flow).
  - Calls a `generate-description` edge function.
  - User can preview the AI output before accepting it.
- **Image management**:
  - Show current images with delete buttons (X on each).
  - "Add more images" button opens the existing `UploadLink` flow (QR code for phone upload).
  - Deleting an image removes it from `project_images` and `project-images` storage bucket.

### 5.3 Edge Functions

**`update-project` (new)**

```
POST /functions/v1/update-project
Body: {
  projectId: string,
  password: string,          // project PIN or admin password
  title?: string,
  description_html?: string,
  category?: string,
  status?: string,
  startedAt?: string,
  members?: Array<{ name: string; initials: string }>,
  tech?: string[],
}
```

- Validates PIN (same bcrypt check as `delete-project`).
- Updates `projects` row with provided fields.
- For members and tech: delete all existing rows for this project, then re-insert. This is simpler than diffing.
- Returns `{ success: true }`.

**`delete-project-image` (new)**

```
POST /functions/v1/delete-project-image
Body: {
  projectId: string,
  password: string,
  storagePath: string,
}
```

- Validates PIN.
- Deletes from `project_images` where `project_id` and `storage_path` match.
- Deletes file from `project-images` storage bucket.
- Returns `{ success: true }`.

**`generate-description` (new)**

```
POST /functions/v1/generate-description
Body: {
  title: string,
  problem: string,
  goal: string,
  technologies: string[],
  status: string,
  notes: string,
}
```

- Calls ChatGPT with the same system/user prompt as the creation flow (section 3).
- Returns `{ descriptionHtml: string }`.
- No auth needed (it just generates text, doesn't modify anything).

### 5.4 Types

Add to `frontend/src/features/projects/types.ts`:

```typescript
export interface UpdateProjectPayload {
  projectId: string;
  password: string;
  title?: string;
  description_html?: string;
  category?: string;
  status?: Project['status'];
  startedAt?: string;
  members?: Array<{ name: string; initials: string }>;
  tech?: string[];
}
```

### 5.5 Service Functions

Add to `frontend/src/features/projects/services/projectService.ts`:

```typescript
export async function updateProject(payload: UpdateProjectPayload): Promise<void> { ... }
export async function deleteProjectImage(projectId: string, password: string, storagePath: string): Promise<void> { ... }
export async function generateDescription(data: GenerateDescriptionPayload): Promise<string> { ... }
```

### 5.6 Hook Changes

Add to `useProjects`:

```typescript
const handleUpdateProject = useCallback(async (payload: UpdateProjectPayload) => {
  await projectService.updateProject(payload);
  await fetchProjects();
}, [fetchProjects]);
```

Pass `handleUpdateProject` through `ProjectDetail` to `EditProjectDialog`.

### 5.7 Components That Need Modification

| Component | Change |
|-----------|--------|
| `ProjectDetail.tsx` | Add "Edit" button, wire up edit flow |
| `useProjects.ts` | Add `handleUpdateProject` |
| `projectService.ts` | Add `updateProject`, `deleteProjectImage`, `generateDescription` |
| `types.ts` | Add `UpdateProjectPayload`, `GenerateDescriptionPayload` |
| `App.tsx` | Pass `handleUpdateProject` through props (or keep in `ProjectDetail` via service calls) |

New components:
| Component | Location |
|-----------|----------|
| `EditProjectDialog.tsx` | `frontend/src/features/projects/components/` |

---

## 6. Implementation Plan

### Phase 1: Database & Infrastructure

**Step 1.1 — Add `creation_sessions` table**
- Create migration: `supabase/migrations/add_creation_sessions.sql`
- Add the `creation_sessions` table (see section 2.2).
- Add RLS: anon SELECT on `creation_sessions` (needed for Realtime subscription).
- Update `docs/database/schema.sql` with the new table.

**Step 1.2 — Add Supabase Realtime for `creation_sessions`**
- Ensure the `creation_sessions` table has Realtime enabled (Supabase dashboard or migration).

**Step 1.3 — Store `OPENAI_API_KEY` in Supabase Edge Function secrets**
- Run: `supabase secrets set OPENAI_API_KEY=sk-...`

### Phase 2: Edge Functions

**Step 2.1 — `create-creation-session` edge function**
- New file: `supabase/functions/create-creation-session/index.ts`
- Generates token, inserts into `creation_sessions`, returns `{ token, expiresAt, createUrl }`.
- No auth required.

**Step 2.2 — `create-project-with-ai` edge function**
- New file: `supabase/functions/create-project-with-ai/index.ts`
- Accepts `MobileCreateProjectPayload`.
- Validates creation session token (not expired, not completed).
- Calls OpenAI API to generate description HTML.
- Inserts project, members, tech (same logic as existing `create-project`).
- Generates signed upload URLs for each image.
- Inserts `project_images` rows.
- Updates `creation_sessions` with `completed_at` and `project_id`.
- Returns `{ projectId, uploadUrls: string[] }`.

**Step 2.3 — `update-project` edge function**
- New file: `supabase/functions/update-project/index.ts`
- Accepts `UpdateProjectPayload`.
- Validates PIN.
- Updates project, replaces members and tech.

**Step 2.4 — `delete-project-image` edge function**
- New file: `supabase/functions/delete-project-image/index.ts`
- Validates PIN.
- Deletes image from storage and database.

**Step 2.5 — `generate-description` edge function**
- New file: `supabase/functions/generate-description/index.ts`
- Accepts project info fields, calls ChatGPT, returns HTML.

### Phase 3: Frontend — Mobile Creation Page

**Step 3.1 — Types**
- Add to `frontend/src/features/projects/types.ts`:
  - `MobileCreateProjectPayload`
  - `MobileCreateProjectResponse`
- Add `GenerateDescriptionPayload` type.

**Step 3.2 — Service functions**
- Add to `frontend/src/features/projects/services/projectService.ts`:
  - `createCreationSession(appBaseUrl: string): Promise<{ token, createUrl }>`
  - `createProjectWithAI(payload: MobileCreateProjectPayload): Promise<{ projectId, uploadUrls }>`

**Step 3.3 — MobileCreatePage component**
- New file: `frontend/src/features/create/components/MobileCreatePage.tsx`
- Multi-step form (4 steps) as described in section 4.2.
- Mobile-first responsive design.
- On submit: calls `createProjectWithAI`, then uploads images in parallel.

**Step 3.4 — StepIndicator component** (optional)
- New file: `frontend/src/components/StepIndicator.tsx`
- Simple dot-based step indicator.

**Step 3.5 — Add route**
- In `App.tsx`, add: `<Route path="/create/:token" element={<MobileCreatePage />} />`

### Phase 4: Frontend — Desktop QR Dialog

**Step 4.1 — CreateFromPhoneDialog component**
- New file: `frontend/src/features/projects/components/CreateFromPhoneDialog.tsx`
- Calls `createCreationSession` on open.
- Shows QR code + link.
- Subscribes to Realtime on `creation_sessions`.
- On completion: shows success, triggers `fetchProjects`.

**Step 4.2 — Update FilterBar / App.tsx wiring**
- Replace (or wrap) `AddProjectDialog` in the `addProjectSlot` with `CreateFromPhoneDialog`.
- Keep `AddProjectDialog` accessible as a "Create from desktop" fallback link inside the new dialog.

### Phase 5: Frontend — Edit Feature

**Step 5.1 — Service functions**
- Add `updateProject`, `deleteProjectImage`, `generateDescription` to `projectService.ts`.

**Step 5.2 — Hook updates**
- Add `handleUpdateProject` to `useProjects`.

**Step 5.3 — EditProjectDialog component**
- New file: `frontend/src/features/projects/components/EditProjectDialog.tsx`
- Pre-populated form with existing project data.
- "Regenerate with AI" button.
- Image management (view, delete, add more via upload link).

**Step 5.4 — Update ProjectDetail**
- Add "Edit" button next to "Delete" in footer.
- Wire up PIN verification → open `EditProjectDialog`.

### Phase 6: Testing & Polish

**Step 6.1 — Test creation flow end-to-end**
- Desktop: open dialog → QR appears.
- Phone: scan QR → fill form → upload images → submit.
- Desktop: grid updates automatically.

**Step 6.2 — Test edit flow**
- Open project → click Edit → enter PIN → modify fields → save.
- Test AI regeneration.
- Test image add/remove.

**Step 6.3 — Error handling**
- Expired session tokens → clear error message on phone.
- ChatGPT API failure → fallback to raw text description.
- Image upload failure → retry button, partial success handling.
- Network errors → user-friendly messages.

---

## File Summary: What to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/add_creation_sessions.sql` | New table |
| `supabase/functions/create-creation-session/index.ts` | Session creation |
| `supabase/functions/create-project-with-ai/index.ts` | AI-powered project creation |
| `supabase/functions/update-project/index.ts` | Update project data |
| `supabase/functions/delete-project-image/index.ts` | Delete single image |
| `supabase/functions/generate-description/index.ts` | ChatGPT description generation |
| `frontend/src/features/create/components/MobileCreatePage.tsx` | Phone creation page |
| `frontend/src/features/projects/components/CreateFromPhoneDialog.tsx` | Desktop QR dialog |
| `frontend/src/features/projects/components/EditProjectDialog.tsx` | Edit project dialog |
| `frontend/src/components/StepIndicator.tsx` | Step indicator UI (optional) |

### Modified Files

| File | Change |
|------|--------|
| `frontend/src/features/projects/types.ts` | Add new payload/response types |
| `frontend/src/features/projects/services/projectService.ts` | Add new service functions |
| `frontend/src/features/projects/hooks/useProjects.ts` | Add `handleUpdateProject`, add Realtime for `projects` table |
| `frontend/src/features/projects/components/ProjectDetail.tsx` | Add Edit button + wire up |
| `frontend/src/app/App.tsx` | Add `/create/:token` route, update dialog wiring |
| `docs/database/schema.sql` | Add `creation_sessions` table definition |

### Unchanged Files (preserve as-is)

| File | Reason |
|------|--------|
| `AddProjectDialog.tsx` | Kept as desktop fallback |
| `UploadPage.tsx` | Still used for adding images to existing projects |
| `UploadLink.tsx` | Still used in ProjectDetail and EditProjectDialog |
| `create-project/index.ts` | Still used by desktop fallback AddProjectDialog |
| `create-upload-session/index.ts` | Still used for standalone image uploads |
| `sign-upload/index.ts` | Still used for standalone image uploads |
| `delete-project/index.ts` | Unchanged |
