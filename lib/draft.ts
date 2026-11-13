// The host's event while they build it. Until sign-in is connected it is kept
// on their own phone (localStorage) and saved after every change; after sign-in
// it is saved to the database instead (events, event_people, sub_events,
// feature_toggles). Field names follow the database columns.

import { COPY_KEYS, type EventCopy } from "@/lib/ai/copy";
import {
  eventType, language, ORGANISER_TYPES, paletteFor, plan, togglesFor,
  type Parking, type PhotoStyle, type PlanKey, type Scale, type Template, type TextStyle, type ToggleKey,
} from "@/lib/catalog";
import type { EventViewData, ViewFunction, ViewPerson } from "@/lib/event-view";

export type Draft = {
  v: 1;
  eventType: string | null;
  scale: Scale;
  title: string;
  stars: ViewPerson;
  family: ViewPerson[];
  organiserName: string;
  organiserType: string;
  forProfit: boolean | null;
  charityNumber: string;
  organiserContact: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  venueName: string;
  venueAddress: string;
  parking: Parking;
  parkingNote: string;
  functions: (ViewFunction & { id: string })[];
  expectedGuests: number | null;
  venueCapacity: number | null;
  plan: PlanKey;
  languages: string[];
  tone: string;
  copy: EventCopy;
  translation: EventCopy;
  template: Template;
  palette: string;
  customColor: string;
  textStyle: TextStyle;
  border: string;
  photoStyle: PhotoStyle;
  motion: boolean;
  cover: string | null;
  toggles: Record<ToggleKey, boolean>;
  slug: string;
  isPrivate: boolean;
  offerCode: string;
  checked: boolean;
  step: number;
};

export const EMPTY_COPY: EventCopy = Object.fromEntries(COPY_KEYS.map((k) => [k, ""])) as EventCopy;

export function newDraft(): Draft {
  return {
    v: 1,
    eventType: null,
    scale: "personal",
    title: "",
    stars: { relation: "", names: "" },
    family: [],
    organiserName: "",
    organiserType: "",
    forProfit: null,
    charityNumber: "",
    organiserContact: "",
    date: "",
    startTime: "",
    endTime: "",
    timezone: "Europe/London",
    venueName: "",
    venueAddress: "",
    parking: "unknown",
    parkingNote: "",
    functions: [],
    expectedGuests: null,
    venueCapacity: null,
    plan: "popup",
    languages: ["en"],
    tone: "Warm and welcoming",
    copy: { ...EMPTY_COPY },
    translation: { ...EMPTY_COPY },
    template: "classic",
    palette: "marigold_indigo",
    customColor: "#2E2A6E",
    textStyle: "classic",
    border: "none",
    photoStyle: "arch",
    motion: true,
    cover: null,
    toggles: togglesFor(null),
    slug: "",
    isPrivate: false,
    offerCode: "",
    checked: false,
    step: 0,
  };
}

// Choosing what you're celebrating fills in sensible starting choices.
// Anything the host has already typed (names, date, words) is kept.
export function applyType(d: Draft, key: string): Draft {
  const t = eventType(key);
  if (!t) return d;
  const scale = t.scale;
  return {
    ...d,
    eventType: key,
    scale,
    stars: { ...d.stars, relation: t.starLabel },
    template: t.theme,
    palette: t.palette,
    textStyle: t.textStyle,
    border: t.borders[0] ?? "none",
    photoStyle: t.photoStyle,
    motion: !t.sensitive,
    tone: t.tone,
    toggles: togglesFor(key),
    plan: scale === "community" ? "community" : d.plan === "community" ? "popup" : d.plan,
  };
}

export function applyScale(d: Draft, scale: Scale): Draft {
  return { ...d, scale, plan: scale === "community" ? "community" : d.plan === "community" ? "popup" : d.plan };
}

const KEY = "in2min2.draft.v1";

export function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return newDraft();
    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (parsed?.v !== 1) return newDraft();
    const base = newDraft();
    return { ...base, ...parsed, copy: { ...base.copy, ...parsed.copy }, translation: { ...base.translation, ...parsed.translation },
      toggles: { ...base.toggles, ...parsed.toggles } };
  } catch {
    return newDraft();
  }
}

// Returns false if the phone refused (private browsing, or storage full).
export function saveDraft(d: Draft): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing saved to clear */
  }
}

// in2min2.com/{type}/{slug}: lower case, digits and single hyphens (as the database requires).
export function slugify(text: string): string {
  const s = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return s.length >= 3 ? s : "";
}

export function slugOk(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 60;
}

export function people(d: Draft): number {
  return Math.max(0, Math.floor(d.expectedGuests ?? 0));
}

export function toViewData(d: Draft): EventViewData {
  const t = eventType(d.eventType);
  const organiserLabel = ORGANISER_TYPES.find((o) => o.key === d.organiserType)?.label ?? "";
  return {
    typeKey: d.eventType ?? "party",
    typeLabel: t?.label ?? "Your event",
    scale: d.scale,
    sensitive: t?.sensitive ?? false,
    title: d.title,
    stars: d.stars.names.trim() ? d.stars : null,
    family: d.family,
    organiser: d.scale === "community" && d.organiserName.trim()
      ? { name: d.organiserName.trim(), typeLabel: organiserLabel, forProfit: d.forProfit, charityNumber: d.charityNumber.trim(), contact: d.organiserContact.trim() }
      : null,
    date: d.date,
    startTime: d.startTime,
    endTime: d.endTime,
    timezone: d.timezone,
    venueName: d.venueName,
    venueAddress: d.venueAddress,
    parking: d.parking,
    parkingNote: d.parkingNote,
    functions: d.scale === "personal" ? [] : d.functions,
    languages: d.languages.filter((c) => language(c)),
    copy: d.copy,
    translation: d.languages.length > 1 ? d.translation : null,
    template: d.template,
    palette: paletteFor(d.palette, d.customColor),
    textStyle: d.textStyle,
    border: d.border,
    photoStyle: d.photoStyle,
    motion: d.motion,
    cover: d.cover,
    toggles: d.toggles,
    hideBranding: plan(d.plan).hideBranding,
  };
}
