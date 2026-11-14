// POST /api/photos/remove: the owner or a co-host removes photos for good.
// The database checks who is asking (remove_photos(), 0006, with the host's
// own sign-in token) and deletes the rows; this then deletes the files from
// R2. Helpers can hide photos in the builder but not remove them.

import { rpc } from "@/lib/supabase/rest";
import { photoKeys, photoStore } from "@/lib/photo-store";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ ok: false, reason: "sign_in" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/.test(x)).slice(0, 200) : [];
  if (!ids.length) return Response.json({ ok: false, reason: "nothing" }, { status: 400 });

  const r = await rpc<{ event_id: string; id: string }[]>("remove_photos", { p_ids: ids }, token);
  if (!r.ok) return Response.json({ ok: false, reason: "not_ready", message: r.message }, { status: r.status === 401 ? 401 : 503 });

  const store = await photoStore();
  if (store && r.data.length) {
    try { await store.delete(r.data.flatMap((g) => photoKeys(g.event_id, g.id))); } catch { /* rows are gone; stray files are swept later */ }
  }
  return Response.json({ ok: true, removed: r.data.length }, { headers: { "Cache-Control": "no-store" } });
}
