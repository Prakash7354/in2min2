// What the builder offers, and how prices are worked out.
//
// EVENT_TYPES, PLANS and TOGGLES mirror the seeds and defaults in
// supabase/migrations/0001_init.sql. `npm run test:db` checks they still match
// (supabase/tests/catalog.test.mjs), so change both together.
//
// This file has no imports on purpose: Node runs it directly in that check.

export type Scale = "personal" | "celebration" | "community";
export type Template = "classic" | "modern" | "festive" | "sport";
export type TextStyle = "classic" | "formal" | "elegant" | "calligraphy" | "heritage" | "contemporary" | "clean" | "bold" | "playful" | "handwritten";
export type PhotoStyle = "hero" | "arch" | "polaroid" | "split";
export type Parking = "unknown" | "none" | "free" | "paid" | "street";
export type PlanKey = "popup" | "season" | "half_year" | "keepsake" | "community";

// A small label on a tile, so the choice feels like browsing a shop.
export type Tag = "popular" | "new" | "soon";
export const TAG_LABELS: Record<Tag, string> = { popular: "Popular", new: "New", soon: "Coming soon" };

export type ToggleKey =
  | "ai_copy" | "rsvp" | "countdown" | "schedule" | "map_directions" | "photo_wall" | "auto_reminders"
  | "gift_registry" | "guestbook"
  | "tickets" | "team_entries" | "stalls" | "parking" | "live_scores" | "sponsors"
  | "menu";

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
  palette: string;       // starting colours (PALETTES)
  textStyle: TextStyle;
  borders: BorderKey[];  // suggested borders, best first; the first is the starting one
  tag?: Tag;
  soonNote?: string;     // what is still to come, for "Coming soon" types
  photoStyle: PhotoStyle;
  tone: string;
};

