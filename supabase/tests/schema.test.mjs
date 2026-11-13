// npm run test:db — runs supabase/migrations/*.sql on PGlite (real Postgres in WASM)
// with stand-ins for Supabase's auth schema and roles, then checks each role.
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";

// Every migration, in order (or just the file named on the command line).
const dir = new URL("../migrations/", import.meta.url);
const migration = process.argv[2]
  ? fs.readFileSync(process.argv[2], "utf8")
  : fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => fs.readFileSync(new URL(f, dir), "utf8")).join("\n");
const db = new PGlite({ extensions: { pgcrypto } });

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log("  ok  ", name); } else { fail++; console.log("  FAIL", name, extra); } };
async function expectError(name, sql, re) {
  try { await db.exec(sql); fail++; console.log("  FAIL", name, "(no error)"); }
  catch (e) { const m = String(e.message); if (!re || re.test(m)) { pass++; console.log("  ok  ", name, "→", m.slice(0, 80)); } else { fail++; console.log("  FAIL", name, m); } }
}
const q = async (sql, params) => (await db.query(sql, params)).rows;

// ── Supabase stand-ins ──
await db.exec(`
  create schema extensions;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  grant usage on schema public, auth, extensions to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  insert into auth.users values ('aaaaaaaa-0000-0000-0000-000000000001'), ('bbbbbbbb-0000-0000-0000-000000000002'), ('cccccccc-0000-0000-0000-000000000003');
`);

console.log("Migration:");
await db.exec(migration);
await db.exec(`grant execute on all functions in schema extensions to anon, authenticated;`);
ok("migration ran without error", true);

const A = "aaaaaaaa-0000-0000-0000-000000000001", B = "bbbbbbbb-0000-0000-0000-000000000002", C = "cccccccc-0000-0000-0000-000000000003";
const as = async (user) => { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ""}', false); set role ${user ? "authenticated" : "anon"};`); };

console.log("Host A creates a wedding:");
await as(A);
const [ev] = await q(`insert into events (event_type, slug, title, host_names, starts_at, ends_at, card_headline)
  values ('wedding','meenu-jose','Meenu & Jose','Meenu & Jose', '2027-03-14 13:00+00', '2027-03-14 23:00+00', 'Meenu & Jose')
  returning id, owner_id, plan, short_code, hosting_until, status`);
ok("insert returns the row (select policy on own insert)", !!ev?.id);
ok("owner_id defaulted to auth.uid()", ev.owner_id === A);
ok("plan defaults to popup", ev.plan === "popup");
ok("short code is 5 readable chars", /^[2-9a-hjkmnp-z]{5}$/.test(ev.short_code), ev.short_code);
ok("hosting_until = end + 7 days", new Date(ev.hosting_until).toISOString() === "2027-03-21T23:00:00.000Z", ev.hosting_until);
const hosts = await q(`select role from event_hosts where event_id = $1`, [ev.id]);
ok("creator added as owner", hosts.length === 1 && hosts[0].role === "owner");
const [ft] = await q(`select * from feature_toggles where event_id = $1`, [ev.id]);
ok("toggles row created", !!ft);
ok("wedding defaults applied (gift_registry, guestbook on)", ft.gift_registry === true && ft.guestbook === true);
ok("column defaults kept (rsvp on, tickets off)", ft.rsvp === true && ft.tickets === false);
ok("wedding gets celebration scale from its type", (await q(`select scale from events where id = $1`, [ev.id]))[0].scale === "celebration");
const [st] = await q(`select event_settings($1) as s`, [ev.id]);
ok("event_settings returns theme_config + feature_flags", st.s.theme_config.template === "classic" && st.s.feature_flags.photo_wall === true);

