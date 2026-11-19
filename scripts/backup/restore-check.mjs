// Practise a restore (CONCEPT 21): load a nightly backup into a throwaway
// database on this Mac (PGlite: real Postgres, in memory, never the live
// one), built from our migrations, and check every row arrives.
//
//   1. Fetch last night's copy (file names are the date):
//      npx wrangler r2 object get in2min2-backups/db/2026-11-20.json --jurisdiction eu --remote --file backup.json
//   2. node scripts/backup/restore-check.mjs backup.json
//   3. Delete backup.json afterwards: it holds real guests' details.
//
// For a real disaster the same steps fill a new Supabase project: run the
// migrations in its SQL Editor, then this script's INSERTs against it
// (ask Claude Code; it needs the new project's connection string).

import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";

const file = process.argv[2];
if (!file) { console.error("Usage: node scripts/backup/restore-check.mjs backup.json"); process.exit(1); }
const backup = JSON.parse(fs.readFileSync(file, "utf8"));
if (backup.version !== 1 || !backup.tables) { console.error("That doesn't look like an In2Min2 backup."); process.exit(1); }

const dir = new URL("../../supabase/migrations/", import.meta.url);
const migrations = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => fs.readFileSync(new URL(f, dir), "utf8")).join("\n");
const db = new PGlite({ extensions: { pgcrypto } });

// The same stand-ins for Supabase as supabase/tests/schema.test.mjs.
await db.exec(`
  create schema extensions; create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  grant usage on schema public, auth, extensions to anon, authenticated, service_role;
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean not null default false, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
    name text not null, owner_id text, created_at timestamptz not null default now(), unique (bucket_id, name));
  alter table storage.objects enable row level security;
`);
await db.exec(migrations);
// Migrations add starter rows (offers, plans…); the backup holds the real ones.
// Load with checks and triggers paused, as a restore tool does.
await db.exec(`set session_replication_role = replica;`);
const ours = (await db.query(`select tablename from pg_tables where schemaname = 'public'`)).rows.map((r) => r.tablename);
for (const t of ours) await db.exec(`delete from public."${t.replaceAll('"', '""')}"`);

let rows = 0, bad = 0;
console.log(`Backup taken ${backup.taken_at}`);
for (const [t, list] of Object.entries(backup.tables)) {
  if (!ours.includes(t)) { console.log(`  ?  ${t}: not in today's migrations (an old backup?)`); bad++; continue; }
  const id = `"${t.replaceAll('"', '""')}"`;
  try {
    if (list.length) await db.query(`insert into public.${id} select * from json_populate_recordset(null::public.${id}, $1::json)`, [JSON.stringify(list)]);
    const n = (await db.query(`select count(*)::int n from public.${id}`)).rows[0].n;
    const same = n === list.length;
    if (!same) bad++;
    rows += n;
    console.log(`  ${same ? "ok" : "!!"}  ${t}: ${n} of ${list.length}`);
  } catch (e) {
    bad++;
    console.log(`  !!  ${t}: ${String(e.message).slice(0, 120)}`);
  }
}
for (const t of ours.filter((t) => !(t in backup.tables))) console.log(`  -   ${t}: new since this backup (empty)`);
console.log(bad ? `\nRestore practice FAILED: ${bad} problem(s) above.` : `\nRestore practice passed: ${Object.keys(backup.tables).length} tables, ${rows} rows, all match.`);
process.exit(bad ? 1 : 0);
