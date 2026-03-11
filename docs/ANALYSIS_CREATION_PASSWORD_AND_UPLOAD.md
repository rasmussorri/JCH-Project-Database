# Analysis: Creation Password & Android Upload

## STEP 1 — Analysis Output

### 1. Current project creation flow

**Desktop**
- **Entry:** Home → FilterBar → “+ Add Project” opens `CreateFromPhoneDialog`; “Create from desktop instead” sets `showDesktopFallback` and opens `AddProjectDialog`.
- **Form:** `AddProjectDialog` — title, category, description (RichTextEditor), status, start date, team, technologies, contact, **Project PIN** (min 4 chars).
- **Submit:** `handleSubmit` → `onCreate(payload)` → `handleCreateProject` (useProjects) → `projectService.createProject(payload)` → `supabase.functions.invoke('create-project', { body: payload })`.
- **Backend:** Edge function `create-project` validates title + deletePin, hashes PIN with bcrypt, INSERTs into `projects`, `project_members`, `project_tech`; returns `{ projectId }`. No creation password.

**Phone / QR**
- **Entry:** User opens `/create/:token` (from QR or link). Route renders `MobileCreatePage`.
- **Session:** Desktop calls `createCreationSession(origin)` → edge `create-creation-session` → INSERTs `creation_sessions` (token, expires_at), returns `createUrl` + token. No password gating.
- **Form:** `MobileCreatePage` — Step 1: title, category, status, date, team, tech, contact, **Project PIN**; Step 2: problem, goal, notes; Step 3: images; Step 4: review.
- **Submit:** `handleSubmit` → `createProjectWithAI(payload)` → `supabase.functions.invoke('create-project-with-ai', { body: payload })`.
- **Backend:** Edge `create-project-with-ai` validates token, title, PIN length; loads `creation_sessions` (not expired, not completed); optional OpenAI description; INSERTs project, members, tech, project_images rows; signed upload URLs; marks session completed; returns `{ projectId, uploadUrls }`. Client then PUTs image files to signed URLs. No creation password.

**Summary:** Both flows hit edge functions that insert into the DB with no separate “creation” gate. Only the per-project PIN (for later edit/delete/upload) is required at creation.

---

### 2. Current phone image upload flow (QR → add image to existing project)

- **Route:** `/upload/:token` → `UploadPage` (single image).
- **Link generation:** From project detail, user enters Project PIN (or admin password) → `create-upload-session` → returns `uploadUrl` = `${appBaseUrl}/upload/${token}`. QR/link points there.
- **UploadPage:** One hidden `<input type="file" accept="image/*" capture="environment" />`; button “Select image” triggers it; `handleFileSelect` → preview; “Upload image” → `signUpload(token, fileExt, contentType)` → PUT to signed URL. Same component on desktop and mobile.
- **Backend:** `sign-upload` loads `upload_sessions`, validates token, creates signed URL for `project-images` bucket, marks session used, INSERTs `project_images`; frontend PUTs file.

---

### 3. Root cause of insecure/missing creation-password gating

- **Cause:** There is no concept of a “creation password” in the codebase. Only the **per-project PIN** (deletePin) and optional **ADMIN_PASSWORD** (for edit/delete/upload-link/delete-image) exist.
- **Where it’s missing:** Both `create-project` and `create-project-with-ai` accept requests without any check that the user is allowed to create projects. Anyone who can call the edge function (e.g. from the frontend or directly) can create a project. The creation session token only proves “someone opened the QR/link,” not “someone who knows a shared creation secret.”
- **Correct place to enforce:** In the **edge functions** (`create-project`, `create-project-with-ai`), using a server-side secret (e.g. `CREATION_PASSWORD` from env). Frontend should only collect the password and send it in the request; validation must be backend-only so the secret is never in the client.

---

### 4. Root cause of Android camera-only behavior

- **Cause:** The file inputs use **`capture="environment"`** (and on UploadPage also no `multiple`). On many Android devices, `capture="environment"` on `<input type="file" accept="image/*">` tells the OS to use the **camera directly** and often does not show the gallery/document picker. So the user only gets “take photo,” not “choose from gallery.”
- **Where:**  
  - `frontend/src/features/uploads/components/UploadPage.tsx`: `capture="environment"` on the single file input.  
  - `frontend/src/features/create/components/MobileCreatePage.tsx`: same on the Step 3 multi-image input.
- **Copy:** UploadPage says “Select image” and “You can also take a photo directly with your camera,” which implies both options, but the attribute forces camera-only on Android.

---

### 5. Proposed implementation plan

**Feature 1 — Creation password**
- Add **CREATION_PASSWORD** (optional) to edge function env. If set and non-empty:
  - In **create-project** and **create-project-with-ai**: require `body.creationPassword` and reject with 403 if it does not match `CREATION_PASSWORD`. Do not insert project on failure.
  - If `CREATION_PASSWORD` is unset/empty: skip check (backward compatible).
- **Payloads:** Add optional `creationPassword?: string` to `CreateProjectPayload` and `MobileCreateProjectPayload`.
- **Desktop:** In `AddProjectDialog`, add a “Creation password” field (separate from Project PIN); include in payload; surface API error (e.g. “Incorrect creation password”) in the dialog.
- **Phone:** In `MobileCreatePage` Step 1, add “Creation password” field; include in payload; show same error on failed create.
- **Service:** Pass through `creationPassword` in existing `createProject` / `createProjectWithAI` calls; no new endpoints. Ensure error messages from edge functions are shown in the UI.