await expectError("host cannot set plan (paid) on insert", `insert into events (event_type, slug, title, starts_at, plan) values ('party','free-upgrade','x', now(), 'keepsake')`, /permission denied/);
await expectError("host cannot update plan", `update events set plan = 'keepsake' where id = '${ev.id}'`, /permission denied/);
await expectError("host cannot set custom_domain", `update events set custom_domain = 'meenu.com' where id = '${ev.id}'`, /permission denied/);
await expectError("headline over 45 chars rejected", `update events set card_headline = repeat('x', 46) where id = '${ev.id}'`, /check constraint/);
await expectError("bad slug rejected", `insert into events (event_type, slug, title, starts_at) values ('party','Bad Slug!','x', now())`, /check constraint/);
await expectError("duplicate type+slug rejected", `insert into events (event_type, slug, title, starts_at) values ('wedding','meenu-jose','x', now())`, /unique|duplicate/);

// Sport defaults
const [sp] = await q(`insert into events (event_type, slug, title, starts_at) values ('sport','kickoff-2026','Kickoff', '2027-05-01 09:00+00') returning id`);
const [spt] = await q(`select tickets, team_entries, stalls, parking, live_scores, sponsors, gift_registry, rsvp from feature_toggles where event_id = $1`, [sp.id]);
ok("sport defaults: tickets, teams, stalls, parking, live scores, sponsors on; gifts and RSVP off", spt.tickets && spt.team_entries && spt.stalls && spt.parking && spt.live_scores && spt.sponsors && !spt.gift_registry && !spt.rsvp);

console.log("Scales and plans:");
const [spe] = await q(`select scale, plan, hosting_until, starts_at from events where id = $1`, [sp.id]);
ok("tournament is community scale on the Community plan", spe.scale === "community" && spe.plan === "community", JSON.stringify(spe));
ok("Community plan keeps the page 90 days", (new Date(spe.hosting_until) - new Date(spe.starts_at)) / 86400000 === 90);
const [bd] = await q(`insert into events (event_type, slug, title, starts_at) values ('birthday','asha-10','Asha is 10', '2027-02-01 14:00+00') returning id, scale, plan`);
ok("birthday is personal scale on Pop-Up", bd.scale === "personal" && bd.plan === "popup");
await q(`update events set event_type = 'sport' where id = $1`, [bd.id]);
const [bd2] = await q(`select scale, plan from events where id = $1`, [bd.id]);
ok("changing the type moves scale and free plan with it", bd2.scale === "community" && bd2.plan === "community", JSON.stringify(bd2));
await q(`update events set scale = 'personal' where id = $1`, [bd.id]);
ok("host can choose the scale; free plan follows", (await q(`select plan from events where id = $1`, [bd.id]))[0].plan === "popup");
await db.exec(`reset role; update events set plan = 'half_year' where id = '${bd.id}'`);
await as(A);
await q(`update events set scale = 'community' where id = $1`, [bd.id]);
ok("a paid plan is never changed by a scale change", (await q(`select plan from events where id = $1`, [bd.id]))[0].plan === "half_year");
ok("Half-Year keeps the page 182 days", (await q(`select (hosting_until - starts_at) = interval '182 days' as ok from events where id = $1`, [bd.id]))[0].ok === true);

console.log("Languages and look:");
await q(`update events set languages = '{ne,en}', copy_translations = $2 where id = $1`,
  [ev.id, JSON.stringify({ en: { card_headline: "Meenu & Jose", post_event_thank_you: "Thank you for coming!" } })]);
