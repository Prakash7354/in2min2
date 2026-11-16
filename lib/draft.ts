// The host's event while they build it. Until sign-in is connected it is kept
// on their own phone (localStorage) and saved after every change; after sign-in
// it is saved to the database instead (events, event_people, sub_events,
// feature_toggles). Field names follow the database columns.

import { COPY_KEYS, type EventCopy } from "@/lib/ai/copy";
import {
  eventType, heroMotionOf, language, ORGANISER_TYPES, paletteFor, plan, togglesFor,
  type CoverFit, type EffectKey, type HeroMotion, type Parking, type PhotoStyle, type PlanKey, type Scale, type Template, type TextStyle, type ToggleKey,
} from "@/lib/catalog";
import { creditFor, defaultCredit, type CreditChoice, type EventViewData, type ViewFunction, type ViewPerson } from "@/lib/event-view";

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
  effect: EffectKey;
  cover: string | null;
  coverFit: CoverFit;
  moreCovers: string[];   // up to four more photos for the top of the page (0007), data: URLs
  heroMotion: HeroMotion; // how they change
  toggles: Record<ToggleKey, boolean>;
  slug: string;
  isPrivate: boolean;
  offerCode: string;
  checked: boolean;
  step: number;
  // Once published (signed in): the event's id and address, and whether the code was used.
  eventId?: string;
  publishedPath?: string;
  shortPath?: string; // "/e/x9k2b": the short link, easy to read aloud or put on a poster
  offerClaimed?: boolean;
  publishedHash?: string; // fingerprint() when last published, to spot changes not yet live
  // The main photo and preview picture as stored (0005), and what they were made from.
  coverKey?: string | null;
  shareKey?: string | null;
  heroKeys?: string[];    // the four more, as stored (0007)
  heroHash?: string;      // what they were made from, so unchanged photos aren't sent again
  mediaHash?: string;
  // Builder 2.0 (/new), kept on this phone only: where the Quick start got
  // to, whether it's finished, who wrote the words (the AI, ready-made
  // suggestions, or the host), and a milestone such as "50th" for the title.
  quickAt?: string;
  quickDone?: boolean;
  wordsBy?: "ai" | "suggested" | "host";
  milestone?: string;
  // The line at the bottom left of the page (lib/event-view.ts creditFor):
  // left out = made from the organiser or family; null = hidden. Published
  // in feature_toggles.settings.credit.
  credit?: CreditChoice;
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
    effect: "none",
    cover: null,
    coverFit: "fill",
    moreCovers: [],
    heroMotion: "zoomin",
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
    effect: t.sensitive ? "none" : t.effect ?? "none",
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
      toggles: { ...base.toggles, ...parsed.toggles }, heroMotion: heroMotionOf(parsed.heroMotion) };
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

// A short fingerprint of everything that publishing sends, so the builder can
// say "you have changes that aren't live yet". The photo isn't sent yet
// (photo storage comes later), so it's left out.
const LOCAL_ONLY = ["step", "checked", "eventId", "publishedPath", "shortPath", "offerClaimed", "publishedHash", "cover", "offerCode",
  "coverKey", "shareKey", "mediaHash", "moreCovers", "heroKeys", "heroHash", "quickAt", "quickDone", "wordsBy", "milestone"] as const;
export function fingerprint(d: Draft): string {
  const rest: Record<string, unknown> = { ...d };
  for (const k of LOCAL_ONLY) delete rest[k];
  // The showcase photos (0007) count as a change, by a cheap signature rather
  // than the whole pictures.
  if (d.moreCovers?.length) rest.photoSig = [d.cover, ...d.moreCovers].map((u) => (u ? `${u.length}${u.slice(-40)}` : "")).join("|");
  const s = JSON.stringify(rest);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function unpublishedChanges(d: Draft): boolean {
  return !!d.eventId && !!d.publishedHash && d.publishedHash !== fingerprint(d);
}

// What still has to be filled in before the event can be published, and the
// step (0-based) where each thing is asked.
export function missingForPublish(d: Draft): { text: string; step: number }[] {
  const t = eventType(d.eventType);
  const community = d.scale === "community";
  const slug = d.slug || slugify(d.title || d.stars.names);
  const missing: { text: string; step: number }[] = [];
  if (!t) missing.push({ text: "What you're celebrating", step: 0 });
  if (!d.title.trim()) missing.push({ text: "The name of the event", step: 1 });
  if (community && !d.organiserName.trim()) missing.push({ text: "The organiser's name", step: 1 });
  if (community && !d.organiserType) missing.push({ text: "What kind of organiser", step: 1 });
  if (community && d.forProfit === null) missing.push({ text: "Whether anyone makes a profit", step: 1 });
  if (!d.date) missing.push({ text: "The date", step: 2 });
  if (!d.startTime) missing.push({ text: "The start time", step: 2 });
  if (!slugOk(slug)) missing.push({ text: "A web address", step: 6 });
  return missing;
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
    functions: d.functions,
    languages: d.languages.filter((c) => language(c)),
    copy: d.copy,
    translation: d.languages.length > 1 ? d.translation : null,
    template: d.template,
    palette: paletteFor(d.palette, d.customColor),
    textStyle: d.textStyle,
    border: d.border,
    photoStyle: d.photoStyle,
    motion: d.motion,
    effect: d.effect,
    cover: d.cover,
    coverFit: d.coverFit,
    moreCovers: d.cover ? d.moreCovers ?? [] : [],
    heroMotion: heroMotionOf(d.heroMotion),
    toggles: d.toggles,
    hideBranding: plan(d.plan).hideBranding,
    credit: creditFor(d.credit, defaultCredit({ scale: d.scale, sensitive: t?.sensitive ?? false, organiserName: d.organiserName, family: d.family })),
  };
}