**Feature 2 — Android upload**
- **UploadPage:**  
  - Remove `capture="environment"` from the main file input so the system picker offers gallery/files (and often camera).  
  - Optionally add a second, camera-only input and a “Take photo” button that triggers it.  
  - Copy: e.g. “Choose from gallery or take a photo” for the main action; if we add “Take photo,” label it explicitly.
- **MobileCreatePage (Step 3):**  
  - Same: remove `capture` from the main “Add Images” input so gallery/files are available.  
  - Optionally add “Take photo” as a separate input with `capture`.  
  - Copy: clarify “Choose from gallery or take a photo” / “Add from gallery” vs “Take photo.”
- Keep existing upload/backend logic unchanged; only input attributes and UX/copy change.

---

## Implementation checklist

- [x] Edge: `create-project` — read CREATION_PASSWORD; validate creationPassword when set.
- [x] Edge: `create-project-with-ai` — same.
- [x] Types: Add `creationPassword?: string` to CreateProjectPayload, MobileCreateProjectPayload.
- [x] AddProjectDialog: creation password field, validation message, pass in payload.
- [x] MobileCreatePage: creation password in Step 1, pass in payload, show error.
- [x] projectService: payloads already forwarded; ensure error message from response is thrown.
- [x] UploadPage: remove capture; optional “Take photo” input; update copy.
- [x] MobileCreatePage Step 3: remove capture; optional “Take photo”; update copy.
- [x] Verify desktop create, phone create, Android gallery, desktop upload, PIN flows unchanged where intended.

---

## STEP 6 — Implementation report

### Root causes found

1. **Creation password:** There was no creation gate. Only the per-project PIN (for later edit/delete/upload) and optional `ADMIN_PASSWORD` existed. Both `create-project` and `create-project-with-ai` accepted requests without checking a shared creation secret.
2. **Android camera-only:** The file inputs used `capture="environment"`, which on many Android devices forces the camera and does not show the gallery/file picker.

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/create-project/index.ts` | Added `CREATION_PASSWORD` env check; require `body.creationPassword` when set; return 403 on mismatch. |
| `supabase/functions/create-project-with-ai/index.ts` | Same creation password check before session validation. |
| `frontend/src/features/projects/types.ts` | Added optional `creationPassword` to both payload types. |
| `frontend/src/features/projects/services/projectService.ts` | `createProject` and `createProjectWithAI` throw with `data.error` so API errors (e.g. "Incorrect creation password") are shown. |
| `frontend/src/features/projects/components/AddProjectDialog.tsx` | Added "Creation password" field (optional in UI); pass in payload; show API error. |
| `frontend/src/features/create/components/MobileCreatePage.tsx` | Creation password in Step 1; Step 3: "Choose from gallery" + "Take photo" inputs, copy updated. |
| `frontend/src/features/uploads/components/UploadPage.tsx` | Two buttons: "Choose from gallery" (no capture), "Take photo" (capture); copy updated. |
| `supabase/functions/README.md` | Documented `CREATION_PASSWORD` for create-project and create-project-with-ai. |
| `README.md` | Mentioned `CREATION_PASSWORD` in secrets reference. |

### How creation password is validated

- **Backend only:** `CREATION_PASSWORD` is read from the edge function environment (Supabase secrets). Never in the frontend.
- **When set:** Both edge functions require `body.creationPassword` and return 403 with `{ error: "Incorrect creation password" }` on mismatch. No project is inserted.
- **When not set:** Check is skipped (backward compatible).
- **UI:** Optional "Creation password" field in desktop and phone flows; API error is shown when server rejects.

### How Android upload was fixed

- **UploadPage:** Removed `capture` from main flow. Two actions: "Choose from gallery" (no capture, system picker: gallery/files) and "Take photo" (camera-only input). Same handler for both.
- **MobileCreatePage Step 3:** Same: main input no capture, second input with capture; buttons "Choose from gallery" / "Add more" and "Take photo". Multi-image unchanged.

### UX copy changes

- **UploadPage:** Subtitle: "Choose an image from your gallery or take a new photo to upload." Buttons: "Choose from gallery", "Take photo." Hint: "On mobile, 'Choose from gallery' lets you pick existing photos or files."
- **MobileCreatePage Step 3:** "Choose from gallery" / "Add more (n/10)", "Take photo." Hint: "Choose existing photos from gallery or take new ones. Up to 10 images."
- **Creation password (desktop + mobile):** Label "Creation password", placeholder "Required if enabled by administrator", helper "Shared password to allow creating new projects (separate from project PIN)."

### Caveats and follow-up

1. **Set `CREATION_PASSWORD` in production** if you want to gate creation: Supabase Dashboard → Edge Functions → create-project and create-project-with-ai → Settings → Secrets.
2. **Optional in UI:** Field is not required so that when `CREATION_PASSWORD` is not set, creation still works. When set, wrong/missing password returns 403 and the message is shown.
3. **Direct API calls:** Enforcement is only in the edge; if `CREATION_PASSWORD` is set, correct value must be sent; no frontend bypass.
4. **Android:** "Choose from gallery" uses system picker; exact options depend on device. "Take photo" explicitly requests camera.
