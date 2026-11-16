// Builder 2.0 (/new): what each kind of event asks, and the quick choices it
// offers. Few, popular, commonly used options; anything else can be typed.
// Owner, 15 Nov 2026: "not too many choices but adjustable, with a few very
// popular and commonly used options in each".
//
// Also here: the bold event-type tiles, complete ready-made looks to swipe
// through, a timed day plan for each kind, popular dishes, and ready-made
// words that are there instantly (the AI writes better ones once signed in).

import type { IconName } from "@/components/icons";
import { clampText, COPY_FIELDS, COPY_KEYS, type EventCopy } from "@/lib/ai/copy";
import { EVENT_TYPES, eventType, type BorderKey, type PhotoStyle, type Template, type TextStyle } from "@/lib/catalog";
import { slugify, type Draft } from "@/lib/draft";

// ─────────────── The event-type tiles ───────────────

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

// ─────────────── Complete looks ───────────────
// Colours, border, letters, layout and photo shape chosen together, so the
// host chooses once instead of six times.

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
const COMMUNITY_LOOKS: Look[] = [
  { key: "festival", name: "Festival", palette: "festival_rainbow", border: "bunting", textStyle: "bold", template: "festive", photoStyle: "hero" },
  { key: "saffron", name: "Saffron", palette: "saffron", border: "mandala", textStyle: "heritage", template: "festive", photoStyle: "hero" },
  { key: "royal", name: "Royal blue", palette: "royal_blue", border: "art_deco", textStyle: "formal", template: "modern", photoStyle: "hero" },
];

// The type's own look first, then others that suit it.
export function looksFor(typeKey: string | null): Look[] {
  const t = eventType(typeKey);
  const own: Look | null = t ? {
    key: "own", name: `Made for ${t.label.toLowerCase()}`, palette: t.palette, border: (t.borders?.[0] ?? "none") as BorderKey,
    textStyle: t.textStyle, template: t.theme as Template, photoStyle: t.photoStyle,
  } : null;
  const pool = t?.sensitive ? CALM : t?.scale === "community" ? [...COMMUNITY_LOOKS, ...GENERAL.slice(0, 3)] : GENERAL;
  return [...(own ? [own] : []), ...pool.filter((l) => l.palette !== own?.palette)];
}

export function applyLook(d: Draft, l: Look): Draft {
  return { ...d, palette: l.palette, border: l.border, textStyle: l.textStyle, template: l.template, photoStyle: l.photoStyle };
}

// Which look a draft is wearing, if it's one of the complete looks.
export function currentLook(d: Draft): string | null {
  return looksFor(d.eventType).find((l) => l.palette === d.palette && l.border === d.border && l.textStyle === d.textStyle
    && l.template === d.template && l.photoStyle === d.photoStyle)?.key ?? null;
}

// ─────────────── What each kind asks ───────────────

export type Kind = {
  // Whose day: the question, and how the name is asked
  who: string;                 // "Whose birthday is it?"
  label: string;               // label over the box
  example: string;             // placeholder
  couple?: boolean;            // two names, joined with " & "
  titleFirst?: boolean;        // the event's name is asked instead of a person's (parties, community)
  titleChips?: string[];       // quick names for the event
  relations?: string[];        // shown above the names on the card
  milestone?: { label: string; chips: string[]; max: number; other: string };   // "Which birthday?" 50th… or any other number
  memorialKinds?: boolean;     // "What is it?" funeral, prayers…
  // When
  times: string[];             // popular start times, "HH:MM"
  hours: number[];             // how long it usually lasts, for end-time chips
  // Where
  venues: string[];
  // Day plan: [what, minutes after the start, a meal?]
  plan: [string, number, boolean?][];
  dishes: "nepali" | "christmas" | "general";
};

const NEPALI_VENUES = ["At home", "Community hall", "Temple", "Function hall"];

