// Server side: the photo wall's event details for the photos page, the TV
// slideshow and the table cards (public_photos(), 0006). One database call
// per request, shared by the page and its title.

import { cache } from "react";
import { headers } from "next/headers";
import type { PublicWall } from "@/lib/photos";
import { rpc } from "@/lib/supabase/rest";

// null: no such event. undefined: the database can't answer yet (0006 not run).
export const getWall = cache(async (type: string, slug: string, key?: string): Promise<PublicWall | null | undefined> => {
  if (!/^[a-z]+(-[a-z]+)*$/.test(type) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const r = await rpc<PublicWall | null>("public_photos", { p_type: type, p_slug: slug, p_token: key ?? null, p_device: null, p_before: null, p_limit: 1 });
  return r.ok ? r.data : undefined;
});

// A guest's own link (?g=) or a private event's photo key (?k=).
export function keyParam(sp: Record<string, string | string[] | undefined>): string | undefined {
  for (const v of [sp.k, sp.g]) if (typeof v === "string" && /^[A-Za-z0-9]{16,64}$/.test(v)) return v;
  return undefined;
}

// https://in2min2.com, or whichever address this page was opened on, for QR codes.
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "in2min2.com";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
