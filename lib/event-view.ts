// The data an event page is drawn from. The builder makes it from the host's
// draft; the public page (phase 2) will make it from public_event(). Both use
// components/event/event-view.tsx, so the preview is exactly what guests see.

import type { EventCopy } from "@/lib/ai/copy";
import type { Palette, Parking, PhotoStyle, Scale, Template, TextStyle, ToggleKey } from "@/lib/catalog";

export type ViewPerson = { relation: string; names: string };
export type ViewFunction = { title: string; date: string; time: string; place: string };

export type EventViewData = {
  typeKey: string;
  typeLabel: string;
  scale: Scale;
  sensitive: boolean;
  title: string;
  stars: ViewPerson | null;
  family: ViewPerson[];
  organiser: { name: string; typeLabel: string; forProfit: boolean | null; charityNumber: string; contact: string } | null;
  date: string;        // YYYY-MM-DD in the event's own time zone
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
  cover: string | null; // image URL (a data: URL while it's a draft)
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
