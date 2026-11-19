// POST /api/report-error: a guest's or host's phone tells us a page broke
// (components/error-reporter.tsx). Noted for the owner's hourly alert email.
// Small and capped (lib/ops.ts), and it never says whether it was kept.

import { recordError } from "@/lib/ops";

export async function POST(request: Request) {
  const text = (await request.text().catch(() => "")).slice(0, 2000);
  let body: { where?: unknown; message?: unknown } = {};
  try { body = JSON.parse(text); } catch { /* ignore */ }
  if (typeof body.message === "string" && body.message.trim()) {
    const where = typeof body.where === "string" ? body.where : "?";
    await recordError(`phone ${where}`, body.message, { agent: request.headers.get("user-agent")?.slice(0, 120) ?? undefined });
  }
  return new Response(null, { status: 204 });
}
