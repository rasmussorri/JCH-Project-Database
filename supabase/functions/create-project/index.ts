declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { handleCorsOptions, json } from "../_shared/cors.ts";

const ALLOWED_STATUSES = ["In Progress", "Testing", "Completed"] as const;

interface CreateProjectBody {
  title: string;
  deletePin: string;
  description?: string;
  description_html?: string;
  category?: string;
  status?: string;
  startedAt?: string;
  members?: Array<{ name: string; initials?: string }>;
  tech?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return json(500, { error: "Missing Supabase env vars" });

    const supabase = createClient(url, key);
    const body: CreateProjectBody = await req.json();

    if (!body.title?.trim() || !body.deletePin) {
      return json(400, { error: "Missing title or deletePin" });
    }

    const category =
      typeof body.category === "string" && body.category.trim() !== ""
        ? body.category.trim()
        : "Uncategorized";
    const status =
      typeof body.status === "string" &&
      ALLOWED_STATUSES.includes(body.status as (typeof ALLOWED_STATUSES)[number])
        ? body.status
        : "In Progress";

    let startedAt: string | null = null;
    if (body.startedAt && typeof body.startedAt === "string") {
      const parsed = body.startedAt.trim();
      if (parsed) {
        const match = parsed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (match) {
          startedAt = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
        } else {
          startedAt = parsed;
        }
      }
    }

    const pinHash = bcrypt.hashSync(body.deletePin, 10);

    const rawDescription =
      body.description_html != null
        ? String(body.description_html).trim()
        : body.description != null
          ? String(body.description).trim()
          : "";
    const descriptionValue = rawDescription || "";
    const descriptionHtmlValue = rawDescription || null;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        title: String(body.title).trim(),
        description: descriptionValue,
        description_html: descriptionHtmlValue,
        category,
        status,
        started_at: startedAt,
        delete_pin_hash: pinHash,
      })
      .select("id")
      .single();

    if (error) return json(500, { error: error.message });

    const projectId = data.id;

    const members = Array.isArray(body.members) ? body.members : [];
    if (members.length > 0) {
      const memberRows = members
        .filter((m): m is { name: string; initials?: string } =>
          !!m && typeof m.name === "string",
        )
        .map((m) => ({
          project_id: projectId,
          name: String(m.name).trim(),
          initials:
            typeof m.initials === "string"
              ? m.initials.trim()
              : String(m.name)
                  .trim()
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase(),
        }));
      if (memberRows.length > 0) {
        const { error: membersErr } = await supabase
          .from("project_members")
          .insert(memberRows);
        if (membersErr)
          return json(500, { error: "Failed to save team members: " + membersErr.message });
      }
    }

    const tech = Array.isArray(body.tech) ? body.tech : [];
    if (tech.length > 0) {
      const techRows = tech
        .filter((t): t is string => typeof t === "string" && t.trim() !== "")
        .map((t) => ({ project_id: projectId, tech: t.trim() }));
      if (techRows.length > 0) {
        const { error: techErr } = await supabase
          .from("project_tech")
          .insert(techRows);
        if (techErr)
          return json(500, { error: "Failed to save technologies: " + techErr.message });
      }
    }

    return json(200, { projectId });
  } catch (e) {
    return json(500, { error: String(e) });
  }
});
