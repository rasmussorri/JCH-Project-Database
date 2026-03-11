# Edge Functions

This folder is the **only** Edge Functions folder. The Supabase CLI deploys from here (`supabase functions deploy`).

These functions are set up so the **browser** (e.g. `http://localhost:5173`) can call them without CORS errors.

## Deploy

From the **project root** (parent of `supabase/`):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy create-project --no-verify-jwt
npx supabase functions deploy delete-project --no-verify-jwt
npx supabase functions deploy create-upload-session --no-verify-jwt
npx supabase functions deploy sign-upload --no-verify-jwt
```

Use your project ref in place of `YOUR_PROJECT_REF`.

## Environment

Supabase sets **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** automatically.

- **create-project**: Optional **`CREATION_PASSWORD`**. If set, users must send the same value as `creationPassword` in the request body to create a project; otherwise the function returns 403. Use this to gate who can create projects (separate from the per-project PIN).
- **create-project-with-ai**: Same **`CREATION_PASSWORD`** as create-project. If set, mobile creation requires the creation password.
- **verify-creation-password**: Same **`CREATION_PASSWORD`**. Validates the password only (returns 200 or 403). Used by the UI to gate the project creation flow before showing the form.
- **delete-project**: Set **`ADMIN_PASSWORD`** in the function’s secrets (Supabase Dashboard → Edge Functions → delete-project → Settings). Min 8 characters. Users can delete a project with either the project PIN or this admin password.
- **create-upload-session**: Set **`ADMIN_PASSWORD`** (same as above). Optional: **`UPLOAD_SESSION_TTL_MINUTES`** (default `10`).
- **sign-upload**: No extra env vars.

## Shared code

- **`_shared/cors.ts`** – CORS headers; can be imported by functions that want a single source. Current functions inline CORS for simplicity.

## Test a deployed function (404 / "non-2xx")

From a terminal, call your project's Edge Function **without** the app (replace `YOUR_ANON_KEY` and the URL):

```bash
curl -i -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-project" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"title":"Test","deletePin":"1234"}'
```

- **404** and `{"code":"NOT_FOUND",...}`: function not deployed on that project → deploy from this folder with the CLI.
- **200** and JSON: function works; if the app still fails, check the Vite proxy (see below).

## If CORS fails ("does not have HTTP ok status" / preflight blocked)

The Supabase gateway can reject the **OPTIONS** preflight when JWT verification is on. Use one of these:

1. **Recommended: Vite proxy**  
   In the frontend `.env`:
   ```bash
   VITE_SUPABASE_PROXY_TARGET=https://YOUR_PROJECT_REF.supabase.co
   ```
   Restart the dev server. The app then talks to the same origin and Vite proxies `/functions` (etc.) to Supabase.

2. **Deploy with JWT verification disabled**  
   ```bash
   npx supabase functions deploy <function-name> --no-verify-jwt
   ```

3. **Check logs**  
   Supabase → Edge Functions → &lt;function&gt; → Logs. If OPTIONS never appears, the gateway is blocking preflight; use (1) or (2).