export const KINDS: Record<string, Kind> = {
  birthday: {
    who: "Whose birthday is it?", label: "Their name", example: "Sita",
    relations: ["The birthday girl", "The birthday boy", "The birthday star"],
    milestone: { label: "Which birthday? (if you like)", chips: ["1st", "16th", "18th", "21st", "30th", "40th", "50th", "60th"], max: 120, other: "Another age" },
    times: ["11:00", "14:00", "16:00", "19:00"], hours: [2, 3, 4],
    venues: ["At home", "Community hall", "Restaurant", "Soft play", "Garden"],
    plan: [["Guests arrive", 0], ["Games", 30], ["Food", 90, true], ["Cake", 120], ["Party ends", 180]], dishes: "general",
  },
  pasni: {
    who: "Whose Pasni is it?", label: "The baby's name", example: "Aarav",
    relations: ["Our son", "Our daughter", "Our little one"],
    times: ["10:00", "11:00", "12:00"], hours: [3, 4, 5],
    venues: [...NEPALI_VENUES, "Restaurant"],
    plan: [["Guests arrive", 0], ["Puja", 30], ["Rice feeding", 90], ["Lunch", 120, true], ["Tika and blessings", 180]], dishes: "nepali",
  },
  party: {
    who: "What's the party?", label: "The party's name", example: "Our house-warming", titleFirst: true,
    titleChips: ["Our house-warming", "Get-together", "Farewell party", "Baby shower", "Graduation party", "Retirement party"],
    times: ["13:00", "18:00", "19:00", "20:00"], hours: [3, 4, 5],
    venues: ["At home", "Garden", "Restaurant", "Pub", "Community hall"],
    plan: [["Guests arrive", 0], ["Food", 60, true], ["Music and dancing", 120], ["Party ends", 240]], dishes: "general",
  },
  ceremony: {
    who: "What's the ceremony?", label: "The ceremony", example: "Satyanarayan Puja", titleFirst: true,
    titleChips: ["Puja", "Naming ceremony", "House blessing", "Satyanarayan Puja", "Blessing ceremony"],
    times: ["09:00", "10:00", "11:00"], hours: [3, 4],
    venues: NEPALI_VENUES,
    plan: [["Guests arrive", 0], ["Puja", 30], ["Lunch", 120, true], ["Tika and blessings", 180]], dishes: "nepali",
  },
  wedding: {
    who: "Who's getting married?", label: "Their names", example: "Meenu", couple: true,
    relations: ["The couple", "The bride and groom"],
    times: ["10:00", "11:00", "13:00", "18:00"], hours: [5, 6, 8],
    venues: ["Function hall", "Hotel", "Temple", "Church", "Garden venue"],
    plan: [["Guests arrive", 0], ["Ceremony", 60], ["Photos", 150], ["Reception", 210], ["Dinner", 270, true], ["First dance", 360]], dishes: "nepali",
  },
  engagement: {
    who: "Who's getting engaged?", label: "Their names", example: "Priya", couple: true,
    relations: ["The couple", "The happy couple"],
    times: ["11:00", "13:00", "18:00"], hours: [3, 4, 5],
    venues: ["At home", "Function hall", "Restaurant", "Hotel", "Temple"],
    plan: [["Guests arrive", 0], ["Tika", 30], ["Ring ceremony", 60], ["Dinner", 120, true]], dishes: "nepali",
  },
  anniversary: {
    who: "Whose anniversary is it?", label: "Their names", example: "Ram", couple: true,
    relations: ["The couple", "Mum and Dad", "Grandma and Grandpa"],
    milestone: { label: "How many years? (if you like)", chips: ["1st", "10th", "25th", "30th", "40th", "50th", "60th"], max: 90, other: "Another year" },
    times: ["13:00", "18:00", "19:00"], hours: [3, 4, 5],
    venues: ["At home", "Restaurant", "Function hall", "Hotel"],
    plan: [["Guests arrive", 0], ["Welcome", 30], ["Cake", 90], ["Dinner", 120, true], ["Dancing", 180]], dishes: "general",
  },
  bratabandha: {
    who: "Whose Bratabandha is it?", label: "His name", example: "Kiran",
    relations: ["Our son", "Our sons", "The boy"],
    times: ["08:00", "09:00", "10:00"], hours: [5, 6],
    venues: NEPALI_VENUES,
    plan: [["Puja", 0], ["Bratabandha ceremony", 60], ["Lunch", 240, true], ["Tika and blessings", 300]], dishes: "nepali",
  },
  reunion: {
    who: "What's the reunion?", label: "The reunion's name", example: "2nd Battalion reunion 2027", titleFirst: true,
    titleChips: ["Regimental reunion", "School reunion", "Family reunion", "Old friends' reunion"],
    times: ["11:00", "12:00", "18:00", "19:00"], hours: [4, 5, 6],
    venues: ["Function hall", "Hotel", "Community centre", "Restaurant", "Pub"],
    plan: [["Guests arrive", 0], ["Welcome speech", 30], ["Lunch", 60, true], ["Cultural programme", 150], ["Raffle", 210], ["Close", 270]], dishes: "nepali",
  },
  corporate: {
    who: "What's the event?", label: "The event's name", example: "Annual dinner 2027", titleFirst: true,
    titleChips: ["Annual dinner", "Christmas party", "Awards night", "Product launch", "Team day out"],
    times: ["09:00", "18:00", "18:30", "19:00"], hours: [3, 4, 5],
    venues: ["Hotel", "Restaurant", "Office", "Conference centre", "Function hall"],
    plan: [["Arrival drinks", 0], ["Welcome", 30], ["Dinner", 60, true], ["Awards", 150], ["Close", 240]], dishes: "general",
  },
  mela: {
    who: "What's the festival called?", label: "The festival's name", example: "Riverside Mela 2027", titleFirst: true,
    titleChips: ["Summer Mela", "Dashain Mela", "Tihar Mela", "Teej festival", "Food festival"],
    times: ["10:00", "11:00", "12:00"], hours: [6, 8],
    venues: ["Park", "Recreation ground", "Community centre", "Leisure centre", "School field"],
    plan: [["Opening", 0], ["Food stalls open", 30, true], ["Cultural show", 90], ["Raffle draw", 300], ["Close", 420]], dishes: "nepali",
  },
  sport: {
    who: "What's the tournament called?", label: "The tournament's name", example: "Riverside Cup 2027", titleFirst: true,
    titleChips: ["Football tournament", "Volleyball tournament", "Futsal tournament", "Cricket tournament", "Badminton tournament"],
    times: ["08:00", "09:00", "10:00"], hours: [8, 10],
    venues: ["Sports ground", "Leisure centre", "Recreation ground", "School field", "Sports hall"],
    plan: [["Opening ceremony", 0], ["Group games", 30], ["Lunch", 240, true], ["Semi-finals", 360], ["Final", 450], ["Prize-giving", 510]], dishes: "general",
  },
  charity: {
    who: "What's the fundraiser called?", label: "The fundraiser's name", example: "Walk for Nepal 2027", titleFirst: true,
    titleChips: ["Charity walk", "Fundraising dinner", "Sponsored run", "Quiz night", "Coffee morning"],
    times: ["09:00", "10:00", "18:00", "19:00"], hours: [3, 4, 6],
    venues: ["Community centre", "Park", "Function hall", "Church hall", "School hall"],
    plan: [["Registration", 0], ["Start", 30], ["Lunch", 180, true], ["Prize-giving", 240]], dishes: "general",
  },
  community: {
    who: "What's the event called?", label: "The event's name", example: "Dashain gathering 2027", titleFirst: true,
    titleChips: ["Dashain gathering", "Tihar celebration", "Teej celebration", "Cultural show", "Community meeting"],
    times: ["11:00", "12:00", "17:00", "18:00"], hours: [4, 5, 6],
    venues: ["Community centre", "Function hall", "School hall", "Park", "Temple"],
    plan: [["Welcome", 0], ["Programme", 30], ["Food", 120, true], ["Close", 240]], dishes: "nepali",
  },
  memorial: {
    who: "Who are we remembering?", label: "Their name", example: "Bhim Bahadur Gurung", memorialKinds: true,
    relations: ["In loving memory of", "In memory of", "Remembering", "Celebrating the life of"],
    times: ["10:00", "11:00", "13:00", "14:00"], hours: [2, 3, 4],
    venues: ["Crematorium", "Church", "Temple", "Community hall", "At home"],
    plan: [["Service", 0], ["Prayers", 45], ["Refreshments", 90, true]], dishes: "general",
  },
  christmas: {
    who: "What's the party?", label: "The party's name", example: "The Gurung family Christmas", titleFirst: true,
    titleChips: ["Family Christmas", "Christmas party", "Christmas dinner", "Christmas lunch", "Office Christmas party"],
    times: ["12:00", "13:00", "18:00", "19:00"], hours: [4, 5, 6],
    venues: ["At home", "Restaurant", "Pub", "Function hall", "Office"],
    plan: [["Guests arrive", 0], ["Christmas dinner", 60, true], ["Secret Santa", 150], ["Games", 180], ["Carols", 210]], dishes: "christmas",
  },
  "new-year": {
    who: "What's the party?", label: "The party's name", example: "New Year's Eve 2026", titleFirst: true,
    titleChips: ["New Year's Eve party", "Countdown party", "New Year's Eve dinner"],
    times: ["19:00", "20:00", "21:00"], hours: [5, 6],
    venues: ["At home", "Restaurant", "Pub", "Function hall"],
    plan: [["Guests arrive", 0], ["Dinner", 60, true], ["Dancing", 150]], dishes: "general",
  },
  lhosar: {
    who: "Which Lhosar?", label: "The event's name", example: "Riverside Tamu Lhosar 2026", titleFirst: true,
    titleChips: ["Tamu Lhosar", "Sonam Lhosar", "Gyalpo Lhosar", "Lhosar celebration"],
    times: ["10:00", "11:00", "12:00"], hours: [5, 6, 8],
    venues: ["Community centre", "Function hall", "School hall", "Leisure centre", "Park"],
    plan: [["Welcome", 0], ["Prayers and blessings", 30], ["Cultural programme", 90], ["Cultural dances", 150], ["Lunch", 210, true], ["Tika and close", 300]], dishes: "nepali",
  },
};

