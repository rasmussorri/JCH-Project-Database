declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { handleCorsOptions, json } from "../_shared/cors.ts";

function randomToken(byteLen = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLen));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

interface CreateUploadSessionBody {
  projectId: string;
  password: string;
  appBaseUrl: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
    const TTL_MIN = parseInt(Deno.env.get("UPLOAD_SESSION_TTL_MINUTES") ?? "10", 10);

    if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: "Missing Supabase env vars" });
    if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) return json(500, { error: "ADMIN_PASSWORD not set" });

    const body = (await req.json()) as CreateUploadSessionBody;
    if (!body?.projectId) return json(400, { error: "Missing projectId" });
    if (!body?.password) return json(400, { error: "Missing password" });
    if (!body?.appBaseUrl) return json(400, { error: "Missing appBaseUrl" });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("id, delete_pin_hash")
      .eq("id", body.projectId)
      .single();

    if (fetchErr || !project) return json(404, { error: "Project not found" });

    const isAdmin = body.password === ADMIN_PASSWORD;
    const isPinOk = bcrypt.compareSync(body.password, project.delete_pin_hash);
    if (!isAdmin && !isPinOk) return json(403, { error: "Invalid password" });

    const token = randomToken(24);
    const expiresAt = new Date(Date.now() + TTL_MIN * 60_000).toISOString();

    const { data: session, error: insErr } = await supabase
      .from("upload_sessions")
      .insert({
        project_id: project.id,
        token,
        expires_at: expiresAt,
      })
      .select("token, expires_at")
      .single();

    if (insErr || !session) return json(500, { error: insErr?.message ?? "Failed to create session" });

    const base = body.appBaseUrl.replace(/\/$/, "");
    const uploadUrl = `${base}/upload/${session.token}`;

    return json(200, { token: session.token, expiresAt: session.expires_at, uploadUrl });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
