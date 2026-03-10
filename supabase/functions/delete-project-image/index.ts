declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { handleCorsOptions, json } from "../_shared/cors.ts";

interface DeleteImageBody {
  projectId: string;
  password: string;
  storagePath: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
    if (!SUPABASE_URL || !SERVICE_KEY)
      return json(500, { error: "Missing Supabase env vars" });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const body: DeleteImageBody = await req.json();

    if (!body?.projectId) return json(400, { error: "Missing projectId" });
    if (!body?.password) return json(400, { error: "Missing password" });
    if (!body?.storagePath) return json(400, { error: "Missing storagePath" });

    // Validate PIN
    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("id, delete_pin_hash")
      .eq("id", body.projectId)
      .single();

    if (fetchErr || !project) return json(404, { error: "Project not found" });

    const isAdmin = ADMIN_PASSWORD.length >= 8 && body.password === ADMIN_PASSWORD;
    const isPinOk = bcrypt.compareSync(body.password, project.delete_pin_hash);
    if (!isAdmin && !isPinOk) return json(403, { error: "Incorrect password" });

    // Delete from storage
    const { error: storageErr } = await supabase.storage
      .from("project-images")
      .remove([body.storagePath]);

    if (storageErr) {
      console.error("Failed to remove from storage:", storageErr.message);
    }

    // Delete from database
    const { error: dbErr } = await supabase
      .from("project_images")
      .delete()
      .eq("project_id", body.projectId)
      .eq("storage_path", body.storagePath);

    if (dbErr) return json(500, { error: dbErr.message });

    return json(200, { success: true });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