export const EVENT_TYPES: EventType[] = [
  { key: "birthday", tag: "popular", label: "Birthday", scale: "personal", theme: "modern", toggles: {}, repeatsYearly: true, sensitive: false,
    line: "Any age, any size", starLabel: "The birthday person", palette: "confetti_brights", textStyle: "playful", borders: ["balloons", "confetti", "bunting", "stars", "floral"], photoStyle: "polaroid", tone: "Fun and playful" },
  { key: "pasni", tag: "popular", label: "Pasni (rice feeding)", scale: "personal", theme: "festive", toggles: { gift_registry: true }, repeatsYearly: false, sensitive: false,
    line: "Baby's first rice", starLabel: "The child", palette: "marigold_indigo", textStyle: "heritage", borders: ["marigold", "mandala", "floral", "balloons"], photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "party", label: "Party", scale: "personal", theme: "modern", toggles: {}, repeatsYearly: false, sensitive: false,
    line: "House-warming, get-together", starLabel: "Who it's for", palette: "citrus", textStyle: "playful", borders: ["confetti", "bunting", "balloons", "stars", "sunburst"], photoStyle: "hero", tone: "Fun and playful" },
  { key: "ceremony", label: "Family ceremony", scale: "personal", theme: "festive", toggles: { gift_registry: true }, repeatsYearly: false, sensitive: false,
    line: "Puja, naming, blessing", starLabel: "Who it's for", palette: "saffron", textStyle: "heritage", borders: ["marigold", "mandala", "dhaka", "ornate"], photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "wedding", tag: "popular", label: "Wedding", scale: "celebration", theme: "classic", toggles: { gift_registry: true, guestbook: true }, repeatsYearly: true, sensitive: false,
    line: "Mehndi, ceremony, reception", starLabel: "The couple", palette: "red_gold", textStyle: "calligraphy", borders: ["ornate", "floral", "marigold", "art_deco", "mandala", "fine_line"], photoStyle: "arch", tone: "Formal and elegant" },
  { key: "engagement", label: "Engagement", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: false, sensitive: false,
    line: "Tika, ring ceremony", starLabel: "The couple", palette: "burgundy_gold", textStyle: "elegant", borders: ["floral", "ornate", "art_deco", "stars"], photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "anniversary", label: "Wedding anniversary", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: true, sensitive: false,
    line: "Silver, golden or any year", starLabel: "The couple", palette: "black_gold", textStyle: "elegant", borders: ["art_deco", "ornate", "floral", "stars", "fine_line"], photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "bratabandha", label: "Bratabandha", scale: "celebration", theme: "festive", toggles: { gift_registry: true }, repeatsYearly: false, sensitive: false,
    line: "Sacred thread ceremony", starLabel: "The boy", palette: "saffron", textStyle: "heritage", borders: ["mandala", "marigold", "dhaka", "ornate"], photoStyle: "arch", tone: "Festive and joyful" },
  { key: "reunion", tag: "new", label: "Reunion or regimental day", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: true, sensitive: false,
    line: "Old comrades, classmates, family", starLabel: "Who's coming together", palette: "regimental", textStyle: "formal", borders: ["laurel", "fine_line", "art_deco", "bunting", "dhaka"], photoStyle: "hero", tone: "Warm and welcoming" },
  { key: "corporate", label: "Corporate event", scale: "celebration", theme: "modern", toggles: { sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Dinner, launch, awards", starLabel: "The organisation", palette: "navy_gold", textStyle: "formal", borders: ["fine_line", "art_deco", "none", "stars"], photoStyle: "split", tone: "Formal and elegant" },
  { key: "mela", tag: "soon", soonNote: "Ticket and parking sales arrive in February. You can make the page now.", label: "Mela / festival", scale: "community", theme: "festive",
    toggles: { rsvp: false, tickets: true, stalls: true, parking: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Stalls, food, music, parking", starLabel: "The festival", palette: "festival_rainbow", textStyle: "bold", borders: ["rainbow", "bunting", "sunburst", "dhaka", "confetti", "marigold"], photoStyle: "hero", tone: "Festive and joyful" },
  { key: "sport", tag: "soon", soonNote: "Teams, the draw and live scores arrive in March. You can make the page now.", label: "Sports tournament", scale: "community", theme: "sport",
    toggles: { rsvp: false, tickets: true, team_entries: true, stalls: true, parking: true, sponsors: true, live_scores: true }, repeatsYearly: true, sensitive: false,
    line: "Teams, draw, fixtures, live scores", starLabel: "The tournament", palette: "pitch_green", textStyle: "bold", borders: ["stripes", "pitch", "laurel", "bunting", "sunburst"], photoStyle: "split", tone: "Sporty and energetic" },
  { key: "charity", label: "Charity or fundraiser", scale: "community", theme: "festive", toggles: { tickets: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Walks, dinners, appeals", starLabel: "The cause", palette: "garden_green", textStyle: "contemporary", borders: ["vines", "rainbow", "sunburst", "floral", "bunting"], photoStyle: "hero", tone: "Warm and welcoming" },
  { key: "community", label: "Community event", scale: "community", theme: "festive", toggles: { tickets: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Dashain, Teej, cultural show", starLabel: "The event", palette: "dhaka", textStyle: "heritage", borders: ["dhaka", "bunting", "rainbow", "marigold", "sunburst"], photoStyle: "hero", tone: "Festive and joyful" },
  { key: "memorial", tag: "new", label: "Memorial or funeral", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: false, sensitive: true,
    line: "Funeral, prayers, remembrance", starLabel: "In memory of", palette: "calm", textStyle: "formal", borders: ["fine_line", "laurel", "vines", "none"], photoStyle: "arch", tone: "Gentle and respectful" },
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
  menu: true, // 0003
};

export const TOGGLES: { key: ToggleKey; label: string; line: string; scales: Scale[]; later?: string }[] = [
  { key: "rsvp", label: "Replies (RSVP)", line: "Guests say yes, no or maybe, and how many are coming", scales: ["personal", "celebration", "community"] },
  { key: "countdown", label: "Countdown", line: "Shows how many days are left", scales: ["personal", "celebration", "community"] },
  { key: "schedule", label: "Running order", line: "What happens when on the day, in time order", scales: ["personal", "celebration", "community"] },
  { key: "menu", label: "Food menu", line: "What's being served, shown with its meal in the running order", scales: ["personal", "celebration", "community"] },
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

export type PaletteFamily = "In2Min2" | "Formal" | "Nepali and South Asian" | "Modern" | "Festival colours" | "Party" | "Sport" | "Calm";

export type Palette = {
  key: string;
  tag?: Tag;
  name: string;
  family: PaletteFamily;
  bg: string; main: string; onMain: string; accent: string; onAccent: string; soft: string; ink: string; muted: string;
  dark?: boolean;      // light text on a dark page
  gradient?: string;   // a colour blend behind the card and in some borders
  party?: string[];    // colours for confetti, balloons, bunting and leaves
};

// Every pair used for text passes WCAG AA (4.5:1); checked by npm run test:db.
// Grouped like a high-street shop: formal first, party last.
export const PALETTES: Palette[] = [
  // In2Min2's own three (owner's choice, 13 Nov 2026)
  { key: "marigold_indigo", tag: "popular", name: "Marigold & Indigo", family: "In2Min2", bg: "#FFF9EF", main: "#2E2A6E", onMain: "#FFFFFF", accent: "#F4A522", onAccent: "#1C1A3A", soft: "#F7E6C4", ink: "#1C1A3A", muted: "#5C5878" },
  { key: "lali_gurans", name: "Lali Gurans", family: "In2Min2", bg: "#FFF8F4", main: "#C0163D", onMain: "#FFFFFF", accent: "#F2B134", onAccent: "#15203B", soft: "#F3DCD6", ink: "#15203B", muted: "#5E5A66" },
  { key: "himalayan_dusk", name: "Himalayan Dusk", family: "In2Min2", bg: "#F6F7FA", main: "#4A2545", onMain: "#FFFFFF", accent: "#F7A072", onAccent: "#4A2545", soft: "#CFE6E4", ink: "#22172A", muted: "#5D5866" },
  // Formal: regimental days, memorials, corporate, charities, anniversaries
  { key: "navy_gold", tag: "popular", name: "Navy & Gold", family: "Formal", bg: "#FBF8F1", main: "#14213D", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#14213D", soft: "#ECE5D3", ink: "#14213D", muted: "#535A6B" },
  { key: "regimental", name: "Regimental Green", family: "Formal", bg: "#F7F5EE", main: "#1F3A2E", onMain: "#FFFFFF", accent: "#B8973A", onAccent: "#13261D", soft: "#E3E6D8", ink: "#13261D", muted: "#4F5B52" },
  { key: "black_gold", name: "Black & Gold", family: "Formal", dark: true, bg: "#141414", main: "#D4AF37", onMain: "#141414", accent: "#D4AF37", onAccent: "#141414", soft: "#24211A", ink: "#F3EBD3", muted: "#BDB291" },
  { key: "burgundy_gold", name: "Burgundy & Gold", family: "Formal", bg: "#FBF6F0", main: "#6B1D2F", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#2B0D14", soft: "#EEDFD0", ink: "#2B0D14", muted: "#6A5258" },
  { key: "charcoal_silver", name: "Charcoal & Silver", family: "Formal", bg: "#F6F6F5", main: "#2E3138", onMain: "#FFFFFF", accent: "#9AA1AC", onAccent: "#15171B", soft: "#E3E4E6", ink: "#1C1E22", muted: "#555A63" },
  { key: "black_white", name: "Black & White", family: "Formal", bg: "#FFFFFF", main: "#111111", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#111111", soft: "#EFEFEF", ink: "#111111", muted: "#555555" },
  // Nepali and South Asian
  { key: "red_gold", tag: "popular", name: "Red & Gold", family: "Nepali and South Asian", bg: "#FFF7EC", main: "#8E1B1B", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#2B1408", soft: "#F3E3C3", ink: "#2B1408", muted: "#6A5446" },
  { key: "dhaka", name: "Dhaka Red", family: "Nepali and South Asian", bg: "#FFF8F0", main: "#A8201A", onMain: "#FFFFFF", accent: "#E39B2D", onAccent: "#1B1B1B", soft: "#F2E3CF", ink: "#1B1B1B", muted: "#5E534A",
    party: ["#A8201A", "#1B1B1B", "#E39B2D", "#F2E3CF", "#7A5C2E"] },
  { key: "saffron", name: "Saffron & Maroon", family: "Nepali and South Asian", bg: "#FFF7EA", main: "#7A1F2B", onMain: "#FFFFFF", accent: "#F08A24", onAccent: "#2A0E12", soft: "#FBE3C1", ink: "#2A0E12", muted: "#6B4F44" },
  { key: "tihar_night", tag: "new", name: "Tihar Night", family: "Nepali and South Asian", dark: true, bg: "#1E1433", main: "#F4A522", onMain: "#1E1433", accent: "#F26B3A", onAccent: "#1E1433", soft: "#2D2149", ink: "#F8EEDC", muted: "#CBBCDD",
    gradient: "linear-gradient(160deg, #1E1433 0%, #3A1F5C 55%, #6B2A4A 100%)", party: ["#F4A522", "#F26B3A", "#FFD36E", "#E8E0F5", "#B993F2"] },
  // Modern
  { key: "sage_terracotta", name: "Sage & Terracotta", family: "Modern", bg: "#F7F3EC", main: "#4E6B53", onMain: "#FFFFFF", accent: "#AD5230", onAccent: "#FFFFFF", soft: "#E3E8DC", ink: "#23302A", muted: "#56615A" },
  { key: "ocean", name: "Ocean & Coral", family: "Modern", bg: "#F3F8F9", main: "#0E5A66", onMain: "#FFFFFF", accent: "#FF8366", onAccent: "#1A1F24", soft: "#D6EBEE", ink: "#10262B", muted: "#4B5F64" },
  { key: "royal_blue", name: "Royal Blue", family: "Modern", bg: "#F5F8FF", main: "#1F3B8C", onMain: "#FFFFFF", accent: "#E0B84A", onAccent: "#111A33", soft: "#DCE5FA", ink: "#111A33", muted: "#4F5A75" },
  { key: "garden_green", name: "Garden Green", family: "Modern", bg: "#F5FAF4", main: "#1F5E3A", onMain: "#FFFFFF", accent: "#E2A93B", onAccent: "#12261A", soft: "#D7ECD9", ink: "#12261A", muted: "#4E6355" },
  { key: "lavender_sage", name: "Lavender & Sage", family: "Modern", bg: "#F7F5FB", main: "#5A4A8A", onMain: "#FFFFFF", accent: "#9DB89A", onAccent: "#1F2A1E", soft: "#E6E1F3", ink: "#221B36", muted: "#5D5870" },
  // Festival colours: blends, like a festival poster
  { key: "festival_rainbow", tag: "new", name: "Festival Rainbow", family: "Festival colours", bg: "#F3ECDF", main: "#111111", onMain: "#F3ECDF", accent: "#F2B134", onAccent: "#111111", soft: "#E6DCCB", ink: "#111111", muted: "#4A443B",
    gradient: "linear-gradient(120deg, #7B3FE4 0%, #E6399B 22%, #F5A524 45%, #8BC34A 66%, #2EB5A0 83%, #4FA8F0 100%)", party: ["#7B3FE4", "#E6399B", "#F5A524", "#8BC34A", "#2EB5A0", "#4FA8F0"] },
  { key: "sunset", name: "Sunset Mela", family: "Festival colours", bg: "#FFF6EC", main: "#5B1E4D", onMain: "#FFFFFF", accent: "#F28C28", onAccent: "#2A0D22", soft: "#FBE2CC", ink: "#2A0D22", muted: "#6A4E5F",
    gradient: "linear-gradient(135deg, #5B1E4D 0%, #B2365B 35%, #F28C28 70%, #F6C445 100%)", party: ["#5B1E4D", "#B2365B", "#F28C28", "#F6C445", "#FFE7B3"] },
  { key: "holi", tag: "new", name: "Holi Colours", family: "Festival colours", bg: "#FFFDF8", main: "#2D2A7A", onMain: "#FFFFFF", accent: "#FFC93C", onAccent: "#1D1B4F", soft: "#EEF0FB", ink: "#1D1B4F", muted: "#55537A",
    gradient: "linear-gradient(120deg, #FF4FA3 0%, #FFC93C 28%, #38C172 52%, #3BA4F5 76%, #8E5CF7 100%)", party: ["#FF4FA3", "#FFC93C", "#38C172", "#3BA4F5", "#8E5CF7"] },
  { key: "aurora", tag: "new", name: "Northern Lights", family: "Festival colours", dark: true, bg: "#0C1424", main: "#6EE7C8", onMain: "#0C1424", accent: "#A78BFA", onAccent: "#0C1424", soft: "#16223A", ink: "#E8F0FA", muted: "#A3B3CA",
    gradient: "linear-gradient(150deg, #0C1424 0%, #0E5A66 45%, #3DB89A 75%, #A78BFA 100%)", party: ["#6EE7C8", "#A78BFA", "#3DB89A", "#7DD3FC", "#F0ABFC"] },
  { key: "confetti_brights", name: "Confetti Brights", family: "Festival colours", bg: "#FFFFFF", main: "#1D4ED8", onMain: "#FFFFFF", accent: "#FACC15", onAccent: "#1A1A1A", soft: "#E8F0FE", ink: "#111827", muted: "#4B5563",
    gradient: "linear-gradient(90deg, #EF4444, #F59E0B, #FACC15, #22C55E, #3B82F6, #8B5CF6)", party: ["#EF4444", "#F59E0B", "#FACC15", "#22C55E", "#3B82F6", "#8B5CF6"] },
  // Party
  { key: "citrus", name: "Citrus Pop", family: "Party", bg: "#FFFBEA", main: "#B93D0B", onMain: "#FFFFFF", accent: "#84CC16", onAccent: "#1A2E05", soft: "#FEF0C3", ink: "#1C1917", muted: "#57534E",
    party: ["#F97316", "#84CC16", "#FACC15", "#14B8A6", "#B93D0B"] },
  { key: "pastel_party", name: "Pastel Party", family: "Party", bg: "#FFF7FB", main: "#A63D74", onMain: "#FFFFFF", accent: "#6EC6CA", onAccent: "#1F2E33", soft: "#FBE0EC", ink: "#2E1A27", muted: "#6B5563",
    party: ["#F9A8D4", "#6EC6CA", "#FDE68A", "#C4B5FD", "#A7F3D0"] },
  // Sport
  { key: "pitch_green", name: "Pitch Green", family: "Sport", bg: "#F3F7F2", main: "#0F3D2B", onMain: "#FFFFFF", accent: "#F2C230", onAccent: "#0B1F16", soft: "#DCEADF", ink: "#0B1F16", muted: "#4B5E53" },
  { key: "team_red", name: "Team Red & Black", family: "Sport", bg: "#F7F7F7", main: "#B91C1C", onMain: "#FFFFFF", accent: "#111111", onAccent: "#FFFFFF", soft: "#E7E7E7", ink: "#111111", muted: "#4B4B4B" },
  { key: "stadium_night", name: "Stadium Night", family: "Sport", dark: true, bg: "#0B132B", main: "#FACC15", onMain: "#0B132B", accent: "#38BDF8", onAccent: "#0B132B", soft: "#1C2541", ink: "#F1F5F9", muted: "#A9B4C8",
    gradient: "linear-gradient(160deg, #0B132B 0%, #1C2541 60%, #3A506B 100%)" },
  // Calm: memorials and quiet occasions
  { key: "calm", name: "Calm Grey", family: "Calm", bg: "#F4F3F1", main: "#4A4E57", onMain: "#FFFFFF", accent: "#A8A39A", onAccent: "#1F2126", soft: "#E4E1DC", ink: "#2A2C31", muted: "#5C5F66" },
  { key: "lily", name: "Lily White & Sage", family: "Calm", bg: "#FFFFFF", main: "#47604F", onMain: "#FFFFFF", accent: "#B9C7B5", onAccent: "#1D2A21", soft: "#EEF2EC", ink: "#1D2A21", muted: "#56645A" },
];

export const PALETTE_FAMILIES: PaletteFamily[] = ["In2Min2", "Formal", "Nepali and South Asian", "Modern", "Festival colours", "Party", "Sport", "Calm"];

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

// Colours for confetti, balloons and bunting: the palette's own, or a set
// made from its main colours.
export function partyColours(p: Palette): string[] {
  return p.party ?? [p.main, p.accent, p.soft === p.bg ? p.muted : p.muted, p.ink === p.main ? p.accent : p.ink, p.accent];
}

// The host's own colour: build a full palette round it, picking white or dark
// text automatically so everything stays readable.
export function paletteFor(key: string, customColor?: string): Palette {
  const found = PALETTES.find((p) => p.key === key);
  if (found) return found;
  const main = customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor) ? customColor : PALETTES[0].main;
  const ink = "#1C1A1F";
  const onMain = contrast("#FFFFFF", main) >= contrast(ink, main) ? "#FFFFFF" : ink;
  return { key: "custom", name: "Your own colour", family: "Modern", bg: "#FFFFFF", main, onMain, accent: main, onAccent: onMain,
    soft: "#F1F0EE", ink, muted: "#5B5962" };
}

export const TEMPLATES: { key: Template; name: string; line: string }[] = [
  { key: "classic", name: "Classic", line: "Centred and traditional" },
  { key: "modern", name: "Modern", line: "Left-aligned, a bold colour band" },
  { key: "festive", name: "Festive", line: "Centred, with a bright label" },
  { key: "sport", name: "Poster", line: "Big capitals, left-aligned" },
];

// Fonts for every script the AI writes in, in each text style. A browser uses
// the first font in the list that has the letter, so Nepali, Hindi, Punjabi,
// Gujarati, Bengali and Tamil each get a matching font, and only the fonts an
// event actually uses are downloaded. Font variables: components/event/fonts.ts.
const SCRIPTS_SANS = "var(--f-noto-sans-deva), var(--f-noto-sans-guru), var(--f-noto-sans-gujr), var(--f-noto-sans-beng), var(--f-noto-sans-taml)";
const SCRIPTS_SERIF = "var(--f-noto-serif-deva), var(--f-noto-serif-guru), var(--f-noto-serif-gujr), var(--f-noto-serif-beng), var(--f-noto-serif-taml)";
const SCRIPTS_TIRO = "var(--f-tiro-deva), var(--f-tiro-guru), var(--f-noto-serif-gujr), var(--f-tiro-beng), var(--f-tiro-taml)";
const SCRIPTS_MUKTA = "var(--f-mukta), var(--f-mukta-guru), var(--f-mukta-gujr), var(--f-hind-beng), var(--f-mukta-taml)";
const SCRIPTS_BALOO = "var(--f-baloo), var(--f-baloo-guru), var(--f-baloo-gujr), var(--f-baloo-beng), var(--f-baloo-taml)";

export type TextStyleDef = { key: TextStyle; name: string; feel: string; display: string; body: string };

export const TEXT_STYLES: TextStyleDef[] = [
  { key: "classic", name: "Classic", feel: "Traditional serif, for anything",
    display: `var(--f-playfair), ${SCRIPTS_TIRO}, Georgia, serif`, body: `var(--f-inter), ${SCRIPTS_SANS}, system-ui, sans-serif` },
  { key: "formal", name: "Formal", feel: "Engraved capitals: regimental, memorial, corporate",
    display: `var(--f-cinzel), ${SCRIPTS_TIRO}, Georgia, serif`, body: `var(--f-lora), ${SCRIPTS_SERIF}, Georgia, serif` },
  { key: "elegant", name: "Elegant", feel: "Light italic serif",
    display: `var(--f-cormorant), ${SCRIPTS_SERIF}, Georgia, serif`, body: `var(--f-cormorant), ${SCRIPTS_SERIF}, Georgia, serif` },
  { key: "calligraphy", name: "Calligraphy", feel: "Flowing script for weddings",
    display: `var(--f-great-vibes), var(--f-amita), ${SCRIPTS_SERIF}, cursive`, body: `var(--f-cormorant), ${SCRIPTS_SERIF}, Georgia, serif` },
  { key: "heritage", name: "Heritage", feel: "Bold, beautiful Nepali and Hindi headlines",
    display: `var(--f-rozha), ${SCRIPTS_TIRO}, Georgia, serif`, body: `${SCRIPTS_MUKTA}, system-ui, sans-serif` },
  { key: "contemporary", name: "Contemporary", feel: "Soft modern serif",
    display: `var(--f-fraunces), ${SCRIPTS_SERIF}, Georgia, serif`, body: `var(--f-inter), ${SCRIPTS_SANS}, system-ui, sans-serif` },
  { key: "clean", name: "Clean", feel: "Plain and modern",
    display: `var(--f-inter), ${SCRIPTS_SANS}, system-ui, sans-serif`, body: `var(--f-inter), ${SCRIPTS_SANS}, system-ui, sans-serif` },
  { key: "bold", name: "Poster", feel: "Tall poster capitals for sport and melas",
    display: `var(--f-bebas), ${SCRIPTS_MUKTA}, Impact, sans-serif`, body: `${SCRIPTS_MUKTA}, system-ui, sans-serif` },
  { key: "playful", name: "Playful", feel: "Round and friendly, for children",
    display: `${SCRIPTS_BALOO}, system-ui, sans-serif`, body: `${SCRIPTS_BALOO}, system-ui, sans-serif` },
  { key: "handwritten", name: "Handwritten", feel: "Like a note from a friend",
    display: `var(--f-caveat), var(--f-kalam), ${SCRIPTS_SANS}, cursive`, body: `${SCRIPTS_MUKTA}, system-ui, sans-serif` },
];

export function textStyle(key: string): TextStyleDef {
  return TEXT_STYLES.find((t) => t.key === key) ?? TEXT_STYLES[0];
}

// How the main photo fits its space (events.cover_fit, 0003).
export type CoverFit = "fill" | "whole";
export const COVER_FITS: { key: CoverFit; name: string; line: string }[] = [
  { key: "fill", name: "Fill the space", line: "Best for photos of people and places. The edges may be trimmed." },
  { key: "whole", name: "Show the whole picture", line: "Best for logos, posters and photos with words on them." },
];

export const PHOTO_STYLES: { key: PhotoStyle; name: string; line: string }[] = [
  { key: "hero", name: "Hero", line: "The photo fills the top" },
  { key: "arch", name: "Arch", line: "The photo in an arch, for a child or a couple" },
  { key: "polaroid", name: "Polaroid", line: "Tilted like a snapshot, fun for birthdays" },
  { key: "split", name: "Split", line: "Photo on one side, words on the other" },
];

// Borders and decorations, drawn in code (components/event/borders.tsx) so
// In2Min2 owns them outright and they take the event's colours.
export type BorderKey =
  | "none" | "fine_line" | "ornate" | "art_deco" | "laurel" | "floral" | "vines" | "marigold" | "dhaka" | "mandala"
  | "balloons" | "confetti" | "bunting" | "stars" | "sunburst" | "rainbow" | "stripes" | "pitch";

export const BORDERS: { key: BorderKey; name: string; line: string; tag?: Tag }[] = [
  { key: "none", name: "Plain", line: "No border: let the words speak" },
  { key: "fine_line", name: "Fine lines", line: "A thin double frame: formal and quiet" },
  { key: "ornate", tag: "popular", name: "Ornate scrolls", line: "Curled corners, like an engraved card" },
  { key: "art_deco", name: "Art Deco", line: "Gold fans and steps: galas and anniversaries" },
  { key: "laurel", name: "Laurel", line: "A laurel wreath: regiments, awards, remembrance" },
  { key: "floral", tag: "popular", name: "Flowers", line: "Flower sprays in the corners" },
  { key: "vines", name: "Leafy vine", line: "A vine of many-coloured leaves" },
  { key: "marigold", tag: "popular", name: "Marigold garland", line: "Swags of marigolds, as at Tihar and weddings" },
  { key: "dhaka", tag: "new", name: "Dhaka pattern", line: "Bands inspired by Nepali dhaka cloth" },
  { key: "mandala", name: "Lotus & mandala", line: "Petal rings for pujas and ceremonies" },
  { key: "balloons", tag: "popular", name: "Balloons", line: "Balloon bunches for birthdays" },
  { key: "confetti", name: "Confetti", line: "A shower of colour for parties" },
  { key: "bunting", name: "Bunting", line: "Flags across the top: fêtes, melas, sport" },
  { key: "stars", name: "Stars", line: "Stars and sparkles" },
  { key: "sunburst", tag: "new", name: "Sunburst", line: "Rays behind the photo, like a festival poster" },
  { key: "rainbow", tag: "new", name: "Festival frame", line: "A bold frame in a colour blend" },
  { key: "stripes", name: "Sport stripes", line: "Diagonal stripes, top and bottom" },
  { key: "pitch", tag: "new", name: "Pitch lines", line: "Football pitch markings" },
];

// ─────────────────────────────── Languages ───────────────────────────────

export const LANGUAGES: { code: string; name: string; native: string; ready: boolean; ai: string; sample: string }[] = [
  { code: "en", name: "English", native: "English", ready: true, ai: "British English", sample: "Aa" },
  { code: "ne", name: "Nepali", native: "नेपाली", ready: true, ai: "Nepali in Devanagari script", sample: "अ" },
  { code: "ne-Latn", name: "Nepali in English letters", native: "Nepali (Roman)", ready: true, ai: "Nepali written in English (Roman) letters", sample: "Aa" },
  { code: "hi", name: "Hindi", native: "हिन्दी", ready: false, ai: "Hindi in Devanagari script", sample: "अ" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", ready: false, ai: "Punjabi in Gurmukhi script", sample: "ਅ" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", ready: false, ai: "Gujarati", sample: "અ" },
  { code: "bn", name: "Bengali", native: "বাংলা", ready: false, ai: "Bengali", sample: "অ" },
  { code: "ta", name: "Tamil", native: "தமிழ்", ready: false, ai: "Tamil", sample: "அ" },
  { code: "tl", name: "Tagalog (Filipino)", native: "Tagalog", ready: false, ai: "Tagalog (Filipino)", sample: "Aa" },
  { code: "pl", name: "Polish", native: "Polski", ready: false, ai: "Polish", sample: "Ąa" },
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