ok("two languages with second-language boxes saved", true);
await expectError("three languages rejected", `update events set languages = '{en,ne,hi}' where id = '${ev.id}'`, /check constraint/);
await expectError("badly written language code rejected", `update events set languages = '{EN}' where id = '${ev.id}'`, /check constraint/);
await expectError("second-language headline over 45 chars rejected", `update events set copy_translations = '{"ne": {"card_headline": "${"क".repeat(46)}"}}' where id = '${ev.id}'`, /check constraint/);
await expectError("badly written text style rejected", `update events set text_style = 'Comic Sans!' where id = '${ev.id}'`, /check constraint/);
await q(`update events set border = 'marigold' where id = $1`, [ev.id]);
ok("host picks a border", (await q(`select border from events where id = $1`, [ev.id]))[0].border === "marigold");
await expectError("badly written border rejected", `update events set border = '<svg>' where id = '${ev.id}'`, /check constraint/);
ok("a new event starts in the Marigold & Indigo palette", (await q(`select palette from events where id = $1`, [ev.id]))[0].palette === "marigold_indigo");
await q(`update events set palette = 'lali_gurans' where id = $1`, [ev.id]);
ok("host picks another palette", (await q(`select palette from events where id = $1`, [ev.id]))[0].palette === "lali_gurans");
await expectError("a badly written palette name is rejected", `update events set palette = 'Red!' where id = '${ev.id}'`, /check constraint/);
await q(`update events set text_style = 'calligraphy', photo_style = 'arch' where id = $1`, [ev.id]);
const [st2] = await q(`select event_settings($1) as s`, [ev.id]);
ok("settings carry scale, languages, palette and styles", st2.s.scale === "celebration" && st2.s.languages[0] === "ne" && st2.s.theme_config.text_style === "calligraphy" && st2.s.theme_config.palette === "lali_gurans");

console.log("The stars and the honoured family:");
await q(`insert into event_people (event_id, role, relation, names, sort_order) values
  ($1, 'honour', 'Parents', 'Mr & Mrs Gurung', 1), ($1, 'star', 'Bride and groom', 'Meenu & Jose', 1)`, [ev.id]);
ok("star and honour rows added", (await q(`select count(*)::int n from event_people where event_id = $1`, [ev.id]))[0].n === 2);

console.log("Guests and sub-events:");
const [g1] = await q(`insert into guest_crm (event_id, full_name, email, phone) values ($1, 'Asha Gurung', 'asha@example.com', '+447700900123') returning id, invite_token`, [ev.id]);
ok("guest added with invite token", g1.invite_token.length === 32);
const [g2] = await q(`insert into guest_crm (event_id, full_name, category, primary_guest_id) values ($1, 'Asha plus one', 'plus_one', $2) returning id`, [ev.id, g1.id]);
ok("named plus-one linked to main guest", !!g2.id);
await expectError("same email twice in one event rejected", `insert into guest_crm (event_id, full_name, email) values ('${ev.id}', 'Asha again', 'asha@example.com')`, /unique|duplicate/);
await expectError("upper-case email rejected (store lower case)", `insert into guest_crm (event_id, full_name, email) values ('${ev.id}', 'X', 'X@Example.com')`, /check constraint/);
await expectError("phone not in international format rejected", `insert into guest_crm (event_id, full_name, phone) values ('${ev.id}', 'X', '07700900123')`, /check constraint/);
await expectError("plus-one cannot point at another event's guest", `insert into guest_crm (event_id, full_name, primary_guest_id) values ('${sp.id}', 'X', '${g1.id}')`, /foreign key/);
await expectError("host cannot write amount_paid", `update guest_crm set amount_paid_pence = 5000 where id = '${g1.id}'`, /permission denied/);
const [mehndi] = await q(`insert into sub_events (event_id, title, kind, starts_at, invite_only) values ($1, 'Mehndi', 'mehndi', '2027-03-13 18:00+00', true) returning id`, [ev.id]);
await q(`insert into sub_events (event_id, title, kind, starts_at) values ($1, 'Ceremony', 'ceremony', '2027-03-14 13:00+00')`, [ev.id]);
await q(`insert into sub_event_guests (sub_event_id, guest_id, event_id) values ($1, $2, $3)`, [mehndi.id, g1.id, ev.id]);
ok("guest invited to Mehndi", true);
const [spGuest] = await q(`insert into guest_crm (event_id, full_name, category, party_size, team_name) values ($1, 'Aldershot FC', 'team', 15, 'Aldershot FC') returning id`, [sp.id]);
await expectError("cannot invite another event's guest to a sub-event", `insert into sub_event_guests (sub_event_id, guest_id, event_id) values ('${mehndi.id}', '${spGuest.id}', '${ev.id}')`, /foreign key/);

