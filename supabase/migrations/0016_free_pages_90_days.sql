-- 0016: every free page stays online until 90 days after its event (owner,
-- 23 Nov 2026: "all free events live for 90 days: still generous, saves
-- space, and nothing lingers for years").
--
-- 1. Pop-Up, the free plan after the festive launch: 7 days → 90 days after
--    the event. Its limits stay (200 people, 50 photos); paid plans add more
--    people and photos, and longer (6 or 12 months).
-- 2. Memorials: the free 90 days too, instead of the year 0015 gave them. The
--    family can still close the page sooner at any time (0015), or choose a
--    longer plan. So set_hosting_until is back to 0013's.
-- 3. Pages already published get their new end date now.
-- Matches PLANS in lib/catalog.ts (the tests check the two agree).
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

update public.plans set hosting_days_after = 90 where key = 'popup';

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
         + make_interval(days => p.hosting_days_after + new.extra_hosting_days)
    into new.hosting_until
    from public.plans p where p.key = new.plan;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

update public.events set extra_hosting_days = extra_hosting_days
  where plan in ('popup', 'festive') or event_type in (select key from public.event_types where sensitive);
