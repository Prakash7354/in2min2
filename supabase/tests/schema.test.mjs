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
ok("column defaults kept (rsvp on, ticket_tiers off)", ft.rsvp === true && ft.ticket_tiers === false);
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
const [spt] = await q(`select ticket_tiers, sponsors, gift_registry from feature_toggles where event_id = $1`, [sp.id]);
ok("sport defaults applied (tickets, sponsors on; gifts off)", spt.ticket_tiers && spt.sponsors && !spt.gift_registry);

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
ok("keepsake hides branding", pe.p.event.hide_branding === true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