console.log("Another host (B) sees nothing of A's:");
await as(B);
ok("B sees no events", (await q(`select id from events`)).length === 0);
ok("B sees no guests", (await q(`select id from guest_crm`)).length === 0);
ok("B sees no toggles", (await q(`select event_id from feature_toggles`)).length === 0);
ok("B sees no family names", (await q(`select id from event_people`)).length === 0);
const upd = await db.query(`update events set title = 'hacked' where id = $1`, [ev.id]);
ok("B's update changes nothing", upd.affectedRows === 0);
await expectError("B cannot add guests to A's event", `insert into guest_crm (event_id, full_name) values ('${ev.id}', 'Intruder')`, /row-level security/);
await expectError("B cannot make himself a host", `insert into event_hosts (event_id, user_id, role) values ('${ev.id}', '${B}', 'owner')`, /row-level security/);

console.log("Owner adds C as helper:");
await as(A);
await q(`insert into event_hosts (event_id, user_id, role) values ($1, $2, 'helper')`, [ev.id, C]);
await as(C);
ok("helper sees the event", (await q(`select id from events where id = $1`, [ev.id])).length === 1);
ok("helper sees the guest list", (await q(`select id from guest_crm where event_id = $1`, [ev.id])).length === 2);
const hu = await db.query(`update events set title = 'helper edit' where id = $1`, [ev.id]);
ok("helper cannot edit the event", hu.affectedRows === 0);
await expectError("helper cannot add guests", `insert into guest_crm (event_id, full_name) values ('${ev.id}', 'X')`, /row-level security/);

console.log("The public (anon):");
await as(null);
await expectError("anon cannot read events table", `select * from events`, /permission denied/);
await expectError("anon cannot read guest_crm", `select * from guest_crm`, /permission denied/);
let [pe] = await q(`select public_event('wedding','meenu-jose') as p`);
ok("draft event is invisible", pe.p === null);
await as(A);
await q(`update events set status = 'published' where id = $1`, [ev.id]);
const [pub] = await q(`select published_at from events where id = $1`, [ev.id]);
ok("published_at stamped on publish", !!pub.published_at);
await as(null);
[pe] = await q(`select public_event('wedding','meenu-jose') as p`);
ok("published event visible, stage pre", pe.p?.stage === "pre", JSON.stringify(pe.p)?.slice(0, 120));
ok("public page never includes guest list", !JSON.stringify(pe.p).includes("asha@example.com"));
ok("invite-only Mehndi hidden from public", pe.p.sub_events.length === 1 && pe.p.sub_events[0].title === "Ceremony");
ok("thank-you hidden before the event", pe.p.event.post_event_thank_you === null);
ok("second-language thank-you hidden before the event too", pe.p.event.translations.en.card_headline === "Meenu & Jose" && !("post_event_thank_you" in pe.p.event.translations.en));
ok("the public page carries the palette and border", pe.p.event.palette === "lali_gurans" && pe.p.event.border === "marigold");
ok("stars shown first, then the honoured family", pe.p.people.length === 2 && pe.p.people[0].role === "star" && pe.p.people[1].relation === "Parents");
await expectError("anon cannot read event_people directly", `select * from event_people`, /permission denied/);
[pe] = await q(`select public_event('wedding','meenu-jose', $1) as p`, [g1.invite_token]);
ok("invited guest's link shows Mehndi too", pe.p.sub_events.length === 2);
ok("guest's own name on their link", pe.p.guest?.name === "Asha Gurung");
const [sc] = await q(`select resolve_short_code(short_code) as r from (select $1::text as short_code) x`, [ev.short_code]);
ok("short code resolves to type/slug", sc.r?.type === "wedding" && sc.r?.slug === "meenu-jose");

