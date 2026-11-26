// A stand-in Supabase for screenshots on this Mac (never the real one). Kept
// in the repo since 20 Nov 2026 because the scratchpad copy kept being wiped.
//
//   node scripts/dev/fake-supabase.mjs            (listens on :54399)
//   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=fake npx next dev -p 3100
//
// Serves: two published events (wedding/meenu-jose with the envelope and
// music, birthday/sita-50), their photos page and live comments (put sample
// photos in the local R2 with scripts/dev/sample-photos.sh), three events
// in a signed-in host's account (Your events), guest_crm in memory, the AI
// allowance, and /auth/v1/user. A fake session for the browser:
//   localStorage "in2min2.auth" = { access_token: "test", expires_at: 1900000000, user: { id: HOST, ... } }
// TV_MODE=bottom|right|off sets where the TV shows comments.

import http from "node:http";
import { randomBytes, randomUUID } from "node:crypto";

const HOST = "22222222-2222-2222-2222-222222222222";
export const WALL_EVENT = "e1000000-0000-4000-8000-0000000000aa";

// ── Public pages (public_event) ──
const base = (o) => ({
  short_code: "x9k2b", host_names: null, timezone: "Europe/London", starts_at: "2026-12-12T18:00:00Z", ends_at: "2026-12-12T23:00:00Z",
  venue_address: "1 Station Road, Reading", parking: "free", parking_note: null, organiser_name: null, organiser_type: null, for_profit: null,
  charity_number: null, organiser_contact: null, is_demo: false, landing_page_story: "", guest_note_box: "", post_event_thank_you: "",
  languages: ["en"], translations: {}, primary_color: "#C0163D", photo_style: "arch", motion: true, cover_image_key: null, hide_branding: false, effect: "none", ...o,
});
const pages = {
  "wedding/meenu-jose": { stage: process.env.STAGE || "pre", event: base({ type: "wedding", slug: "meenu-jose", title: "Meenu & Jose", card_headline: "Meenu & Jose are getting married",
      card_invite_body: "With joy in our hearts, we invite you to celebrate our wedding.", venue_name: "The Grand Hall", scale: "celebration", theme: "classic",
      palette: "sindoor", text_style: "calligraphy", border: "golden_roses" }),
    people: [{ role: "star", relation: "The couple", names: "Meenu & Jose", names_local: null }],
    features: { rsvp: true, photo_wall: true, settings: { music: "wedding_vows", envelope: true, photo_wall: { early: true }, ...(process.env.SEARCHABLE ? { search: true } : {}) } } },
  "birthday/sita-50": { stage: "pre", event: base({ type: "birthday", slug: "sita-50", title: "Sita’s 50th birthday", card_headline: "Sita’s 50th birthday",
      card_invite_body: "Join us for food, music and dancing.", venue_name: "Riverside Community Hall", scale: "personal", theme: "modern",
      palette: "rani_gold", text_style: "classic", border: "none", photo_style: "polaroid" }),
    people: [{ role: "star", relation: "Birthday star", names: "Sita", names_local: null }],
    features: { rsvp: true, settings: { music: "happy_birthday", envelope: true, backdrop: "jali_rani" } } },
};

