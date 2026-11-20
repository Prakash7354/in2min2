"use client";

// Your events, on every device (owner, 19 Nov 2026): the events in the host's
// account (ones they own, and ones they help run), and any event kept only on
// this phone. Opening one from the account turns the database rows back into
// the builder's draft: the exact reverse of lib/publish.ts, so publishing it
// again changes nothing unless the host changes something.
//
// Read as the signed-in host: Row Level Security (0001) shows each person
// only the events they own or host. Nothing is written here.
//
// Events kept only on this phone (not yet published, or with changes not yet
// live) are put on a shelf in localStorage when the host opens another event,
// so switching never loses work.

import type { SupabaseClient } from "@supabase/supabase-js";
import { COPY_KEYS, type EventCopy } from "@/lib/ai/copy";
import { backdropOf, heroMotionOf, musicOf, paletteFor, photoRingOf, TOGGLE_DEFAULTS, type ToggleKey } from "@/lib/catalog";
import { fingerprint, newDraft, unpublishedChanges, type Draft } from "@/lib/draft";
import { creditChoice } from "@/lib/event-view";
import { mediaUrl } from "@/lib/media";
import { heroFingerprint, mediaFingerprint } from "@/lib/media-upload";
import { utcToZoned } from "@/lib/time";

export type MyEvent = {
  id: string;
  type: string;
  title: string;
  date: string;          // "2026-12-12" in the event's own time zone
  time: string;
  status: "draft" | "published" | "cancelled";
  colour: string;        // the event's main colour, for its dot
  cover: string | null;  // its main photo
  owner: boolean;        // false: a co-host or helper
  path: string;          // "/birthday/sitas-50th-birthday"
};

const LIST = "id, owner_id, event_type, slug, title, starts_at, timezone, status, palette, primary_color, cover_image_key";

export async function listMyEvents(sb: SupabaseClient, userId: string): Promise<{ ok: true; events: MyEvent[] } | { ok: false; message: string }> {
  const r = await sb.from("events").select(LIST).order("starts_at", { ascending: true }).limit(200);
  if (r.error) return { ok: false, message: `${r.error.code ?? ""} ${r.error.message}`.trim() };
  type Row = { id: string; owner_id: string; event_type: string; slug: string; title: string; starts_at: string; timezone: string; status: MyEvent["status"]; palette: string; primary_color: string; cover_image_key: string | null };
  const events = (r.data as Row[]).map((e) => {
    const at = utcToZoned(e.starts_at, e.timezone);
    return {
      id: e.id, type: e.event_type, title: e.title, date: at.date, time: at.time, status: e.status,
      colour: paletteFor(e.palette, e.primary_color).main, cover: mediaUrl(e.cover_image_key), owner: e.owner_id === userId,
      path: `/${e.event_type}/${e.slug}`,
    };
  });
  return { ok: true, events };
}

// Coming up first (soonest at the top), then past ones (most recent first).
export function sortEvents<T extends { date: string }>(list: T[], today: string): T[] {
  const coming = list.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = list.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  return [...coming, ...past];
}

const EVENT_COLUMNS = [
  "id", "event_type", "scale", "slug", "short_code", "title", "timezone", "starts_at", "ends_at", "venue_name", "venue_address",
  "parking", "parking_note", "expected_guests", "venue_capacity", "organiser_name", "organiser_type", "for_profit", "charity_number",
  "organiser_contact", "tone", "languages", ...COPY_KEYS, "copy_translations", "theme", "palette", "primary_color", "text_style",
  "border", "photo_style", "cover_fit", "motion", "effect", "is_private", "plan", "cover_image_key", "share_image_key", "hero_keys", "hero_motion",
].join(", ");