console.log("Private event:");
await as(A);
await q(`update events set is_private = true where id = $1`, [ev.id]);
await as(null);
[pe] = await q(`select public_event('wedding','meenu-jose') as p`);
ok("private event shows nothing without a link", pe.p.private === true && !pe.p.event);
[pe] = await q(`select public_event('wedding','meenu-jose', $1) as p`, [g1.invite_token]);
ok("private event opens with a guest's link", !!pe.p.event);
[pe] = await q(`select public_event('wedding','meenu-jose', 'not-a-token') as p`);
ok("a wrong token does not open it", pe.p.private === true);

console.log("Lifecycle from the clock (event in London, 14 Mar 2027 13:00–23:00 UTC):");
await db.exec(`reset role`);
const stageAt = async (ts) => (await q(`select stage(e) as s from events e where slug = 'meenu-jose'`.replace("stage(e)", `(select case
    when e.status = 'cancelled' then 'cancelled' when e.status = 'draft' then 'draft'
    when '${ts}'::timestamptz >= e.hosting_until then 'expired'
    when '${ts}'::timestamptz >= coalesce(e.ends_at, (((e.starts_at at time zone e.timezone)::date + 1)::timestamp at time zone e.timezone)) then 'post'
    when '${ts}'::timestamptz >= (((e.starts_at at time zone e.timezone)::date)::timestamp at time zone e.timezone) then 'live'
    else 'pre' end)`)))[0].s;
ok("13 Mar 23:59 London → pre",  (await stageAt("2027-03-13 23:59+00")) === "pre");
ok("14 Mar 00:00 London → live", (await stageAt("2027-03-14 00:00+00")) === "live");
ok("14 Mar 22:59 → live",        (await stageAt("2027-03-14 22:59+00")) === "live");
ok("14 Mar 23:00 → post",        (await stageAt("2027-03-14 23:00+00")) === "post");
ok("21 Mar 23:00 (popup +7d) → expired", (await stageAt("2027-03-21 23:00+00")) === "expired");
// Same rule checked against the real function by moving the event instead of the clock.
await db.exec(`update events set starts_at = now() - interval '1 hour', ends_at = now() + interval '2 hours' where slug = 'meenu-jose'`);
ok("real stage(): happening now → live", (await q(`select stage(e) s from events e where slug='meenu-jose'`))[0].s === "live");
await db.exec(`update events set starts_at = now() - interval '3 days', ends_at = now() - interval '2 days' where slug = 'meenu-jose'`);
ok("real stage(): ended 2 days ago (popup) → post", (await q(`select stage(e) s from events e where slug='meenu-jose'`))[0].s === "post");
await db.exec(`update events set starts_at = now() - interval '10 days', ends_at = now() - interval '9 days' where slug = 'meenu-jose'`);
ok("real stage(): ended 9 days ago (popup) → expired", (await q(`select stage(e) s from events e where slug='meenu-jose'`))[0].s === "expired");
await db.exec(`update events set plan = 'keepsake' where slug = 'meenu-jose'`);
ok("server upgrades to keepsake → post again (365 days)", (await q(`select stage(e) s from events e where slug='meenu-jose'`))[0].s === "post");
await as(null);
[pe] = await q(`select public_event('wedding','meenu-jose', $1) as p`, [g1.invite_token]);
ok("after the event the thank-you appears", pe.p.stage === "post" && "post_event_thank_you" in pe.p.event);
ok("…in both languages", pe.p.event.translations.en.post_event_thank_you === "Thank you for coming!");
ok("keepsake hides branding", pe.p.event.hide_branding === true);

