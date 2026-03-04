// Deno is provided by the Supabase Edge Runtime (not Node). Declare for IDE type-checking.
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "heic"]);

function randomFileName(ext: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex}.${ext}`;
}

type Body = {
  token: string;
  fileExt: string;      // "jpg"
  contentType: string;  // "image/jpeg"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: { ...corsHeaders, "Content-Length": "2" },
    });
  }
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: "Missing Supabase env vars" });

    const body = (await req.json()) as Body;
    if (!body?.token) return json(400, { error: "Missing token" });

    const ext = (body.fileExt ?? "").toLowerCase().replace(".", "");
    if (!ALLOWED_EXT.has(ext)) return json(400, { error: "Invalid file extension" });
    if (!body?.contentType?.startsWith("image/")) return json(400, { error: "Invalid contentType" });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // validate session
    const { data: session, error: sessErr } = await supabase
      .from("upload_sessions")
      .select("id, project_id, expires_at, used_at")
      .eq("token", body.token)
      .single();

    if (sessErr || !session) return json(404, { error: "Invalid token" });
    if (session.used_at) return json(410, { error: "Token already used" });

    const expires = new Date(session.expires_at).getTime();
    if (Date.now() > expires) return json(410, { error: "Token expired" });

    const fileName = randomFileName(ext);
    const storagePath = `projects/${session.project_id}/${fileName}`;

    const { data: signed, error: signErr } = await supabase
      .storage
      .from("project-images")
      .createSignedUploadUrl(storagePath);

    if (signErr || !signed) return json(500, { error: signErr?.message ?? "Failed to sign upload" });

    // mark used + persist image reference
    await supabase.from("upload_sessions").update({ used_at: new Date().toISOString() }).eq("id", session.id);
    await supabase.from("project_images").insert({ project_id: session.project_id, storage_path: storagePath });

    return json(200, {
      storagePath,
      signedUrl: signed.signedUrl,
      uploadToken: signed.token,
    });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
