// Checks that lib/catalog.ts (what the builder shows and charges) still
// matches the database seeds in 0001_init.sql, and that prices add up.
// Run by `npm run test:db`. Node runs the TypeScript file directly.
import fs from "node:fs";
import * as cat from "../../lib/catalog.ts";

const sql = fs.readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8");
// The migrations after 0001, for what they add (new switches).
const migDir = new URL("../migrations/", import.meta.url);
const later = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql") && f !== "0001_init.sql").sort()
  .map((f) => fs.readFileSync(new URL(f, migDir), "utf8")).join("\n");
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log("  ok  ", name); } else { fail++; console.log("  FAIL", name, extra); } };

console.log("Builder catalogue matches the database:");

// Plans
const planRe = /\('([a-z_]+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(null|\d+),\s*(null|\d+),\s*(\d+),\s*(\d+),\s*(true|false),\s*(true|false),\s*(\d+),\s*(\d+),\s*'\{([a-z,]+)\}',\s*(null|\d+),\s*(null|\d+),\s*(\d+)\)/g;
const num = (v) => (v === "null" ? null : Number(v));
const dbPlans = [...sql.matchAll(planRe)].map((m) => ({
  key: m[1], name: m[2], pricePence: +m[3], daysAfter: +m[4], guestLimit: num(m[5]), photoLimit: num(m[6]),
  photosPerGuest: +m[7], aiWrites: +m[8], fullResDownload: m[9] === "true", hideBranding: m[10] === "true",
  bookingFeeBps: +m[11], bookingFeePence: +m[12], scales: m[13].split(","), packSize: num(m[14]), packPence: num(m[15]), sortOrder: +m[16],
}));
ok("found the 5 plans in the database file", dbPlans.length === 5, String(dbPlans.length));
for (const d of dbPlans) {
  const t = cat.PLANS.find((p) => p.key === d.key);
  const same = t && Object.keys(d).every((k) => JSON.stringify(d[k]) === JSON.stringify(t[k]));
  ok(`plan ${d.key} matches`, !!same, JSON.stringify({ db: d, ts: t }));
}
ok("no extra plans in the builder", cat.PLANS.length === dbPlans.length);

// Event types
const typeRe = /\('([a-z-]+)',\s*'([^']+)',\s*'(personal|celebration|community)',\s*'([a-z]+)',\s*'(\{[^']*\})',\s*(true|false),\s*(true|false),\s*(\d+)\)/g;
const dbTypes = [...sql.matchAll(typeRe)].map((m) => ({
  key: m[1], label: m[2], scale: m[3], theme: m[4], toggles: JSON.parse(m[5]), repeatsYearly: m[6] === "true", sensitive: m[7] === "true", sort: +m[8],
}));
ok("found the 15 event types in the database file", dbTypes.length === 15, String(dbTypes.length));
for (const d of dbTypes) {
  const t = cat.EVENT_TYPES.find((x) => x.key === d.key);
  const same = t && t.label === d.label && t.scale === d.scale && t.theme === d.theme && t.repeatsYearly === d.repeatsYearly
    && t.sensitive === d.sensitive && JSON.stringify(t.toggles) === JSON.stringify(d.toggles);
  ok(`event type ${d.key} matches`, !!same, JSON.stringify({ db: d, ts: t }));
}
ok("builder shows the types in the database's order", cat.EVENT_TYPES.map((t) => t.key).join() === dbTypes.sort((a, b) => a.sort - b.sort).map((t) => t.key).join());
const repeatAs = [...sql.matchAll(/update public\.event_types set repeat_as = '([a-z-]+)' where key = '([a-z-]+)'/g)].map((m) => [m[2], m[1]]);
ok("repeat_as matches (wedding → anniversary)", JSON.stringify(Object.fromEntries(repeatAs)) === JSON.stringify(cat.REPEAT_AS));

// Switch defaults
const toggleBlock = sql.slice(sql.indexOf("create table public.feature_toggles"), sql.indexOf("settings        jsonb"));
const dbToggles = Object.fromEntries([...toggleBlock.matchAll(/^\s+([a-z_]+)\s+boolean not null default (true|false)/gm)].map((m) => [m[1], m[2] === "true"]));
// Switches added by later migrations ("alter table public.feature_toggles add column menu boolean not null default true")
for (const m of later.matchAll(/alter table public\.feature_toggles\s+add column ([a-z_]+) boolean not null default (true|false)/g)) dbToggles[m[1]] = m[2] === "true";
ok("switch defaults match", JSON.stringify(dbToggles) === JSON.stringify(cat.TOGGLE_DEFAULTS), JSON.stringify(dbToggles));
ok("every switch in a type's defaults exists", cat.EVENT_TYPES.every((t) => Object.keys(t.toggles).every((k) => k in cat.TOGGLE_DEFAULTS)));

// Look and language
const shape = /^[a-z][a-z_]{2,29}$/;
ok("the database accepts any well-formed text style and border", /text_style\s+text not null default 'classic' check \(text_style ~ '\^\[a-z\]\[a-z_\]\{2,29\}\$'\)/.test(sql) && /border\s+text not null default 'none' check \(border ~/.test(sql));
ok("every text style name fits the database check", cat.TEXT_STYLES.every((t) => shape.test(t.key)) && cat.TEXT_STYLES.length === 10);
ok("every border name fits the database check", cat.BORDERS.every((b) => shape.test(b.key)) && cat.BORDERS.length === 18);
ok("every palette name fits the database check", cat.PALETTES.every((p) => shape.test(p.key)));
ok("no two palettes, text styles or borders share a name", new Set(cat.PALETTES.map((p) => p.key)).size === cat.PALETTES.length
  && new Set(cat.TEXT_STYLES.map((t) => t.key)).size === cat.TEXT_STYLES.length && new Set(cat.BORDERS.map((b) => b.key)).size === cat.BORDERS.length);
const dbPhotoStyles = sql.match(/photo_style in \(([^)]+)\)/)[1].replace(/'|\s/g, "").split(",");
ok("photo styles match", JSON.stringify(dbPhotoStyles) === JSON.stringify(cat.PHOTO_STYLES.map((s) => s.key)));
const dbFits = later.match(/cover_fit in \(([^)]+)\)/)?.[1].replace(/'|\s/g, "").split(",");
ok("photo fits match (0003)", JSON.stringify(dbFits) === JSON.stringify(cat.COVER_FITS.map((f) => f.key)), JSON.stringify(dbFits));
const dbOrganiser = sql.match(/organiser_type in \(([^)]+)\)/)[1].replace(/'|\s/g, "").split(",");
ok("organiser types match", JSON.stringify([...dbOrganiser].sort()) === JSON.stringify(cat.ORGANISER_TYPES.map((o) => o.key).sort()));
ok("every event type's starting palette, text style and borders exist", cat.EVENT_TYPES.every((t) =>
  cat.PALETTES.some((p) => p.key === t.palette) && cat.TEXT_STYLES.some((s) => s.key === t.textStyle)
  && t.borders.length >= 3 && t.borders.every((b) => cat.BORDERS.some((x) => x.key === b))));
ok("pinks are a small minority (owner, 13 Nov)", cat.PALETTES.filter((p) => /pastel|lali/.test(p.key)).length <= 2);
ok("every palette family has at least two choices", cat.PALETTE_FAMILIES.every((f) => cat.PALETTES.filter((p) => p.family === f).length >= 2));
ok("formal palettes exist for regiments, memorials and corporate events", ["navy_gold", "regimental", "black_gold", "charcoal_silver"].every((k) => cat.PALETTES.some((p) => p.key === k)));
ok("memorials start calm and formal", cat.eventType("memorial").palette === "calm" && cat.eventType("memorial").textStyle === "formal" && cat.eventType("memorial").borders[0] === "fine_line");
ok("every palette has at least five colours for confetti and bunting", cat.PALETTES.every((p) => cat.partyColours(p).length >= 5));
const langRe = /^[a-z]{2,3}(-[A-Z][a-z]{3})?$/;
ok("every language code fits the database check", cat.LANGUAGES.every((l) => langRe.test(l.code)));
for (const script of ["deva", "guru", "gujr", "beng", "taml"]) {
  ok(`every text style has a font for ${script} letters`, cat.TEXT_STYLES.every((t) => t.display.includes(`-${script}`) || (script === "deva" && /--f-(mukta|baloo|rozha|amita|kalam)\b/.test(t.display))));
}
const low = [];
for (const p of cat.PALETTES) {
  for (const [a, b, n] of [[p.main, p.bg, "main"], [p.onMain, p.main, "onMain"], [p.onAccent, p.accent, "onAccent"], [p.ink, p.bg, "ink"], [p.muted, p.bg, "muted"], [p.ink, p.soft, "ink/soft"]]) {
    if (cat.contrast(a, b) < 4.5) low.push(`${p.key} ${n} ${cat.contrast(a, b).toFixed(2)}`);
  }
}
ok(`every one of the ${cat.PALETTES.length} palettes passes the 4.5:1 readability check`, low.length === 0, low.join("; "));
const own = cat.paletteFor("custom", "#FFE066");
ok("your own pale colour gets dark text automatically", cat.contrast(own.onMain, own.main) >= 4.5 && own.onMain !== "#FFFFFF");

console.log("Prices:");
const q = cat.quote;
ok("one-week birthday for 250: £3", q("popup", 250).totalPence === 300);
ok("90-day anniversary for 380: £12", q("season", 380).totalPence === 1200);
ok("12-month wedding for 650: £31", q("keepsake", 650).totalPence === 3100);
ok("exactly 200 on Pop-Up: free, no pack", q("popup", 200).totalPence === 0 && q("popup", 200).packs === 0);
ok("201 on Pop-Up needs one pack", q("popup", 201).packs === 1);
ok("half fee level halves it: £6", q("season", 380, { chargePercent: 50 }).totalPence === 600);
ok("free fee level: £0", q("keepsake", 650, { chargePercent: 0 }).totalPence === 0);
ok("same again: 30% off £12 = £8.40", q("season", 380, { sameAgain: true }).totalPence === 840);
ok("welcome back: 20% off £12 = £9.60", q("season", 380, { welcomeBack: true }).totalPence === 960);
const both = q("season", 380, { sameAgain: true, welcomeBack: true });
ok("discounts never stack: the best one (30%) applies", both.totalPence === 840 && both.discount.kind === "same_again");
ok("a free Pop-Up shows no discount", q("popup", 100, { welcomeBack: true }).discount === null);
ok("booking fee on a £20 order: £1.10", cat.bookingFee(2000) === 110);
ok("…half: 55p; free: 0p", cat.bookingFee(2000, 50) === 55 && cat.bookingFee(2000, 0) === 0);
ok("prices read as £9, £4.50 and Free", cat.formatPence(900) === "£9" && cat.formatPence(450) === "£4.50" && cat.formatPence(0) === "Free");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