console.log("New event types (13 Nov 2026):");
await as(A);
const [ch] = await q(`insert into events (event_type, slug, title, starts_at) values ('charity','walk-2027','Charity walk', '2027-06-01 09:00+00') returning id, scale, plan`);
ok("charity is community scale on the Community plan", ch.scale === "community" && ch.plan === "community");
const [ru] = await q(`insert into events (event_type, slug, title, starts_at) values ('reunion','2gr-reunion','Regimental reunion', '2027-04-10 18:00+00') returning id, scale, plan`);
ok("reunion is celebration scale on Pop-Up", ru.scale === "celebration" && ru.plan === "popup");

console.log("Venue, parking and planning numbers:");
await q(`update events set parking = 'paid', parking_note = 'Pay at the gate, £5 a car', expected_guests = 180, venue_capacity = 200 where id = $1`, [ru.id]);
ok("host sets parking, expected guests and venue capacity", true);
await expectError("unknown parking value rejected", `update events set parking = 'valet' where id = '${ru.id}'`, /check constraint/);
await expectError("host cannot give themselves extra guests", `update events set extra_guests = 500 where id = '${ru.id}'`, /permission denied/);
await q(`update events set status = 'published' where id = $1`, [ru.id]);
await as(null);
[pe] = await q(`select public_event('reunion','2gr-reunion') as p`);
ok("guests see parking but not the planning numbers", pe.p.event.parking === "paid" && pe.p.event.parking_note.startsWith("Pay at")
  && !("venue_capacity" in pe.p.event) && !("expected_guests" in pe.p.event));

console.log("How full is the event (plan limit and venue capacity):");
await as(A);
const usage = async () => (await q(`select event_usage($1) as u`, [ru.id]))[0].u;
let u = await usage();
ok("empty event: 0 people, Pop-Up limit 200, level ok", u.people === 0 && u.guest_limit === 200 && u.level === "ok", JSON.stringify(u));
await q(`insert into guest_crm (event_id, full_name, party_size, rsvp_status) values
  ($1, 'The Rai family', 4, 'attending'), ($1, 'B Company tables', 156, 'invited'), ($1, 'Could not come', 6, 'declined')`, [ru.id]);
u = await usage();
ok("head count adds party sizes and skips those who declined", u.people === 160 && u.attending === 4, JSON.stringify(u));
ok("80% of the limit → near", u.level === "near");
await q(`insert into guest_crm (event_id, full_name, party_size) values ($1, 'Late additions', 48)`, [ru.id]);
u = await usage();
ok("over the limit → over, with the 100-guest pack at £3 offered", u.level === "over" && u.guest_pack.size === 100 && u.guest_pack.pence === 300, JSON.stringify(u));
ok("venue capacity left counts only those attending", u.capacity_left === 196);
await db.exec(`reset role; update events set extra_guests = 100 where id = '${ru.id}'`);
await as(A);
u = await usage();
ok("after a pack is bought (server only) the limit is 300, level ok", u.guest_limit === 300 && u.level === "ok", JSON.stringify(u));
await as(B);
ok("another host gets nothing from event_usage", (await q(`select event_usage($1) as u`, [ru.id]))[0].u === null);

