declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

import { handleCorsOptions, json } from "../_shared/cors.ts";

interface VerifyBody {
  creationPassword?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const CREATION_PASSWORD = Deno.env.get("CREATION_PASSWORD") ?? "";
    if (CREATION_PASSWORD.length === 0) {
      return json(200, { ok: true });
    }

    const body: VerifyBody = await req.json();
    if (body.creationPassword === CREATION_PASSWORD) {
      return json(200, { ok: true });
    }

    return json(403, { error: "Incorrect password" });
  } catch {
    return json(500, { error: "Server error" });
  }
});
