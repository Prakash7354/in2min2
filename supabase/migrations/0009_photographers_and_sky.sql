-- 0009: photographers, and the sky behind the photo wheel.
-- (Owner, 15 Nov 2026: "build the plan, specially most of the time they are
-- tied to events like these. Allow them to get associated but still fee
-- charges", and "could the sky be ... day sky, evening, night, galaxy and
-- northern lights?")
--
-- 1. photo_rules(): adds the sky behind the wheel, from the host's setting
--    settings.photo_wall.sky (day, evening, night, galaxy, aurora), or
--    "auto" (the app picks one from the event's colours).
-- 2. event_photographers: up to three per event, added by the owner or a
--    co-host. Each gets a private upload link (upload_key), with no account.
--    Their photos go straight on the wall, credited to them, and count
--    towards the event's photo space. The host can switch a link off, or
--    remove the photographer (their photos stay, without the credit).
-- 3. photographer_wall() and add_photographer_photo(): the photographer's
--    upload page, through the key. photo_stored() (0007) shows their photos
--    at once, as for the hosts' own.
-- 4. public_photos(): the same as 0008, plus each photo's credit ("pg") and
--    the photographers for the "Book them" card.
-- Charging (CONCEPT 12c): on community events the "Official photographer"
-- card becomes a paid placement with payments (phase 4). Until then it is
-- free, like everything in the festive launch.
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- ─────────────────────────── 1. The sky ───────────────────────────
-- Same as 0006, plus sky.

create or replace function public.photo_rules(e public.events) returns jsonb
language sql stable security definer set search_path = public as $$
  with x as (
    select coalesce(f.photo_wall, true) as wall_on,
           case f.settings #> '{photo_wall,approve_first}' when 'true'::jsonb then true when 'false'::jsonb then false
                else e.scale = 'community' or coalesce(t.sensitive, false) end as approve_first,
           coalesce(f.settings #> '{photo_wall,early}' = 'true'::jsonb, false) as early,
           case when f.settings #>> '{photo_wall,sky}' in ('day', 'evening', 'night', 'galaxy', 'aurora')
                then f.settings #>> '{photo_wall,sky}' else 'auto' end as sky,
           public.stage(e) as s
    from (select 1) one
    left join public.feature_toggles f on f.event_id = e.id
    left join public.event_types t on t.key = e.event_type)
  select jsonb_build_object('on', wall_on, 'approve_first', approve_first, 'early', early, 'sky', sky,
                            'open', wall_on and (s in ('live', 'post') or (s = 'pre' and early)))
  from x
$$;

-- ─────────────────────────── 2. Photographers ───────────────────────────

create table public.event_photographers (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  business   text check (char_length(business) <= 80),
  link       text check (char_length(link) <= 200),        -- website, Instagram or phone, shown as "Book them"
  upload_key text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index event_photographers_event_idx on public.event_photographers (event_id);

alter table public.event_photographers enable row level security;
create policy photographers_read on public.event_photographers for select to authenticated
  using (public.is_event_host(event_id));
create policy photographers_add on public.event_photographers for insert to authenticated
  with check (public.is_event_host(event_id, 'co_host')
              and (select count(*) from public.event_photographers g where g.event_id = event_photographers.event_id) < 3);
create policy photographers_change on public.event_photographers for update to authenticated
  using (public.is_event_host(event_id, 'co_host')) with check (public.is_event_host(event_id, 'co_host'));
create policy photographers_remove on public.event_photographers for delete to authenticated
  using (public.is_event_host(event_id, 'co_host'));

revoke all on public.event_photographers from anon, authenticated;   -- the public: through the functions below only
grant select, delete on public.event_photographers to authenticated;
grant insert (event_id, name, business, link, active), update (name, business, link, active) on public.event_photographers to authenticated;
grant all on public.event_photographers to service_role;

alter table public.event_photos
  add column photographer_id uuid references public.event_photographers(id) on delete set null;
create index event_photos_photographer_idx on public.event_photos (photographer_id);

-- ─────────────────────────── 3. The photographer's upload page ───────────────────────────

-- What the upload page needs: the event's title and colours, the
-- photographer's name, and how much photo space is left. Null for a bad key.
create or replace function public.photographer_wall(p_key text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  g public.event_photographers;
  e public.events;
  p public.plans;
  r jsonb;
begin
  if coalesce(p_key, '') !~ '^[0-9a-f]{32}$' then return null; end if;
  select * into g from public.event_photographers where upload_key = p_key;
  if not found then return null; end if;
  select * into e from public.events where id = g.event_id;
  if e.status = 'draft' then return null; end if;
  r := public.photo_rules(e);
  select * into p from public.plans where key = e.plan;
  return jsonb_build_object(
    'active', g.active,
    'stage', public.stage(e),
    'photographer', jsonb_build_object('name', g.name, 'business', g.business),
    'event', jsonb_build_object('id', e.id, 'type', e.event_type, 'slug', e.slug, 'title', e.title, 'headline', e.card_headline,
      'scale', e.scale, 'palette', e.palette, 'primary_color', e.primary_color, 'text_style', e.text_style,
      'private', e.is_private, 'wall_key', case when e.is_private then e.wall_key end),
    'on', r->'on',
    'limit', p.photo_limit,
    'used', (select count(*) from public.event_photos where event_id = e.id
               and (status <> 'uploading' or created_at > now() - interval '1 hour')),
    'mine', (select count(*) from public.event_photos where photographer_id = g.id and status <> 'uploading'));
end $$;

-- Called by the app's server (/api/photos?pg=…) before it stores the files,
-- like add_photo() (0006). Reasons: bad_photo, no_link (wrong key, switched
-- off, or removed), off, closed, busy, full.
create or replace function public.add_photographer_photo(p_key text, p_width integer, p_height integer, p_bytes integer)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  g public.event_photographers;
  e public.events;
  p public.plans;
  v_all    int;
  v_id     uuid;
  v_secret text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  if coalesce(p_width, 0) not between 16 and 4096 or coalesce(p_height, 0) not between 16 and 4096
     or coalesce(p_bytes, 0) not between 1 and 4194304 then
    return jsonb_build_object('ok', false, 'reason', 'bad_photo');
  end if;
  if coalesce(p_key, '') !~ '^[0-9a-f]{32}$' then return jsonb_build_object('ok', false, 'reason', 'no_link'); end if;
  select * into g from public.event_photographers where upload_key = p_key;
  if not found or not g.active then return jsonb_build_object('ok', false, 'reason', 'no_link'); end if;
  select * into e from public.events where id = g.event_id for update;
  if e.status = 'draft' then return jsonb_build_object('ok', false, 'reason', 'no_link'); end if;
  if not (public.photo_rules(e)->>'on')::boolean then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  if public.stage(e) in ('expired', 'cancelled') then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  if (select count(*) from public.event_photos where event_id = e.id and created_at > now() - interval '10 minutes') >= 300 then
    return jsonb_build_object('ok', false, 'reason', 'busy');
  end if;
  select * into p from public.plans where key = e.plan;
  select count(*) into v_all from public.event_photos
    where event_id = e.id and (status <> 'uploading' or created_at > now() - interval '1 hour');
  if p.photo_limit is not null and v_all >= p.photo_limit then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;

  insert into public.event_photos (event_id, width, height, bytes, added_by, device, upload_secret, by_host, photographer_id)
  values (e.id, p_width, p_height, p_bytes, left(coalesce(nullif(btrim(g.business), ''), g.name), 60),
          'pg' || replace(g.id::text, '-', ''), v_secret, true, g.id)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'event_id', e.id, 'secret', v_secret);
end $$;

revoke execute on function public.photographer_wall(text) from public;
revoke execute on function public.add_photographer_photo(text, integer, integer, integer) from public;
grant execute on function public.photographer_wall(text) to anon, authenticated, service_role;
grant execute on function public.add_photographer_photo(text, integer, integer, integer) to anon, authenticated, service_role;

-- ─────────────────────────── 4. The gallery, with credits ───────────────────────────
-- Same as 0008, plus "pg" on each photo and "photographers".

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
                                          'pg', (select coalesce(nullif(btrim(g.business), ''), g.name) from public.event_photographers g where g.id = x.photographer_id),
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
                                          'pg', (select coalesce(nullif(btrim(g.business), ''), g.name) from public.event_photographers g where g.id = y.photographer_id),
                                          'mine', v_dev is not null and exists (select 1 from public.photo_loves l where l.photo_id = y.id and l.device = v_dev))
                       order by y.favourite desc, y.love_count desc, y.ready_at desc)
      from (select * from public.event_photos
            where event_id = e.id and status = 'shown' and (favourite or love_count > 0)
            order by favourite desc, love_count desc, ready_at desc
            limit 24) y), '[]'::jsonb) else '[]'::jsonb end,
    -- The event's photographers, for the "Book them" card (0009): only those
    -- still switched on who have a photo on the wall.
    'photographers', coalesce((
      select jsonb_agg(jsonb_build_object('name', g.name, 'business', g.business, 'link', g.link,
                                          'photos', (select count(*) from public.event_photos ph where ph.photographer_id = g.id and ph.status = 'shown'))
                       order by g.created_at)
      from public.event_photographers g
      where g.event_id = e.id and g.active
        and exists (select 1 from public.event_photos ph where ph.photographer_id = g.id and ph.status = 'shown')), '[]'::jsonb),
    'mine', case when v_dev is null then null else jsonb_build_object(
      'added', (select count(*) from public.event_photos where event_id = e.id and device = v_dev
                  and (status <> 'uploading' or created_at > now() - interval '1 hour')),
      'waiting', (select count(*) from public.event_photos where event_id = e.id and device = v_dev and status = 'waiting')) end
  );
end $$;
