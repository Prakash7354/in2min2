// POST /api/admin/reply  { id, message }
//
// The owner's "Send reply" in /admin (26 Nov 2026): emails an answer to the
// person who sent an enquiry, through Resend, from hello@in2min2.com.
//
// Only a signed-in admin may call it: the route asks the database
// (is_admin(), 0018) with the caller's own sign-in token, and reads the
// enquiry with that same token, so Row Level Security decides too. The
// address to write to always comes from the stored enquiry, never from the
// request, so this can't be used to send mail to anyone else.
//
// Secret: RESEND_API_KEY is a Worker secret (npx wrangler secret put
// RESEND_API_KEY) and `.env.local` on this Mac; never in the code. Without it
// the route says "not_set_up" and the admin offers the "open in my email app"
// button instead. Resend's free plan: 3,000 a month, 100 a day.

import { NextResponse } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { rpc } from "@/lib/supabase/rest";
import { recordError } from "@/lib/ops";

const FROM = "in2min2 <hello@in2min2.com>";
const REPLY_TO = "hello@in2min2.com";
const MAX = 1500;

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "sign_in" }, { status: 401 });

  const admin = await rpc<boolean>("is_admin", {}, token);
  if (!admin.ok || admin.data !== true) return NextResponse.json({ error: "not_allowed" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { id?: unknown; message?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (message.length < 1 || message.length > MAX) return NextResponse.json({ error: "length", max: MAX }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "not_set_up" }, { status: 503 });

  const found = await fetch(`${SUPABASE_URL}/rest/v1/enquiries?id=eq.${id}&select=id,name,email,message,created_at`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const rows = found.ok ? ((await found.json().catch(() => [])) as { id: string; name: string; email: string; message: string; created_at: string }[]) : [];
  const enquiry = rows.find((r) => r.id === id);
  if (!enquiry) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const wrote = new Date(enquiry.created_at).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
  const text = `${message}\n\n---\nYou wrote to in2min2 on ${wrote}:\n${enquiry.message}\n`;
  const base = (process.env.NODE_ENV === "development" && process.env.RESEND_BASE_URL) || "https://api.resend.com";
  const sent = await fetch(`${base}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [enquiry.email], reply_to: REPLY_TO, subject: "Re: your message to in2min2", text }),
  }).catch(() => null);

  if (!sent?.ok) {
    const detail = sent ? ((await sent.json().catch(() => ({}))) as { message?: string }).message ?? `status ${sent.status}` : "no answer from Resend";
    await recordError("api/admin/reply", `Resend refused the reply: ${detail}`);
    return NextResponse.json({ error: "send_failed", detail: String(detail).slice(0, 200) }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
