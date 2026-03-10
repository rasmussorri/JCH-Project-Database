declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { handleCorsOptions, json } from "../_shared/cors.ts";

const ALLOWED_STATUSES = ["In Progress", "Finished", "History"] as const;

interface UpdateProjectBody {
  projectId: string;
  password: string;
  title?: string;
  description_html?: string;
  category?: string;
  status?: string;
  startedAt?: string;
  members?: Array<{ name: string; initials: string }>;
  tech?: string[];
  contact?: string;
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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
    const body: UpdateProjectBody = await req.json();

    if (!body?.projectId) return json(400, { error: "Missing projectId" });
    if (!body?.password) return json(400, { error: "Missing password" });

    // Fetch project and validate PIN
    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("id, delete_pin_hash")
      .eq("id", body.projectId)
      .single();

    if (fetchErr || !project) return json(404, { error: "Project not found" });

    const isAdmin = ADMIN_PASSWORD.length >= 8 && body.password === ADMIN_PASSWORD;
    const isPinOk = bcrypt.compareSync(body.password, project.delete_pin_hash);
    if (!isAdmin && !isPinOk) return json(403, { error: "Incorrect password" });

    // Build update object
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description_html !== undefined) {
      updates.description_html = body.description_html;
      updates.description = stripHtmlTags(body.description_html);
    }
    if (body.category !== undefined)
      updates.category = body.category.trim() || "Uncategorized";
    if (body.status !== undefined) {
      updates.status = ALLOWED_STATUSES.includes(
        body.status as (typeof ALLOWED_STATUSES)[number]
      )
        ? body.status
        : "In Progress";
    }
    if (body.startedAt !== undefined) updates.started_at = body.startedAt || null;
    if (body.contact !== undefined) updates.contact = body.contact?.trim() || null;

    if (Object.keys(updates).length > 0) {
      const { error: updErr } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", body.projectId);
      if (updErr) return json(500, { error: updErr.message });
    }

    // Replace members if provided
    if (body.members !== undefined) {
      await supabase
        .from("project_members")
        .delete()
        .eq("project_id", body.projectId);

      const memberRows = (body.members ?? [])
        .filter((m) => m && typeof m.name === "string" && m.name.trim())
        .map((m) => ({
          project_id: body.projectId,
          name: m.name.trim(),
          initials:
            typeof m.initials === "string" && m.initials.trim()
              ? m.initials.trim()
              : m.name
                  .trim()
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase(),
        }));

      if (memberRows.length > 0) {
        const { error: memErr } = await supabase
          .from("project_members")
          .insert(memberRows);
        if (memErr) console.error("Failed to save members:", memErr.message);
      }
    }

    // Replace tech if provided
    if (body.tech !== undefined) {
      await supabase
        .from("project_tech")
        .delete()
        .eq("project_id", body.projectId);

      const techRows = (body.tech ?? [])
        .filter((t): t is string => typeof t === "string" && t.trim() !== "")
        .map((t) => ({ project_id: body.projectId, tech: t.trim() }));

      if (techRows.length > 0) {
        const { error: techErr } = await supabase
          .from("project_tech")
          .insert(techRows);
        if (techErr) console.error("Failed to save tech:", techErr.message);
      }
    }

    return json(200, { success: true });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
