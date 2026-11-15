// POST /api/photos: a guest adds one photo to an event's wall.
//
// The phone has already shrunk it (about 1600 px, location removed) and made
// a thumbnail (lib/photo-prep.ts). The body is the thumbnail then the photo,
// both JPEG; ?tl= says where the thumbnail ends. Steps:
//   1. check both are JPEGs of a sensible size;
//   2. add_photo() (0006) decides whether this guest may add it now, and
//      reserves a row;
//   3. both files go into R2 (Europe);
//   4. photo_stored() shows it, or holds it for the host's OK.
// Nothing is stored unless the database said yes first.
//
// The hosts' own photos (0007) come the same way from the builder, with
// ?host=1&event={id} and the host's sign-in token: add_host_photo() checks
// they run the event, and their photos go straight on the wall.

import { rpc } from "@/lib/supabase/rest";
import { photoKeys, photoStore } from "@/lib/photo-store";

const MAX_PHOTO = 4_194_304;
const MAX_THUMB = 400_000;
const isJpeg = (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const say = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

type Added = { ok: true; id: string; event_id: string; secret: string; left?: number | null } | { ok: false; reason: string };

export async function POST(req: Request) {
  const q = new URL(req.url).searchParams;
  const type = q.get("type") ?? "", slug = q.get("slug") ?? "";
  const host = q.get("host") === "1";
  const eventId = q.get("event") ?? "";
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (host ? !token || !/^[0-9a-f-]{36}$/.test(eventId)
    : !/^[a-z]+(-[a-z]+)*$/.test(type) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return say({ ok: false, reason: host ? "sign_in" : "no_event" }, 400);
  const tl = Number(q.get("tl")), w = Number(q.get("w")), h = Number(q.get("h"));
  if (Number(req.headers.get("content-length") ?? 0) > MAX_PHOTO + MAX_THUMB) return say({ ok: false, reason: "too_big" }, 413);

  const store = await photoStore();
  if (!store) return say({ ok: false, reason: "storage_off" }, 503);

  const body = new Uint8Array(await req.arrayBuffer());
  if (body.length > MAX_PHOTO + MAX_THUMB) return say({ ok: false, reason: "too_big" }, 413);
  if (!Number.isInteger(tl) || tl < 4 || tl > MAX_THUMB || tl >= body.length - 4) return say({ ok: false, reason: "bad_photo" }, 400);
  const thumb = body.slice(0, tl), photo = body.slice(tl);
  if (!isJpeg(thumb) || !isJpeg(photo)) return say({ ok: false, reason: "bad_photo" }, 400);

  const size = { p_width: Number.isInteger(w) ? w : 0, p_height: Number.isInteger(h) ? h : 0, p_bytes: photo.length };
  const name = (q.get("name") ?? "").slice(0, 60) || null;
  const add = host
    ? await rpc<Added>("add_host_photo", { p_event: eventId, p_name: name, ...size }, token)
    : await rpc<Added>("add_photo", { p_type: type, p_slug: slug, p_token: q.get("g") || null, p_device: q.get("device") ?? "", p_name: name, ...size });
  if (!add.ok) return say({ ok: false, reason: "not_ready" }, 503);
  if (!add.data.ok) return say(add.data);

  const { id, event_id, secret, left } = add.data;
  const [photoKey, thumbKey] = photoKeys(event_id, id);
  const meta = { httpMetadata: { contentType: "image/jpeg", cacheControl: "public, max-age=86400" } };
  try {
    await store.put(thumbKey, thumb, meta);
    await store.put(photoKey, photo, meta);
  } catch {
    return say({ ok: false, reason: "server" }, 503);
  }

  const done = await rpc<{ ok: boolean; status?: string }>("photo_stored", { p_id: id, p_secret: secret });
  if (!done.ok || !done.data.ok) return say({ ok: false, reason: "server" }, 503);
  return say({ ok: true, id, status: done.data.status, left: left ?? null });
}