const FALLBACK: Kind = {
  who: "What's the event?", label: "The event's name", example: "Our celebration", titleFirst: true,
  times: ["11:00", "14:00", "18:00"], hours: [3, 4], venues: ["At home", "Community hall", "Restaurant"],
  plan: [["Guests arrive", 0], ["Welcome", 30], ["Food", 90, true]], dishes: "general",
};
export function kindOf(typeKey: string | null | undefined): Kind {
  return KINDS[typeKey ?? ""] ?? FALLBACK;
}

// A memorial's title, from what it is.
export const MEMORIAL_KINDS: { key: string; title: (n: string) => string }[] = [
  { key: "Funeral", title: (n) => `Funeral of ${n}` },
  { key: "Prayers", title: (n) => `Prayers for ${n}` },
  { key: "Memorial service", title: (n) => `Memorial service for ${n}` },
  { key: "Remembrance", title: (n) => `Remembering ${n}` },
  { key: "One year on", title: (n) => `${n}: one year on` },
];

// 1st, 2nd, 3rd, 4th… 11th, 12th, 13th… 21st, 101st.
export function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const end = teen ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${end}`;
}

// The event's name made from the names and the milestone, until the host
// types their own.
export function titleFor(d: Draft): string {
  const names = d.stars.names.trim();
  if (!names) return d.title;
  const m = d.milestone ?? "";
  switch (d.eventType) {
    case "birthday": return `${names}’s ${m ? `${m} ` : ""}birthday`;
    case "pasni": return `${names}’s Pasni`;
    case "bratabandha": return `${names}’s Bratabandha`;
    case "wedding": return names;
    case "engagement": return `${names}’s engagement`;
    case "anniversary": return m ? `${names}: ${m.replace(/\D/g, "")} years` : `${names}’s anniversary`;
    case "memorial": return (MEMORIAL_KINDS.find((k) => k.key === m) ?? MEMORIAL_KINDS[3]).title(names);
    default: return d.title || names;
  }
}

// A tidy web address: "Sita’s 50th birthday" → sitas-50th-birthday.
export function suggestedSlug(d: Draft): string {
  return slugify((d.title || d.stars.names).replace(/['’]/g, ""));
}

// ─────────────── Dates and times ───────────────

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// The Saturday `weeksAhead` weeks after the coming one.
export function saturday(weeksAhead: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const add = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + add + weeksAhead * 7);
  return iso(d);
}

// Quick dates: the coming Saturdays, and the fixed days of the festive season.
export function dateChips(typeKey: string | null, from = new Date()): { label: string; date: string }[] {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const next = (month: number, day: number) => {
    let d = new Date(today.getFullYear(), month, day);
    if (d < today) d = new Date(today.getFullYear() + 1, month, day);
    return iso(d);
  };
  if (typeKey === "christmas") {
    return [
      { label: "Sat before Christmas", date: (() => { const c = new Date(next(11, 25) + "T12:00"); c.setDate(c.getDate() - ((c.getDay() + 1) % 7 || 7)); return iso(c); })() },
      { label: "Christmas Eve", date: next(11, 24) },
      { label: "Christmas Day", date: next(11, 25) },
      { label: "Boxing Day", date: next(11, 26) },
    ];
  }
  if (typeKey === "new-year") return [{ label: "New Year's Eve", date: next(11, 31) }, { label: "New Year's Day", date: next(0, 1) }];
  return [
    { label: "This Saturday", date: saturday(0, from) },
    { label: "Next Saturday", date: saturday(1, from) },
    { label: "In 2 weeks", date: saturday(2, from) },
    { label: "In a month", date: saturday(4, from) },
  ];
}

// The date under a quick-date chip: "21 Nov" under "This Saturday", "Thu 25 Dec" under "Christmas Day".
const DAY3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function dateLine(label: string, date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dm = `${d} ${MONTH3[m - 1]}`;
  return /sat/i.test(label) ? dm : `${DAY3[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${dm}`;
}

export function addMinutes(time: string, minutes: number): { time: string; days: number } {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const days = Math.floor(total / 1440);
  const t = ((total % 1440) + 1440) % 1440;
  return { time: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`, days };
}

