// Deno is provided by the Supabase Edge Runtime (not Node). Declare for IDE type-checking.
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

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

Deno.serve(async (req) => {
  // CORS preflight: return 200 + CORS headers (204 can be treated as non-ok by some gateways)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Length": "2",
      },
    });
  }

  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const ALLOWED_STATUSES = ["In Progress", "Testing", "Completed"] as const;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    if (!body.title || !body.deletePin) {
      return json(400, { error: "Missing title or deletePin" });
    }

    const category =
      typeof body.category === "string" && body.category.trim() !== ""
        ? body.category.trim()
        : "Uncategorized";
    const status =
      typeof body.status === "string" && ALLOWED_STATUSES.includes(body.status as typeof ALLOWED_STATUSES[number])
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

    const descriptionHtml =
      body.description_html != null ? String(body.description_html).trim() : "";

    const { data, error } = await supabase
      .from("projects")
      .insert({
        title: String(body.title).trim(),
        description: descriptionHtml || "",
        description_html: descriptionHtml || null,
        category,
        status,
        started_at: startedAt,
        delete_pin_hash: pinHash,
      })
      .select("id")
      .single();

    if (error) return json(500, { error: error.message });

    return json(200, { projectId: data.id });
  } catch (e) {
    return json(500, { error: String(e) });
  }
});
