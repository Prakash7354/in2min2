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
  -- Since 30 Oct 2026 Supabase gives the API roles NO automatic rights on new
  -- tables (changelog 45329), so neither does this stand-in: every right a
  -- role needs must be granted in a migration. Functions are also locked by
  -- default here, stricter than plain Postgres, so each grant is deliberate.
  alter default privileges in schema public revoke execute on functions from public;
  insert into auth.users values ('aaaaaaaa-0000-0000-0000-000000000001'), ('bbbbbbbb-0000-0000-0000-000000000002'), ('cccccccc-0000-0000-0000-000000000003');
  -- Supabase Storage's two tables, as far as our policies need them (0005).
  -- On Supabase, RLS is already on for storage.objects and the API roles have
  -- table rights; the policies decide.
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean not null default false,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
    name text not null, owner_id text default auth.uid()::text, created_at timestamptz not null default now(), unique (bucket_id, name));
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated, service_role;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
  grant select on storage.buckets to anon, authenticated;
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
await q(`update events set photo_style = 'heart' where id = $1`, [ev.id]);
ok("host picks the heart photo shape (0010)", (await q(`select photo_style from events where id = $1`, [ev.id]))[0].photo_style === "heart");
await expectError("an unknown photo shape is rejected", `update events set photo_style = 'star' where id = '${ev.id}'`, /check constraint/);
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
await q(`update events set organiser_name = 'Riverside Community Association', organiser_type = 'charity', for_profit = false,
  charity_number = '1234567', organiser_contact = '07700 900456', keep_for_next_year = true, status = 'published' where id = $1`, [ch.id]);
ok("with name, type and profit answered it publishes", (await q(`select status from events where id = $1`, [ch.id]))[0].status === "published");
ok("the host can keep the guest list for next year", (await q(`select keep_for_next_year k from events where id = $1`, [ch.id]))[0].k === true);
await as(null);
[pe] = await q(`select public_event('charity','walk-2027') as p`);
ok("the public sees who organises it and that nobody profits", pe.p.event.organiser_name === "Riverside Community Association"
  && pe.p.event.organiser_type === "charity" && pe.p.event.for_profit === false && pe.p.event.charity_number === "1234567");
ok("the public never sees the fee level or its note", !("charge_percent" in pe.p.event) && !JSON.stringify(pe.p).includes("checked on the register"));
ok("not a demo", pe.p.event.is_demo === false);
await db.exec(`reset role; update events set is_demo = true where id = '${ch.id}'`);
await as(null);
[pe] = await q(`select public_event('charity','walk-2027') as p`);
ok("a demo event tells the page to show its Demo label", pe.p.event.is_demo === true);
ok("a family event needs no organiser to publish (wedding above)", true);

console.log("Rights on a strict Supabase (0002) and the AI writes cap:");
await as(null);
ok("the public can read plans and event types (pricing page)", (await q(`select key from plans`)).length === 5 && (await q(`select key from event_types`)).length === 18);
await expectError("the public cannot read the AI usage table", `select * from ai_usage`, /permission denied/);
ok("the public gets no AI writes", (await q(`select take_ai_write() as ok`).catch(() => [{ ok: "refused" }]))[0].ok !== true);
await as(B);
ok("a host can list their own events", Array.isArray(await q(`select id from events`)));
let allowed = 0;
for (let i = 0; i < 22; i++) if ((await q(`select take_ai_write() as ok`))[0].ok === true) allowed++;
ok("a signed-in host gets 20 AI writes a day, then no more", allowed === 20, String(allowed));
await expectError("a host cannot reset their own AI count", `delete from ai_usage`, /permission denied/);
await as(C);
ok("another host still has their own 20", (await q(`select take_ai_write() as ok`))[0].ok === true);

console.log("Running order, food menu and photo fit (0003):");
await as(A);
const [ro] = await q(`insert into events (event_type, slug, title, starts_at, status, cover_fit)
  values ('reunion','rgr-2027','1 RGR Reunion 2027', '2027-07-01 11:30+00', 'published', 'whole') returning id`);
ok("a host can choose 'show the whole picture'", (await q(`select cover_fit from events where id = $1`, [ro.id]))[0].cover_fit === "whole");
await expectError("an unknown photo fit is rejected", `update events set cover_fit = 'stretch' where id = '${ro.id}'`, /check constraint/);
ok("the menu switch starts on", (await q(`select menu from feature_toggles where event_id = $1`, [ro.id]))[0].menu === true);
await q(`insert into sub_events (event_id, title, kind, starts_at, description, details) values
  ($1, 'Guests arrive', 'other', '2027-07-01 11:30+00', 'Tea and coffee in the foyer', '{}'),
  ($1, 'Lunch', 'meal', '2027-07-01 12:30+00', 'Vegetarian dishes marked (V)',
   '{"menu": [{"course": "Starter", "dish": "Chicken momo"}, {"course": "Main", "dish": "Dal bhat with goat curry"}]}')`, [ro.id]);
ok("a host adds a meal with its menu", (await q(`select count(*)::int n from sub_events where event_id = $1`, [ro.id]))[0].n === 2);
await expectError("a dish over 160 characters is rejected", `insert into sub_events (event_id, title, kind, starts_at, details)
  values ('${ro.id}', 'Dinner', 'meal', '2027-07-01 18:00+00', '{"menu": [{"course": "Main", "dish": "${"x".repeat(161)}"}]}')`, /check constraint/);
await expectError("an empty dish is rejected", `insert into sub_events (event_id, title, kind, starts_at, details)
  values ('${ro.id}', 'Dinner', 'meal', '2027-07-01 18:00+00', '{"menu": [{"course": "Main", "dish": ""}]}')`, /check constraint/);
await expectError("more than 20 dishes is rejected", `insert into sub_events (event_id, title, kind, starts_at, details)
  values ('${ro.id}', 'Dinner', 'meal', '2027-07-01 18:00+00', '{"menu": [${Array.from({ length: 21 }, (_, i) => `{"dish": "Dish ${i}"}`).join(",")}]}')`, /check constraint/);