function addDaysIso(date: string, days: number): string {
  if (!days || !date) return date;
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return iso(d);
}

// A timed day plan for this kind of event, from its start time.
export function planFor(d: Draft): Draft["functions"] {
  const k = kindOf(d.eventType);
  const start = d.startTime || k.times[0];
  const items = k.plan.map(([title, mins, meal], i) => {
    const at = addMinutes(start, mins);
    return {
      id: `${Date.now().toString(36)}p${i}`, title, time: at.time, date: at.days ? addDaysIso(d.date, at.days) : d.date,
      place: "", note: "", meal: !!meal, menu: meal ? [{ course: "Main", dish: "" }] : [],
    };
  });
  if (d.eventType === "new-year" && d.date) {
    items.push({ id: `${Date.now().toString(36)}c`, title: "Countdown to midnight", time: "23:55", date: d.date, place: "", note: "", meal: false, menu: [] });
    items.push({ id: `${Date.now().toString(36)}f`, title: "Fireworks", time: "00:00", date: addDaysIso(d.date, 1), place: "", note: "", meal: false, menu: [] });
  }
  return items;
}

// ─────────────── Popular dishes, for the menu ───────────────

export const DISHES: Record<Kind["dishes"], [string, string][]> = {
  nepali: [["Starter", "Momo"], ["Starter", "Chatpate"], ["Main", "Dal bhat"], ["Main", "Goat curry"], ["Main", "Chicken curry"], ["Side", "Aloo achar"],
    ["Side", "Sel roti"], ["Dessert", "Kheer"], ["Dessert", "Jeri"], ["Drinks", "Masala chiya"]],
  christmas: [["Starter", "Soup"], ["Main", "Roast turkey"], ["Side", "Pigs in blankets"], ["Side", "Roast potatoes"], ["Side", "Brussels sprouts"],
    ["Dessert", "Christmas pudding"], ["Dessert", "Mince pies"], ["Drinks", "Mulled wine"]],
  general: [["Starter", "Samosas"], ["Starter", "Soup"], ["Main", "Curry and rice"], ["Main", "Buffet"], ["Main", "Pizza"], ["Side", "Salad"],
    ["Dessert", "Cake"], ["Dessert", "Ice cream"], ["Drinks", "Soft drinks"]],
};

