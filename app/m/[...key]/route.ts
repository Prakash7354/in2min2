// GET /m/{event}/{p|t}/{photo}.jpg: a guest photo from R2. The names are
// random ids, so nobody can guess or list them. Photos removed by a host are
// deleted from R2, so their address stops working.

import { photoStore } from "@/lib/photo-store";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(_req: Request, ctx: RouteContext<"/m/[...key]">) {
  const { key } = await ctx.params;
  const name = key.join("/");
  if (!/^[0-9a-f-]{36}\/[pt]\/[0-9a-f-]{36}\.jpg$/.test(name)) return notFound();
  const store = await photoStore();
  if (!store) return notFound();
  const obj = await store.get(name);
  if (!obj) return notFound();
  return new Response(obj.body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(obj.size),
      "Cache-Control": "public, max-age=86400",
      ETag: obj.httpEtag,
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
