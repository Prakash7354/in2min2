// What the builder offers, and how prices are worked out.
//
// EVENT_TYPES, PLANS and TOGGLES mirror the seeds and defaults in
// supabase/migrations/0001_init.sql. `npm run test:db` checks they still match
// (supabase/tests/catalog.test.mjs), so change both together.
//
// This file has no imports on purpose: Node runs it directly in that check.

export type Scale = "personal" | "celebration" | "community";
export type Template = "classic" | "modern" | "festive" | "sport";
export type TextStyle = "clean" | "classic" | "elegant" | "calligraphy" | "bold";
export type PhotoStyle = "hero" | "arch" | "polaroid" | "split";
export type Parking = "unknown" | "none" | "free" | "paid" | "street";
export type PlanKey = "popup" | "season" | "half_year" | "keepsake" | "community";

export type ToggleKey =
  | "ai_copy" | "rsvp" | "countdown" | "schedule" | "map_directions" | "photo_wall" | "auto_reminders"
  | "gift_registry" | "guestbook"
  | "tickets" | "team_entries" | "stalls" | "parking" | "live_scores" | "sponsors";

// ─────────────────────────────── Scales ───────────────────────────────

export const SCALES: Record<Scale, { label: string; line: string }> = {
  personal: { label: "Friends and family", line: "A birthday, Pasni or party" },
  celebration: { label: "A big family occasion", line: "Several functions, planned over weeks" },
  community: { label: "A public event", line: "Tickets, teams, stalls and parking" },
};

// ─────────────────────────────── Event types ───────────────────────────────

export type EventType = {
  key: string;
  label: string;
  scale: Scale;
  theme: Template;
  toggles: Partial<Record<ToggleKey, boolean>>;
  repeatsYearly: boolean;
  sensitive: boolean;
  // Builder only (not in the database):
  line: string;          // one line under the tile
  starLabel: string;     // "Who is it for?" label
  palette: PaletteKey;   // starting colours
  textStyle: TextStyle;
  photoStyle: PhotoStyle;
  tone: string;
};

