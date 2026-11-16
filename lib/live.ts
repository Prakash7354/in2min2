"use client";

// What changes during an event, for guests and the TV (0011): the hosts'
// announcements, and guests' comments and emoji cheers on the photo show.
// public_live() returns both; guests send cheers with post_cheer(), with no
// account (a device id, as for photos).
//
// useLive() polls while the page is on screen. It always fetches the latest
// list rather than "only newer", so a comment the host hides leaves every
// screen at the next poll. New cheers with an emoji float up the screen.

import { useCallback, useEffect, useRef, useState } from "react";
import { publicRpc } from "@/lib/photos";

export type AnnouncementKind = "info" | "urgent" | "happy";
export type Announcement = { id: string; kind: AnnouncementKind; body: string; at: string };
export type CheerEmoji = "clap" | "love" | "party" | "wow" | "laugh" | "fire" | "pray" | "tears";
export type Cheer = { id: string; name: string | null; body: string | null; emoji: CheerEmoji | null; at: string };
export type CheerRules = { on: boolean; approve_first: boolean; tv: "right" | "bottom" | "off"; open: boolean };
export type PublicLive = {
  stage: string; private?: boolean; now?: string;
  announcements?: Announcement[]; cheer_rules?: CheerRules; cheers?: Cheer[];
};

// The popular ones, as on live shows: cheering, love, party, goosebumps…
export const CHEER_EMOJI: Record<CheerEmoji, { char: string; label: string }> = {
  clap: { char: "👏", label: "Cheering" },
  love: { char: "❤️", label: "Love" },
  party: { char: "🎉", label: "Party" },
  wow: { char: "🤩", label: "Amazing" },
  tears: { char: "🥹", label: "Goosebumps" },
  laugh: { char: "😂", label: "Funny" },
  fire: { char: "🔥", label: "On fire" },
  pray: { char: "🙏", label: "Blessings" },
};
export const CHEER_ORDER: CheerEmoji[] = ["clap", "love", "party", "wow", "tears", "laugh", "fire", "pray"];
// For memorials: gentle ones only.
export const GENTLE_ORDER: CheerEmoji[] = ["love", "pray", "tears"];

// Ready-made words, so nobody has to think of what to say.
export function cheerPhrases(sensitive: boolean, typeKey: string): string[] {
  if (sensitive) return ["Thinking of you all", "Beautiful memories", "Rest in peace 🙏", "Sending love to the family"];
  const day = typeKey === "birthday" ? "Happy birthday! 🎂" : typeKey === "wedding" || typeKey === "engagement" ? "Congratulations! 💍"
    : typeKey === "anniversary" ? "Happy anniversary! 🥂" : typeKey === "lhosar" ? "Happy Lhosar! 🎉" : typeKey === "christmas" ? "Merry Christmas! 🎄"
    : typeKey === "new-year" ? "Happy New Year! 🎆" : "What a night! 🎉";
  return [day, "Amazing! 🤩", "Love this! ❤️", "Best day ever!", "Bless you 🙏"];
}

export const CHEER_MESSAGES: Record<string, string> = {
  bad: "That couldn't be sent. Keep it under 140 letters.",
  no_event: "This event can't be found.",
  closed: "This event has ended.",
  private: "Please open the photos from the link the host sent you.",
  off: "Comments are switched off for this event.",
  not_open: "Comments open with the photos, on the day.",
  busy: "Lots of cheers just now! Try again in a minute.",
};

export async function loadLive(type: string, slug: string, token: string | null): Promise<PublicLive | null> {
  return publicRpc<PublicLive | null>("public_live", { p_type: type, p_slug: slug, p_token: token, p_after: null }).catch(() => null);
}

export async function postCheer(a: { type: string; slug: string; token: string | null; device: string; name: string; body: string; emoji: CheerEmoji | null }) {
  const r = await publicRpc<{ ok: boolean; reason?: string; status?: "shown" | "waiting" }>("post_cheer", {
    p_type: a.type, p_slug: a.slug, p_token: a.token, p_device: a.device, p_name: a.name.trim() || null, p_body: a.body.trim() || null, p_emoji: a.emoji,
  }).catch(() => null);
  return r ?? { ok: false, reason: "network" };
}

// "just now", "5 min ago", "2 hours ago", "yesterday".
export function timeAgo(at: string, now = Date.now()): string {
  const m = Math.max(0, Math.round((now - new Date(at).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export type Float = { key: string; emoji: CheerEmoji };

export function useLive(type: string, slug: string, token: string | null, every: number) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [rules, setRules] = useState<CheerRules | null>(null);
  const [cheers, setCheers] = useState<Cheer[]>([]);
  const [floats, setFloats] = useState<Float[]>([]);
  const known = useRef<Set<string> | null>(null);

  const float = useCallback((list: Float[]) => {
    if (!list.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setFloats((f) => [...f, ...list].slice(-24));
    window.setTimeout(() => setFloats((f) => f.filter((x) => !list.some((y) => y.key === x.key))), 4200);
  }, []);

  const poll = useCallback(async () => {
    const r = await loadLive(type, slug, token);
    if (!r || r.private || !r.cheer_rules) return;
    const list = r.cheers ?? [];
    if (known.current) {
      const fresh = list.filter((c) => !known.current!.has(c.id));
      float(fresh.filter((c) => c.emoji).slice(0, 12).map((c) => ({ key: c.id, emoji: c.emoji as CheerEmoji })));
    }
    known.current = new Set(list.map((c) => c.id));
    setAnnouncements(r.announcements ?? []);
    setRules(r.cheer_rules);
    setCheers(list);
  }, [type, slug, token, float]);

  useEffect(() => {
    const first = window.setTimeout(() => void poll(), 0);
    const t = window.setInterval(() => { if (document.visibilityState === "visible") void poll(); }, every);
    return () => { window.clearTimeout(first); window.clearInterval(t); };
  }, [poll, every]);

  // After this phone sends one, look again straight away (it floats up then, like everyone else's).
  const mine = useCallback(() => { window.setTimeout(() => void poll(), 250); }, [poll]);

  return { announcements, rules, cheers, floats, poll, mine };
}