// ─────────────── Ready-made words ───────────────
// There the moment the Quick start finishes, with no sign-in. Simple and
// warm; the AI writes richer ones (in two languages if wanted) once the host
// signs in. Date, time and place are left out: the page shows them anyway.

export function suggestedWords(d: Draft): EventCopy {
  const t = eventType(d.eventType);
  const names = d.stars.names.trim();
  const title = d.title.trim() || names || t?.label || "our event";
  const who = names || title;
  const m = d.milestone ?? "";
  const year = d.date ? Number(d.date.slice(0, 4)) + (d.date.slice(5, 7) === "12" ? 1 : 0) : new Date().getFullYear() + 1;
  const c: EventCopy = (() => {
    switch (d.eventType) {
      case "birthday": return {
        card_headline: m ? `${who} is ${m.replace(/\D/g, "")}!` : `${who}’s birthday!`,
        card_invite_body: `Come and celebrate ${who}’s ${m ? `${m} ` : ""}birthday with us. There’ll be food, fun and cake, and we’d love you to be there.`,
        landing_page_story: `We’re celebrating ${who}’s ${m ? `${m} ` : ""}birthday, and it wouldn’t be the same without you.\n\nCome hungry and ready for fun. Please let us know if you can make it, so we can plan the food.`,
        guest_note_box: "Please let us know if you can come, so we can plan the food.",
        post_event_thank_you: `Thank you for coming to ${who}’s birthday! It meant so much to have you there.`,
      };
      case "pasni": return {
        card_headline: `${who}’s Pasni`,
        card_invite_body: `With joy and blessings, we invite you to ${who}’s Pasni, the rice-feeding ceremony. Please join us to bless our little one.`,
        landing_page_story: `Our family warmly invites you to ${who}’s Pasni, as we celebrate the first taste of rice.\n\nPlease come and share your blessings, then stay for lunch with us.`,
        guest_note_box: "Please let us know if you can come, so we can plan the lunch.",
        post_event_thank_you: `Thank you for coming to ${who}’s Pasni and for your blessings. It meant so much to our family.`,
      };
      case "bratabandha": return {
        card_headline: `${who}’s Bratabandha`,
        card_invite_body: `We warmly invite you to ${who}’s Bratabandha, the sacred thread ceremony. Your presence and blessings would mean a great deal to our family.`,
        landing_page_story: `Our family is proud to invite you to ${who}’s Bratabandha.\n\nPlease join us for the ceremony and for lunch afterwards, and share your blessings.`,
        guest_note_box: "Please let us know if you can come, so we can plan the lunch.",
        post_event_thank_you: `Thank you for joining us for ${who}’s Bratabandha and for your blessings.`,
      };
      case "ceremony": return {
        card_headline: title,
        card_invite_body: `You’re warmly invited to join us for ${title}. Please come and share the blessings with our family.`,
        landing_page_story: `We would be honoured to have you with us for ${title}.\n\nPlease join us for the ceremony and stay for food afterwards.`,
        guest_note_box: "Please let us know if you can come, so we can plan the food.",
        post_event_thank_you: `Thank you for joining us for ${title} and for your blessings.`,
      };
      case "wedding": return {
        card_headline: who,
        card_invite_body: `Together with their families, ${who} invite you to celebrate their wedding. Your love and blessings would mean the world to them.`,
        landing_page_story: `${who} are getting married, and they would love you to be part of their special day.\n\nPlease join them for the ceremony and the celebrations afterwards, and let them know if you can come.`,
        guest_note_box: "Please let us know if you can come, so we can plan the seating and the food.",
        post_event_thank_you: `Thank you for celebrating with ${who}! Your love and blessings made the day unforgettable.`,
      };
      case "engagement": return {
        card_headline: who,
        card_invite_body: `${who} are engaged! Please join us to celebrate this happy news together.`,
        landing_page_story: `We’re delighted to share that ${who} are engaged.\n\nPlease join us to celebrate with them, and to share your blessings for the years ahead.`,
        guest_note_box: "Please let us know if you can come.",
        post_event_thank_you: `Thank you for celebrating ${who}’s engagement with us!`,
      };
      case "anniversary": return {
        card_headline: m ? `${m.replace(/\D/g, "")} years of ${who}` : `Happy anniversary, ${who}`,
        card_invite_body: `Please join us to celebrate ${who}’s ${m ? `${m} ` : ""}wedding anniversary. Years of love deserve a celebration!`,
        landing_page_story: `${who} are celebrating their ${m ? `${m} ` : ""}wedding anniversary, and we’d love you to celebrate with them.\n\nCome and share the memories, the food and a toast to many more happy years.`,
        guest_note_box: "Please let us know if you can come.",
        post_event_thank_you: `Thank you for celebrating ${who}’s anniversary with us!`,
      };
      case "memorial": return {
        card_headline: title,
        card_invite_body: `With love and gratitude, we invite family and friends to join us to remember ${who}.`,
        landing_page_story: `We are gathering to remember ${who}, and to give thanks for a life that meant so much to so many.\n\nFamily and friends are welcome to join us, to share memories and to support one another.`,
        guest_note_box: "",
        post_event_thank_you: `Thank you for being with us to remember ${who}, and for your kind words and support.`,
      };
      case "christmas": return {
        card_headline: title,
        card_invite_body: `Join us for ${title}! Good food, good company and plenty of festive cheer.`,
        landing_page_story: `Christmas is better together, so we’d love you to join us for ${title}.\n\nCome for the food and stay for the fun. Please let us know if you can make it.`,
        guest_note_box: "Please let us know if you can come, so we can plan the food.",
        post_event_thank_you: `Thank you for celebrating Christmas with us! Wishing you a very happy New Year.`,
      };
      case "new-year": return {
        card_headline: `Hello ${year}!`,
        card_invite_body: "Ring in the New Year with us! Join us for food, music and the countdown to midnight.",
        landing_page_story: `Let’s say goodbye to ${year - 1} and welcome ${year} together.\n\nJoin us for food, music and dancing, and be there for the countdown to midnight.`,
        guest_note_box: "Please let us know if you can come.",
        post_event_thank_you: `Thank you for seeing in the New Year with us! Wishing you a happy, healthy ${year}.`,
      };
      case "reunion": return {
        card_headline: title,
        card_invite_body: `It’s time to get together again! Join us for ${title}: old friends, good food and plenty of stories.`,
        landing_page_story: `We’re bringing everyone together again for ${title}.\n\nCome and catch up with old friends, share the memories and make some new ones. Please let us know if you can come.`,
        guest_note_box: "Please let us know if you can come, so we can plan the food.",
        post_event_thank_you: `Thank you for coming to ${title}! It was wonderful to see everyone together again.`,
      };
      case "corporate": return {
        card_headline: title,
        card_invite_body: `You’re invited to ${title}. Join us for good food, good company and a celebration of the year.`,
        landing_page_story: `We’d be delighted if you could join us for ${title}.\n\nIt’s a chance to come together and celebrate. Please let us know if you can come.`,
        guest_note_box: "Please let us know if you can come.",
        post_event_thank_you: `Thank you for joining us for ${title}. It was a pleasure to celebrate together.`,
      };
      case "sport": return {
        card_headline: title,
        card_invite_body: `${title} is coming! Teams, fans and families are all welcome. Come and cheer them on.`,
        landing_page_story: `${title} brings teams and supporters together for a day of great sport.\n\nCome and cheer on the teams, and enjoy the food and the atmosphere. Everyone is welcome.`,
        guest_note_box: "",
        post_event_thank_you: `Thank you to every team, supporter and helper who made ${title} such a great day!`,
      };
      case "charity": return {
        card_headline: title,
        card_invite_body: `Join us for ${title} and help us raise money for a good cause. Everyone is welcome.`,
        landing_page_story: `${title} is our chance to come together and make a difference.\n\nEveryone who joins in helps. Bring your friends and family, and help us make it a success.`,
        guest_note_box: "",
        post_event_thank_you: `Thank you to everyone who joined ${title}. Together we made a real difference.`,
      };
      case "lhosar": return {
        card_headline: title,
        card_invite_body: `Join us to celebrate ${title} with prayers, blessings, cultural dances and food. Everyone is welcome.`,
        landing_page_story: `${title} brings our community together to welcome the new year.\n\nJoin us for prayers and blessings, cultural programmes, dances and food. Everyone is welcome.`,
        guest_note_box: "",
        post_event_thank_you: "Thank you for celebrating Lhosar with us! Wishing you and your family a happy and healthy new year.",
      };
      default: return d.scale === "community" ? {
        card_headline: title,
        card_invite_body: `Everyone is welcome at ${title}! Music, food, culture and fun for all the family.`,
        landing_page_story: `${title} brings our community together for a day to remember.\n\nEveryone is welcome, so bring your family and friends.`,
        guest_note_box: "",
        post_event_thank_you: `Thank you to everyone who came to ${title} and made it so special!`,
      } : {
        card_headline: title,
        card_invite_body: `You’re invited! Come and join us for ${title}: good food, good company and plenty of fun.`,
        landing_page_story: `We’re having ${title}, and it wouldn’t be the same without you.\n\nCome along, and please let us know if you can make it.`,
        guest_note_box: "Please let us know if you can come.",
        post_event_thank_you: `Thank you for coming to ${title}! It was lovely to have you with us.`,
      };
    }
  })();
  return Object.fromEntries(COPY_KEYS.map((k) => [k, clampText(c[k], COPY_FIELDS[k].max)])) as EventCopy;
}