// One event from the account, as a draft ready to change and publish again.
export async function loadEvent(sb: SupabaseClient, id: string): Promise<{ ok: true; draft: Draft } | { ok: false; message: string }> {
  const [ev, people, subs, toggles] = await Promise.all([
    sb.from("events").select(EVENT_COLUMNS).eq("id", id).single(),
    sb.from("event_people").select("role, relation, names, sort_order").eq("event_id", id).order("sort_order"),
    sb.from("sub_events").select("title, kind, starts_at, venue_name, description, details, sort_order").eq("event_id", id).order("sort_order"),
    sb.from("feature_toggles").select("*").eq("event_id", id).maybeSingle(),
  ]);
  const bad = ev.error ?? people.error ?? subs.error ?? toggles.error;
  if (bad || !ev.data) return { ok: false, message: bad ? `${bad.code ?? ""} ${bad.message}`.trim() : "That event wasn't found." };
  // A plain record: the column list is built at run time, so the client can't type it.
  const e = ev.data as unknown as Record<string, unknown>;
  const str = (k: string) => (typeof e[k] === "string" ? (e[k] as string) : "");
  const tz = str("timezone") || "Europe/London";
  const start = utcToZoned(str("starts_at"), tz);
  const end = utcToZoned((e.ends_at as string | null) ?? null, tz);
  const base = newDraft();

  type Person = { role: "star" | "honour"; relation: string | null; names: string };
  const rows = (people.data ?? []) as Person[];
  const star = rows.find((p) => p.role === "star");
  type Sub = { title: string; kind: string; starts_at: string; venue_name: string | null; description: string | null; details: { menu?: { course?: string; dish?: string }[] } | null };
  const functions = ((subs.data ?? []) as Sub[]).map((s, i) => {
    const at = utcToZoned(s.starts_at, tz);
    const meal = s.kind === "meal";
    return {
      id: `f${i}-${Date.now().toString(36)}`, title: s.title, date: at.date === start.date ? "" : at.date, time: at.time, place: s.venue_name ?? "", note: s.description ?? "", meal,
      ...(meal ? { menu: (s.details?.menu ?? []).filter((m) => m?.dish).map((m) => ({ course: m.course ?? "", dish: m.dish ?? "" })) } : {}),
    };
  });

  const t = (toggles.data ?? {}) as Partial<Record<ToggleKey, boolean>> & { settings?: Record<string, unknown> };
  const settings = t.settings ?? {};
  const languages = Array.isArray(e.languages) && e.languages.length ? (e.languages as string[]) : ["en"];
  const second = languages[1];
  const tr = second ? ((e.copy_translations as Record<string, Partial<EventCopy>> | null)?.[second] ?? {}) : {};
  const coverKey = (e.cover_image_key as string | null) ?? null;
  const heroKeys = Array.isArray(e.hero_keys) ? (e.hero_keys as string[]) : [];
  const credit = creditChoice(settings.credit);
  const slug = str("slug");
  const type = str("event_type");

  const d: Draft = {
    ...base,
    eventType: type,
    scale: (e.scale as Draft["scale"]) ?? base.scale,
    title: str("title"),
    stars: { relation: star?.relation ?? "", names: star?.names ?? "" },
    family: rows.filter((p) => p.role === "honour").map((p) => ({ relation: p.relation ?? "", names: p.names })),
    organiserName: str("organiser_name"),
    organiserType: str("organiser_type"),
    forProfit: typeof e.for_profit === "boolean" ? e.for_profit : null,
    charityNumber: str("charity_number"),
    organiserContact: str("organiser_contact"),
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    timezone: tz,
    venueName: str("venue_name"),
    venueAddress: str("venue_address"),
    parking: (e.parking as Draft["parking"]) ?? "unknown",
    parkingNote: str("parking_note"),
    functions,
    expectedGuests: typeof e.expected_guests === "number" ? e.expected_guests : null,
    venueCapacity: typeof e.venue_capacity === "number" ? e.venue_capacity : null,
    plan: (str("plan") || base.plan) as Draft["plan"],
    languages,
    tone: str("tone") || base.tone,
    copy: Object.fromEntries(COPY_KEYS.map((k) => [k, str(k)])) as EventCopy,
    translation: Object.fromEntries(COPY_KEYS.map((k) => [k, tr[k] ?? ""])) as EventCopy,
    template: (e.theme as Draft["template"]) ?? base.template,
    palette: str("palette") || base.palette,
    customColor: str("primary_color") || base.customColor,
    textStyle: (e.text_style as Draft["textStyle"]) ?? base.textStyle,
    border: str("border") || base.border,
    photoStyle: (e.photo_style as Draft["photoStyle"]) ?? base.photoStyle,
    motion: e.motion !== false,
    effect: (e.effect as Draft["effect"]) ?? "none",
    cover: mediaUrl(coverKey),
    coverFit: (e.cover_fit as Draft["coverFit"]) ?? "fill",
    moreCovers: coverKey ? heroKeys.map((k) => mediaUrl(k)).filter((u): u is string => !!u) : [],
    heroMotion: heroMotionOf(e.hero_motion as string | undefined),
    toggles: { ...base.toggles, ...Object.fromEntries((Object.keys(TOGGLE_DEFAULTS) as ToggleKey[]).filter((k) => typeof t[k] === "boolean").map((k) => [k, t[k]])) },
    slug,
    isPrivate: e.is_private === true,
    checked: true,
    // Published already, so straight to its Home; the words are the ones saved.
    quickDone: true,
    wordsBy: COPY_KEYS.some((k) => str(k)) ? "host" : "suggested",
    ...(credit !== undefined ? { credit } : {}),
    topLine: typeof settings.topline === "string" ? settings.topline : "",
    backdrop: backdropOf(typeof settings.backdrop === "string" ? settings.backdrop : null)?.key,
    music: musicOf(typeof settings.music === "string" ? settings.music : null)?.key ?? "",
    envelope: settings.envelope === true,
    envFrom: typeof settings.envelope_from === "string" ? settings.envelope_from : "",
    envTo: typeof settings.envelope_to === "string" ? settings.envelope_to : "",
    photoRing: photoRingOf(settings.photo_ring) ?? "",
    eventId: id,
    publishedPath: `/${type}/${slug}`,
    shortPath: `/e/${str("short_code")}`,
    coverKey,
    shareKey: (e.share_image_key as string | null) ?? null,
    heroKeys,
  };
  // Marked as matching what's live, so the Home says "Live" until something changes.
  const ready = { ...d, mediaHash: mediaFingerprint(d), heroHash: heroFingerprint(d) };
  return { ok: true, draft: { ...ready, publishedHash: fingerprint(ready) } };
}

