-- 0013: the festive launch (owner's decision, 15 Nov 2026; CONCEPT 5i).
--
-- Until 31 January 2027 every family page is free with the Season limits
-- (300 people, 300 photos) and stays online 90 days after its event, instead
-- of the Pop-Up's 7 days. Done with its own free plan, "festive", which a
-- family page takes by itself while the launch lasts and then keeps, so a
-- page published in January still has its 90 days in March. Pages already
-- published move onto it now. The LAUNCH50 code (a free Keepsake) still
-- works on top of it. Public events keep the Community plan, and paid plans
-- are never changed.
--
-- From 1 February new pages are Pop-Up again (7 days) with nothing to run:
-- the date is public.festive_until().

-- 1. The plan (free; never sold; not on the prices page)
insert into public.plans (key, name, price_pence, hosting_days_after, guest_limit, photo_limit, photos_per_guest, ai_writes,
                          full_res_download, hide_branding, booking_fee_bps, booking_fee_pence, scales,
                          guest_pack_size, guest_pack_pence, sort_order) values
  ('festive',   'Festive launch', 0, 90, 300,  300, 20, 30, false, false,   0,  0, '{personal,celebration}', 100, 300, 0)
on conflict (key) do nothing;

-- 2. When the launch ends (UK midnight going into 1 February). A function,
-- so the tests can move it.
create or replace function public.festive_until() returns timestamptz
language sql stable as $$ select timestamptz '2027-02-01 00:00:00+00' $$;
grant execute on function public.festive_until() to anon, authenticated, service_role;

-- 3. Free plans follow the scale, and during the launch a family page takes
-- the festive plan (as before, otherwise; see 0001).
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

-- 4. The launch code works on a festive page too (as before, otherwise).
create or replace function public.claim_offer(p_event uuid, p_code text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  e public.events;
  o public.offers;
begin
  select * into e from public.events where id = p_event;
  if not found or e.owner_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'not_owner');
  end if;
  select * into o from public.offers where code = upper(trim(p_code)) for update;
  if not found or not o.is_active or (o.ends_at is not null and now() >= o.ends_at) then
    return jsonb_build_object('ok', false, 'reason', 'no_offer');
  end if;
  if not exists (select 1 from public.plans p where p.key = o.plan and e.scale = any (p.scales)) then
    return jsonb_build_object('ok', false, 'reason', 'not_for_this_event');
  end if;
  if e.plan not in ('popup', 'festive') then
    return jsonb_build_object('ok', false, 'reason', 'already_upgraded');
  end if;
  if exists (select 1 from public.offer_claims c where c.offer_code = o.code and c.owner_id = e.owner_id) then
    return jsonb_build_object('ok', false, 'reason', 'already_claimed');
  end if;
  if o.claims >= o.max_claims then
    return jsonb_build_object('ok', false, 'reason', 'all_taken');
  end if;

  insert into public.offer_claims (offer_code, owner_id, event_id) values (o.code, e.owner_id, e.id);
  update public.offers set claims = claims + 1 where code = o.code;
  update public.events set plan = o.plan where id = e.id;
  return jsonb_build_object('ok', true, 'plan', o.plan, 'places_left', o.max_claims - o.claims - 1);
end $$;

-- 5. Family pages already made move onto it now (the trigger above sets the
-- plan and works out the new closing date).
update public.events set plan = 'festive'
 where plan = 'popup' and scale <> 'community' and now() < public.festive_until();
