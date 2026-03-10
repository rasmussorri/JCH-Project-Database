declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { handleCorsOptions, json } from "../_shared/cors.ts";

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

interface GenerateBody {
  title: string;
  problem?: string;
  goal?: string;
  technologies?: string[];
  status?: string;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY)
      return json(500, { error: "OPENAI_API_KEY not configured" });

    const body: GenerateBody = await req.json();
    if (!body?.title?.trim())
      return json(400, { error: "Missing title" });

    const parts = [`Project Title: ${body.title}`];
    if (body.problem?.trim()) parts.push(`Problem: ${body.problem}`);
    if (body.goal?.trim()) parts.push(`Goal: ${body.goal}`);
    if (body.technologies?.length)
      parts.push(`Technologies: ${body.technologies.join(", ")}`);
    if (body.status) parts.push(`Development Stage: ${body.status}`);
    if (body.notes?.trim()) parts.push(`Additional Notes: ${body.notes}`);

    const userPrompt = `Write a project description based on the following information:\n\n${parts.join("\n")}`;

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
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI error:", res.status, errText);
      const isQuota =
        res.status === 429 ||
        /quota|insufficient_quota|exceeded.*quota|billing/i.test(errText);
      if (isQuota) {
        return json(402, {
          error: "API_CREDITS_EXHAUSTED",
          message: "API credits exhausted. AI descriptions are temporarily unavailable.",
        });
      }
      return json(502, { error: "AI service unavailable" });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      return json(502, { error: "Empty response from AI" });
    }

    return json(200, { descriptionHtml: content.trim() });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
