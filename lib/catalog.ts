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
export type PhotoStyle = "hero" | "arch" | "polaroid" | "split" | "heart";
export type Parking = "unknown" | "none" | "free" | "paid" | "street";
export type PlanKey = "popup" | "season" | "half_year" | "keepsake" | "community" | "festive";

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
  effect?: EffectKey;    // a moving effect it starts with (EFFECTS); none if not set
};

export const EVENT_TYPES: EventType[] = [
  { key: "birthday", tag: "popular", label: "Birthday", scale: "personal", theme: "modern", toggles: {}, repeatsYearly: true, sensitive: false,
    line: "Any age, any size", starLabel: "The birthday person", palette: "confetti_brights", textStyle: "playful", borders: ["balloons", "confetti", "bunting", "stars", "floral", "golden_roses", "royal", "watercolour_roses", "golden_leaves"], photoStyle: "polaroid", tone: "Fun and playful" },
  { key: "pasni", tag: "popular", label: "Pasni (rice feeding)", scale: "personal", theme: "festive", toggles: { gift_registry: true }, repeatsYearly: false, sensitive: false,
    line: "Baby's first rice", starLabel: "The child", palette: "marigold_indigo", textStyle: "heritage", borders: ["marigold", "royal", "ornate_flowers", "mandala", "floral", "balloons"], photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "party", label: "Party", scale: "personal", theme: "modern", toggles: {}, repeatsYearly: false, sensitive: false,
    line: "House-warming, get-together", starLabel: "Who it's for", palette: "citrus", textStyle: "playful", borders: ["confetti", "bunting", "balloons", "stars", "sunburst"], photoStyle: "hero", tone: "Fun and playful" },
  { key: "ceremony", label: "Family ceremony", scale: "personal", theme: "festive", toggles: { gift_registry: true }, repeatsYearly: false, sensitive: false,
    line: "Puja, naming, blessing", starLabel: "Who it's for", palette: "saffron", textStyle: "heritage", borders: ["marigold", "mandala", "royal", "dhaka", "ornate"], photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "wedding", tag: "popular", label: "Wedding", scale: "celebration", theme: "classic", toggles: { gift_registry: true, guestbook: true }, repeatsYearly: true, sensitive: false,
    line: "Mehndi, ceremony, reception", starLabel: "The couple", palette: "red_gold", textStyle: "calligraphy", borders: ["royal", "golden_roses", "red_roses", "wedding_lines", "gold_crown", "ornate_flowers", "ornate", "watercolour_roses", "floral", "marigold", "golden_leaves", "art_deco", "mandala", "fine_line"], photoStyle: "arch", tone: "Formal and elegant" },
  { key: "engagement", label: "Engagement", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: false, sensitive: false,
    line: "Tika, ring ceremony", starLabel: "The couple", palette: "burgundy_gold", textStyle: "elegant", borders: ["floral", "royal", "red_roses", "watercolour_roses", "golden_leaves", "ornate", "art_deco", "stars"], photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "anniversary", label: "Wedding anniversary", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: true, sensitive: false,
    line: "Silver, golden or any year", starLabel: "The couple", palette: "black_gold", textStyle: "elegant", borders: ["art_deco", "royal", "gold_crown", "red_roses", "golden_leaves", "ornate", "floral", "stars", "fine_line"], photoStyle: "arch", tone: "Warm and welcoming" },
  { key: "bratabandha", label: "Bratabandha", scale: "celebration", theme: "festive", toggles: { gift_registry: true }, repeatsYearly: false, sensitive: false,
    line: "Sacred thread ceremony", starLabel: "The boy", palette: "saffron", textStyle: "heritage", borders: ["mandala", "royal", "marigold", "dhaka", "ornate"], photoStyle: "arch", tone: "Festive and joyful" },
  { key: "reunion", tag: "new", label: "Reunion or regimental day", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: true, sensitive: false,
    line: "Old comrades, classmates, family", starLabel: "Who's coming together", palette: "regimental", textStyle: "formal", borders: ["laurel", "khukuri", "fine_line", "art_deco", "bunting", "dhaka"], photoStyle: "hero", tone: "Warm and welcoming" },
  { key: "corporate", label: "Corporate event", scale: "celebration", theme: "modern", toggles: { sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Dinner, launch, awards", starLabel: "The organisation", palette: "navy_gold", textStyle: "formal", borders: ["fine_line", "art_deco", "gold_crown", "golden_leaves", "none", "stars"], photoStyle: "split", tone: "Formal and elegant" },
  { key: "mela", tag: "soon", soonNote: "Ticket and parking sales arrive in February. You can make the page now.", label: "Mela / festival", scale: "community", theme: "festive",
    toggles: { rsvp: false, tickets: true, stalls: true, parking: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Stalls, food, music, parking", starLabel: "The festival", palette: "festival_rainbow", textStyle: "bold", borders: ["rainbow", "bunting", "sunburst", "dhaka", "confetti", "marigold"], photoStyle: "hero", tone: "Festive and joyful" },
  { key: "sport", tag: "soon", soonNote: "Teams, the draw and live scores arrive in March. You can make the page now.", label: "Sports tournament", scale: "community", theme: "sport",
    toggles: { rsvp: false, tickets: true, team_entries: true, stalls: true, parking: true, sponsors: true, live_scores: true }, repeatsYearly: true, sensitive: false,
    line: "Teams, draw, fixtures, live scores", starLabel: "The tournament", palette: "pitch_green", textStyle: "bold", borders: ["stripes", "pitch", "laurel", "bunting", "sunburst"], photoStyle: "split", tone: "Sporty and energetic" },
  { key: "charity", label: "Charity or fundraiser", scale: "community", theme: "festive", toggles: { tickets: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Walks, dinners, appeals", starLabel: "The cause", palette: "garden_green", textStyle: "contemporary", borders: ["vines", "rainbow", "sunburst", "floral", "bunting"], photoStyle: "hero", tone: "Warm and welcoming" },
  { key: "community", label: "Community event", scale: "community", theme: "festive", toggles: { tickets: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Dashain, Teej, cultural show", starLabel: "The event", palette: "dhaka", textStyle: "heritage", borders: ["dhaka", "bunting", "rainbow", "marigold", "sunburst", "khukuri"], photoStyle: "hero", tone: "Festive and joyful" },
  { key: "memorial", tag: "new", label: "Memorial or funeral", scale: "celebration", theme: "classic", toggles: { guestbook: true }, repeatsYearly: false, sensitive: true,
    line: "Funeral, prayers, remembrance", starLabel: "In memory of", palette: "calm", textStyle: "formal", borders: ["fine_line", "laurel", "golden_leaves", "khukuri", "vines", "none"], photoStyle: "arch", tone: "Gentle and respectful" },
  // Festive season (owner, 14 Nov 2026: seasonal designs to show off the festive launch; 0004)
  { key: "christmas", tag: "new", label: "Christmas party", scale: "personal", theme: "festive", toggles: {}, repeatsYearly: true, sensitive: false,
    line: "Family, friends or work", starLabel: "Who it's for", palette: "christmas", textStyle: "classic", borders: ["christmas_greenery", "snowflakes", "stars", "floral", "bunting"], photoStyle: "hero", tone: "Festive and joyful", effect: "snow" },
  { key: "new-year", tag: "new", label: "New Year’s Eve party", scale: "personal", theme: "festive", toggles: {}, repeatsYearly: true, sensitive: false,
    line: "Countdown to midnight", starLabel: "Who it's for", palette: "midnight_gold", textStyle: "contemporary", borders: ["fireworks", "stars", "art_deco", "confetti"], photoStyle: "hero", tone: "Festive and joyful", effect: "fireworks" },
  { key: "lhosar", tag: "new", label: "Lhosar celebration", scale: "community", theme: "festive", toggles: { tickets: true, sponsors: true }, repeatsYearly: true, sensitive: false,
    line: "Tamu, Sonam or Gyalpo Lhosar", starLabel: "The celebration", palette: "prayer_flags", textStyle: "heritage", borders: ["prayer_flags", "dhaka", "bunting", "marigold"], photoStyle: "hero", tone: "Festive and joyful", effect: "petals" },
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
  // The festive launch (0013): free with the Season limits until 31 January
  // 2027; never sold, so not on the prices page.
  { key: "festive", name: "Festive launch", pricePence: 0, daysAfter: 90, guestLimit: 300, photoLimit: 300, photosPerGuest: 20, aiWrites: 30,
    fullResDownload: false, hideBranding: false, bookingFeeBps: 0, bookingFeePence: 0, scales: ["personal", "celebration"],
    packSize: 100, packPence: 300, sortOrder: 0, duration: "90 days", bestFor: "Every family event until 31 January 2027" },
];
// When the festive launch ends (0013 public.festive_until()).
export const FESTIVE_UNTIL = Date.parse("2027-02-01T00:00:00Z");
// The plan a family page is on once published: a paid one as chosen, else
// the festive launch's while it lasts, else Pop-Up.
export function freePlanAt(key: PlanKey, scale: string, now: number): PlanKey {
  if (scale === "community") return "community";
  if (key !== "popup" && key !== "festive") return key;
  return key === "festive" || now < FESTIVE_UNTIL ? "festive" : "popup";
}

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

export type PaletteFamily = "In2Min2" | "Seasonal" | "Formal" | "Nepali and South Asian" | "Modern" | "Festival colours" | "Party" | "Sport" | "Calm";

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
  // Seasonal: Christmas, New Year and Lhosar (14 Nov 2026)
  { key: "christmas", tag: "new", name: "Christmas Red & Green", family: "Seasonal", bg: "#FFF8F0", main: "#A3172B", onMain: "#FFFFFF", accent: "#1F6B45", onAccent: "#FFFFFF", soft: "#F3E1D6", ink: "#2A1215", muted: "#6A4F52",
    party: ["#A3172B", "#1F6B45", "#D4AF37", "#C8102E", "#2E8B57", "#E9DCC9"] },
  { key: "winter_night", tag: "new", name: "Winter Night", family: "Seasonal", dark: true, bg: "#0F1B2D", main: "#CFE3F7", onMain: "#0F1B2D", accent: "#E9C46A", onAccent: "#0F1B2D", soft: "#1A2B44", ink: "#F2F6FB", muted: "#A9B8CC",
    gradient: "linear-gradient(170deg, #0F1B2D 0%, #1D3557 60%, #457B9D 100%)", party: ["#CFE3F7", "#E9C46A", "#FFFFFF", "#8FB8DE", "#F4F1DE"] },
  { key: "midnight_gold", tag: "new", name: "Midnight & Gold", family: "Seasonal", dark: true, bg: "#0B0B1A", main: "#F2C14E", onMain: "#0B0B1A", accent: "#C9A0FF", onAccent: "#0B0B1A", soft: "#1B1B33", ink: "#F6F1E4", muted: "#B9B3C9",
    gradient: "linear-gradient(160deg, #0B0B1A 0%, #241A4A 60%, #4A2E7A 100%)", party: ["#F2C14E", "#C9A0FF", "#FF7AB6", "#7FDBFF", "#FFFFFF"] },
  { key: "prayer_flags", tag: "new", name: "Prayer Flags", family: "Seasonal", bg: "#FFFBF2", main: "#1F4E9A", onMain: "#FFFFFF", accent: "#F2C230", onAccent: "#1A1A1A", soft: "#EAF0FA", ink: "#161B29", muted: "#525A6B",
    gradient: "linear-gradient(90deg, #1F5FBF 0 20%, #F4F1E8 20% 40%, #C8102E 40% 60%, #1E8C45 60% 80%, #F2C230 80% 100%)", party: ["#1F5FBF", "#F4F1E8", "#C8102E", "#1E8C45", "#F2C230"] },
  // Formal: regimental days, memorials, corporate, charities, anniversaries
  { key: "navy_gold", tag: "popular", name: "Navy & Gold", family: "Formal", bg: "#FBF8F1", main: "#14213D", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#14213D", soft: "#ECE5D3", ink: "#14213D", muted: "#535A6B" },
  { key: "regimental", name: "Regimental Green", family: "Formal", bg: "#F7F5EE", main: "#1F3A2E", onMain: "#FFFFFF", accent: "#B8973A", onAccent: "#13261D", soft: "#E3E6D8", ink: "#13261D", muted: "#4F5B52" },
  { key: "black_gold", name: "Black & Gold", family: "Formal", dark: true, bg: "#141414", main: "#D4AF37", onMain: "#141414", accent: "#D4AF37", onAccent: "#141414", soft: "#24211A", ink: "#F3EBD3", muted: "#BDB291" },
  { key: "burgundy_gold", name: "Burgundy & Gold", family: "Formal", bg: "#FBF6F0", main: "#6B1D2F", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#2B0D14", soft: "#EEDFD0", ink: "#2B0D14", muted: "#6A5258" },
  { key: "charcoal_silver", name: "Charcoal & Silver", family: "Formal", bg: "#F6F6F5", main: "#2E3138", onMain: "#FFFFFF", accent: "#9AA1AC", onAccent: "#15171B", soft: "#E3E4E6", ink: "#1C1E22", muted: "#555A63" },
  { key: "black_white", name: "Black & White", family: "Formal", bg: "#FFFFFF", main: "#111111", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#111111", soft: "#EFEFEF", ink: "#111111", muted: "#555555" },
  // Nepali and South Asian
  { key: "red_gold", tag: "popular", name: "Red & Gold", family: "Nepali and South Asian", bg: "#FFF7EC", main: "#8E1B1B", onMain: "#FFFFFF", accent: "#C9A23F", onAccent: "#2B1408", soft: "#F3E3C3", ink: "#2B1408", muted: "#6A5446" },
  // A deep red card with gold letters, as on the community's favourite printed
  // wedding cards (owner, 16 Nov 2026). Our own colours, not a copy of any card.
  { key: "sindoor", tag: "new", name: "Sindoor Red & Gold", family: "Nepali and South Asian", dark: true, bg: "#7A1020", main: "#F3C969", onMain: "#4A0A12", accent: "#E8B04B", onAccent: "#3D0710", soft: "#5A0B16", ink: "#FFF3DE", muted: "#F0D3B0",
    party: ["#F3C969", "#E8B04B", "#FFF3DE", "#F28C28", "#D9485F"] },
  // Jewel tones with gold (owner, 19 Nov 2026): the page carries on in the colour of the drawn backgrounds.
  { key: "emerald_gold", tag: "new", name: "Emerald & Gold", family: "Nepali and South Asian", dark: true, bg: "#0E4D32", main: "#F3C969", onMain: "#0A2E1E", accent: "#E8B04B", onAccent: "#0A2E1E", soft: "#0A3A26", ink: "#FFF6E0", muted: "#D5E6C8",
    party: ["#F3C969", "#E8B04B", "#FFF6E0", "#3FB27F", "#D9485F"] },
  { key: "royal_blue_gold", tag: "new", name: "Royal Blue & Gold", family: "Nepali and South Asian", dark: true, bg: "#13297A", main: "#F3C969", onMain: "#0B1A4F", accent: "#E8B04B", onAccent: "#0B1A4F", soft: "#0D1F5E", ink: "#FFF6E0", muted: "#CBD5F5",
    party: ["#F3C969", "#E8B04B", "#FFF6E0", "#6C8CFF", "#D9485F"] },
  { key: "rani_gold", tag: "new", name: "Rani Pink & Gold", family: "Nepali and South Asian", dark: true, bg: "#8A0F4F", main: "#F3C969", onMain: "#4A0729", accent: "#E8B04B", onAccent: "#3D0622", soft: "#6B0B3D", ink: "#FFF3E8", muted: "#F5CFE0",
    party: ["#F3C969", "#E8B04B", "#FFF3E8", "#FF7AB6", "#7A5CFF"] },
  { key: "indigo_gold", tag: "new", name: "Indigo & Gold", family: "Nepali and South Asian", dark: true, bg: "#261A6B", main: "#F3C969", onMain: "#170F45", accent: "#E8B04B", onAccent: "#170F45", soft: "#1D1454", ink: "#FFF6E0", muted: "#D4CCF5",
    party: ["#F3C969", "#E8B04B", "#FFF6E0", "#8C7CFF", "#FF7AB6"] },
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

export const PALETTE_FAMILIES: PaletteFamily[] = ["In2Min2", "Seasonal", "Formal", "Nepali and South Asian", "Modern", "Festival colours", "Party", "Sport", "Calm"];

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

// Up to five photos at the top of the page (0007): how they change from one
// to the next. Gentle, never flashing; still for anyone who turns movement off.
// Owner, 15 Nov 2026: "one zoom in, fade and slide; another zoom out, fade
// and slide; and the slide one as is" (0008 renamed fade → zoomin, zoom → zoomout).
export type HeroMotion = "zoomin" | "zoomout" | "slide";
export const HERO_MOTIONS: { key: HeroMotion; name: string; line: string }[] = [
  { key: "zoomin", name: "Zoom in", line: "Each photo glides in and fades up, then slowly draws closer" },
  { key: "zoomout", name: "Zoom out", line: "Each photo glides in and fades up, then slowly draws back" },
  { key: "slide", name: "Slide", line: "Photos slide across, like a phone's gallery" },
];
// Drafts and pages saved before 0008 used the old names.
export function heroMotionOf(m: string | null | undefined): HeroMotion {
  return m === "zoomout" || m === "zoom" ? "zoomout" : m === "slide" ? "slide" : "zoomin";
}
export const MAX_SHOWCASE = 5; // the main photo plus four more

// The sky behind the photo wheel (owner, 15 Nov 2026; 0009 stores the host's
// choice in settings.photo_wall.sky). "auto" picks one from the colours.
export type Sky = "morning" | "day" | "evening" | "night" | "galaxy" | "aurora";
export const SKIES: { key: Sky | "auto"; name: string; line: string }[] = [
  { key: "auto", name: "Match my colours", line: "Picked for you from your event's colours" },
  { key: "morning", name: "Morning", line: "A fresh dawn sky, with a gentle sun rising in the corner" },
  { key: "day", name: "Day sky", line: "Clear blue sky with soft drifting clouds" },
  { key: "evening", name: "Evening", line: "A soft sunset, from rose to purple" },
  { key: "night", name: "Night", line: "Deep blue night with twinkling stars" },
  { key: "galaxy", name: "Galaxy", line: "The Milky Way in pinks, purples and blues" },
  { key: "aurora", name: "Northern lights", line: "Green and violet lights swaying over the stars" },
];
function hueOf(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
// Auto: northern lights for a winter night, a galaxy for colour blends,
// night for dark pages, an evening glow for warm colours, otherwise day.
export function skyFor(p: Palette, chosen?: string | null): Sky {
  if (chosen && chosen !== "auto" && SKIES.some((s) => s.key === chosen)) return chosen as Sky;
  if (p.key === "winter_night") return "aurora";
  if (p.dark) {
    // A warm, coloured dark card (Sindoor red) gets the evening; the others the night or the galaxy.
    const n = parseInt(p.bg.replace("#", ""), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const hb = hueOf(p.bg);
    if (Math.max(r, g, b) - Math.min(r, g, b) > 40 && (hb >= 330 || hb < 40)) return "evening";
    return p.gradient ? "galaxy" : "night";
  }
  if (p.gradient) return "morning";   // the bright party colours: birthdays, mostly
  const h = hueOf(p.main);
  // Warm colours get the morning sky (owner, 16 Nov 2026: "a young morning
  // sky with a tender sun rising in the corner … inspirational for birthdays").
  return h >= 330 || h < 60 ? "morning" : "day";
}

// The heart (0010) needs the database file 0010 before it can be published.
// The arch comes last (owner, 16 Nov 2026: arch "less of a priority").
export const PHOTO_STYLES: { key: PhotoStyle; name: string; line: string }[] = [
  { key: "hero", name: "Hero", line: "The photo fills the top" },
  { key: "polaroid", name: "Polaroid", line: "Tilted like a snapshot, fun for birthdays" },
  { key: "heart", name: "Heart", line: "The photo in a soft heart with a fine outline, for love and birthdays" },
  { key: "split", name: "Split", line: "Photo on one side, words on the other" },
  { key: "arch", name: "Arch", line: "The photo in an arch, for a child or a couple" },
];

// Borders and decorations, drawn in code (components/event/borders.tsx) so
// In2Min2 owns them outright and they take the event's colours.
export type BorderKey =
  | "none" | "fine_line" | "ornate" | "art_deco" | "laurel" | "floral" | "vines" | "marigold" | "dhaka" | "mandala"
  | "balloons" | "confetti" | "bunting" | "stars" | "sunburst" | "rainbow" | "stripes" | "pitch"
  | "snowflakes" | "fireworks" | "prayer_flags" | "royal" | "khukuri"
  | "red_roses" | "watercolour_roses" | "gold_crown" | "golden_leaves"
  | "christmas_greenery" | "golden_roses" | "ornate_flowers" | "wedding_lines";

export const BORDERS: { key: BorderKey; name: string; line: string; tag?: Tag }[] = [
  { key: "none", name: "Plain", line: "No border: let the words speak" },
  { key: "fine_line", name: "Fine lines", line: "A thin double frame: formal and quiet" },
  { key: "ornate", tag: "popular", name: "Ornate scrolls", line: "Curled corners, like an engraved card" },
  { key: "art_deco", name: "Art Deco", line: "Gold fans and steps: galas and anniversaries" },
  { key: "royal", tag: "new", name: "Royal frame", line: "Gold filigree corners and a lotus crest, like a printed wedding card" },
  { key: "khukuri", tag: "new", name: "Crossed khukuris", line: "Crossed khukuris and fine lines: regimental days and reunions" },
  // Picture borders from the owner's own frames (16 Nov 2026; public/art/borders/b01…b04)
  { key: "red_roses", tag: "new", name: "B1 Red roses", line: "Red and pink roses with gold lines, in their own colours" },
  { key: "watercolour_roses", tag: "new", name: "B2 Watercolour roses", line: "Soft painted roses; best on light colours" },
  { key: "gold_crown", tag: "new", name: "B3 Gold crown", line: "Gold scroll corners and a crown line; takes your colours" },
  { key: "golden_leaves", tag: "new", name: "B4 Golden leaves", line: "A fine frame with leafy sprays; takes your colours" },
  // Whole frames traced from the owner's designs (19 Nov 2026; public/art/frames), in the accent colour
  { key: "christmas_greenery", tag: "new", name: "B5 Christmas greenery", line: "Holly, pine and snowflakes all round; takes your colours" },
  { key: "golden_roses", tag: "new", name: "B6 Golden roses", line: "Fine drawn roses in the corners; takes your colours" },
  { key: "ornate_flowers", tag: "new", name: "B7 Ornate flowers", line: "Rich flower corners with a crest; takes your colours" },
  { key: "wedding_lines", tag: "new", name: "B8 Wedding lines", line: "Elegant fine lines and corner sprays; takes your colours" },
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
  { key: "snowflakes", tag: "new", name: "Snowflakes", line: "Falling snowflakes: Christmas and winter" },
  { key: "fireworks", tag: "new", name: "Fireworks", line: "Bursts of colour: New Year and Diwali" },
  { key: "prayer_flags", tag: "new", name: "Prayer flags", line: "Five-colour flags: Lhosar and Buddhist festivals" },
];

// Painted backgrounds behind the words (owner, 19 Nov 2026; public/art/backgrounds).
// Each comes with colours for the letters that read well on it; three have
// their own frame painted in, so they go without a border. Kept in
// feature_toggles.settings.backdrop (no database change). `shade` darkens
// the middle a little where a bright centre makes the words hard to read.
// The owner's are pictures (`file`); ours are drawn in CSS (`css`), so they
// cost nothing to load. The last layer of `css` is sized to cover the card.
export type BackdropGroup = "yours" | "glowing" | "traditional" | "modern";
export type Backdrop = { key: string; name: string; group: BackdropGroup; file?: string; css?: string; dark: boolean; palette: string; frame?: boolean; shade?: number };
export const BACKDROP_GROUPS: { key: BackdropGroup; name: string }[] = [
  { key: "yours", name: "Painted" }, { key: "glowing", name: "Glowing" }, { key: "traditional", name: "Traditional" }, { key: "modern", name: "Modern" },
];
const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
// A fine grain, so a glow looks printed rather than flat.
const GRAIN = `${svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .07 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")} 0 0 / 180px 180px repeat`;
// A jali (trellis) in fine gold lines, as on wedding cards and carved screens.
const JALI = `${svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='40' height='60' viewBox='0 0 40 60'><path d='M20 0C20 15 0 15 0 30S20 45 20 60M20 0C20 15 40 15 40 30S20 45 20 60' fill='none' stroke='#EBC66B' stroke-opacity='.24' stroke-width='1.1'/><g fill='#EBC66B' fill-opacity='.3'><circle cx='20' cy='30' r='1.8'/><circle cx='0' cy='0' r='1.8'/><circle cx='40' cy='0' r='1.8'/><circle cx='0' cy='60' r='1.8'/><circle cx='40' cy='60' r='1.8'/></g></svg>")} 0 0 / 40px 60px repeat`;
const VIGNETTE = "radial-gradient(ellipse 90% 75% at 50% 45%, transparent 55%, rgb(0 0 0 / 0.42) 100%)";
const glowing = (a: string, b: string, c: string, d: string) =>
  `${GRAIN}, radial-gradient(ellipse 78% 58% at 50% 42%, ${a} 0%, ${b} 42%, ${c} 82%, ${d} 100%)`;
const trellis = (a: string, b: string, c: string) =>
  `${VIGNETTE}, ${JALI}, radial-gradient(ellipse 80% 60% at 50% 42%, ${a} 0%, ${b} 58%, ${c} 100%)`;
const mesh = (base: string, spots: [string, string, string, string]) =>
  `radial-gradient(at 12% 8%, ${spots[0]} 0, transparent 52%), radial-gradient(at 88% 18%, ${spots[1]} 0, transparent 48%), radial-gradient(at 85% 88%, ${spots[2]} 0, transparent 52%), radial-gradient(at 10% 92%, ${spots[3]} 0, transparent 48%), linear-gradient(${base}, ${base})`;

export const BACKDROPS: Backdrop[] = [
  { key: "ivory_frame", group: "yours", name: "Ivory and gold", file: "/art/backgrounds/minimalist-ivory-elegant-bg.webp", dark: false, palette: "navy_gold", frame: true },
  { key: "rose_frame", group: "yours", name: "Rose blush", file: "/art/backgrounds/rose-pink-whimsical-bg.webp", dark: false, palette: "lali_gurans", frame: true },
  { key: "red_gold_frame", group: "yours", name: "Red and gold frame", file: "/art/backgrounds/red-gold-frame-bg.jpg", dark: true, palette: "sindoor", frame: true },
  { key: "luminous_red", group: "yours", name: "Glowing red", file: "/art/backgrounds/luminous-red-gradient-bg.webp", dark: true, palette: "sindoor" },
  { key: "luminous_blue", group: "yours", name: "Glowing blue", file: "/art/backgrounds/luminous-blue-gradient-bg.webp", dark: true, palette: "royal_blue_gold", shade: 0.25 },
  { key: "luminous_green", group: "yours", name: "Glowing green", file: "/art/backgrounds/luminous-green-gradient-bg.webp", dark: true, palette: "emerald_gold" },
  { key: "luminous_teal", group: "yours", name: "Glowing teal", file: "/art/backgrounds/luminous-teal-gradient-bg.webp", dark: true, palette: "black_gold", shade: 0.5 },
  { key: "fireworks_blue", group: "yours", name: "Fireworks", file: "/art/backgrounds/royal-blue-celebration-bg.webp", dark: true, palette: "midnight_gold" },
  { key: "festive_teal", group: "yours", name: "Festive baubles", file: "/art/backgrounds/scarlet-festive-party-bg.webp", dark: true, palette: "black_gold" },
  // Drawn by us (19 Nov 2026): the colours the owner asked for, in three styles.
  { key: "glow_rani", group: "glowing", name: "Glowing pink", css: glowing("#FF6FAE", "#C2185B", "#5E0A31", "#2E0418"), dark: true, palette: "rani_gold", shade: 0.3 },
  { key: "glow_indigo", group: "glowing", name: "Glowing indigo", css: glowing("#8C7CFF", "#3B2BB0", "#160F55", "#0A0628"), dark: true, palette: "indigo_gold", shade: 0.2 },
  { key: "glow_emerald", group: "glowing", name: "Glowing emerald", css: glowing("#3DBE82", "#0F6B43", "#06321F", "#021A10"), dark: true, palette: "emerald_gold", shade: 0.2 },
  { key: "glow_royal", group: "glowing", name: "Glowing royal blue", css: glowing("#5B86FF", "#1A3BB0", "#0A1A55", "#040B2A"), dark: true, palette: "royal_blue_gold", shade: 0.2 },
  { key: "jali_emerald", group: "traditional", name: "Emerald jali", css: trellis("#2E9E68", "#0E5A38", "#05281A"), dark: true, palette: "emerald_gold" },
  { key: "jali_royal", group: "traditional", name: "Royal blue jali", css: trellis("#3E6BF0", "#15349A", "#071A4E"), dark: true, palette: "royal_blue_gold" },
  { key: "jali_rani", group: "traditional", name: "Rani pink jali", css: trellis("#E0408A", "#A0125B", "#4A0628"), dark: true, palette: "rani_gold" },
  { key: "jali_indigo", group: "traditional", name: "Indigo jali", css: trellis("#6A5CFF", "#2C1F8A", "#0F0A3A"), dark: true, palette: "indigo_gold" },
  { key: "mesh_blush", group: "modern", name: "Blush", css: mesh("#FFF6F9", ["#FFC2D9", "#FFE0C7", "#F1C8FF", "#FFD3E1"]), dark: false, palette: "lali_gurans" },
  { key: "mesh_mint", group: "modern", name: "Mint", css: mesh("#F4FFF9", ["#BFF0D6", "#D3EBFF", "#FFF1BF", "#CFF5E4"]), dark: false, palette: "garden_green" },
  { key: "mesh_sky", group: "modern", name: "Sky", css: mesh("#F5F8FF", ["#C9DAFF", "#E3D6FF", "#CFF3FF", "#DCE6FF"]), dark: false, palette: "royal_blue" },
  { key: "mesh_night", group: "modern", name: "Night glow", css: mesh("#0B1033", ["#3B5BDB", "#7B2FF7", "#1098AD", "#3A1C8C"]), dark: true, palette: "indigo_gold", shade: 0.15 },
];
export const backdropOf = (key: string | null | undefined) => BACKDROPS.find((b) => b.key === key) ?? null;
export const backdropImage = (b: Backdrop) => b.css ?? `url(${b.file})`;

// Music that plays, round and round, once a guest taps to open the invitation
// (owner, 19 Nov 2026: our own licensed library; he chooses the tunes). Kept
// in feature_toggles.settings.music (no database change). Files in
// public/music, made smaller for phones (AAC, 128 kbps); where each came from
// and its licence: docs/reference/music.md. A changed file gets a new name
// (…-2.m4a), because phones keep these for a year. `loop` is where the sound
// starts and fades out, in seconds, so the repeat has no silent gap.
export type Track = { key: string; name: string; line: string; file: string; seconds: number; loop: [number, number]; kinds: string[] };
export const MUSIC: Track[] = [
  { key: "happy_birthday", name: "Happy Birthday", line: "A cheerful party tune", file: "/music/happy-birthday-1.m4a", seconds: 69, loop: [0, 67.4],
    kinds: ["birthday", "party", "pasni"] },
  { key: "merry_christmas", name: "We Wish You a Merry Christmas", line: "Bright and festive", file: "/music/merry-christmas-1.m4a", seconds: 68, loop: [1.4, 67.6],
    kinds: ["christmas", "new-year"] },
  { key: "wedding_vows", name: "Wedding vows", line: "Soft and romantic, no words", file: "/music/wedding-vows-1.m4a", seconds: 190, loop: [0, 189.3],
    kinds: ["wedding", "engagement", "anniversary", "ceremony", "bratabandha"] },
];
export const musicOf = (key: string | null | undefined) => MUSIC.find((m) => m.key === key) ?? null;
// The tune a new event starts with, only where it plainly fits (a birthday
// gets Happy Birthday; a house-warming or New Year's Eve starts quiet). The
// host can choose any tune, or none, in Look › Envelope & music.
// Moving decorations around the photo (owner, 20 Nov 2026: "a subtle wave
// splashing out or a bubbly ring, for some templates, so their photo feels
// special"). Drawn in CSS in the event's own colours (event-view.css
// .ev-ring); for the arch, heart and polaroid shapes. Still when the phone
// asks for less motion. In feature_toggles.settings.photo_ring.
export type PhotoRing = "glow" | "ripple" | "bubbles" | "sparkle";
export const PHOTO_RINGS: { key: PhotoRing; name: string; line: string }[] = [
  { key: "glow", name: "Glow", line: "A soft halo in the event's colours, slowly turning" },
  { key: "ripple", name: "Ripples", line: "Gentle waves spreading out from the photo" },
  { key: "bubbles", name: "Bubbles", line: "Little bubbles drifting up around it" },
  { key: "sparkle", name: "Sparkles", line: "Tiny stars twinkling round the edge" },
];
export const photoRingOf = (key: unknown): PhotoRing | null => PHOTO_RINGS.find((r) => r.key === key)?.key ?? null;
export const RING_SHAPES: PhotoStyle[] = ["arch", "heart", "polaroid"];
// The decoration a new event starts with, where one suits it.
export const STARTING_RING: Record<string, PhotoRing> = {
  wedding: "glow", engagement: "ripple", anniversary: "glow", birthday: "bubbles", pasni: "sparkle", bratabandha: "sparkle",
};

export const STARTING_MUSIC: Record<string, string> = {
  birthday: "happy_birthday", christmas: "merry_christmas", wedding: "wedding_vows", engagement: "wedding_vows", anniversary: "wedding_vows",
};
// This kind's own tunes first.
export const musicFor = (eventType: string | null | undefined) =>
  [...MUSIC].sort((a, b) => Number(b.kinds.includes(eventType ?? "")) - Number(a.kinds.includes(eventType ?? "")));

// A gentle moving effect over the page (0004, events.effect). Only when
// Motion is on, never on the builder's small copies, and never for people who
// have asked their phone for less motion.
export type EffectKey = "none" | "snow" | "fireworks" | "petals" | "confetti";
export const EFFECTS: { key: EffectKey; name: string; line: string }[] = [
  { key: "none", name: "None", line: "Still and calm" },
  { key: "snow", name: "Snow", line: "Soft snow drifting down" },
  { key: "fireworks", name: "Fireworks", line: "Bursts of light, now and then" },
  { key: "petals", name: "Marigold petals", line: "Petals falling, as at Tihar and weddings" },
  { key: "confetti", name: "Confetti", line: "A shower of party colours" },
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

// Food needs guests can tick when they reply (owner, 22 Nov 2026; 0014). The
// keys are checked by submit_rsvp in the database too: change both together.
// Some say something about health or beliefs, so the form says only the hosts
// see them, and they're optional (privacy page: explicit consent).
export const FOOD_NEEDS = [
  { key: "vegetarian", label: "Vegetarian", icon: "🌱" },
  { key: "vegan", label: "Vegan", icon: "🥦" },
  { key: "halal", label: "Halal", icon: "🍖" },
  { key: "gluten_free", label: "Gluten-free", icon: "🌾" },
  { key: "nut_allergy", label: "Nut allergy", icon: "🥜" },
  { key: "dairy_free", label: "Dairy-free", icon: "🥛" },
] as const;
export type FoodNeed = (typeof FOOD_NEEDS)[number]["key"];
// Only known keys, each once, in the list's order.
export function foodNeedsOf(x: unknown): FoodNeed[] {
  const got = Array.isArray(x) ? x : [];
  return FOOD_NEEDS.map((f) => f.key).filter((k) => got.includes(k));
}
export const foodLabel = (k: FoodNeed) => FOOD_NEEDS.find((f) => f.key === k)?.label ?? k;