await as(B);
await expectError("another host cannot add to A's running order", `insert into sub_events (event_id, title, starts_at) values ('${ro.id}', 'Intruder', now())`, /row-level security/);
ok("another host cannot see A's running order", (await q(`select id from sub_events where event_id = $1`, [ro.id])).length === 0);
await as(null);
[pe] = await q(`select public_event('reunion','rgr-2027') as p`);
ok("the public page carries the running order in time order", pe.p.sub_events.map((x) => x.title).join() === "Guests arrive,Lunch");
ok("…with each item's note", pe.p.sub_events[0].description === "Tea and coffee in the foyer");
ok("…and the lunch menu", pe.p.sub_events[1].menu?.length === 2 && pe.p.sub_events[1].menu[0].dish === "Chicken momo");
ok("…and how the photo fits", pe.p.event.cover_fit === "whole");
await as(A);
await q(`update feature_toggles set menu = false where event_id = $1`, [ro.id]);
await as(null);
[pe] = await q(`select public_event('reunion','rgr-2027') as p`);
ok("menu switched off: the meal stays, its menu is not sent", pe.p.sub_events.length === 2 && pe.p.sub_events[1].menu === null);
await as(A);
await q(`update feature_toggles set schedule = false where event_id = $1`, [ro.id]);
await as(null);
[pe] = await q(`select public_event('reunion','rgr-2027') as p`);
ok("running order switched off: nothing of it is sent", pe.p.sub_events.length === 0);
await as(C);
const hro = await db.query(`update feature_toggles set schedule = true where event_id = $1`, [ro.id]);
ok("a helper of another event cannot switch it back", hro.affectedRows === 0);
await as(A);
await q(`delete from events where id = $1`, [ro.id]);

console.log("Replies (0004):");
await as(A);
const [rv] = await q(`insert into events (event_type, slug, title, starts_at, status, venue_capacity)
  values ('birthday','asha-rsvp','Asha is 10', '2027-06-01 14:00+00', 'published', 10) returning id`);
const reply = async (body, token = null, slug = "asha-rsvp", type = "birthday") =>
  (await q(`select submit_rsvp($1, $2, $3, $4) as r`, [type, slug, token, JSON.stringify(body)]))[0].r;
await as(null);
let r1 = await reply({ name: "Sita Rai", status: "attending", party_size: 4, note: "Can't wait!" });
ok("a guest replies yes for 4 from the public page", r1.ok === true && r1.status === "attending" && r1.party_size === 4, JSON.stringify(r1));
ok("…and gets a private token to change it later", /^[0-9a-f]{32}$/.test(r1.token));
await expectError("the public still can't add to the guest list directly", `insert into guest_crm (event_id, full_name) values ('${rv.id}', 'Spam')`, /permission denied/);
await expectError("the public can't read the guest list", `select full_name from guest_crm`, /permission denied/);
let r1b = await reply({ name: "Sita Rai", status: "maybe", party_size: 2 }, r1.token);
ok("the same token changes the reply instead of adding another", r1b.ok && r1b.status === "maybe" && r1b.party_size === 2);
await as(A);
ok("…so the host still sees one reply", (await q(`select count(*)::int n from guest_crm where event_id = $1`, [rv.id]))[0].n === 1);
await as(null);
ok("a blank name is refused", (await reply({ name: "  ", status: "attending" })).reason === "name");
ok("more than 20 people in one reply is refused", (await reply({ name: "Big family", status: "attending", party_size: 21 })).reason === "party_size");
ok("a note over 280 characters is refused", (await reply({ name: "Long", status: "attending", note: "x".repeat(281) })).reason === "note");
ok("an unknown answer is refused", (await reply({ name: "Odd", status: "invited" })).reason === "bad_reply");
await reply({ name: "Sita Rai", status: "attending", party_size: 4 }, r1.token);
const r2 = await reply({ name: "Hari Gurung", status: "attending", party_size: 6 });
ok("replies fill the venue's safe capacity (10)", r2.status === "attending");
const r3 = await reply({ name: "Gita Thapa", status: "attending", party_size: 2 });
ok("past the venue's capacity a reply joins the waiting list", r3.ok && r3.status === "waitlist", JSON.stringify(r3));
const r1c = await reply({ name: "Sita Rai", status: "declined", party_size: 4 }, r1.token);
ok("a guest who can no longer come can say so", r1c.status === "declined");
await as(A);
const who = async (name) => (await q(`select rsvp_status from guest_crm where event_id = $1 and full_name = $2`, [rv.id, name]))[0]?.rsvp_status;
ok("…and the waiting list moves up by itself", (await who("Gita Thapa")) === "attending");
await as(null);
ok("someone already coming can't take more places than are left", (await reply({ name: "Hari Gurung", status: "attending", party_size: 9 }, r2.token)).reason === "no_more_room");
const r2b = await reply({ name: "Hari Gurung", status: "attending", party_size: 6, note: "Bringing sel roti" }, r2.token);
ok("…but keeps the places they had", r2b.ok && r2b.status === "attending");
const twin = await reply({ name: "Hari Gurung", status: "declined" });
ok("a different guest with the same name gets their own reply", twin.ok && twin.token !== r2.token);
await as(A);
let seen = await q(`select full_name, party_size, rsvp_status, rsvp_note from guest_crm where event_id = $1 order by created_at`, [rv.id]);
ok("the host sees every reply with its note", seen.length === 4 && seen[1].rsvp_note === "Bringing sel roti", JSON.stringify(seen));
await as(B);
ok("another host sees none of them", (await q(`select id from guest_crm where event_id = $1`, [rv.id])).length === 0);
await as(A);
await q(`delete from guest_crm where event_id = $1 and full_name = 'Hari Gurung' and rsvp_status = 'declined'`, [rv.id]);
ok("the host can remove a reply", (await q(`select count(*)::int n from guest_crm where event_id = $1`, [rv.id]))[0].n === 3);

await q(`update events set is_private = true where id = $1`, [rv.id]);
await as(null);
ok("a private event takes no reply without a guest's own link", (await reply({ name: "Stranger", status: "attending" })).reason === "private");
ok("…but takes one with it", (await reply({ name: "Hari Gurung", status: "attending", party_size: 6 }, r2.token)).ok === true);
await as(A);
await q(`update events set is_private = false where id = $1`, [rv.id]);
await q(`update feature_toggles set rsvp = false where event_id = $1`, [rv.id]);
await as(null);
ok("replies switched off: none taken", (await reply({ name: "Late", status: "attending" })).reason === "closed");
await as(A);
await q(`update feature_toggles set rsvp = true where event_id = $1`, [rv.id]);
await q(`insert into events (event_type, slug, title, starts_at, status) values ('birthday','was-2020','Long ago', '2020-01-01 14:00+00', 'published')`);
await q(`insert into events (event_type, slug, title, starts_at) values ('birthday','not-yet','Draft', '2027-06-01 14:00+00')`);
await as(null);
ok("after the day, replies are closed", (await reply({ name: "Late", status: "attending" }, null, "was-2020")).reason === "closed");
ok("a draft can't be replied to", (await reply({ name: "Early", status: "attending" }, null, "not-yet")).reason === "no_event");

