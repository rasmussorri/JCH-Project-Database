declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { handleCorsOptions, json } from "../_shared/cors.ts";

const ALLOWED_STATUSES = ["In Progress", "Finished", "History"] as const;
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "heic"]);

const SYSTEM_PROMPT = `You are a technical writer for a university prototyping lab (JHC Protolab).

You receive raw project information from students and staff, and your job is to
produce a well-structured HTML project description suitable for a project database.

Rules:
- Write in clear, professional English.
- Use HTML formatting: <p>, <strong>, <em>, <ul>/<ol>/<li>.
- Do NOT use <h1>-<h6> tags (the title is displayed separately).
- Structure the description into logical sections using <strong> labels, such as:
  "Problem", "Goal", "Approach", "Current Status".
- Keep the tone informative but accessible.
- If certain fields are empty, skip them gracefully — do not mention missing data.
- Keep the total description concise: aim for 100–250 words.
- Do not invent information. Only use what is provided.`;

interface MobileCreateBody {
  token: string;
  title: string;
  problem?: string;
  goal?: string;
  technologies?: string[];
  status?: string;
  category?: string;
  startDate?: string;
  members?: Array<{ name: string; initials: string }>;
  notes?: string;
  deletePin: string;
  contact?: string;
  images?: Array<{ fileExt: string; contentType: string }>;
}

function randomFileName(ext: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex}.${ext}`;
}

function buildUserPrompt(body: MobileCreateBody): string {
  const parts = [`Project Title: ${body.title}`];
  if (body.problem?.trim()) parts.push(`Problem: ${body.problem}`);
  if (body.goal?.trim()) parts.push(`Goal: ${body.goal}`);
  if (body.technologies?.length)
    parts.push(`Technologies: ${body.technologies.join(", ")}`);
  if (body.status) parts.push(`Development Stage: ${body.status}`);
  if (body.notes?.trim()) parts.push(`Additional Notes: ${body.notes}`);

  return `Write a project description based on the following information:\n\n${parts.join("\n")}`;
}

function buildFallbackHtml(body: MobileCreateBody): string {
  const sections: string[] = [];
  if (body.problem?.trim())
    sections.push(`<p><strong>Problem:</strong> ${body.problem}</p>`);
  if (body.goal?.trim())
    sections.push(`<p><strong>Goal:</strong> ${body.goal}</p>`);
  if (body.technologies?.length)
    sections.push(
      `<p><strong>Technologies:</strong> ${body.technologies.join(", ")}</p>`
    );
  if (body.notes?.trim())
    sections.push(`<p><strong>Notes:</strong> ${body.notes}</p>`);
  return sections.length > 0 ? sections.join("\n") : "<p></p>";
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function generateDescription(body: MobileCreateBody): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) return buildFallbackHtml(body);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(body) },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error("OpenAI API error:", res.status, await res.text());
      return buildFallbackHtml(body);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim()
      ? content.trim()
      : buildFallbackHtml(body);
  } catch (err) {
    console.error("OpenAI call failed:", err);
    return buildFallbackHtml(body);
  }
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
    const body: MobileCreateBody = await req.json();

    if (!body?.token) return json(400, { error: "Missing token" });
    if (!body?.title?.trim()) return json(400, { error: "Missing title" });
    if (!body?.deletePin || body.deletePin.trim().length < 4)
      return json(400, { error: "PIN must be at least 4 characters" });

    // Validate creation session
    const { data: session, error: sessErr } = await supabase
      .from("creation_sessions")
      .select("id, expires_at, completed_at")
      .eq("token", body.token)
      .single();

    if (sessErr || !session) return json(404, { error: "Invalid creation token" });
    if (session.completed_at)
      return json(410, { error: "This creation link has already been used" });
    if (Date.now() > new Date(session.expires_at).getTime())
      return json(410, { error: "This creation link has expired" });

    // Generate description via ChatGPT (falls back to raw HTML on failure)
    const descriptionHtml = await generateDescription(body);
    const descriptionPlain = stripHtmlTags(descriptionHtml);

    // Resolve fields
    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : "Uncategorized";
    const status =
      typeof body.status === "string" &&
      ALLOWED_STATUSES.includes(body.status as (typeof ALLOWED_STATUSES)[number])
        ? body.status
        : "In Progress";

    let startedAt: string | null = null;
    if (body.startDate && typeof body.startDate === "string") {
      startedAt = body.startDate.trim() || null;
    }

    const pinHash = bcrypt.hashSync(body.deletePin, 10);

    // Insert project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({
        title: body.title.trim(),
        description: descriptionPlain,
        description_html: descriptionHtml,
        category,
        status,
        started_at: startedAt,
        delete_pin_hash: pinHash,
        contact: typeof body.contact === "string" ? body.contact.trim() || null : null,
      })
      .select("id")
      .single();

    if (projErr) return json(500, { error: projErr.message });
    const projectId = project.id;

    // Insert members
    const members = Array.isArray(body.members) ? body.members : [];
    if (members.length > 0) {
      const memberRows = members
        .filter((m) => m && typeof m.name === "string" && m.name.trim())
        .map((m) => ({
          project_id: projectId,
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

    // Insert technologies
    const tech = Array.isArray(body.technologies) ? body.technologies : [];
    if (tech.length > 0) {
      const techRows = tech
        .filter((t): t is string => typeof t === "string" && t.trim() !== "")
        .map((t) => ({ project_id: projectId, tech: t.trim() }));
      if (techRows.length > 0) {
        const { error: techErr } = await supabase
          .from("project_tech")
          .insert(techRows);
        if (techErr) console.error("Failed to save tech:", techErr.message);
      }
    }

    // Generate signed upload URLs for images
    const uploadUrls: string[] = [];
    const images = Array.isArray(body.images) ? body.images : [];
    for (const img of images) {
      const ext = (img.fileExt ?? "").toLowerCase().replace(".", "");
      if (!ALLOWED_EXT.has(ext)) continue;
      if (!img.contentType?.startsWith("image/")) continue;

      const fileName = randomFileName(ext);
      const storagePath = `projects/${projectId}/${fileName}`;

      const { data: signed, error: signErr } = await supabase.storage
        .from("project-images")
        .createSignedUploadUrl(storagePath);

      if (signErr || !signed) {
        console.error("Failed to sign upload:", signErr?.message);
        continue;
      }

      await supabase
        .from("project_images")
        .insert({ project_id: projectId, storage_path: storagePath });

      uploadUrls.push(signed.signedUrl);
    }

    // Mark creation session as completed
    await supabase
      .from("creation_sessions")
      .update({
        completed_at: new Date().toISOString(),
        project_id: projectId,
      })
      .eq("id", session.id);

    return json(200, { projectId, uploadUrls });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
