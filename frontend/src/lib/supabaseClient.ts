import { createClient } from '@supabase/supabase-js';

// In dev, if VITE_SUPABASE_PROXY_TARGET is set, use same origin so Vite can proxy (avoids CORS when gateway blocks OPTIONS)
const supabaseUrl = (
  import.meta.env.DEV && import.meta.env.VITE_SUPABASE_PROXY_TARGET
    ? window.location.origin
    : import.meta.env.VITE_SUPABASE_URL
) as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
