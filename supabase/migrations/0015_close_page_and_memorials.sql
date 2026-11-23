-- 0015: hosts close their page whenever they wish, and memorials stay online
-- for a year (owner, 23 Nov 2026).
--
-- 1. Close the page early. Any event's owner or co-host can close its page at
--    any time, without asking (Settings › "Close the page now"). Guests then
--    see "This page is now closed" instead of the page, replies and photos.
--    They can open it again within 30 days, while the plan's time lasts.
--    events.closed_at: when the page closed; empty = open. Hosts write it
--    themselves (policy events_edit: the owner and co-hosts). It can only make
--    a page close sooner: when it ends (hosting_until) stays the server's.
--    The clean-up (to be built in the Worker) deletes guests' details and
--    photos 30 days after a page closes for good: 30 days after closed_at if
--    it is still closed then, otherwise 30 days after hosting_until.
--
-- 2. Memorials and funerals stay online for 12 months after the day, free
--    (owner, 15 Nov 2026), whatever the plan, unless a plan gives longer.
--    Memorial pages already published move to it now.
--
-- 3. Memorials start with no countdown: "days to go" isn't right for a
--    funeral. The host can still switch it on. Matches EVENT_TYPES in
--    lib/catalog.ts (the tests check the two agree).
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- 1. Closing early
alter table public.events add column if not exists closed_at timestamptz;
grant update (closed_at) on public.events to authenticated;

-- The page's stage, from the clock (as in 0001), now also closed when the
-- host has closed it.
create or replace function public.stage(e public.events) returns public.lifecycle_stage
language sql stable set search_path = public as $$
  select (case
    when e.status = 'cancelled' then 'cancelled'
    when e.status = 'draft'     then 'draft'
    when now() >= e.hosting_until then 'expired'
    when e.closed_at is not null and now() >= e.closed_at then 'expired'
    when now() >= coalesce(e.ends_at,
           (((e.starts_at at time zone e.timezone)::date + 1)::timestamp at time zone e.timezone)) then 'post'
    when now() >= (((e.starts_at at time zone e.timezone)::date)::timestamp at time zone e.timezone) then 'live'
    else 'pre'
  end)::public.lifecycle_stage
$$;

-- 2. When a page ends (as in 0013), with a year for memorials.
create or replace function public.set_hosting_until() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.scale is null
     or (tg_op = 'UPDATE' and new.event_type is distinct from old.event_type
         and new.scale is not distinct from old.scale) then
    select t.scale into new.scale from public.event_types t where t.key = new.event_type;
  end if;
  if new.plan in ('popup', 'community', 'festive') then
    new.plan := case
      when new.scale = 'community' then 'community'
      when new.plan = 'festive' then 'festive'
      when coalesce(new.published_at, now()) < public.festive_until() then 'festive'
      else 'popup'
    end;
  end if;

  select coalesce(new.ends_at, new.starts_at)
         + make_interval(days => case when coalesce(t.sensitive, false) then greatest(p.hosting_days_after, 365)
                                      else p.hosting_days_after end
                                 + new.extra_hosting_days)
    into new.hosting_until
    from public.plans p left join public.event_types t on t.key = new.event_type
    where p.key = new.plan;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

-- Memorial pages already made get their year now.
update public.events set extra_hosting_days = extra_hosting_days
  where event_type in (select key from public.event_types where sensitive);

-- 3. No countdown on a memorial to start with.
update public.event_types set default_toggles = default_toggles || '{"countdown": false}'::jsonb where key = 'memorial';
