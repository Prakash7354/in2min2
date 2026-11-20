// The data an event page is drawn from. The builder makes it from the host's
// draft; the public page (phase 2) will make it from public_event(). Both use
// components/event/event-view.tsx, so the preview is exactly what guests see.

import type { EventCopy } from "@/lib/ai/copy";
import type { CoverFit, EffectKey, HeroMotion, Palette, Parking, PhotoStyle, Scale, Template, TextStyle, ToggleKey } from "@/lib/catalog";

export type ViewPerson = { relation: string; names: string };
export type MenuItem = { course: string; dish: string };
// One line of the running order. A meal can carry its menu (0003).
export type ViewFunction = {
  title: string; date: string; time: string; place: string;
  note?: string; meal?: boolean; menu?: MenuItem[];
};

// The line at the bottom left of the page that says who's behind the event
// (owner, 16 Nov 2026: "give credibility to the organiser: organised by …,
// hosted by …, in memory of …"). The host can change it or hide it; until
// they do, it's made from what they've already filled in.
export type Credit = { label: string; name: string };
export const CREDIT_LABELS = ["Hosted by", "Organised by", "With love from", "In memory of", "Presented by"] as const;
// The host's own choice: undefined = made for them, null = hidden.
export type CreditChoice = Credit | null | undefined;

export function defaultCredit(x: { scale: string; sensitive: boolean; organiserName: string; family: { relation: string; names: string }[] }): Credit | null {
  if (x.scale === "community") return x.organiserName.trim() ? { label: "Organised by", name: x.organiserName.trim() } : null;
  const fam = x.family.find((f) => f.names.trim());
  if (!fam) return null;
  return { label: x.sensitive ? "With love from" : "Hosted by", name: fam.names.trim() };
}

// The host's credit line as published (lib/publish.ts): { label, name }, or
// { hidden: true }; anything else means "made from the organiser or family".
export function creditChoice(v: unknown): CreditChoice {
  if (!v || typeof v !== "object") return undefined;
  const c = v as { hidden?: unknown; label?: unknown; name?: unknown };
  if (c.hidden === true) return null;
  return typeof c.label === "string" && typeof c.name === "string" ? { label: c.label, name: c.name } : undefined;
}

export function creditFor(choice: CreditChoice, made: Credit | null): Credit | null {
  if (choice === null) return null;
  if (choice && choice.name.trim()) return { label: choice.label.trim().slice(0, 30) || "Hosted by", name: choice.name.trim().slice(0, 80) };
  return made;
}

export type EventViewData = {
  typeKey: string;
  typeLabel: string;
  scale: Scale;
  sensitive: boolean;
  title: string;
  stars: ViewPerson | null;
  family: ViewPerson[];
  organiser: { name: string; typeLabel: string; forProfit: boolean | null; charityNumber: string; contact: string } | null;
  // Bottom left of the page: "Hosted by …", "Organised by …" (creditFor).
  credit: Credit | null;
  // A blessing line at the very top, e.g. "॥ श्री गणेशाय नमः ॥", or "".
  topLine: string;
  // A painted background behind the words (BACKDROPS key), or null.
  backdrop: string | null;
  // Music once the guest opens it (MUSIC key), and whether guests first see a
  // sealed envelope to tap (components/event/opening.tsx).
  music: string | null;
  envelope: boolean;
  // What the envelope says (envelopeFrom / envelopeTo below): the host's own
  // words, or "" to have them made from the names already given.
  envFrom: string;
  envTo: string;
  photoRing?: string | null;   // a moving decoration round the photo (catalog PHOTO_RINGS)
  date: string;       // YYYY-MM-DD in the event's own time zone
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM or ""
  timezone: string;
  venueName: string;
  venueAddress: string;
  parking: Parking;
  parkingNote: string;
  functions: ViewFunction[];
  languages: string[];
  copy: EventCopy;
  translation: EventCopy | null;
  template: Template;
  palette: Palette;
  textStyle: TextStyle;
  border: string;     // BORDERS key in lib/catalog.ts
  photoStyle: PhotoStyle;
  motion: boolean;
  effect: EffectKey;    // a moving effect over the top of the page (0004)
  cover: string | null; // image URL (a data: URL while it's a draft)
  moreCovers: string[];  // up to four more photos for the top of the page (0007)
  heroMotion: HeroMotion; // how they change from one to the next
  coverFit: CoverFit;   // fill the space, or show the whole picture (logos, posters)
  toggles: Record<ToggleKey, boolean>;
  hideBranding: boolean;
  demo?: boolean;
};

