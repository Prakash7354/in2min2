-- In2Min2 · second migration (14 Nov 2026)
-- ═══════════════════════════════════════════════════════════════════════════
-- Run once, after 0001 (SQL Editor › New query › paste › Run).
--
-- 1. Rights for the API roles. Since 30 Oct 2026 Supabase no longer grants
--    anon / authenticated / service_role anything on new tables (changelog
--    45329). 0001 relied on the old automatic grants, so on a new project a
--    host could not even read their own events. Row Level Security still
--    decides WHICH rows; these grants decide which tables and actions are
--    reachable at all. Column grants from 0001 (what a host may write on
--    events and guest_crm) are kept: no table-wide insert or update is given
--    on those two tables here.
-- 2. A daily cap on AI writes per signed-in person, so nobody can use up the
--    Gemini allowance. The AI route calls take_ai_write() first.

-- ─────────────────────────────── 1. Rights ───────────────────────────────

-- Public reference data (the pricing page and the builder read these).
grant select on public.plans, public.event_types to anon, authenticated;

-- Signed-in hosts. RLS policies in 0001 limit every one of these to the
-- events they run.
grant select, delete on public.events to authenticated;
grant select, delete on public.guest_crm to authenticated;
grant select, update on public.feature_toggles to authenticated;
grant select, insert, update, delete on public.event_hosts, public.event_people, public.sub_events,
  public.sub_event_guests to authenticated;

-- The server (service key) for payments, the owner's admin page and clean-up jobs.
grant all on public.plans, public.event_types, public.events, public.event_hosts, public.event_people,
  public.sub_events, public.guest_crm, public.sub_event_guests, public.feature_toggles,
  public.offers, public.offer_claims to service_role;

-- Functions used by the policies, column defaults and checks above, or
-- called by the app. (Supabase may lock functions down by default too.)
grant execute on function public.is_event_host(uuid, public.host_role) to authenticated, service_role;
grant execute on function public.new_short_code() to authenticated, service_role;
grant execute on function public.copy_fits(jsonb) to authenticated, service_role;
grant execute on function public.stage(public.events) to authenticated, service_role;
grant execute on function public.event_settings(uuid) to authenticated, service_role;
grant execute on function public.event_usage(uuid) to authenticated, service_role;
grant execute on function public.public_event(text, text, text) to anon, authenticated, service_role;
grant execute on function public.resolve_short_code(text) to anon, authenticated, service_role;
grant execute on function public.offer_places_left(text) to anon, authenticated, service_role;
grant execute on function public.claim_offer(uuid, text) to authenticated, service_role;

-- ─────────────────────────────── 2. AI writes ───────────────────────────────

create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  writes  integer not null default 0 check (writes >= 0),
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;  -- no policies: reached only through take_ai_write()
revoke all on public.ai_usage from anon, authenticated;
grant all on public.ai_usage to service_role;

-- Counts one AI write for the signed-in person and says whether it is
-- allowed: at most 20 a day each (enough to write and rewrite an event many
-- times). Not signed in: false. The limit is fixed here, never passed in.
create or replace function public.take_ai_write() returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare
  n integer;
begin
  if auth.uid() is null then
    return false;
  end if;
  insert into public.ai_usage as u (user_id, day, writes) values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set writes = u.writes + 1 where u.writes < 20
  returning writes into n;
  return n is not null;
end $$;

revoke execute on function public.take_ai_write() from public, anon;
grant execute on function public.take_ai_write() to authenticated;