// ── Photos page and TV ──
const wallPhotos = Array.from({ length: 8 }, (_, i) => ({
  id: `a0000000-0000-4000-8000-${String(i).padStart(12, "0")}`, w: i % 3 === 2 ? 800 : 600, h: i % 3 === 2 ? 600 : 800,
  by: ["Sita", "Hari", null, "Gita", "Asha", "Maya", "Bikash", "Kamala"][i], at: new Date(Date.now() - i * 600000).toISOString(),
  loves: [12, 3, 0, 7, 1, 0, 5, 2][i], mine: false, fav: i === 3, pg: null,
}));
const wall = () => ({
  stage: "live", event: { id: WALL_EVENT, type: "wedding", slug: "meenu-jose", short_code: "x9k2b", title: "Meenu & Jose", headline: "Meenu & Jose are getting married",
    scale: "celebration", palette: "sindoor", primary_color: "#8B1A1A", text_style: "calligraphy", private: false, sensitive: false },
  rules: { on: true, approve_first: false, early: true, open: true, sky: "night" }, limit: 500, per_guest: 50, shown: 8,
  photos: wallPhotos, featured: [wallPhotos[3], wallPhotos[0]], photographers: [], mine: { added: 0, waiting: 0 },
});
const names = ["Asha", "Hari", "Gita", "Bikash", "Maya", "Ram", "Kamala", "Suman"];
const words = ["Congratulations to you both!", "Beautiful ceremony 😍", "The food is amazing", "So happy for you!", "What a lovely day", "Dancing all night!", "Best wishes from the Thapa family", "Look at that cake!"];
const live = () => ({
  stage: "live", now: new Date().toISOString(),
  announcements: [{ id: "n1", kind: "happy", body: "Dinner is served in the main hall.", at: new Date().toISOString() }],
  cheer_rules: { on: true, approve_first: false, tv: process.env.TV_MODE || "right", open: true },
  cheers: process.env.NO_CHEERS ? [] : names.map((n, i) => ({ id: `c${i}`, name: n, body: words[i], emoji: i % 3 === 0 ? "love" : null, at: new Date(Date.now() - i * 120000).toISOString() })),
});

// ── Your events: three in the host's account ──
const ev = (o) => ({
  owner_id: HOST, timezone: "Europe/London", ends_at: null, venue_address: null, parking: "unknown", parking_note: null, expected_guests: null, venue_capacity: null,
  organiser_name: null, organiser_type: null, for_profit: null, charity_number: null, organiser_contact: null, languages: ["en"], landing_page_story: "",
  guest_note_box: "", post_event_thank_you: "", copy_translations: {}, cover_fit: "fill", motion: true, effect: "none", is_private: false, plan: "popup",
  cover_image_key: null, share_image_key: null, hero_keys: [], hero_motion: "zoomin", status: "published", closed_at: null, ...o,
  // When the page ends (0001/0013/0015): 90 days after the event here.
  hosting_until: new Date(Date.parse(o.ends_at ?? o.starts_at) + 90 * 86_400_000).toISOString(),
});
const mine = [
  ev({ id: "e1000000-0000-4000-8000-000000000001", event_type: "wedding", scale: "celebration", slug: "meenu-jose", short_code: "w3dd1", title: "Meenu & Jose",
    starts_at: "2027-05-15T10:00:00Z", ends_at: "2027-05-15T22:00:00Z", venue_name: "The Grand Hall", tone: "Formal and elegant", languages: ["en", "ne"],
    card_headline: "Meenu & Jose are getting married", card_invite_body: "With joy in our hearts, we invite you to celebrate our wedding.",
    copy_translations: { ne: { card_headline: "मीनु र जोसको विवाह" } }, theme: "classic", palette: "sindoor", primary_color: "#8B1A1A",
    text_style: "calligraphy", border: "golden_roses", photo_style: "arch" }),
  ev({ id: "e1000000-0000-4000-8000-000000000002", owner_id: "33333333-3333-3333-3333-333333333333", event_type: "christmas", scale: "personal", slug: "office-party",
    short_code: "xm4s2", title: "Office Christmas party", starts_at: "2026-12-18T19:00:00Z", venue_name: "The Crown", tone: "Festive and joyful",
    card_headline: "Office Christmas party", card_invite_body: "Mince pies and merriment.", theme: "festive", palette: "christmas", primary_color: "#B71C1C",
    text_style: "classic", border: "christmas_greenery", photo_style: "hero", effect: "snow" }),
  ev({ id: "e1000000-0000-4000-8000-000000000003", event_type: "birthday", scale: "personal", slug: "aaravs-5th", short_code: "b1rt3", title: "Aarav’s 5th birthday",
    starts_at: "2026-10-03T13:00:00Z", venue_name: "Soft play", tone: "Fun and playful", card_headline: "Aarav is 5!", card_invite_body: "Come and play.",
    theme: "modern", palette: "confetti_brights", primary_color: "#1D4ED8", text_style: "playful", border: "balloons", photo_style: "polaroid" }),
];
const minePeople = { [mine[0].id]: [{ role: "star", relation: "The couple", names: "Meenu & Jose", sort_order: 0 }, { role: "honour", relation: "Parents", names: "Ram & Gita", sort_order: 1 }],
  [mine[2].id]: [{ role: "star", relation: "The birthday star", names: "Aarav", sort_order: 0 }] };
