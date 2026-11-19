-- 0012_backup.sql — the nightly backup (CONCEPT 21; owner: "safety first", 19 Nov 2026).
--
-- Supabase's free plan keeps no backups, so every night the Worker
-- (worker/main.js) asks for one snapshot of every table in the public schema
-- and saves it to the private R2 bucket in2min2-backups (EU), keeping 30 days.
-- The tables' design is in these migration files, so data plus migrations is
-- a full copy. New tables are included automatically.
--
-- Only the server's secret key (service_role) may call it: never a browser.

create or replace function public.backup_snapshot()
returns json
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  t text;
  part json;
  body text := '';
begin
  for t in
    select tablename from pg_catalog.pg_tables where schemaname = 'public' order by tablename
  loop
    execute format('select coalesce(json_agg(x), ''[]''::json) from public.%I x', t) into part;
    body := body || case when body = '' then '' else ',' end || to_json(t)::text || ':' || part::text;
  end loop;
  return ('{"version":1,"taken_at":' || to_json(now())::text || ',"tables":{' || body || '}}')::json;
end;
$$;

revoke all on function public.backup_snapshot() from public, anon, authenticated;
grant execute on function public.backup_snapshot() to service_role;
