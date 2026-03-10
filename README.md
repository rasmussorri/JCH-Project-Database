# JHC Project Database

A project database built to showcase and track **LUT University's Protolab J. Hyneman Center's** innovation & prototype projects. Add projects with descriptions, team members, technologies, status, and images; filter and browse in a responsive grid; manage uploads and deletion via PIN; create projects from your phone with optional AI-generated descriptions.

Built with:
- Cursor (Language models used: Auto, Opus 4.6, Sonnet 4.6)
- ChatGPT 5.2 & 5.3 to engineer prompts for Cursor
- Supabase
- Vercel

---

## Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, TypeScript, Vite 7, React Router 7 |
| **UI** | Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) (Radix), TipTap (rich text), Lucide icons, QR codes (`qrcode.react`) |
| **Backend / data** | [Supabase](https://supabase.com/): Postgres, Storage, Edge Functions (Deno), Realtime |
| **Auth / security** | Supabase anon key for client reads; project PIN + optional admin password for mutations; Edge Functions use service role; HTML sanitized with DOMPurify |
| **Deploy** | Vercel (frontend SPA), Supabase Cloud (functions, DB, storage) |

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Project listing with category/status filters |
| `/upload/:token` | Token-based image upload (pick or capture) |
| `/create/:token` | Mobile project creation (multi-step form with optional AI description) |

---

## Features

- **Browse projects** — Responsive grid of cards with image carousels, team avatars, tech badges, and status indicators. Filter by category and status.
- **Add project (desktop)** — Full form with TipTap rich text editor for descriptions.
- **Add project (mobile)** — Scan a QR code from the desktop app to open a multi-step creation flow on your phone, with optional AI-generated descriptions.
- **Edit project** — Update any project field after PIN / admin password verification.
- **Delete project** — Remove a project and its images after PIN / admin password verification.
- **Upload images** — Generate a time-limited upload link (QR or copy URL) for adding images from any device.
- **Realtime** — Desktop view updates automatically when a project is created from mobile or images are uploaded.

---

## Build & deploy

### Frontend

```bash
cd frontend && npm install && npm run build
```

Deploy from `frontend/` with `npx vercel --prod`, or connect the repo to Vercel with **Root Directory** set to `frontend`.

**Required Vercel environment variables:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production (and Preview). Trigger a new deployment after adding them; otherwise the app will throw "Missing Supabase env vars" in the browser.

### Supabase Edge Functions

Deploy from the **project root** (parent of `supabase/`):

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy create-project --no-verify-jwt
npx supabase functions deploy create-project-with-ai --no-verify-jwt
npx supabase functions deploy create-creation-session --no-verify-jwt
npx supabase functions deploy update-project --no-verify-jwt
npx supabase functions deploy delete-project --no-verify-jwt
npx supabase functions deploy delete-project-image --no-verify-jwt
npx supabase functions deploy create-upload-session --no-verify-jwt
npx supabase functions deploy sign-upload --no-verify-jwt
npx supabase functions deploy generate-description --no-verify-jwt
```

See `supabase/functions/README.md` for secrets (e.g. `ADMIN_PASSWORD`, `UPLOAD_SESSION_TTL_MINUTES`).

### Database / migrations

Schema and RLS policies are in `supabase/` (`supabase/migrations/`, `supabase/sql/`). Apply via Supabase Dashboard or CLI as needed.

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `create-project` | Create a project with members, tech, and PIN (bcrypt-hashed) |
| `create-project-with-ai` | Mobile create flow with AI-generated description (OpenAI) |
| `create-creation-session` | Start a mobile creation session, return token and URL |
| `update-project` | Update project fields (PIN validation) |
| `delete-project` | Delete a project and its images (PIN or admin password) |
| `delete-project-image` | Delete a single image (PIN validation) |
| `create-upload-session` | Validate PIN / admin password, create a time-limited upload session |
| `sign-upload` | Validate upload token, return a signed storage URL |
| `generate-description` | AI-generated project description for the mobile form |

---

## Local development

1. **Frontend** — create `frontend/.env`:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   Then:
   ```bash
   npm run dev        # from project root
   # or
   cd frontend && npm run dev
   ```
   If you hit CORS when calling Edge Functions, add `VITE_SUPABASE_PROXY_TARGET` pointing to your Supabase URL and restart the dev server (see `frontend/README.md`).

2. **Edge Functions** — deploy to your linked Supabase project with the commands above, or run locally via Supabase CLI.

---

## Database schema

| Table | Key columns |
|-------|-------------|
| `projects` | `id`, `title`, `description`, `description_html`, `category`, `status`, `started_at`, `contact`, `delete_pin_hash` |
| `project_images` | `id`, `project_id`, `storage_path` |
| `project_members` | `id`, `project_id`, `name`, `initials` |
| `project_tech` | `id`, `project_id`, `tech` |
| `upload_sessions` | `id`, `project_id`, `token`, `expires_at`, `used_at` |
| `creation_sessions` | `id`, `token`, `expires_at`, `completed_at`, `project_id` |

Project statuses: **In Progress**, **Finished**, **History**.  
Storage bucket: `project-images/{project_id}/{random}.{ext}`.  
Full schema reference: `docs/database/schema.sql`.

---

## Docs

- `docs/guidelines.md` — project guidelines
- `docs/database/schema.sql` — full schema reference
- `docs/REDESIGN-CREATE-PROJECT.md` — create workflow spec
- `frontend/README.md` — frontend env, CORS, and tooling
- `supabase/functions/README.md` — Edge Function deploy and env

---

## Attributions

- UI components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).