console.log("Launch offer, first 50 families free:");
await as(null);
const placesLeft = async () => (await q(`select offer_places_left('launch50') as n`))[0].n;
ok("anyone can see the places left (50)", (await placesLeft()) === 50);
await expectError("the public cannot claim", `select claim_offer('${ru.id}', 'LAUNCH50')`, /permission denied/);
await as(A);
await expectError("hosts cannot read the offers table", `select * from offers`, /permission denied/);
await expectError("hosts cannot change the count", `update offers set claims = 0`, /permission denied/);
await as(B);
let [cl] = await q(`select claim_offer($1, 'LAUNCH50') as r`, [ru.id]);
ok("cannot claim for someone else's event", cl.r.ok === false && cl.r.reason === "not_owner");
await as(A);
[cl] = await q(`select claim_offer($1, ' launch50 ') as r`, [ru.id]);
ok("owner claims a free Keepsake", cl.r.ok === true && cl.r.plan === "keepsake" && cl.r.places_left === 49, JSON.stringify(cl.r));
const [ruk] = await q(`select plan, (hosting_until - starts_at) = interval '365 days' as year from events where id = $1`, [ru.id]);
ok("plan is Keepsake and the page is kept 12 months", ruk.plan === "keepsake" && ruk.year === true);
ok("places left drops to 49", (await placesLeft()) === 49);
const [ab] = await q(`insert into events (event_type, slug, title, starts_at) values ('birthday','second-try','Second try', '2027-05-01 14:00+00') returning id`);
[cl] = await q(`select claim_offer($1, 'LAUNCH50') as r`, [ab.id]);
ok("one place per family", cl.r.reason === "already_claimed");
[cl] = await q(`select claim_offer($1, 'LAUNCH50') as r`, [ch.id]);
ok("not for community events", cl.r.reason === "not_for_this_event");
await db.exec(`reset role; insert into offers (code, label, plan, max_claims) values ('LASTONE', 'Test: one place', 'season', 1)`);
await as(B);
const [bEv] = await q(`insert into events (event_type, slug, title, starts_at) values ('pasni','baby-b','Baby B', '2027-07-01 11:00+00') returning id`);
[cl] = await q(`select claim_offer($1, 'LASTONE') as r`, [bEv.id]);
ok("B takes the last place", cl.r.ok === true && cl.r.places_left === 0, JSON.stringify(cl.r));
await as(C);
const [cEv] = await q(`insert into events (event_type, slug, title, starts_at) values ('party','c-party','C party', '2027-08-01 19:00+00') returning id`);
[cl] = await q(`select claim_offer($1, 'LASTONE') as r`, [cEv.id]);
ok("the next family is told all places are taken", cl.r.ok === false && cl.r.reason === "all_taken");
ok("…and stays on the normal plan", (await q(`select plan from events where id = $1`, [cEv.id]))[0].plan === "popup");

console.log("Plans, repeats and sensitive occasions (13 Nov 2026, v3.1):");
await as(null);
const limits = Object.fromEntries((await q(`select key, guest_limit from plans`)).map((r) => [r.key, r.guest_limit]));
ok("people included: Pop-Up 200, Season 300, Half-Year 400, Keepsake 500", limits.popup === 200 && limits.season === 300 && limits.half_year === 400 && limits.keepsake === 500, JSON.stringify(limits));
const types = Object.fromEntries((await q(`select key, scale, repeats_yearly, repeat_as, sensitive from event_types`)).map((r) => [r.key, r]));
ok("a wedding comes back as its anniversary", types.wedding.repeats_yearly && types.wedding.repeat_as === "anniversary");
ok("birthdays, tournaments and reunions repeat yearly; Pasni doesn't", types.birthday.repeats_yearly && types.sport.repeats_yearly && types.reunion.repeats_yearly && !types.pasni.repeats_yearly);
ok("a memorial is sensitive and never prompted to repeat", types.memorial.sensitive && !types.memorial.repeats_yearly && types.memorial.scale === "celebration");
ok("only the memorial is marked sensitive", Object.values(types).filter((t) => t.sensitive).length === 1);
await db.exec(`reset role`);
await expectError("an event type can't take a website address (contact)", `insert into event_types (key, label, scale) values ('contact', 'x', 'personal')`, /check constraint/);