await as(A);
await q(`update events set venue_capacity = null where id = $1`, [rv.id]);
await q(`insert into guest_crm (event_id, full_name, party_size, rsvp_status) values ($1, 'Whole class', 200, 'invited')`, [rv.id]);
await as(null);
// 200 invited + Hari 6 + Gita 2 = 208 of 200 so far; 10% grace allows 220.
ok("the plan's limit has 10% grace", (await reply({ name: "Grace", status: "maybe", party_size: 12 })).ok === true);
ok("…then replies pause kindly", (await reply({ name: "One more", status: "attending", party_size: 1 })).reason === "full");
ok("…though anyone can still say they can't come", (await reply({ name: "Sorry", status: "declined" })).ok === true);
await db.exec(`reset role; insert into guest_crm (event_id, full_name, source) select '${rv.id}', 'Bot ' || i, 'rsvp_form' from generate_series(1, 60) i`);
await as(null);
ok("more than 60 new replies in 10 minutes: the next waits", (await reply({ name: "Flood", status: "declined" })).reason === "busy");
await db.exec(`reset role; delete from guest_crm where full_name like 'Bot %'`);

console.log("Festive designs, effects and the preview picture (0004):");
await as(null);
const fest = await q(`select key, scale from event_types where key in ('christmas', 'new-year', 'lhosar') order by sort_order`);
ok("Christmas party, New Year's Eve and Lhosar are event types", fest.map((t) => `${t.key}:${t.scale}`).join() === "christmas:personal,new-year:personal,lhosar:community", JSON.stringify(fest));
[pe] = await q(`select public_event('birthday','asha-rsvp') as p`);
ok("a page starts with no moving effect", pe.p.event.effect === "none" && pe.p.event.share_image_key === null);
await as(A);
await q(`update events set effect = 'snow', share_image_key = $2, cover_image_key = $3 where id = $1`,
  [rv.id, `${rv.id}/share-abc123.png`, `${rv.id}/cover-def456.jpg`]);
await expectError("an unknown effect is rejected", `update events set effect = 'lasers' where id = '${rv.id}'`, /check constraint/);
await expectError("a preview picture from another event's folder is rejected", `update events set share_image_key = '${ev.id}/share-abc123.png' where id = '${rv.id}'`, /check constraint/);
await expectError("a photo name that isn't a picture is rejected", `update events set cover_image_key = '${rv.id}/cover-abc123.html' where id = '${rv.id}'`, /check constraint/);
await as(null);
[pe] = await q(`select public_event('birthday','asha-rsvp') as p`);
ok("the public page gets the effect, photo and preview picture", pe.p.event.effect === "snow" && pe.p.event.share_image_key.endsWith("/share-abc123.png") && pe.p.event.cover_image_key.endsWith("/cover-def456.jpg"));