export const EVENT_TYPES: EventType[] = [
  { key: "birthday", label: "Birthday", scale: "personal", theme: "modern", toggles: {}, repeatsYearly: true, sensitive: false,
    line: "Any age, any size", starLabel: "The birthday person", palette: "pastel_party", textStyle: "clean", photoStyle: "polaroid", tone: "Fun and playful" },
  { key: "pasni", label: "Pasni (rice feeding)", scale: "personal", theme: "festive", toggles: { gift_registry: true }, repeatsYearly: false, sensitive: false,
    line: "Baby's first rice", starLabel: "The child", palette: "marigold_indigo", textStyle: "classic", photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "party", label: "Party", scale: "personal", theme: "modern", toggles: {}, repeatsYearly: false, sensitive: false,
    line: "House-warming, get-together", starLabel: "Who it's for", palette: "royal_blue", textStyle: "clean", photoStyle: "hero", tone: "Fun and playful" },
  { key: "ceremony", label: "Family ceremony", scale: "personal", theme: "festive", toggles: { gift_registry: true }, repeatsYearly: false, sensitive: false,
    line: "Puja, naming, blessing", starLabel: "Who it's for", palette: "marigold_indigo", textStyle: "classic", photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "wedding", label: "Wedding", scale: "celebration", theme: "classic", toggles: { gift_registry: true, guestbook: true }, repeatsYearly: true, sensitive: false,
    line: "Mehndi, ceremony, reception", starLabel: "The couple", palette: "red_gold", textStyle: "calligraphy", photoStyle: "arch", tone: "Formal and elegant" },
  { key: "engagement", label: "Engagement", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: false, sensitive: false,
    line: "Tika, ring ceremony", starLabel: "The couple", palette: "lali_gurans", textStyle: "elegant", photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "anniversary", label: "Wedding anniversary", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: true, sensitive: false,
    line: "Silver, golden or any year", starLabel: "The couple", palette: "red_gold", textStyle: "elegant", photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "bratabandha", label: "Bratabandha", scale: "celebration", theme: "festive", toggles: { gift_registry: true }, repeatsYearly: false, sensitive: false,
    line: "Sacred thread ceremony", starLabel: "The boy", palette: "marigold_indigo", textStyle: "classic", photoStyle: "arch", tone: "Festive and joyful" },
  { key: "reunion", label: "Reunion or regimental day", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: true, sensitive: false,
    line: "Old comrades, classmates, family", starLabel: "Who's coming together", palette: "royal_blue", textStyle: "classic", photoStyle: "hero", tone: "Warm and welcoming" },
  { key: "corporate", label: "Corporate event", scale: "celebration", theme: "modern", toggles: { sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Dinner, launch, awards", starLabel: "The organisation", palette: "black_white", textStyle: "clean", photoStyle: "split", tone: "Formal and elegant" },
  { key: "mela", label: "Mela / festival", scale: "community", theme: "festive",
    toggles: { rsvp: false, tickets: true, stalls: true, parking: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Stalls, food, music, parking", starLabel: "The festival", palette: "marigold_indigo", textStyle: "bold", photoStyle: "hero", tone: "Festive and joyful" },
  { key: "sport", label: "Sports tournament", scale: "community", theme: "sport",
    toggles: { rsvp: false, tickets: true, team_entries: true, stalls: true, parking: true, sponsors: true, live_scores: true }, repeatsYearly: true, sensitive: false,
    line: "Teams, draw, fixtures, live scores", starLabel: "The tournament", palette: "pitch_green", textStyle: "bold", photoStyle: "split", tone: "Sporty and energetic" },
  { key: "charity", label: "Charity or fundraiser", scale: "community", theme: "festive", toggles: { tickets: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Walks, dinners, appeals", starLabel: "The cause", palette: "garden_green", textStyle: "clean", photoStyle: "hero", tone: "Warm and welcoming" },
  { key: "community", label: "Community event", scale: "community", theme: "festive", toggles: { tickets: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Dashain, Teej, cultural show", starLabel: "The event", palette: "himalayan_dusk", textStyle: "classic", photoStyle: "hero", tone: "Festive and joyful" },
  { key: "memorial", label: "Memorial or funeral", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: false, sensitive: true,
    line: "Funeral, prayers, remembrance", starLabel: "In memory of", palette: "calm", textStyle: "classic", photoStyle: "arch", tone: "Gentle and respectful" },
];

export const REPEAT_AS: Record<string, string> = { wedding: "anniversary" };

export function eventType(key: string | null | undefined): EventType | undefined {
  return EVENT_TYPES.find((t) => t.key === key);
}

// ─────────────────────────────── Plans and prices ───────────────────────────────
// PROVISIONAL launch prices (docs/CONCEPT.md, section 5). Money in whole pence.

export type Plan = {
  key: PlanKey;
  name: string;
  pricePence: number;
  daysAfter: number;
  guestLimit: number | null;
  photoLimit: number | null;
  photosPerGuest: number;
  aiWrites: number;
  fullResDownload: boolean;
  hideBranding: boolean;
  bookingFeeBps: number;
  bookingFeePence: number;
  scales: Scale[];
  packSize: number | null;
  packPence: number | null;
  sortOrder: number;
  // Builder only:
  duration: string;
  bestFor: string;
};

export const PLANS: Plan[] = [
  { key: "popup", name: "Pop-Up", pricePence: 0, daysAfter: 7, guestLimit: 200, photoLimit: 50, photosPerGuest: 10, aiWrites: 5,
    fullResDownload: false, hideBranding: false, bookingFeeBps: 0, bookingFeePence: 0, scales: ["personal", "celebration"],
    packSize: 100, packPence: 300, sortOrder: 1, duration: "7 days", bestFor: "Birthdays, Pasni, parties" },
  { key: "season", name: "Season", pricePence: 900, daysAfter: 90, guestLimit: 300, photoLimit: 300, photosPerGuest: 20, aiWrites: 30,
    fullResDownload: false, hideBranding: false, bookingFeeBps: 0, bookingFeePence: 0, scales: ["personal", "celebration"],
    packSize: 100, packPence: 300, sortOrder: 2, duration: "90 days", bestFor: "Anniversaries, engagements, reunions" },
  { key: "half_year", name: "Half-Year", pricePence: 1500, daysAfter: 182, guestLimit: 400, photoLimit: 600, photosPerGuest: 20, aiWrites: 50,
    fullResDownload: false, hideBranding: false, bookingFeeBps: 0, bookingFeePence: 0, scales: ["personal", "celebration"],
    packSize: 100, packPence: 300, sortOrder: 3, duration: "6 months", bestFor: "Weddings planned well ahead" },
  { key: "keepsake", name: "Keepsake", pricePence: 2500, daysAfter: 365, guestLimit: 500, photoLimit: 1000, photosPerGuest: 30, aiWrites: 100,
    fullResDownload: true, hideBranding: true, bookingFeeBps: 0, bookingFeePence: 0, scales: ["personal", "celebration"],
    packSize: 100, packPence: 300, sortOrder: 4, duration: "12 months", bestFor: "Weddings and milestones to keep" },
  { key: "community", name: "Community", pricePence: 0, daysAfter: 90, guestLimit: null, photoLimit: 2000, photosPerGuest: 20, aiWrites: 30,
    fullResDownload: false, hideBranding: false, bookingFeeBps: 400, bookingFeePence: 30, scales: ["community"],
    packSize: null, packPence: null, sortOrder: 5, duration: "90 days", bestFor: "Melas, tournaments, fundraisers" },
];

export function plan(key: PlanKey): Plan {
  const p = PLANS.find((x) => x.key === key);
  if (!p) throw new Error(`Unknown plan ${key}`);
  return p;
}

export function plansFor(scale: Scale): Plan[] {
  return PLANS.filter((p) => p.scales.includes(scale));
}

// Discounts (docs/CONCEPT.md 5g and 5h). Recommended numbers, not yet confirmed.
export const SAME_AGAIN_PERCENT = 30;
export const WELCOME_BACK_PERCENT = 20;

export type Quote = {
  plan: PlanKey;
  people: number;
  basePence: number;
  packs: number;
  packsPence: number;
  subtotalPence: number;
  discount: { kind: "fee_level" | "same_again" | "welcome_back"; percentOff: number } | null;
  totalPence: number;
};

// Packs of extra people needed on top of what the plan includes.
export function packsNeeded(p: Plan, people: number): number {
  if (p.guestLimit === null || p.packSize === null) return 0;
  return Math.max(0, Math.ceil((people - p.guestLimit) / p.packSize));
}

// The price of a plan for this many people. Only the single best discount
// applies: the owner's fee level (100, 50 or 0 percent of the normal price),
// same event again, or welcome back. Discounts never stack.
export function quote(
  planKey: PlanKey,
  people: number,
  opts: { chargePercent?: 0 | 50 | 100; sameAgain?: boolean; welcomeBack?: boolean } = {},
): Quote {
  const p = plan(planKey);
  const n = Math.max(0, Math.floor(people || 0));
  const packs = packsNeeded(p, n);
  const packsPence = packs * (p.packPence ?? 0);
  const subtotalPence = p.pricePence + packsPence;
  const options: NonNullable<Quote["discount"]>[] = [];
  const charge = opts.chargePercent ?? 100;
  if (charge < 100) options.push({ kind: "fee_level", percentOff: 100 - charge });
  if (opts.sameAgain) options.push({ kind: "same_again", percentOff: SAME_AGAIN_PERCENT });
  if (opts.welcomeBack) options.push({ kind: "welcome_back", percentOff: WELCOME_BACK_PERCENT });
  const best = options.sort((a, b) => b.percentOff - a.percentOff)[0] ?? null;
  const totalPence = best ? Math.round((subtotalPence * (100 - best.percentOff)) / 100) : subtotalPence;
  return { plan: p.key, people: n, basePence: p.pricePence, packs, packsPence, subtotalPence, discount: subtotalPence ? best : null, totalPence };
}

// In2Min2's booking fee on one online order (community events), in pence.
export function bookingFee(orderPence: number, chargePercent: 0 | 50 | 100 = 100, p: Plan = plan("community")): number {
  if (orderPence <= 0) return 0;
  const full = (orderPence * p.bookingFeeBps) / 10000 + p.bookingFeePence;
  return Math.round((full * chargePercent) / 100);
}

export function formatPence(pence: number): string {
  if (pence === 0) return "Free";
  const pounds = pence / 100;
  return "£" + (Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2));
}

// ─────────────────────────────── Switches ───────────────────────────────
// Column defaults of public.feature_toggles. The type's own defaults go on top.

export const TOGGLE_DEFAULTS: Record<ToggleKey, boolean> = {
  ai_copy: true, rsvp: true, countdown: true, schedule: true, map_directions: true, photo_wall: true, auto_reminders: true,
  gift_registry: false, guestbook: false,
  tickets: false, team_entries: false, stalls: false, parking: false, live_scores: false, sponsors: false,
};

export const TOGGLES: { key: ToggleKey; label: string; line: string; scales: Scale[]; later?: string }[] = [
  { key: "rsvp", label: "Replies (RSVP)", line: "Guests say yes, no or maybe, and how many are coming", scales: ["personal", "celebration", "community"] },
  { key: "countdown", label: "Countdown", line: "Shows how many days are left", scales: ["personal", "celebration", "community"] },
  { key: "schedule", label: "Schedule", line: "The functions or programme of the day, in order", scales: ["personal", "celebration", "community"] },
  { key: "map_directions", label: "Map and directions", line: "One tap opens directions on the guest's phone", scales: ["personal", "celebration", "community"] },
  { key: "photo_wall", label: "Photo wall", line: "Guests add photos on the day; a gallery afterwards", scales: ["personal", "celebration", "community"] },
  { key: "auto_reminders", label: "Reminders", line: "A reminder to guests the day before", scales: ["personal", "celebration", "community"] },
  { key: "gift_registry", label: "Gifts", line: "A gift list link, or a note about gifts", scales: ["personal", "celebration"] },
  { key: "guestbook", label: "Guestbook", line: "Guests leave a message for you", scales: ["personal", "celebration"] },
  { key: "tickets", label: "Tickets", line: "Entry tickets, paid or free, with QR passes", scales: ["community"], later: "February" },
  { key: "parking", label: "Car parking", line: "Sell parking passes online, cheaper than on the day", scales: ["community"], later: "February" },
  { key: "stalls", label: "Stalls", line: "Businesses and charities apply for a stall", scales: ["community"], later: "February" },
  { key: "sponsors", label: "Sponsors", line: "Sponsor logos on the page and the big screen", scales: ["community"], later: "February" },
  { key: "team_entries", label: "Team entries", line: "Teams apply and pay; the draw and fixtures follow", scales: ["community"], later: "March" },
  { key: "live_scores", label: "Live scores", line: "Results and tables update as games finish", scales: ["community"], later: "March" },
];

export function togglesFor(typeKey: string | null): Record<ToggleKey, boolean> {
  return { ...TOGGLE_DEFAULTS, ...(eventType(typeKey)?.toggles ?? {}) };
}

// ─────────────────────────────── The look ───────────────────────────────

export type PaletteKey =
  | "marigold_indigo" | "lali_gurans" | "himalayan_dusk"
  | "red_gold" | "royal_blue" | "garden_green" | "pastel_party" | "black_white" | "pitch_green" | "calm";

export type Palette = {
  key: PaletteKey | "custom";
  name: string;
  brand?: boolean; // one of In2Min2's own three
  bg: string; main: string; onMain: string; accent: string; onAccent: string; soft: string; ink: string; muted: string;
};

// Every pair used for text passes WCAG AA (4.5:1), checked 13 Nov 2026.
export const PALETTES: Palette[] = [
  { key: "marigold_indigo", name: "Marigold & Indigo", brand: true, bg: "#FFF9EF", main: "#2E2A6E", onMain: "#FFFFFF", accent: "#F4A522", onAccent: "#1C1A3A", soft: "#F2C4CB", ink: "#1C1A3A", muted: "#5C5878" },
  { key: "lali_gurans", name: "Lali Gurans", brand: true, bg: "#FFF8F4", main: "#C0163D", onMain: "#FFFFFF", accent: "#F2B134", onAccent: "#15203B", soft: "#F6D6D9", ink: "#15203B", muted: "#5E5A66" },
  { key: "himalayan_dusk", name: "Himalayan Dusk", brand: true, bg: "#F6F7FA", main: "#4A2545", onMain: "#FFFFFF", accent: "#F7A072", onAccent: "#4A2545", soft: "#CFE6E4", ink: "#22172A", muted: "#5D5866" },
  { key: "red_gold", name: "Red & Gold", bg: "#FFF7EC", main: "#8E1B1B", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#2B1408", soft: "#F3E3C3", ink: "#2B1408", muted: "#6A5446" },
  { key: "royal_blue", name: "Royal Blue", bg: "#F5F8FF", main: "#1F3B8C", onMain: "#FFFFFF", accent: "#E0B84A", onAccent: "#111A33", soft: "#DCE5FA", ink: "#111A33", muted: "#4F5A75" },
  { key: "garden_green", name: "Garden Green", bg: "#F5FAF4", main: "#1F5E3A", onMain: "#FFFFFF", accent: "#E2A93B", onAccent: "#12261A", soft: "#D7ECD9", ink: "#12261A", muted: "#4E6355" },
  { key: "pastel_party", name: "Pastel Party", bg: "#FFF7FB", main: "#A63D74", onMain: "#FFFFFF", accent: "#6EC6CA", onAccent: "#1F2E33", soft: "#FBE0EC", ink: "#2E1A27", muted: "#6B5563" },
  { key: "black_white", name: "Black & White", bg: "#FFFFFF", main: "#111111", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#111111", soft: "#EFEFEF", ink: "#111111", muted: "#555555" },
  { key: "pitch_green", name: "Pitch Green", bg: "#F3F7F2", main: "#0F3D2B", onMain: "#FFFFFF", accent: "#F2C230", onAccent: "#0B1F16", soft: "#DCEADF", ink: "#0B1F16", muted: "#4B5E53" },
  { key: "calm", name: "Calm", bg: "#F4F3F1", main: "#4A4E57", onMain: "#FFFFFF", accent: "#A8A39A", onAccent: "#1F2126", soft: "#E4E1DC", ink: "#2A2C31", muted: "#5C5F66" },
];

function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The host's own colour: build a full palette round it, picking white or dark
// text automatically so everything stays readable.
export function paletteFor(key: string, customColor?: string): Palette {
  const found = PALETTES.find((p) => p.key === key);
  if (found) return found;
  const main = customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor) ? customColor : PALETTES[0].main;
  const ink = "#1C1A1F";
  const onMain = contrast("#FFFFFF", main) >= contrast(ink, main) ? "#FFFFFF" : ink;
  return { key: "custom", name: "Your own colour", bg: "#FFFFFF", main, onMain, accent: main, onAccent: onMain,
    soft: "#F1F0EE", ink, muted: "#5B5962" };
}

export const TEMPLATES: { key: Template; name: string; line: string }[] = [
  { key: "classic", name: "Classic", line: "Centred, framed, traditional" },
  { key: "modern", name: "Modern", line: "Big words, clean lines" },
  { key: "festive", name: "Festive", line: "Garland borders, warm and bright" },
  { key: "sport", name: "Sport", line: "Bold stripes, poster lettering" },
];

// Font CSS variables are set in app/fonts.ts.
export const TEXT_STYLES: { key: TextStyle; name: string; feel: string; display: string; body: string }[] = [
  { key: "clean", name: "Clean", feel: "Plain and modern",
    display: "var(--f-inter), var(--f-noto-sans-deva), system-ui, sans-serif", body: "var(--f-inter), var(--f-noto-sans-deva), system-ui, sans-serif" },
  { key: "classic", name: "Classic", feel: "Traditional serif",
    display: "var(--f-playfair), var(--f-noto-serif-deva), Georgia, serif", body: "var(--f-inter), var(--f-noto-sans-deva), system-ui, sans-serif" },
  { key: "elegant", name: "Elegant", feel: "Light and graceful",
    display: "var(--f-cormorant), var(--f-noto-serif-deva), Georgia, serif", body: "var(--f-cormorant), var(--f-noto-serif-deva), Georgia, serif" },
  { key: "calligraphy", name: "Calligraphy", feel: "Script headline for weddings",
    display: "var(--f-great-vibes), var(--f-kalam), cursive", body: "var(--f-cormorant), var(--f-noto-serif-deva), Georgia, serif" },
  { key: "bold", name: "Bold", feel: "Poster lettering for sport and melas",
    display: "var(--f-bebas), var(--f-mukta), Impact, sans-serif", body: "var(--f-mukta), system-ui, sans-serif" },
];

export const PHOTO_STYLES: { key: PhotoStyle; name: string; line: string }[] = [
  { key: "hero", name: "Hero", line: "The photo fills the top" },
  { key: "arch", name: "Arch", line: "The photo in an arch, for a child or a couple" },
  { key: "polaroid", name: "Polaroid", line: "Tilted like a snapshot, fun for birthdays" },
  { key: "split", name: "Split", line: "Photo on one side, words on the other" },
];

// ─────────────────────────────── Languages ───────────────────────────────

export const LANGUAGES: { code: string; name: string; native: string; ready: boolean; ai: string }[] = [
  { code: "en", name: "English", native: "English", ready: true, ai: "British English" },
  { code: "ne", name: "Nepali", native: "नेपाली", ready: true, ai: "Nepali in Devanagari script" },
  { code: "ne-Latn", name: "Nepali in English letters", native: "Nepali (Roman)", ready: true, ai: "Nepali written in English (Roman) letters" },
  { code: "hi", name: "Hindi", native: "हिन्दी", ready: false, ai: "Hindi in Devanagari script" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", ready: false, ai: "Punjabi in Gurmukhi script" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", ready: false, ai: "Gujarati" },
  { code: "bn", name: "Bengali", native: "বাংলা", ready: false, ai: "Bengali" },
  { code: "ta", name: "Tamil", native: "தமிழ்", ready: false, ai: "Tamil" },
  { code: "tl", name: "Tagalog (Filipino)", native: "Tagalog", ready: false, ai: "Tagalog (Filipino)" },
  { code: "pl", name: "Polish", native: "Polski", ready: false, ai: "Polish" },
];

export function language(code: string | undefined) {
  return LANGUAGES.find((l) => l.code === code);
}

export const TONES = ["Warm and welcoming", "Formal and elegant", "Fun and playful", "Festive and joyful", "Sporty and energetic", "Gentle and respectful"];

// ─────────────────────────────── Venue and organiser ───────────────────────────────

export const PARKING_OPTIONS: { key: Parking; label: string; line: string }[] = [
  { key: "free", label: "Free car park", line: "Guests park free on site" },
  { key: "paid", label: "Paid parking", line: "A charge applies" },
  { key: "street", label: "Street parking", line: "Park on nearby roads" },
  { key: "none", label: "No parking", line: "Suggest a bus, train or taxi" },
];

export const ORGANISER_TYPES: { key: string; label: string }[] = [
  { key: "community_group", label: "Community group" },
  { key: "club", label: "Club or society" },
  { key: "charity", label: "Charity" },
  { key: "armed_forces", label: "Armed forces or veterans' association" },
  { key: "faith", label: "Faith group (temple, gurdwara, church, mosque)" },
  { key: "business", label: "Business" },
  { key: "individual", label: "An individual" },
  { key: "family", label: "A family" },
];
