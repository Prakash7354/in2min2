// The guests' photo wall (0006): shared shapes, addresses and messages.
// Files live in Cloudflare R2 and are served by the app at /m/… (app/m).

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export type WallRules = { on: boolean; approve_first: boolean; early: boolean; open: boolean };
export type WallPhoto = { id: string; w: number; h: number; by: string | null; at: string };
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
  mine?: { added: number; waiting: number } | null;
};

export const photoUrl = (eventId: string, id: string, size: "p" | "t") => `/m/${eventId}/${size}/${id}.jpg`;

// The photos page, and the TV slideshow. A private event's links carry its
// photo key (k), which opens the photos only.
export function wallPath(type: string, slug: string, key?: string | null, page: "photos" | "tv" | "print" = "photos") {
  return `/${type}/${slug}/${page}${key ? `?k=${encodeURIComponent(key)}` : ""}`;
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