// ─────────────── The shelf: events kept only on this phone ───────────────

const SHELF = "in2min2.shelf.v1";
export type Shelved = { key: string; savedAt: number; draft: Draft };

// Worth keeping when the host switches away: not yet published, with something
// in it; or published, with changes not yet live.
export function worthKeeping(d: Draft): boolean {
  if (!d.eventType) return false;
  if (d.eventId) return unpublishedChanges(d);
  return !!(d.title.trim() || d.stars.names.trim() || d.date || d.venueName.trim());
}

export function shelfKey(d: Draft): string {
  return d.eventId ?? d.localId ?? "";
}

export function readShelf(): Shelved[] {
  try {
    const list = JSON.parse(window.localStorage.getItem(SHELF) ?? "[]") as Shelved[];
    return Array.isArray(list) ? list.filter((s) => s?.key && s.draft?.v === 1) : [];
  } catch {
    return [];
  }
}

function writeShelf(list: Shelved[]): boolean {
  try {
    window.localStorage.setItem(SHELF, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

// Put an event on the shelf (replacing an older copy of the same one). If the
// phone's storage is full, its photos are left out rather than losing the
// words; returns "no-photos" then, or false if even that didn't fit.
export function shelve(draft: Draft): true | "no-photos" | false {
  const d = draft.eventId || draft.localId ? draft : { ...draft, localId: `local-${Date.now().toString(36)}` };
  const key = shelfKey(d);
  const rest = readShelf().filter((s) => s.key !== key).slice(0, 11);
  if (writeShelf([{ key, savedAt: Date.now(), draft: d }, ...rest])) return true;
  const lighter: Draft = { ...d, cover: d.coverKey ? d.cover : null, moreCovers: d.coverKey ? d.moreCovers : [] };
  return writeShelf([{ key, savedAt: Date.now(), draft: lighter }, ...rest]) ? "no-photos" : false;
}

export function takeFromShelf(key: string): Draft | null {
  const list = readShelf();
  const hit = list.find((s) => s.key === key);
  if (!hit) return null;
  writeShelf(list.filter((s) => s.key !== key));
  return hit.draft;
}
