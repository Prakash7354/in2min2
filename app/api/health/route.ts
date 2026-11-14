// GET /api/health: is everything switched on? The owner can open
// in2min2.com/api/health on his phone to check, without signing in.
// It asks Google only to describe the AI model (no text is written, so no
// writing allowance is used) and the database only for a public number.

import { DEFAULT_MODEL } from "@/lib/ai/copy";
import { rpc } from "@/lib/supabase/rest";

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let ai = "not set: save the Gemini key with npx wrangler secret put GEMINI_API_KEY";
  if (key) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`, {
        headers: { "x-goog-api-key": key },
        cache: "no-store",
      });
      if (r.ok) {
        ai = "ready";
      } else {
        const body = (await r.json().catch(() => ({}))) as { error?: { status?: string; details?: { reason?: string }[] } };
        const reason = body.error?.details?.find((d) => d.reason)?.reason ?? body.error?.status ?? String(r.status);
        ai = reason === "API_KEY_INVALID" ? "key not valid: make a new key in Google AI Studio"
          : r.status === 404 ? `model not found: ${model}`
          : `not ready (${reason})`;
      }
    } catch {
      ai = "couldn't reach Google";
    }
  }

  const db = await rpc<number>("offer_places_left", { p_code: "LAUNCH50" }).catch(() => null);
  const database = db?.ok ? `ready (LAUNCH50 places left: ${db.data})` : "not reachable";

  return Response.json({ ai, model, database }, { headers: { "Cache-Control": "no-store" } });
}
