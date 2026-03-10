declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { handleCorsOptions, json } from "../_shared/cors.ts";

interface DeleteBody {
  projectId: string;
  password: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";

    if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: "Missing Supabase env vars" });
    if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
      return json(500, { error: "ADMIN_PASSWORD not configured (min 8 chars)" });
    }

    const body = (await req.json()) as DeleteBody;
    if (!body?.projectId) return json(400, { error: "Missing projectId" });
    if (!body?.password) return json(400, { error: "Missing password" });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("id, delete_pin_hash")
      .eq("id", body.projectId)
      .single();

    if (fetchErr || !project) return json(404, { error: "Project not found" });

    const isAdmin = body.password === ADMIN_PASSWORD;
    const isPinOk = bcrypt.compareSync(body.password, project.delete_pin_hash);
    if (!isAdmin && !isPinOk) return json(403, { error: "Incorrect password" });

    const projectId = project.id;

    const { data: images } = await supabase
      .from("project_images")
      .select("storage_path")
      .eq("project_id", projectId);

    if (images?.length) {
      const { error: storageErr } = await supabase.storage
        .from("project-images")
        .remove(images.map((i) => i.storage_path));
      if (storageErr) {
        console.error("Failed to remove storage files:", storageErr.message);
      }
    }

    await supabase.from("creation_sessions").delete().eq("project_id", projectId);
    await supabase.from("upload_sessions").delete().eq("project_id", projectId);
    await supabase.from("project_images").delete().eq("project_id", projectId);
    await supabase.from("project_members").delete().eq("project_id", projectId);
    await supabase.from("project_tech").delete().eq("project_id", projectId);

    const { error: delErr } = await supabase.from("projects").delete().eq("id", projectId);
    if (delErr) return json(500, { error: delErr.message });

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
