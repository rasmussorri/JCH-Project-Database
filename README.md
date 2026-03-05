# JHC Project Database

This project database was built to showcase and track **LUT University’s Protolab J. Hyneman Center's** innovation & prototype projects. Usage: add projects with descriptions, team, technologies, status, and images; filter and view in a grid; manage uploads and deletion via PIN.

The tech stack:
- Cursor (Language models used: Auto, Opus 4.6, Sonnet 4.6)
- ChatGPT 5.2 & 5.3 to engineer prompts for Cursor
- Supabase
- Vercel

---

## Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, TypeScript, Vite 7, React Router 7 |
| **UI** | Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) (Radix), TipTap (rich text), Lucide icons |
| **Backend / data** | [Supabase](https://supabase.com/): Postgres, Storage, Edge Functions (Deno) |
| **Auth / security** | Supabase anon key for client; project PIN + optional admin password for delete; Edge Functions use service role |

---

## Build & deploy

- **Frontend**  
  - Build: `cd frontend && npm install && npm run build` (output: `frontend/dist`).  
  - Deploy: from **`frontend/`** run `npx vercel --prod`, or connect the repo to Vercel with **Root Directory** set to `frontend`.  
  - **Required in Vercel:** In the project’s **Settings → Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the Production (and Preview) environment. Then trigger a new deployment so the build has access to them; otherwise the app will throw “Missing Supabase env vars” in the browser.

- **Supabase Edge Functions**  
  Deploy from the **project root** (parent of `supabase/`):
  ```bash
  npx supabase link --project-ref YOUR_PROJECT_REF
  npx supabase functions deploy create-project --no-verify-jwt
  npx supabase functions deploy delete-project --no-verify-jwt
  npx supabase functions deploy create-upload-session --no-verify-jwt
  npx supabase functions deploy sign-upload --no-verify-jwt
  ```
  See `supabase/functions/README.md` for secrets (e.g. `ADMIN_PASSWORD` for delete and upload).

- **Database / migrations**  
  Schema and RLS are in `supabase/` (e.g. `supabase/migrations/`, `supabase/sql/`). Apply via Supabase Dashboard or CLI as needed.

---

## Local development

1. **Frontend**  
   In `frontend/` create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Then:
   ```bash
   cd frontend && npm install && npm run dev
   ```
   If you hit CORS when calling Edge Functions, set `VITE_SUPABASE_PROXY_TARGET` to your Supabase URL and restart the dev server (see `frontend/README.md`).

2. **Edge Functions**  
   Deploy to your linked Supabase project with the commands above; run and test locally via Supabase CLI if desired.

---

## Other

- **Rich text / descriptions**  
  Descriptions are edited with TipTap and stored as HTML in `description_html`; the app sanitizes before render. See `frontend/README.md` and `supabase/migrations/add_description_html.sql` if the column is missing.

- **Docs**  
  - `docs/guidelines.md` – project guidelines.  
  - `docs/plans/` – plans and notes.  
  - `frontend/README.md` – frontend env, CORS, and tooling.  
  - `supabase/functions/README.md` – Edge Function deploy and env.

---

## Attributions

- UI components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).