export type EventStageView = "card" | "page" | "live" | "after";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parseDate(date: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}

// "Saturday 6 February 2027". Worked out from the calendar date itself, so the
// viewer's own time zone can never shift it to the day before.
export function formatDate(date: string, withYear = true): string {
  const p = parseDate(date);
  if (!p) return "";
  const dow = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
  return `${DAYS[dow]} ${p.d} ${MONTHS[p.m - 1]}${withYear ? " " + p.y : ""}`;
}

// "12 noon", "2pm", "2:30pm"
export function formatTime(time: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return "";
  const h = +m[1], min = +m[2];
  if (h === 12 && min === 0) return "12 noon";
  if (h === 0 && min === 0) return "midnight";
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return min ? `${h12}:${String(min).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

// The date and time now on the event's own clock, as "YYYY-MM-DD" and "HH:MM".
export function zonedNow(now: number, timezone: string): { date: string; time: string } {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(now).map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
  } catch {
    const iso = new Date(now).toISOString();
    return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
  }
}

// The running order in time order, and which item is on now and which is next.
export function runningOrder(items: ViewFunction[], fallbackDate: string, now: number, timezone: string) {
  const sorted = items
    .map((f) => ({ ...f, date: f.date || fallbackDate }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const z = zonedNow(now, timezone);
  const at = `${z.date} ${z.time}`;
  let current = -1;
  sorted.forEach((f, i) => { if (`${f.date} ${f.time || "00:00"}` <= at) current = i; });
  const next = current + 1 < sorted.length ? current + 1 : -1;
  return { items: sorted, current, next, multiDay: new Set(sorted.map((f) => f.date)).size > 1 };
}

// Whole days from today (in the event's time zone) to the event date.
export function daysUntil(date: string, timezone: string, now: number): number | null {
  const p = parseDate(date);
  if (!p) return null;
  let today: string;
  try {
    today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    today = new Date(now).toISOString().slice(0, 10);
  }
  const t = parseDate(today);
  if (!t) return null;
  return Math.round((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(t.y, t.m - 1, t.d)) / 86_400_000);
}

export function directionsUrl(d: Pick<EventViewData, "venueName" | "venueAddress">): string | null {
  const q = [d.venueName, d.venueAddress].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

// Up to two initials for the photo placeholder: "Meenu & Jose" → "MJ".
export function monogram(text: string): string {
  const words = text.split(/[\s&+,]+|\band\b/i).map((w) => w.trim()).filter(Boolean);
  return words.slice(0, 2).map((w) => Array.from(w)[0]?.toUpperCase() ?? "").join(words.length > 1 ? "·" : "");
}

// Remembers, for this tab only, that a guest has opened an event's envelope
// (components/event/opening.tsx and the guest page's early check).
export const openedKey = (id: string) => `in2min2:opened:${id}`;

// ── The envelope's "From" and "To" (owner, 19 Nov 2026: like a real
// envelope, so the invitation is personal and plainly not spam) ──

// From: the host's own words, else the credit line's name ("Hosted by the
// Gurung family"), else the stars' names, else the organiser.
export function envelopeFrom(d: Pick<EventViewData, "envFrom" | "credit" | "stars" | "organiser">): string {
  return d.envFrom.trim() || d.credit?.name.trim() || d.stars?.names.trim() || d.organiser?.name.trim() || "";
}

// Three ways to invite (owner, 19 Nov 2026), and what the envelope says:
// personal links carry each guest's own name; one shared link and an open
// invitation say the host's "To" line.
export type InviteWay = "personal" | "shared" | "open";
export const TO_LINES: Record<Exclude<InviteWay, "personal">, string[]> = {
  shared: ["Our family and friends", "Family and friends", "Our dear friends", "You and your family"],
  open: ["Everyone, all welcome", "Teams, stalls and sponsors", "Our whole community", "Friends old and new"],
};
export function defaultTo(d: Pick<EventViewData, "scale" | "sensitive">): string {
  return d.scale === "community" ? "Everyone, all welcome" : d.sensitive ? "Family and friends" : "Our family and friends";
}
// To: the guest's own name from their personal link, else the host's line.
export function envelopeTo(d: Pick<EventViewData, "envTo" | "scale" | "sensitive">, guestName?: string | null): string {
  return guestName?.trim() || d.envTo.trim() || defaultTo(d);
}
