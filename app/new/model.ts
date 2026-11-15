// Design 2.0 prototype (/new): the answers from the 6 screens, the bold
// event-type tiles, and complete ready-made looks to swipe through. The
// answers stay on this phone only (in2min2.new.v1), apart from the real
// builder's draft; nothing is sent anywhere.

import type { IconName } from "@/components/icons";
import { EVENT_TYPES, eventType, type BorderKey, type PhotoStyle, type Template, type TextStyle } from "@/lib/catalog";
import { applyType, newDraft, type Draft } from "@/lib/draft";

export type Answers = {
  type: string | null;
  names: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  venue: string;
  address: string;
  look: string | null;
  photo: string | null;
};
export const EMPTY: Answers = { type: null, names: "", date: "", time: "", venue: "", address: "", look: null, photo: null };

const KEY = "in2min2.new.v1";
export function loadAnswers(): Answers {
  try { return { ...EMPTY, ...(JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Partial<Answers>) }; } catch { return EMPTY; }
}
export function saveAnswers(a: Answers) {
  try { window.localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* a big photo may not fit; the rest still works */ }
}

// Each kind of event gets a picture and two colours, so the first screen is bold.
export const TYPE_ART: Record<string, { icon: IconName; from: string; to: string }> = {
  birthday: { icon: "cake", from: "#ff8a3d", to: "#ff3d7f" },
  pasni: { icon: "bowl", from: "#ffc53d", to: "#ff7a1a" },
  party: { icon: "balloon", from: "#b14dff", to: "#ff4fa3" },
  ceremony: { icon: "sparkle", from: "#6a5cff", to: "#b38cff" },
  wedding: { icon: "rings", from: "#e8336a", to: "#9b1d4a" },
  engagement: { icon: "heart", from: "#ff5c8a", to: "#c2185b" },
  anniversary: { icon: "heart", from: "#d63384", to: "#7b2cbf" },
  bratabandha: { icon: "star", from: "#f59e0b", to: "#b45309" },
  reunion: { icon: "people", from: "#22a6b3", to: "#1e6fd9" },
  corporate: { icon: "briefcase", from: "#3d5afe", to: "#1a237e" },
  mela: { icon: "flag", from: "#ff9800", to: "#e91e63" },
  sport: { icon: "trophy", from: "#2ecc71", to: "#0b8a5f" },
  charity: { icon: "heart", from: "#26c6da", to: "#00838f" },
  community: { icon: "people", from: "#29b6f6", to: "#5e35b1" },
  memorial: { icon: "flower", from: "#8d8ab5", to: "#4a4870" },
  christmas: { icon: "tree", from: "#2e9d5b", to: "#c62828" },
  "new-year": { icon: "sparkle", from: "#ffca28", to: "#5e35b1" },
  lhosar: { icon: "flag", from: "#1f5fbf", to: "#c8102e" },
};
export const FIRST_TYPES = ["birthday", "wedding", "pasni", "christmas", "new-year", "lhosar", "party", "memorial"];
export const MORE_TYPES = EVENT_TYPES.map((t) => t.key).filter((k) => !FIRST_TYPES.includes(k));

// Complete looks: colours, border, letters, layout and photo shape chosen
// together, so the host chooses once instead of six times.
export type Look = { key: string; name: string; palette: string; border: BorderKey; textStyle: TextStyle; template: Template; photoStyle: PhotoStyle };
const GENERAL: Look[] = [
  { key: "indigo", name: "Marigold & indigo", palette: "marigold_indigo", border: "fine_line", textStyle: "classic", template: "classic", photoStyle: "arch" },
  { key: "rose", name: "Rose and gold", palette: "lali_gurans", border: "floral", textStyle: "elegant", template: "classic", photoStyle: "arch" },
  { key: "midnight", name: "Midnight gold", palette: "midnight_gold", border: "stars", textStyle: "formal", template: "modern", photoStyle: "hero" },
  { key: "party", name: "Party brights", palette: "confetti_brights", border: "confetti", textStyle: "playful", template: "festive", photoStyle: "polaroid" },
  { key: "sunset", name: "Sunset", palette: "sunset", border: "none", textStyle: "contemporary", template: "modern", photoStyle: "hero" },
  { key: "garden", name: "Garden", palette: "garden_green", border: "vines", textStyle: "heritage", template: "classic", photoStyle: "arch" },
  { key: "pastel", name: "Pastel", palette: "pastel_party", border: "balloons", textStyle: "handwritten", template: "festive", photoStyle: "polaroid" },
];
const CALM: Look[] = [
  { key: "calm", name: "Calm", palette: "calm", border: "fine_line", textStyle: "classic", template: "classic", photoStyle: "arch" },
  { key: "lily", name: "Lily", palette: "lily", border: "laurel", textStyle: "elegant", template: "classic", photoStyle: "arch" },
  { key: "charcoal", name: "Charcoal and silver", palette: "charcoal_silver", border: "fine_line", textStyle: "formal", template: "classic", photoStyle: "hero" },
];
const COMMUNITY: Look[] = [
  { key: "festival", name: "Festival", palette: "festival_rainbow", border: "bunting", textStyle: "bold", template: "festive", photoStyle: "hero" },
  { key: "saffron", name: "Saffron", palette: "saffron", border: "mandala", textStyle: "heritage", template: "festive", photoStyle: "hero" },
  { key: "royal", name: "Royal blue", palette: "royal_blue", border: "art_deco", textStyle: "formal", template: "modern", photoStyle: "hero" },
];

export function looksFor(typeKey: string | null): Look[] {
  const t = eventType(typeKey);
  const own: Look | null = t ? {
    key: "own", name: `Made for ${t.label.toLowerCase()}`, palette: t.palette, border: (t.borders?.[0] ?? "none") as BorderKey,
    textStyle: t.textStyle, template: t.theme as Template, photoStyle: t.photoStyle,
  } : null;
  const pool = t?.sensitive ? CALM : t?.scale === "community" ? [...COMMUNITY, ...GENERAL.slice(0, 3)] : GENERAL;
  return [...(own ? [own] : []), ...pool.filter((l) => l.palette !== own?.palette)];
}

// A real builder draft from the answers, so the preview is the real page.
// Words are written from the answers here; in the finished builder the AI
// writes them in the background.
export function draftFrom(a: Answers, look?: Look | null): Draft {
  const t = eventType(a.type);
  let d = newDraft();
  if (a.type) d = applyType(d, a.type);
  const names = a.names.trim();
  const community = t?.scale === "community";
  const label = t?.label ?? "Our event";
  const headline = names ? (community ? names : `${names}${t?.sensitive ? "" : `’s ${label.toLowerCase()}`}`) : label;
  d = {
    ...d,
    title: names || label,
    stars: community ? d.stars : { ...d.stars, names },
    date: a.date, startTime: a.time, venueName: a.venue, venueAddress: a.address,
    cover: a.photo, coverFit: "fill",
    copy: {
      ...d.copy,
      card_headline: headline.slice(0, 45),
      card_invite_body: t?.sensitive ? "Please join us to remember and give thanks." : community ? "Everyone is welcome. Come and join us." : "We’d love you to join us to celebrate.",
    },
  };
  if (look) d = { ...d, palette: look.palette, border: look.border, textStyle: look.textStyle, template: look.template, photoStyle: look.photoStyle };
  return d;
}

// Quick dates: this Saturday and next Saturday.
export function saturday(weeksAhead: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const add = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + add + weeksAhead * 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
