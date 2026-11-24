-- 0017: the Free plan (owner's decisions, 24 Nov 2026; docs/PLAN-pricing-free-plan.md).
--
-- From 1 February 2027 (until then every family page is on the festive plan,
-- which this does not touch) the plan with the key 'popup' is called "Free":
--   * 100 people, 25 photos (5 from each phone), 5 AI writes
--   * online for 14 days counted from the day the page is PUBLISHED, not from
--     the event (building and editing before that costs nothing)
-- Paid plans keep their clock: until 90 days / 6 months / 12 months after the
-- event.
-- Memorials get their own free plan, "memorial" (Recommended, not yet
-- confirmed by the owner): online until 90 days after the service, 300 people,
-- 300 photos. A family is never sold to. Memorial pages move onto it now,
-- with the same limits as the festive plan they may be on at the moment.
-- Matches PLANS in lib/catalog.ts (the tests check the two agree).
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- 1. A plan can count its days from publishing.
alter table public.plans add column if not exists hosting_from_publish boolean not null default false;

-- 2. Free
update public.plans set name = 'Free' where key = 'popup';
update public.plans set guest_limit = 100 where key = 'popup';
update public.plans set photo_limit = 25 where key = 'popup';
update public.plans set photos_per_guest = 5 where key = 'popup';
update public.plans set hosting_days_after = 14 where key = 'popup';
update public.plans set hosting_from_publish = true where key = 'popup';

-- 3. The free plan for memorials
insert into public.plans (key, name, price_pence, hosting_days_after, guest_limit, photo_limit, photos_per_guest, ai_writes,
                          full_res_download, hide_branding, booking_fee_bps, booking_fee_pence, scales,
                          guest_pack_size, guest_pack_pence, sort_order) values
  ('memorial',  'Memorial', 0, 90, 300,  300, 20, 30, false, false,   0,  0, '{personal,celebration}', 100, 300, 0)
on conflict (key) do nothing;

-- 4. Which plan a page is on, and when it ends.
create or replace function public.set_hosting_until() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.scale is null
     or (tg_op = 'UPDATE' and new.event_type is distinct from old.event_type
         and new.scale is not distinct from old.scale) then
    select t.scale into new.scale from public.event_types t where t.key = new.event_type;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  if new.plan in ('popup', 'community', 'festive', 'memorial') then
    new.plan := case
      when new.scale = 'community' then 'community'
      when exists (select 1 from public.event_types t where t.key = new.event_type and t.sensitive) then 'memorial'
      when new.plan = 'festive' then 'festive'
      when coalesce(new.published_at, now()) < public.festive_until() then 'festive'
      else 'popup'
    end;
  end if;

  select case when p.hosting_from_publish
              then coalesce(new.published_at, now())
              else coalesce(new.ends_at, new.starts_at) end
         + make_interval(days => p.hosting_days_after + new.extra_hosting_days)
    into new.hosting_until
    from public.plans p where p.key = new.plan;
  return new;
end $$;

-- 5. Memorial pages already made move onto their plan now (the trigger works
-- out the plan and the closing date).
update public.events set extra_hosting_days = extra_hosting_days
  where event_type in (select key from public.event_types where sensitive);