console.log("Fee level: full, half or free, set only by the owner of In2Min2:");
await as(A);
const [fe] = await q(`select charge_percent, series_id, is_demo, keep_for_next_year from events where id = $1`, [ch.id]);
ok("a new event pays 100%, has its own series, isn't a demo", fe.charge_percent === 100 && /^[0-9a-f-]{36}$/.test(fe.series_id) && fe.is_demo === false && fe.keep_for_next_year === false);
ok("every event starts its own series", (await q(`select count(distinct series_id)::int d, count(*)::int n from events`))[0].d === (await q(`select count(*)::int n from events`))[0].n);
await expectError("host cannot make their own event free", `update events set charge_percent = 0 where id = '${ch.id}'`, /permission denied/);
await expectError("host cannot create an event at half price", `insert into events (event_type, slug, title, starts_at, charge_percent) values ('party','cheap','x', now(), 50)`, /permission denied/);
await expectError("host cannot join another series", `update events set series_id = gen_random_uuid() where id = '${ch.id}'`, /permission denied/);
await expectError("host cannot mark an event as demo", `update events set is_demo = true where id = '${ch.id}'`, /permission denied/);
await db.exec(`reset role; update events set charge_percent = 50, charge_note = 'Registered charity, checked on the register' where id = '${ch.id}'`);
ok("the owner of In2Min2 sets half price (server)", (await q(`select charge_percent from events where id = $1`, [ch.id]))[0].charge_percent === 50);
await expectError("only 0, 50 or 100 percent", `update events set charge_percent = 30 where id = '${ch.id}'`, /check constraint/);

console.log("Community events say who runs them:");
await as(A);
await expectError("a community event can't be published without its organiser", `update events set status = 'published' where id = '${ch.id}'`, /community_organiser_named/);
await expectError("a badly written charity number is rejected", `update events set charity_number = 'no. 123' where id = '${ch.id}'`, /check constraint/);
await expectError("an unknown organiser type is rejected", `update events set organiser_type = 'secret' where id = '${ch.id}'`, /check constraint/);
await q(`update events set organiser_name = 'Andover Gurkha Welfare Group', organiser_type = 'charity', for_profit = false,
  charity_number = '1234567', organiser_contact = '07700 900456', keep_for_next_year = true, status = 'published' where id = $1`, [ch.id]);
ok("with name, type and profit answered it publishes", (await q(`select status from events where id = $1`, [ch.id]))[0].status === "published");
ok("the host can keep the guest list for next year", (await q(`select keep_for_next_year k from events where id = $1`, [ch.id]))[0].k === true);
await as(null);
[pe] = await q(`select public_event('charity','walk-2027') as p`);
ok("the public sees who organises it and that nobody profits", pe.p.event.organiser_name === "Andover Gurkha Welfare Group"
  && pe.p.event.organiser_type === "charity" && pe.p.event.for_profit === false && pe.p.event.charity_number === "1234567");
ok("the public never sees the fee level or its note", !("charge_percent" in pe.p.event) && !JSON.stringify(pe.p).includes("checked on the register"));
ok("not a demo", pe.p.event.is_demo === false);
await db.exec(`reset role; update events set is_demo = true where id = '${ch.id}'`);
await as(null);
[pe] = await q(`select public_event('charity','walk-2027') as p`);
ok("a demo event tells the page to show its Demo label", pe.p.event.is_demo === true);
ok("a family event needs no organiser to publish (wedding above)", true);

console.log("Delete everything:");
await as(C);  // C is a helper on A's wedding
const hd = await db.query(`delete from events where id = $1`, [ev.id]);
ok("a helper cannot delete the event", hd.affectedRows === 0);
await as(A);
await q(`delete from events where id = $1`, [ru.id]);
await db.exec(`reset role`);
const left = (await q(`select (select count(*) from guest_crm where event_id = $1) + (select count(*) from feature_toggles where event_id = $1)
  + (select count(*) from event_hosts where event_id = $1) as n`, [ru.id]))[0].n;
ok("one delete removes the guest list, switches and hosts", Number(left) === 0);
ok("the offer place stays used", (await q(`select count(*)::int n from offer_claims where owner_id = $1 and event_id is null`, [A]))[0].n === 1);
await as(A);
[cl] = await q(`select claim_offer($1, 'LAUNCH50') as r`, [ab.id]);
ok("…so deleting and starting again can't claim twice", cl.r.reason === "already_claimed");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