console.log("Event photos (0005):");
await as(null);
const [bk] = await q(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'event-media'`);
ok("a public bucket for event pictures, up to 3 MB, pictures only", bk?.public === true && Number(bk.file_size_limit) === 3145728 && bk.allowed_mime_types.join() === "image/jpeg,image/png,image/webp");
await expectError("the public can't add a file", `insert into storage.objects (bucket_id, name) values ('event-media', '${rv.id}/cover-abc123.jpg')`, /row-level security/);
await as(A);
await q(`insert into storage.objects (bucket_id, name) values ('event-media', $1)`, [`${rv.id}/cover-abc123.jpg`]);
ok("the owner adds a photo in their event's folder", (await q(`select count(*)::int n from storage.objects where name = $1`, [`${rv.id}/cover-abc123.jpg`]))[0].n === 1);
await expectError("…but not a web page", `insert into storage.objects (bucket_id, name) values ('event-media', '${rv.id}/cover-abc123.html')`, /row-level security/);
await expectError("…or a file outside an event folder", `insert into storage.objects (bucket_id, name) values ('event-media', 'cover-abc123.jpg')`, /row-level security/);
await as(B);
await expectError("another host can't add to A's event", `insert into storage.objects (bucket_id, name) values ('event-media', '${rv.id}/share-abc123.png')`, /row-level security/);
ok("…or list its files", (await q(`select name from storage.objects where bucket_id = 'event-media'`)).length === 0);
const bdel = await db.query(`delete from storage.objects where name = $1`, [`${rv.id}/cover-abc123.jpg`]);
ok("…or delete them", bdel.affectedRows === 0);
await as(C);  // a helper on A's wedding
await expectError("a helper can't change an event's pictures", `insert into storage.objects (bucket_id, name) values ('event-media', '${ev.id}/cover-abc123.jpg')`, /row-level security/);
await as(A);
const adel = await db.query(`delete from storage.objects where name = $1`, [`${rv.id}/cover-abc123.jpg`]);
ok("the owner can remove their photo", adel.affectedRows === 1);
await q(`delete from events where slug in ('asha-rsvp', 'was-2020', 'not-yet')`);

console.log("Photo wall (0006):");
await as(A);
const [pw] = await q(`insert into events (event_type, slug, title, starts_at, status) values ('birthday','photo-party','Photo party', '2027-06-01 14:00+00', 'published') returning id, wall_key`);
ok("each event gets its own photo key for table cards and the TV", /^[0-9a-f]{24}$/.test(pw.wall_key));
const DEV1 = "phoneone0000000000000001", DEV2 = "phonetwo0000000000000002";
const addPhoto = async (dev = DEV1, slug = "photo-party", token = null, type = "birthday", name = "Sita") =>
  (await q(`select add_photo($1, $2, $3, $4, $5, 1600, 1200, 350000) as r`, [type, slug, token, dev, name]))[0].r;
const stored = async (id, secret) => (await q(`select photo_stored($1, $2) as r`, [id, secret]))[0].r;
const wall = async (slug = "photo-party", token = null, dev = DEV1, type = "birthday") =>
  (await q(`select public_photos($1, $2, $3, $4) as r`, [type, slug, token, dev]))[0].r;
await as(null);
let w = await wall();
ok("before the day the wall is on but not open yet", w.rules.on === true && w.rules.open === false && w.photos.length === 0, JSON.stringify(w.rules));
ok("a family event shows photos without waiting for the host (default)", w.rules.approve_first === false);
ok("…so a photo can't be added before the day", (await addPhoto()).reason === "closed");
await as(A);
await q(`update feature_toggles set settings = jsonb_set(settings, '{photo_wall}', '{"early": true}') where event_id = $1`, [pw.id]);
await as(null);
let a1 = await addPhoto();
ok("the host lets guests add photos early: a photo is reserved", a1.ok === true && /^[0-9a-f]{32}$/.test(a1.secret) && a1.event_id === pw.id, JSON.stringify(a1));
await expectError("the public can't read the photos table", `select * from event_photos`, /permission denied/);
await expectError("…or add to it directly", `insert into event_photos (event_id, width, height, bytes, device) values ('${pw.id}', 100, 100, 100, '${DEV1}')`, /permission denied/);
ok("a reserved photo isn't on the wall until its files are stored", (await wall()).photos.length === 0);
ok("the wrong secret can't finish it", (await stored(a1.id, "0".repeat(32))).reason === "no_upload");
let s1 = await stored(a1.id, a1.secret);
ok("the right secret shows it", s1.ok === true && s1.status === "shown");
ok("…once only", (await stored(a1.id, a1.secret)).reason === "no_upload");
w = await wall();
ok("the wall lists it with its size and the guest's name", w.photos.length === 1 && w.photos[0].id === a1.id && w.photos[0].w === 1600 && w.photos[0].by === "Sita");
ok("…and tells this phone how many it has added", w.mine.added === 1 && w.mine.waiting === 0 && w.per_guest === 10);
ok("the wall never gives out the event's photo key", !JSON.stringify(w).includes(pw.wall_key));
ok("a bad phone id is refused", (await addPhoto("NOT valid!")).reason === "bad_photo");
ok("a photo too big is refused", (await q(`select add_photo('birthday','photo-party',null,$1,null,9000,1200,350000) as r`, [DEV1]))[0].r.reason === "bad_photo");
for (let i = 0; i < 9; i++) { const a = await addPhoto(); await stored(a.id, a.secret); }
const share = await addPhoto();
ok("one phone can add its share (10 on Pop-Up), then no more", share.reason === "your_share" && share.per_guest === 10, JSON.stringify(share));
ok("…while another phone still can", (await addPhoto(DEV2)).ok === true);
await db.exec(`reset role; update event_photos set created_at = now() - interval '2 hours' where status = 'uploading'`);
ok("a reservation never finished stops counting after an hour", (await wall("photo-party", null, DEV2)).mine.added === 0);
await db.exec(`reset role; insert into event_photos (event_id, status, width, height, bytes, device, ready_at)
  select '${pw.id}', 'shown', 100, 100, 100, 'filler' || lpad(i::text, 18, '0'), now() from generate_series(1, 40) i`);
await as(null);
ok("the plan's photos (50 on Pop-Up) fill up, then it says full", (await addPhoto(DEV2)).reason === "full");
await db.exec(`reset role; delete from event_photos where device like 'filler%'`);
await db.exec(`reset role; insert into event_photos (event_id, status, width, height, bytes, device)
  select '${pw.id}', 'uploading', 100, 100, 100, 'flood' || lpad(i::text, 19, '0') from generate_series(1, 300) i`);
await as(null);
ok("more than 300 photos in 10 minutes: the next waits", (await addPhoto(DEV2)).reason === "busy");
await db.exec(`reset role; delete from event_photos where device like 'flood%'`);

await as(B);
ok("another host sees none of A's photos", (await q(`select id from event_photos where event_id = $1`, [pw.id])).length === 0);
const bh = await db.query(`update event_photos set status = 'hidden' where event_id = $1`, [pw.id]);
ok("…and can't hide them", bh.affectedRows === 0);
ok("…or remove them", (await q(`select remove_photos(array[$1]::uuid[]) as r`, [a1.id]))[0].r.length === 0);
await as(A);
await q(`insert into event_hosts (event_id, user_id, role) values ($1, $2, 'helper')`, [pw.id, C]);
await as(C);
const chp = await db.query(`update event_photos set status = 'hidden' where id = $1`, [a1.id]);
ok("a helper can hide a photo", chp.affectedRows === 1);
ok("…which comes off the wall", (await (async () => { await as(null); return (await wall()).photos.length; })()) === 9);
await as(C);
ok("a helper can't remove a photo for good", (await q(`select remove_photos(array[$1]::uuid[]) as r`, [a1.id]))[0].r.length === 0);
await expectError("a host can't change a photo's size or phone", `update event_photos set width = 20 where id = '${a1.id}'`, /permission denied/);
await expectError("…or put it back to uploading", `update event_photos set status = 'uploading' where id = '${a1.id}'`, /row-level security/);
await as(A);
await q(`update event_photos set status = 'shown' where id = $1`, [a1.id]);
const [rv1] = await q(`select reviewed_at from event_photos where id = $1`, [a1.id]);
ok("the owner shows it again; the change is noted", !!rv1.reviewed_at);

await as(null);
const rq = (await q(`select ask_photo_removal('birthday','photo-party',null,$1,'That is me, please remove') as r`, [a1.id]))[0].r;
ok("a guest asks for a photo to be removed: it comes down at once", rq.ok === true && rq.hidden === true && !(await wall()).photos.some((x) => x.id === a1.id));
await as(A);
const [asked] = await q(`select status, removal_note from event_photos where id = $1`, [a1.id]);
ok("…and the host sees why", asked.status === "hidden" && asked.removal_note === "That is me, please remove");
await q(`update event_photos set status = 'shown' where id = $1`, [a1.id]);
await as(null);
const rq2 = (await q(`select ask_photo_removal('birthday','photo-party',null,$1,null) as r`, [a1.id]))[0].r;
ok("if the host decides to keep it, a later request doesn't hide it again", rq2.ok === true && rq2.hidden === false);

await as(A);
const gone = (await q(`select remove_photos(array[$1]::uuid[]) as r`, [a1.id]))[0].r;
ok("the owner removes a photo for good; the app is told which files to delete", gone.length === 1 && gone[0].id === a1.id && gone[0].event_id === pw.id);
ok("…and the row is gone", (await q(`select id from event_photos where id = $1`, [a1.id])).length === 0);

const [lw] = await q(`insert into events (event_type, slug, title, starts_at, status, organiser_name, organiser_type, for_profit)
  values ('lhosar','photo-lhosar','Lhosar', now() - interval '1 hour', 'published', 'Riverside Community Association', 'community_group', false) returning id`);
await as(null);
w = await wall("photo-lhosar", null, DEV1, "lhosar");
ok("on the day the wall is open by itself", w.stage === "live" && w.rules.open === true);
ok("community events wait for the host's OK by default", w.rules.approve_first === true);
const a2 = await addPhoto(DEV1, "photo-lhosar", null, "lhosar");
const s2 = await stored(a2.id, a2.secret);
ok("…so a new photo waits", s2.status === "waiting" && (await wall("photo-lhosar", null, DEV1, "lhosar")).photos.length === 0);
ok("…and the guest's phone knows it is waiting", (await wall("photo-lhosar", null, DEV1, "lhosar")).mine.waiting === 1);
await as(A);
await q(`update event_photos set status = 'shown' where id = $1`, [a2.id]);
await as(null);
ok("the host approves it and it shows", (await wall("photo-lhosar", null, DEV1, "lhosar")).photos.length === 1);
await as(A);
await q(`update feature_toggles set photo_wall = false where event_id = $1`, [lw.id]);
await as(null);
ok("the wall switched off: no photos added", (await addPhoto(DEV1, "photo-lhosar", null, "lhosar")).reason === "off");
ok("…or shown", (await wall("photo-lhosar", null, DEV1, "lhosar")).photos.length === 0);

await as(A);
await q(`update events set is_private = true where id = $1`, [pw.id]);
const [pgu] = await q(`insert into guest_crm (event_id, full_name) values ($1, 'Invited Aunt') returning invite_token`, [pw.id]);
await as(null);
ok("a private event's photos are closed to strangers", (await wall()).private === true && (await addPhoto(DEV2)).reason === "private");
ok("…open to a guest's own link", (await addPhoto(DEV2, "photo-party", pgu.invite_token)).ok === true);
const wk = await wall("photo-party", pw.wall_key);
ok("…and to the table card's photo key, for the photos only", wk.event?.title === "Photo party" && !("venue_name" in wk.event));
ok("…but the photo key doesn't open the private page itself", (await q(`select public_event('birthday','photo-party',$1) as p`, [pw.wall_key]))[0].p.private === true);
ok("a wrong key opens nothing", (await wall("photo-party", "f".repeat(24))).private === true);
await expectError("a host can't change the photo key", `update events set wall_key = 'abc' where id = '${pw.id}'`, /permission denied/);

await as(A);
await q(`delete from events where id in ($1, $2)`, [pw.id, lw.id]);
await db.exec(`reset role`);
ok("deleting an event deletes its photos' rows too", (await q(`select count(*)::int n from event_photos where event_id in ($1, $2)`, [pw.id, lw.id]))[0].n === 0);

console.log("Showcase photos and the hosts' own photos (0007):");
await as(A);
const [sh] = await q(`insert into events (event_type, slug, title, starts_at, status, organiser_name, organiser_type, for_profit)
  values ('lhosar','show-lhosar','Lhosar showcase', '2027-02-18 11:00+00', 'published', 'Riverside Community Association', 'community_group', false) returning id`);
await q(`update events set hero_keys = $2, hero_motion = 'zoomout' where id = $1`, [sh.id, `{${sh.id}/cover-abc123def.jpg,${sh.id}/cover-xyz789abc.jpg}`]);
let [hk] = await q(`select hero_keys, hero_motion from events where id = $1`, [sh.id]);
ok("a host adds two more showcase photos and chooses how they move", hk.hero_keys.length === 2 && hk.hero_motion === "zoomout");
await expectError("more than four extra photos is refused", `update events set hero_keys = '{${[1, 2, 3, 4, 5].map((i) => `${sh.id}/cover-abcdef${i}`).map((k) => k + ".jpg").join(",")}}' where id = '${sh.id}'`, /check constraint/);
await expectError("a showcase photo from another event's folder is refused", `update events set hero_keys = '{${ev.id}/cover-abc123def.jpg}' where id = '${sh.id}'`, /check constraint/);
await expectError("a file that isn't a picture is refused", `update events set hero_keys = '{${sh.id}/cover-abc123def.html}' where id = '${sh.id}'`, /check constraint/);
await expectError("an unknown movement is refused", `update events set hero_motion = 'spin' where id = '${sh.id}'`, /check constraint/);
await as(null);
[pe] = await q(`select public_event('lhosar','show-lhosar') as p`);
ok("the public page gets the showcase photos and their movement", pe.p.event.hero_keys.length === 2 && pe.p.event.hero_motion === "zoomout");
await expectError("the public can't add a host photo", `select add_host_photo('${sh.id}', 'X', 1600, 1200, 300000)`, /permission denied/);

await as(A);
const hp = (await q(`select add_host_photo($1, 'Riverside Committee', 1600, 1200, 300000) as r`, [sh.id]))[0].r;
ok("the owner adds their own photo before the day", hp.ok === true && /^[0-9a-f]{32}$/.test(hp.secret), JSON.stringify(hp));
await as(null);
const hs = (await q(`select photo_stored($1, $2) as r`, [hp.id, hp.secret]))[0].r;
ok("…it goes straight on the wall, though guests' photos here wait for an OK", hs.status === "shown");
await as(B);
ok("another host can't add photos to A's event", (await q(`select add_host_photo($1, null, 1600, 1200, 300000) as r`, [sh.id]))[0].r.reason === "no_event");
await as(A);
await q(`insert into event_hosts (event_id, user_id, role) values ($1, $2, 'helper')`, [sh.id, C]);
await as(C);
ok("a helper can add photos (they're often the photographer)", (await q(`select add_host_photo($1, null, 1600, 1200, 300000) as r`, [sh.id]))[0].r.ok === true);
ok("a host photo that's too big is refused", (await q(`select add_host_photo($1, null, 9000, 1200, 300000) as r`, [sh.id]))[0].r.reason === "bad_photo");
await db.exec(`reset role; insert into event_photos (event_id, status, width, height, bytes, device, ready_at)
  select '${sh.id}', 'shown', 100, 100, 100, 'fill' || lpad(i::text, 20, '0'), now() from generate_series(1, 1998) i;
  update event_photos set created_at = now() - interval '1 day' where device like 'fill%'`);
await as(A);
ok("host photos count towards the plan's photos (2,000 here), then it's full", (await q(`select add_host_photo($1, null, 1600, 1200, 300000) as r`, [sh.id]))[0].r.reason === "full");
await db.exec(`reset role; delete from event_photos where device like 'fill%'`);
await as(A);
await q(`update feature_toggles set photo_wall = false where event_id = $1`, [sh.id]);
ok("with the photo wall switched off, the host is told", (await q(`select add_host_photo($1, null, 1600, 1200, 300000) as r`, [sh.id]))[0].r.reason === "off");
await q(`delete from events where id = $1`, [sh.id]);

console.log("Love taps, favourites and the new movements (0008):");
await as(A);
const [lv] = await q(`insert into events (event_type, slug, title, starts_at, ends_at, status)
  values ('birthday','love-party','Love party', now() - interval '1 hour', now() + interval '4 hours', 'published') returning id, wall_key`);
ok("a new event's photos at the top start with zoom in", (await q(`select hero_motion from events where id = $1`, [lv.id]))[0].hero_motion === "zoomin");
await q(`update events set hero_motion = 'zoomout' where id = $1`, [lv.id]);
await expectError("the old movement names are gone", `update events set hero_motion = 'fade' where id = '${lv.id}'`, /check constraint/);
await as(null);
const LD1 = "loverphone00000000000001", LD2 = "loverphone00000000000002";
const lp = await addPhoto(DEV1, "love-party");
await stored(lp.id, lp.secret);
const lp2 = await addPhoto(DEV1, "love-party");
await stored(lp2.id, lp2.secret);
const love = async (photo, dev, on = true, slug = "love-party", token = null) =>
  (await q(`select love_photo('birthday', $1, $2, $3, $4, $5) as r`, [slug, token, photo, dev, on]))[0].r;
let l1 = await love(lp.id, LD1);
ok("a guest loves a photo", l1.ok === true && l1.loves === 1 && l1.mine === true, JSON.stringify(l1));
ok("…the same phone can't love it twice", (await love(lp.id, LD1)).loves === 1);
ok("…another phone adds to the count", (await love(lp.id, LD2)).loves === 2);
ok("…and a love can be taken back", (await love(lp.id, LD1, false)).loves === 1);
ok("a bad phone id is refused", (await love(lp.id, "NOT ok!")).reason === "bad");
let lwall = (await q(`select public_photos('birthday','love-party',null,$1) as r`, [LD2]))[0].r;
const lpRow = lwall.photos.find((x) => x.id === lp.id);
ok("the wall shows each photo's loves, and which this phone loved", lpRow.loves === 1 && lpRow.mine === true && lwall.photos.find((x) => x.id === lp2.id).mine === false);
ok("the most-loved photos are featured", lwall.featured.length === 1 && lwall.featured[0].id === lp.id);
await expectError("the public can't read who loved what", `select * from photo_loves`, /permission denied/);
await expectError("…or write a love directly", `insert into photo_loves (photo_id, event_id, device) values ('${lp.id}', '${lv.id}', '${LD1}')`, /permission denied/);

await as(A);
ok("the owner sees the loves on their event", (await q(`select device from photo_loves where event_id = $1`, [lv.id])).length === 1);
await q(`update event_photos set favourite = true where id = $1`, [lp2.id]);
await expectError("a host can't change a love count", `update event_photos set love_count = 99 where id = '${lp.id}'`, /permission denied/);
await as(null);
lwall = (await q(`select public_photos('birthday','love-party',null,null) as r`))[0].r;
ok("the host's favourite comes first among the featured", lwall.featured[0].id === lp2.id && lwall.featured[0].fav === true && lwall.featured.length === 2);
await as(B);
ok("another host sees no loves on A's event", (await q(`select device from photo_loves where event_id = $1`, [lv.id])).length === 0);
const bf = await db.query(`update event_photos set favourite = false where id = $1`, [lp2.id]);
ok("…and can't change A's favourites", bf.affectedRows === 0);
await as(A);
await q(`insert into event_hosts (event_id, user_id, role) values ($1, $2, 'helper')`, [lv.id, C]);
await as(C);
ok("a helper sees the loves", (await q(`select device from photo_loves where event_id = $1`, [lv.id])).length === 1);
ok("…and can pick favourites", (await db.query(`update event_photos set favourite = true where id = $1`, [lp.id])).affectedRows === 1);
await as(A);
await q(`update event_photos set status = 'hidden' where id = $1`, [lp.id]);
await as(null);
ok("a hidden photo can't be loved", (await love(lp.id, LD2)).reason === "gone");
await as(A);
await q(`update events set is_private = true where id = $1`, [lv.id]);
await as(null);
ok("a private event's photos can't be loved without a link", (await love(lp2.id, LD1)).reason === "private");
ok("…but can with the photo key", (await love(lp2.id, LD1, true, "love-party", lv.wall_key)).ok === true);
await as(A);
await q(`delete from events where id = $1`, [lv.id]);
await db.exec(`reset role`);
ok("deleting an event deletes its loves", (await q(`select count(*)::int n from photo_loves where event_id = $1`, [lv.id]))[0].n === 0);

console.log("Photographers and the sky behind the wheel (0009):");
await as(A);
const [pgev] = await q(`insert into events (event_type, slug, title, starts_at, ends_at, status, organiser_name, organiser_type, for_profit)
  values ('lhosar','pg-lhosar','Lhosar with a photographer', now() - interval '1 hour', now() + interval '6 hours', 'published', 'Riverside Community Association', 'community_group', false) returning id`);
await as(null);
let pgw = (await q(`select public_photos('lhosar','pg-lhosar') as r`))[0].r;
ok("the sky behind the wheel starts on auto", pgw.rules.sky === "auto");
await as(A);
await q(`update feature_toggles set settings = jsonb_set(settings, '{photo_wall}', '{"sky": "aurora"}') where event_id = $1`, [pgev.id]);
await as(null);
ok("the host can choose northern lights", (await q(`select public_photos('lhosar','pg-lhosar') as r`))[0].r.rules.sky === "aurora");
await as(A);
await q(`update feature_toggles set settings = jsonb_set(settings, '{photo_wall}', '{"sky": "mars"}') where event_id = $1`, [pgev.id]);
await as(null);
ok("an unknown sky falls back to auto", (await q(`select public_photos('lhosar','pg-lhosar') as r`))[0].r.rules.sky === "auto");
await as(A);
await q(`update feature_toggles set settings = jsonb_set(settings, '{photo_wall}', '{"sky": "morning"}') where event_id = $1`, [pgev.id]);
await as(null);
ok("the host can choose the morning sky (0010)", (await q(`select public_photos('lhosar','pg-lhosar') as r`))[0].r.rules.sky === "morning");
await as(A);
await q(`update feature_toggles set settings = settings || '{"credit": {"label": "Presented by", "name": "Riverside Gurung Samaj"}}' where event_id = $1`, [pgev.id]);
await as(null);
const pgpub = (await q(`select public_event('lhosar','pg-lhosar') as r`))[0].r;
ok("the host's credit line reaches the public page", pgpub.features.settings.credit.name === "Riverside Gurung Samaj");
await db.exec(`reset role`);
const pgkey = (await q(`select wall_key from events where id = $1`, [pgev.id]))[0].wall_key;
await as(null);
ok("…and the photo key never does", pgkey.length > 10 && !JSON.stringify(pgpub).includes(pgkey));

await as(A);
const [pg1] = await q(`insert into event_photographers (event_id, name, business, link) values ($1, 'Ram Thapa', 'Ram Studio', 'https://ramstudio.example') returning id, upload_key`, [pgev.id]);
ok("the owner adds a photographer, who gets a private upload key", /^[0-9a-f]{32}$/.test(pg1.upload_key));
await expectError("a host can't choose the upload key", `insert into event_photographers (event_id, name, upload_key) values ('${pgev.id}', 'X', '${"a".repeat(32)}')`, /permission denied/);
await q(`insert into event_photographers (event_id, name) values ($1, 'Two'), ($1, 'Three')`, [pgev.id]);
await expectError("at most three photographers per event", `insert into event_photographers (event_id, name) values ('${pgev.id}', 'Four')`, /row-level security/);
await q(`delete from event_photographers where event_id = $1 and name in ('Two', 'Three')`, [pgev.id]);
await as(null);
await expectError("the public can't read photographers or their keys", `select * from event_photographers`, /permission denied/);
await as(B);
ok("another host sees none of A's photographers", (await q(`select id from event_photographers where event_id = $1`, [pgev.id])).length === 0);
await as(A);
await q(`insert into event_hosts (event_id, user_id, role) values ($1, $2, 'helper')`, [pgev.id, C]);
await as(C);
ok("a helper can see the photographer", (await q(`select id from event_photographers where event_id = $1`, [pgev.id])).length === 1);
await expectError("…but can't add one", `insert into event_photographers (event_id, name) values ('${pgev.id}', 'Helper pick')`, /row-level security/);

await as(null);
const pgWall = (await q(`select photographer_wall($1) as r`, [pg1.upload_key]))[0].r;
ok("the photographer's link opens their upload page", pgWall.photographer.business === "Ram Studio" && pgWall.event.title === "Lhosar with a photographer" && pgWall.active === true);
ok("a wrong key opens nothing", (await q(`select photographer_wall($1) as r`, ["0".repeat(32)]))[0].r === null);
const pa = (await q(`select add_photographer_photo($1, 1600, 1067, 400000) as r`, [pg1.upload_key]))[0].r;
ok("the photographer adds a photo with no account", pa.ok === true, JSON.stringify(pa));
const ps = (await q(`select photo_stored($1, $2) as r`, [pa.id, pa.secret]))[0].r;
ok("…it goes straight on the wall, though guests' photos here wait for an OK", ps.status === "shown");
pgw = (await q(`select public_photos('lhosar','pg-lhosar') as r`))[0].r;
ok("…credited to the studio", pgw.photos[0].pg === "Ram Studio" && pgw.photos[0].by === "Ram Studio");
ok("the gallery lists the photographer for the Book them card", pgw.photographers.length === 1 && pgw.photographers[0].link === "https://ramstudio.example" && pgw.photographers[0].photos === 1);
ok("a bad size is refused", (await q(`select add_photographer_photo($1, 9000, 1067, 400000) as r`, [pg1.upload_key]))[0].r.reason === "bad_photo");
await as(A);
await q(`update event_photographers set active = false where id = $1`, [pg1.id]);
await as(null);
ok("a switched-off link takes no more photos", (await q(`select add_photographer_photo($1, 1600, 1067, 400000) as r`, [pg1.upload_key]))[0].r.reason === "no_link");
ok("…and drops off the Book them card", (await q(`select public_photos('lhosar','pg-lhosar') as r`))[0].r.photographers.length === 0);
await as(A);
await q(`update event_photographers set active = true where id = $1`, [pg1.id]);
await db.exec(`reset role; insert into event_photos (event_id, status, width, height, bytes, device, ready_at, created_at)
  select '${pgev.id}', 'shown', 100, 100, 100, 'pgfill' || lpad(i::text, 18, '0'), now(), now() - interval '1 day' from generate_series(1, 1999) i`);
await as(null);
ok("photographers' photos count towards the event's photo space", (await q(`select add_photographer_photo($1, 1600, 1067, 400000) as r`, [pg1.upload_key]))[0].r.reason === "full");
await db.exec(`reset role; delete from event_photos where device like 'pgfill%'`);
await as(A);
await q(`delete from event_photographers where id = $1`, [pg1.id]);
await as(null);
pgw = (await q(`select public_photos('lhosar','pg-lhosar') as r`))[0].r;
ok("removing a photographer keeps their photos, without the credit", pgw.photos.length === 1 && pgw.photos[0].pg === null);
ok("…and their link stops working", (await q(`select photographer_wall($1) as r`, [pg1.upload_key]))[0].r === null);
await as(A);
await q(`delete from events where id = $1`, [pgev.id]);

console.log("Announcements and live comments (0011):");
const D = "dddddddd-0000-0000-0000-000000000004";
await db.exec(`reset role; insert into auth.users values ('${D}')`);
await as(A);
const [lev] = await q(`insert into events (event_type, slug, title, starts_at, ends_at, status)
  values ('birthday','live-party','Live party', now() - interval '1 hour', now() + interval '5 hours', 'published') returning id`);
await q(`insert into event_hosts (event_id, user_id, role) values ($1, $2, 'co_host'), ($1, $3, 'helper')`, [lev.id, D, C]);
await q(`insert into event_announcements (event_id, kind, body) values ($1, 'urgent', 'Car park full: please use the school car park')`, [lev.id]);
ok("the owner posts an announcement", (await q(`select count(*)::int n from event_announcements where event_id = $1`, [lev.id]))[0].n === 1);
await as(D);
await q(`insert into event_announcements (event_id, body) values ($1, 'We can''t wait to see you!')`, [lev.id]);
ok("a co-host posts one too", (await q(`select count(*)::int n from event_announcements where event_id = $1`, [lev.id]))[0].n === 2);
await as(C);
ok("a helper can read them", (await q(`select id from event_announcements where event_id = $1`, [lev.id])).length === 2);
await expectError("…but can't post one", `insert into event_announcements (event_id, body) values ('${lev.id}', 'Helper news')`, /row-level security/);
ok("…or delete one", (await db.query(`delete from event_announcements where event_id = $1`, [lev.id])).affectedRows === 0);
await as(B);
ok("another host can't read them", (await q(`select id from event_announcements where event_id = $1`, [lev.id])).length === 0);
await expectError("…or post on someone else's event", `insert into event_announcements (event_id, body) values ('${lev.id}', 'Spam')`, /row-level security/);
await as(null);
await expectError("the public can't read the table", `select * from event_announcements`, /permission denied/);
await expectError("…or post", `insert into event_announcements (event_id, body) values ('${lev.id}', 'Spam')`, /permission denied/);
let live = (await q(`select public_live('birthday','live-party') as r`))[0].r;
ok("guests see the announcements, newest first", live.announcements.length === 2 && live.announcements[0].body === "We can't wait to see you!" && live.announcements[1].kind === "urgent");
await as(A);
await expectError("an announcement can't be too long", `insert into event_announcements (event_id, body) values ('${lev.id}', '${"x".repeat(281)}')`, /check constraint/);
for (let i = 0; i < 8; i++) await q(`insert into event_announcements (event_id, body) values ($1, $2)`, [lev.id, `Update ${i}`]);
await expectError("no more than 10 a day", `insert into event_announcements (event_id, body) values ('${lev.id}', 'The eleventh')`, /row-level security/);
await as(D);
ok("a co-host can remove one", (await db.query(`delete from event_announcements where event_id = $1 and body = 'Update 0'`, [lev.id])).affectedRows === 1);

await as(null);
const dev1 = "phoneone0000000000000001", dev2 = "phonetwo0000000000000002";
const cheer = async (dev, name, body, emoji, slug = "live-party", token = null, type = "birthday") =>
  (await q(`select post_cheer($1, $2, $3, $4, $5, $6, $7) as r`, [type, slug, token, dev, name, body, emoji]))[0].r;
let c1 = await cheer(dev1, "Asha", null, "clap");
ok("a guest cheers with an emoji, no account", c1.ok === true && c1.status === "shown", JSON.stringify(c1));
let c2 = await cheer(dev2, "Hari", "Happy birthday Sita!", "love");
ok("…and with words, shown at once on a family party", c2.ok === true && c2.status === "shown");
live = (await q(`select public_live('birthday','live-party') as r`))[0].r;
ok("guests and the TV see the cheers, newest first", live.cheers.length === 2 && live.cheers[0].body === "Happy birthday Sita!" && live.cheers[0].name === "Hari");
ok("…the TV puts them on the right unless the host says otherwise", live.cheer_rules.tv === "right" && live.cheer_rules.open === true);
const after = (await q(`select public_live('birthday','live-party', null, $1) as r`, [live.cheers[0].at]))[0].r;
ok("a poll with a time brings only newer ones", after.cheers.length === 0);
ok("a made-up emoji is refused", (await cheer(dev1, null, null, "skull")).reason === "bad");
ok("…and so is a long comment", (await cheer(dev1, null, "x".repeat(141), null)).reason === "bad");
ok("…and an empty one", (await cheer(dev1, null, "   ", null)).reason === "bad");
ok("…and a bad phone id", (await cheer("NOT A DEVICE", null, "hi", null)).reason === "bad");
await expectError("the public can't read the comments table", `select * from event_cheers`, /permission denied/);
let busy = null;
for (let i = 0; i < 21 && !busy; i++) { const r = await cheer(dev1, null, `Comment ${i}`, null); if (!r.ok) busy = r.reason; }
ok("one phone can't flood the screen", busy === "busy");

await as(A);
await q(`update feature_toggles set settings = settings || '{"cheers": {"approve_first": true, "tv": "bottom"}}' where event_id = $1`, [lev.id]);
await as(null);
const c3 = await cheer(dev2, "Hari", "Waiting for an OK", null);
ok("with checking on, words wait for the host's OK", c3.status === "waiting");
ok("…but an emoji still shows at once", (await cheer(dev2, null, null, "party")).status === "shown");
live = (await q(`select public_live('birthday','live-party') as r`))[0].r;
ok("…waiting ones stay off the screen, and the TV moves them to the bottom", !live.cheers.some((c) => c.body === "Waiting for an OK") && live.cheer_rules.tv === "bottom");
await as(C);
ok("a helper can show a waiting comment", (await db.query(`update event_cheers set status = 'shown' where id = $1`, [c3.id])).affectedRows === 1);
ok("…and hide one", (await db.query(`update event_cheers set status = 'hidden' where id = $1`, [c2.id])).affectedRows === 1);
ok("…but not delete one", (await db.query(`delete from event_cheers where id = $1`, [c2.id])).affectedRows === 0);
await as(B);
ok("another host sees none of the comments", (await q(`select id from event_cheers where event_id = $1`, [lev.id])).length === 0);
ok("…and can't hide them", (await db.query(`update event_cheers set status = 'hidden' where id = $1`, [c3.id])).affectedRows === 0);
await as(D);
ok("a co-host can delete one", (await db.query(`delete from event_cheers where id = $1`, [c2.id])).affectedRows === 1);
await as(null);
live = (await q(`select public_live('birthday','live-party') as r`))[0].r;
ok("a hidden or deleted comment leaves the screen", !live.cheers.some((c) => c.body === "Happy birthday Sita!") && live.cheers.some((c) => c.body === "Waiting for an OK"));
await as(A);
await q(`update feature_toggles set settings = settings || '{"cheers": {"on": false}}' where event_id = $1`, [lev.id]);
await as(null);
ok("the host can switch comments off", (await cheer(dev2, null, null, "clap")).reason === "off"
  && (await q(`select public_live('birthday','live-party') as r`))[0].r.cheers.length === 0);
await as(A);
const [fut] = await q(`insert into events (event_type, slug, title, starts_at, ends_at, status, is_private)
  values ('birthday','next-month','Next month', now() + interval '30 days', now() + interval '30 days 4 hours', 'published', true) returning id`);
await as(null);
ok("a private event's comments need its link", (await cheer(dev1, null, null, "clap", "next-month")).reason === "private"
  && (await q(`select public_live('birthday','next-month') as r`))[0].r.private === true);
await db.exec(`reset role`);
const futKey = (await q(`select wall_key from events where id = $1`, [fut.id]))[0].wall_key;
await as(null);
ok("…and before the day they're closed, like the photos", (await cheer(dev1, null, null, "clap", "next-month", futKey)).reason === "not_open");
await as(A);
await q(`delete from events where id in ($1, $2)`, [lev.id, fut.id]);

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

console.log("Nightly backup (0012):");
await as(A);
await expectError("a host cannot take a backup", `select public.backup_snapshot()`, /permission denied/);
await as(null);
await expectError("the public cannot take a backup", `select public.backup_snapshot()`, /permission denied/);
await db.exec(`reset role; set role service_role`);
const snap = (await q(`select public.backup_snapshot() as s`))[0].s;
await db.exec(`reset role`);
const allTables = (await q(`select tablename from pg_tables where schemaname = 'public'`)).map((r) => r.tablename);
ok("the server's backup has every table", allTables.length > 10 && allTables.every((t) => Array.isArray(snap.tables[t])),
  allTables.filter((t) => !Array.isArray(snap.tables[t])).join(", "));
ok("…with every row in it", snap.tables.events.length === (await q(`select count(*)::int n from events`))[0].n && typeof snap.taken_at === "string");
// For practising a restore without real data: BACKUP_SAMPLE=/path/file.json npm run test:db
if (process.env.BACKUP_SAMPLE) fs.writeFileSync(process.env.BACKUP_SAMPLE, JSON.stringify(snap));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
