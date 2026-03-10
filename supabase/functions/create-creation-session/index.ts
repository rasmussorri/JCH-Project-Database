declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsOptions, json } from "../_shared/cors.ts";

const TTL_MINUTES = 30;

function randomToken(byteLen = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLen));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

interface CreateCreationSessionBody {
  appBaseUrl: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY)
      return json(500, { error: "Missing Supabase env vars" });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const body: CreateCreationSessionBody = await req.json();

    if (!body?.appBaseUrl) return json(400, { error: "Missing appBaseUrl" });

    const token = randomToken(24);
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000).toISOString();

    const { error } = await supabase
      .from("creation_sessions")
      .insert({ token, expires_at: expiresAt });

    if (error) return json(500, { error: error.message });

    const base = body.appBaseUrl.replace(/\/$/, "");
    const createUrl = `${base}/create/${token}`;

    return json(200, { token, expiresAt, createUrl });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
