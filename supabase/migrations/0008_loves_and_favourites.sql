-- 0008: love taps on guests' photos, the hosts' favourites, and the new
-- movements for the photos at the top of the page. (Owner, 15 Nov 2026:
-- "love taps and ... counts can be displayed", "the host picking favourites
-- for the front", and "zoom in fade and slide ... zoom out fade and slide ...
-- slide keep as is".)
--
-- 1. events.hero_motion: zoomin, zoomout or slide. The old fade becomes
--    zoomin and the old zoom becomes zoomout.
-- 2. event_photos.favourite (set by the event's hosts) and love_count.
-- 3. photo_loves: one love per photo per phone (the phone's random id, as for
--    the photo share in 0006). Guests love and unlove through love_photo();
--    hosts can see the loves on their own events; nobody else reads them.
-- 4. public_photos(): each photo with its loves, whether this phone loved it
--    and whether it's a favourite, plus "featured": favourites and the
--    most-loved photos, wherever they are in the list.
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- ─────────────────────────── 1. Movements at the top ───────────────────────────

alter table public.events drop constraint events_hero_motion_check;
update public.events set hero_motion = case hero_motion when 'fade' then 'zoomin' when 'zoom' then 'zoomout' else hero_motion end
  where hero_motion in ('fade', 'zoom');
alter table public.events alter column hero_motion set default 'zoomin';
alter table public.events add constraint events_hero_motion_check check (hero_motion in ('zoomin', 'zoomout', 'slide'));

-- ─────────────────────────── 2. Favourites and love counts ───────────────────────────

alter table public.event_photos
  add column favourite boolean not null default false,
  add column love_count integer not null default 0 check (love_count >= 0);

-- Hosts (owner, co-hosts and helpers, under photos_review in 0006) may now
-- mark favourites as well as show or hide. love_count is written only by
-- love_photo().
grant update (status, favourite) on public.event_photos to authenticated;

-- ─────────────────────────── 3. Love taps ───────────────────────────

create table public.photo_loves (
  photo_id   uuid not null references public.event_photos(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  device     text not null check (device ~ '^[a-z0-9]{16,40}$'),
  created_at timestamptz not null default now(),
  primary key (photo_id, device)
);
create index photo_loves_event_idx on public.photo_loves (event_id, created_at);

alter table public.photo_loves enable row level security;
create policy loves_read on public.photo_loves for select to authenticated using (public.is_event_host(event_id));

revoke all on public.photo_loves from anon, authenticated;   -- the public: through love_photo() only
grant select on public.photo_loves to authenticated;
grant all on public.photo_loves to service_role;

-- Love (p_love true) or unlove a shown photo. One love per phone per photo;
-- at most 300 loves an hour from one phone, and 3,000 in 10 minutes per
-- event, so a script can't run up the counts. Reasons: bad, no_event,
-- closed, private, gone (not shown any more), busy.
create or replace function public.love_photo(p_type text, p_slug text, p_token text, p_photo uuid, p_device text, p_love boolean)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  e  public.events;
  ph public.event_photos;
  v_n int;
begin
  if coalesce(p_device, '') !~ '^[a-z0-9]{16,40}$' or p_love is null then return jsonb_build_object('ok', false, 'reason', 'bad'); end if;
  select * into e from public.events where event_type = p_type and slug = p_slug and status <> 'draft';
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_event'); end if;
  if public.stage(e) in ('expired', 'cancelled') then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  if not public.photo_access(e, p_token) then return jsonb_build_object('ok', false, 'reason', 'private'); end if;
  select * into ph from public.event_photos where id = p_photo and event_id = e.id and status = 'shown' for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'gone'); end if;

  if p_love then
    if (select count(*) from public.photo_loves where event_id = e.id and device = p_device and created_at > now() - interval '1 hour') >= 300
       or (select count(*) from public.photo_loves where event_id = e.id and created_at > now() - interval '10 minutes') >= 3000 then
      return jsonb_build_object('ok', false, 'reason', 'busy');
    end if;
    insert into public.photo_loves (photo_id, event_id, device) values (ph.id, e.id, p_device) on conflict do nothing;
    get diagnostics v_n = row_count;
    if v_n > 0 then update public.event_photos set love_count = love_count + 1 where id = ph.id returning * into ph; end if;
  else
    delete from public.photo_loves where photo_id = ph.id and device = p_device;
    get diagnostics v_n = row_count;
    if v_n > 0 then update public.event_photos set love_count = greatest(love_count - 1, 0) where id = ph.id returning * into ph; end if;
  end if;
  return jsonb_build_object('ok', true, 'loves', ph.love_count, 'mine', p_love);
end $$;
revoke execute on function public.love_photo(text, text, text, uuid, text, boolean) from public;
grant execute on function public.love_photo(text, text, text, uuid, text, boolean) to anon, authenticated, service_role;

-- ─────────────────────────── 4. The gallery, with loves and favourites ───────────────────────────
-- Same as 0006, plus loves, mine and fav on each photo, and "featured".

create or replace function public.public_photos(p_type text, p_slug text, p_token text default null,
  p_device text default null, p_before timestamptz default null, p_limit integer default 60)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  e public.events;
  s public.lifecycle_stage;
  r jsonb;
  p public.plans;
  v_dev text := case when p_device ~ '^[a-z0-9]{16,40}$' then p_device end;
begin
  select * into e from public.events where event_type = p_type and slug = p_slug and status <> 'draft';
  if not found then return null; end if;
  s := public.stage(e);
  if s in ('expired', 'cancelled') then return jsonb_build_object('stage', s, 'title', e.title); end if;
  if not public.photo_access(e, p_token) then return jsonb_build_object('stage', s, 'private', true); end if;
  r := public.photo_rules(e);
  select * into p from public.plans where key = e.plan;

  return jsonb_build_object(
    'stage', s,
    'event', jsonb_build_object('id', e.id, 'type', e.event_type, 'slug', e.slug, 'short_code', e.short_code,
      'title', e.title, 'headline', e.card_headline, 'scale', e.scale, 'palette', e.palette,
      'primary_color', e.primary_color, 'text_style', e.text_style, 'private', e.is_private,
      'sensitive', coalesce((select t.sensitive from public.event_types t where t.key = e.event_type), false)),
    'rules', r,
    'limit', p.photo_limit,
    'per_guest', p.photos_per_guest,
    'shown', (select count(*) from public.event_photos where event_id = e.id and status = 'shown'),
    'photos', case when (r->>'on')::boolean then coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'w', x.width, 'h', x.height, 'by', x.added_by, 'at', x.ready_at,
                                          'loves', x.love_count, 'fav', x.favourite,
                                          'mine', v_dev is not null and exists (select 1 from public.photo_loves l where l.photo_id = x.id and l.device = v_dev))
                       order by x.ready_at desc)
      from (select * from public.event_photos
            where event_id = e.id and status = 'shown' and (p_before is null or ready_at < p_before)
            order by ready_at desc
            limit least(greatest(coalesce(p_limit, 60), 1), 200)) x), '[]'::jsonb) else '[]'::jsonb end,
    -- The hosts' favourites and the most-loved photos, wherever they are in
    -- the list, so the wheel can bring them round more often (0008).
    'featured', case when (r->>'on')::boolean then coalesce((
      select jsonb_agg(jsonb_build_object('id', y.id, 'w', y.width, 'h', y.height, 'by', y.added_by, 'at', y.ready_at,
                                          'loves', y.love_count, 'fav', y.favourite,
                                          'mine', v_dev is not null and exists (select 1 from public.photo_loves l where l.photo_id = y.id and l.device = v_dev))
                       order by y.favourite desc, y.love_count desc, y.ready_at desc)
      from (select * from public.event_photos
            where event_id = e.id and status = 'shown' and (favourite or love_count > 0)
            order by favourite desc, love_count desc, ready_at desc
            limit 24) y), '[]'::jsonb) else '[]'::jsonb end,
    'mine', case when v_dev is null then null else jsonb_build_object(
      'added', (select count(*) from public.event_photos where event_id = e.id and device = v_dev
                  and (status <> 'uploading' or created_at > now() - interval '1 hour')),
      'waiting', (select count(*) from public.event_photos where event_id = e.id and device = v_dev and status = 'waiting')) end
  );
end $$;