const mineSubs = { [mine[0].id]: [{ title: "Ceremony", kind: "other", starts_at: "2027-05-15T10:00:00Z", venue_name: null, description: null, details: {}, sort_order: 0 },
  { title: "Lunch", kind: "meal", starts_at: "2027-05-15T12:30:00Z", venue_name: null, description: null, details: { menu: [{ course: "Main", dish: "Dal bhat" }] }, sort_order: 1 }] };
const mineToggles = { [mine[0].id]: { rsvp: true, photo_wall: true, settings: { envelope: true, music: "wedding_vows", envelope_from: "Meenu & Jose" } } };

const guests = [];
// SEED_REPLIES=1: replies already in (oldest first) and two personal invitations
// not answered, for the Replies panel. VENUE_CAP=120: the venue's safe capacity.
if (process.env.SEED_REPLIES) {
  const seed = [["Asha Gurung", "attending", 3, "Can't wait!", ["vegetarian"]], ["Hari", "maybe", 2, "Hoping to come after work.", []],
    ["Kamala", "declined", 1, "So sorry, we're away.", []], ["Sunita & family", "attending", 4, "", ["vegetarian", "nut_allergy"]],
    ["Bikash", "attending", 1, "See you there", ["halal"]], ["Maya", "attending", 2, "", []]];
  seed.forEach(([n, st, size, note, food], i) => {
    const at = new Date(Date.now() - (seed.length - i) * 3_600_000).toISOString();
    guests.push({ id: randomUUID(), invite_token: randomBytes(16).toString("hex"), invited_at: null, created_at: at, rsvp_at: at, source: "rsvp_form",
      full_name: n, party_size: size, rsvp_status: st, rsvp_note: note || null, guest_metadata: { food } });
  });
  for (const n of ["Uncle Ram", "Didi"]) guests.push({ id: randomUUID(), invite_token: randomBytes(16).toString("hex"), invited_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 9 * 3_600_000).toISOString(), rsvp_at: null, source: "host", full_name: n, party_size: 2, rsvp_status: "invited", rsvp_note: null, guest_metadata: {} });
}
// Enquiries and the admin (0018): in memory. ADMIN=0 makes the signed-in account a non-admin.
const enquiries = [
  { id: randomUUID(), source: "in2min2", created_at: new Date(Date.now() - 3_600_000).toISOString(), name: "Sita Rai", email: "sita@example.com", phone: "07700 900123",
    message: "Hello, do you do Pasni pages in Nepali? We'd like to send the link to family in Kathmandu.", status: "new", replied_at: null, notes: null },
  { id: randomUUID(), source: "in2min2", created_at: new Date(Date.now() - 30 * 3_600_000).toISOString(), name: "Arjun Patel", email: "arjun@example.com", phone: null,
    message: "Can guests upload photos without an account?", status: "replied", replied_at: new Date(Date.now() - 20 * 3_600_000).toISOString(), notes: "Told him yes" },
];
const venueCap = process.env.VENUE_CAP ? Number(process.env.VENUE_CAP) : null;

