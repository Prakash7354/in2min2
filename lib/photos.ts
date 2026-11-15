// The guests' photo wall (0006): shared shapes, addresses and messages.
// Files live in Cloudflare R2 and are served by the app at /m/… (app/m).

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export type WallRules = { on: boolean; approve_first: boolean; early: boolean; open: boolean; sky?: string };
// loves: love taps (0008); mine: this phone loved it; fav: one of the hosts' favourites.
// pg: the photographer's credit (0009).
export type WallPhoto = { id: string; w: number; h: number; by: string | null; at: string; loves?: number; mine?: boolean; fav?: boolean; pg?: string | null };
export type WallPhotographer = { name: string; business: string | null; link: string | null; photos: number };
export type WallEvent = {
  id: string; type: string; slug: string; short_code: string; title: string; headline: string | null;
  scale: "personal" | "celebration" | "community"; palette: string; primary_color: string; text_style: string;
  private: boolean; sensitive: boolean;
};
export type PublicWall = {
  stage: "pre" | "live" | "post" | "expired" | "cancelled";
  private?: boolean;
  title?: string;
  event?: WallEvent;
  rules?: WallRules;
  limit?: number | null;
  per_guest?: number | null;
  shown?: number;
  photos?: WallPhoto[];
  featured?: WallPhoto[];   // favourites and the most-loved, wherever they are (0008)
  photographers?: WallPhotographer[];   // for the "Book them" card (0009)
  mine?: { added: number; waiting: number } | null;
};

export const photoUrl = (eventId: string, id: string, size: "p" | "t") => `/m/${eventId}/${size}/${id}.jpg`;

// The photos page, and the TV slideshow. A private event's links carry its
// photo key (k), which opens the photos only.
export function wallPath(type: string, slug: string, key?: string | null, page: "photos" | "tv" | "print" = "photos", style?: "wheel") {
  const q = new URLSearchParams({ ...(key ? { k: key } : {}), ...(style ? { style } : {}) }).toString();
  return `/${type}/${slug}/${page}${q ? `?${q}` : ""}`;
}

// What the phone shows when a photo can't be added.
export const PHOTO_MESSAGES: Record<string, string> = {
  closed: "Photos can be added from midnight on the day.",
  off: "The host has switched off photos for this event.",
  private: "Please open the photos from the link or QR code the host shared.",
  full: "The photo wall is full. Please tell the host.",
  your_share: "You've added all the photos one phone can add. Thank you!",
  busy: "Lots of photos are arriving at once. Yours will try again in a minute.",
  bad_photo: "This photo couldn't be read. Please try a different one.",
  no_event: "This event can't be found.",
  storage_off: "Photos aren't switched on yet. Please try again later.",
  not_ready: "Photos aren't switched on yet. Please try again later.",
  too_big: "This photo is too big to send.",
  sign_in: "Please sign in again, then try once more.",
  no_link: "This photographer link has been switched off. Please ask the host for a new one.",
};

// Reasons worth trying again later by themselves (bad signal, a busy moment).
export const RETRY_REASONS = new Set(["busy", "network", "server", "storage_off", "not_ready"]);

// Calls a public database function from the browser (like rsvp.tsx).
export async function publicRpc<T>(fn: string, args: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export function loadWall(type: string, slug: string, token: string | null, device: string | null, before?: string): Promise<PublicWall | null> {
  return publicRpc<PublicWall | null>("public_photos", {
    p_type: type, p_slug: slug, p_token: token, p_device: device, p_before: before ?? null, p_limit: 60,
  });
}

// Love a photo, or take the love back (0008). One per phone per photo.
export function lovePhoto(type: string, slug: string, token: string | null, id: string, device: string, love: boolean) {
  return publicRpc<{ ok: boolean; loves?: number; mine?: boolean; reason?: string }>("love_photo", {
    p_type: type, p_slug: slug, p_token: token, p_photo: id, p_device: device, p_love: love,
  }).catch(() => null);
}

// A photographer's "Book them" link: a website, an Instagram name or a phone.
export function bookingHref(link: string | null | undefined): string | null {
  const l = (link ?? "").trim();
  if (!l) return null;
  if (/^https?:\/\//i.test(l)) return l;
  if (/^@[\w.]{2,30}$/.test(l)) return `https://instagram.com/${l.slice(1)}`;
  if (/^[+\d][\d\s()-]{6,}$/.test(l)) return `tel:${l.replace(/[^\d+]/g, "")}`;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(l)) return `https://${l}`;
  return null;
}

// A random id for this phone, kept in its storage: it counts the phone's share.
export function deviceId(): string {
  const key = "in2min2.device";
  try {
    const have = window.localStorage.getItem(key);
    if (have && /^[a-z0-9]{16,40}$/.test(have)) return have;
    const made = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
    window.localStorage.setItem(key, made);
    return made;
  } catch {
    return Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
  }
}