http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Expose-Headers", "*");
    if (req.method === "OPTIONS") { res.end(); return; }
    const u = new URL(req.url, "http://x");
    const send = (v, status = 200) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(v)); };
    const args = (() => { try { return JSON.parse(body || "{}"); } catch { return {}; } })();
    const eq = (k) => u.searchParams.get(k)?.replace(/^eq\./, "");
    const one = (req.headers.accept ?? "").includes("vnd.pgrst.object");

    if (u.pathname === "/rest/v1/rpc/submit_enquiry") {
      if (args.p_website) return send({ ok: true });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.p_email ?? "")) return send({ ok: false, reason: "email" });
      if ((args.p_message ?? "").trim().length < 5) return send({ ok: false, reason: "message" });
      enquiries.unshift({ id: randomUUID(), source: "in2min2", created_at: new Date().toISOString(), name: args.p_name, email: args.p_email.toLowerCase(), phone: args.p_phone || null,
        message: args.p_message, status: "new", replied_at: null, notes: null });
      return send({ ok: true });
    }
    if (u.pathname === "/emails" && req.method === "POST") { console.log("fake Resend:", JSON.stringify({ to: args.to, from: args.from, subject: args.subject })); return send({ id: "fake-email" }); }
    if (u.pathname === "/rest/v1/rpc/is_admin") return send(process.env.ADMIN !== "0");
    if (u.pathname === "/rest/v1/rpc/admin_overview") {
      if (process.env.ADMIN === "0") return send(null);
      const days = Array.from({ length: 14 }, (_, i) => ({ day: new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10), events: [0, 1, 0, 2, 3, 0, 1, 4, 2, 0, 1, 5, 2, 3][i], enquiries: [0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 1, 0, 1][i] }));
      return send({ enquiries: { new: enquiries.filter((e) => e.status === "new").length, total: enquiries.filter((e) => e.status !== "spam").length, week: 2 },
        accounts: { total: 14, hosts: 9 }, events: { total: 21, published: 12, drafts: 9, week: 6, month: 17 }, replies: { total: 64, week: 22, attending: 118 }, photos: { total: 203 }, ai: { week: 41 },
        by_plan: [{ key: "festive", n: 8 }, { key: "popup", n: 3 }, { key: "memorial", n: 1 }], by_type: [{ key: "birthday", n: 7 }, { key: "pasni", n: 5 }, { key: "wedding", n: 4 }], days });
    }
    if (u.pathname === "/rest/v1/enquiries") {
      const id = eq("id");
      if (req.method === "GET") return send(enquiries);
      const i = enquiries.findIndex((x) => x.id === id);
      if (req.method === "PATCH" && i >= 0) Object.assign(enquiries[i], args);
      if (req.method === "DELETE" && i >= 0) enquiries.splice(i, 1);
      res.statusCode = 204; res.end(); return;
    }
    if (u.pathname === "/rest/v1/rpc/public_event") {
      const e = pages[`${args.p_type}/${args.p_slug}`];
      const g = args.p_token ? guests.find((x) => x.invite_token === args.p_token) : null;
      return send(e ? { ...e, guest: g ? { name: g.full_name, rsvp_status: g.rsvp_status, party_size: g.party_size } : null } : null);
    }
    // Replies (submit_rsvp, 0004 + food needs 0014), kept in guests.
    if (u.pathname === "/rest/v1/rpc/submit_rsvp") {
      const r = args.p_reply ?? {};
      const FOOD = ["vegetarian", "vegan", "halal", "gluten_free", "nut_allergy", "dairy_free"];
      if ("food" in r && !Array.isArray(r.food)) return send({ ok: false, reason: "bad_reply" });
      let g = args.p_token ? guests.find((x) => x.invite_token === args.p_token) : null;
      if (!g) { g = { id: randomUUID(), invite_token: randomBytes(16).toString("hex"), created_at: new Date().toISOString(), source: "rsvp_form", guest_metadata: {} }; guests.push(g); }
      Object.assign(g, { full_name: r.name, party_size: r.party_size ?? 1, rsvp_status: r.status, rsvp_at: new Date().toISOString(), rsvp_note: r.note || null });
      if (Array.isArray(r.food)) g.guest_metadata = { ...(g.guest_metadata ?? {}), food: FOOD.filter((k) => r.food.includes(k)) };
      return send({ ok: true, status: g.rsvp_status, name: g.full_name, party_size: g.party_size, token: g.invite_token });
    }
    if (u.pathname === "/rest/v1/rpc/resolve_short_code") return send({ type: "wedding", slug: "meenu-jose" });
    if (u.pathname === "/rest/v1/rpc/event_usage") {
      const sum = (f) => guests.filter(f).reduce((n, g) => n + g.party_size, 0);
      const people = sum((g) => ["invited", "attending", "maybe"].includes(g.rsvp_status)), attending = sum((g) => g.rsvp_status === "attending");
      const e = mine.find((x) => x.id === args.p_event);
      return send({ people, attending, guest_limit: 300, level: "ok", venue_capacity: venueCap, capacity_left: venueCap === null ? null : venueCap - attending, hosting_until: e?.hosting_until ?? null });
    }
    if (u.pathname === "/rest/v1/rpc/public_photos") return send(wall());
    if (u.pathname === "/rest/v1/rpc/public_live") return send(live());
    if (u.pathname === "/rest/v1/rpc/love_photo") return send({ ok: true, loves: 13, mine: !!args.p_love });
    if (u.pathname === "/rest/v1/rpc/post_cheer") return send({ ok: true, status: "shown" });
    if (u.pathname === "/rest/v1/rpc/take_ai_write") return send(true);
    if (u.pathname === "/auth/v1/user") return send({ id: HOST, aud: "authenticated", role: "authenticated", email: "host@example.com" });

    if (u.pathname === "/rest/v1/events" && req.method === "GET") {
      const id = eq("id");
      if (!id) return send(mine);
      const e = mine.find((x) => x.id === id);
      return e ? send(one ? e : [e]) : send({ code: "PGRST116", message: "no rows" }, 406);
    }
    if (u.pathname === "/rest/v1/event_people" && req.method === "GET") return send(minePeople[eq("event_id")] ?? []);
    if (u.pathname === "/rest/v1/sub_events" && req.method === "GET") return send(mineSubs[eq("event_id")] ?? []);
    if (u.pathname === "/rest/v1/feature_toggles" && req.method === "GET") { const t = mineToggles[eq("event_id")] ?? { settings: {} }; return send(one ? t : [t]); }

    // Publishing (lib/publish.ts, lib/media-upload.ts): accept it and hand back a new event.
    if (u.pathname === "/rest/v1/events" && req.method === "POST") {
      const row = Array.isArray(args) ? args[0] : args;
      const e = { id: randomUUID(), event_type: row.event_type, slug: row.slug, short_code: randomBytes(3).toString("hex").slice(0, 5) };
      return send(one ? e : [e], 201);
    }
    if (u.pathname === "/rest/v1/events" && req.method === "PATCH") {
      const e = mine.find((x) => x.id === eq("id"));
      if (e && "closed_at" in args) e.closed_at = args.closed_at;   // closing the page early (0015)
      return send(one ? (e ?? { id: eq("id") }) : e ? [e] : [], 200);
    }
    if (u.pathname.startsWith("/rest/v1/") && ["POST", "PATCH", "DELETE"].includes(req.method) && u.pathname !== "/rest/v1/guest_crm") {
      res.statusCode = req.method === "POST" ? 201 : 204; res.end(); return;
    }
    if (u.pathname === "/rest/v1/rpc/claim_offer") return send({ ok: false, reason: "no_offer" });
    if (u.pathname.startsWith("/storage/v1/object/")) return send({ Key: u.pathname.split("/storage/v1/object/")[1] });

    if (u.pathname === "/rest/v1/guest_crm") {
      const id = eq("id");
      if (req.method === "GET") {
        const src = eq("source"), desc = u.searchParams.get("order") === "created_at.desc";
        const list = guests.filter((g) => !src || g.source === src).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
        return send(desc ? list.reverse() : list);
      }
      if (req.method === "POST") {
        for (const g of [].concat(args)) guests.push({ id: randomUUID(), invite_token: randomBytes(16).toString("hex"), invited_at: null, created_at: new Date().toISOString(), ...g });
        res.statusCode = 201; res.end(""); return;
      }
      if (req.method === "PATCH") { const g = guests.find((x) => x.id === id); if (g) Object.assign(g, args); res.statusCode = 204; res.end(); return; }
      if (req.method === "DELETE") { const i = guests.findIndex((x) => x.id === id); if (i >= 0) guests.splice(i, 1); res.statusCode = 204; res.end(); return; }
    }
    send([]);
  });
}).listen(54399, () => console.log("fake supabase on 54399"));
