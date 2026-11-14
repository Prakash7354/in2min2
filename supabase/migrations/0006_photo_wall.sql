-- 0006: the guests' photo wall, the gallery afterwards and the TV slideshow.
-- (Phase 3, brought forward: owner, 14 Nov 2026, "go ahead".) CONCEPT 12a.
--
-- How a guest's photo travels:
--   1. Their phone shrinks it (about 1600 px, hidden location removed) and
--      makes a thumbnail, then sends both to the app (/api/photos).
--   2. The app asks add_photo() whether this guest may add it now: the wall
--      is on and open, the plan has room, this phone hasn't used its share,
--      and not too many are arriving at once. A yes reserves a row.
--   3. The app stores both files in Cloudflare R2 (Europe), then calls
--      photo_stored(), which shows the photo at once, or holds it for the
--      host's OK.
-- Guests never touch event_photos directly. Hosts read and review it under
-- Row Level Security. Removing a photo for good goes through the app, which
-- deletes the files too (remove_photos()).
--
-- The host's settings, in feature_toggles:
--   photo_wall (the switch)  : the wall on or off.
--   settings.photo_wall.approve_first : the host checks each photo before it
--       shows. Default: on for community events and memorials, off for
--       family events (CONCEPT 12a, Recommended).
--   settings.photo_wall.early : guests may add photos before the day (for
--       "photos through the years", or to try it out). Default off.
-- Guests can add photos from midnight on the day until the page closes.
--
-- events.wall_key: a private event's photo key. It goes on the table cards'
-- QR code and the TV link, so guests at the venue can add and see photos
-- without their own invitation link. It opens the photos only, never the
-- rest of a private page.
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- ─────────────────────────── 1. The photos ───────────────────────────

alter table public.events
  add column wall_key text not null default encode(extensions.gen_random_bytes(12), 'hex');

-- Files in R2: {event_id}/p/{id}.jpg (about 1600 px) and {event_id}/t/{id}.jpg
-- (the thumbnail). Worked out from the ids, so never stored or trusted.
create table public.event_photos (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  -- uploading: reserved, files on their way; waiting: for the host's OK;
  -- shown: on the wall and in the gallery; hidden: taken down by a host, or
  -- after someone asked for it to be removed.
  status           text not null default 'uploading' check (status in ('uploading', 'waiting', 'shown', 'hidden')),
  width            integer not null check (width between 16 and 4096),
  height           integer not null check (height between 16 and 4096),
  bytes            integer not null check (bytes between 1 and 4194304),
  added_by         text check (char_length(added_by) between 1 and 60),   -- the name the guest typed, if any
  device           text not null check (device ~ '^[a-z0-9]{16,40}$'),   -- a random id kept on the guest's phone: their share
  upload_secret    text,                                                  -- between add_photo() and photo_stored() only
  removal_asked_at timestamptz,                                           -- "Please remove this photo"
  removal_note     text check (char_length(removal_note) <= 200),
  kept_at          timestamptz,                                           -- a host showed it again after a request
  created_at       timestamptz not null default now(),
  ready_at         timestamptz,                                           -- files stored
  reviewed_at      timestamptz                                            -- a host last changed its status
);
create index event_photos_wall_idx   on public.event_photos (event_id, status, ready_at desc);
create index event_photos_device_idx on public.event_photos (event_id, device);
create index event_photos_recent_idx on public.event_photos (event_id, created_at);

-- When a host changes a photo's status, note when; and a photo shown again
-- after a removal request is marked as kept, so a second request doesn't
-- hide it again (the host has decided).
create or replace function public.photo_reviewed() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status and old.status <> 'uploading' and auth.uid() is not null then
    new.reviewed_at := now();
    if new.status = 'shown' and old.removal_asked_at is not null then new.kept_at := now(); end if;
  end if;
  return new;
end $$;
create trigger event_photos_reviewed before update on public.event_photos
  for each row execute function public.photo_reviewed();

-- Hosts (owner, co-hosts and helpers) see their events' photos and decide
-- what shows. Nobody adds or deletes rows from the browser.
alter table public.event_photos enable row level security;
create policy photos_read on public.event_photos for select to authenticated
  using (public.is_event_host(event_id));
create policy photos_review on public.event_photos for update to authenticated
  using (public.is_event_host(event_id) and status <> 'uploading')
  with check (public.is_event_host(event_id) and status in ('waiting', 'shown', 'hidden'));

revoke all on public.event_photos from anon, authenticated;   -- the public: through the functions below only
grant select on public.event_photos to authenticated;
grant update (status) on public.event_photos to authenticated;
grant all on public.event_photos to service_role;

-- ─────────────────────────── 2. Rules ───────────────────────────

-- May this caller see and add photos? Anyone for a public event; for a
-- private one, a guest's own link or the event's wall key.
create or replace function public.photo_access(e public.events, p_token text) returns boolean
language sql stable security definer set search_path = public as $$
  select not e.is_private
      or (coalesce(p_token, '') <> ''
          and (p_token = e.wall_key
               or exists (select 1 from public.guest_crm g where g.event_id = e.id and g.invite_token = p_token)))
$$;

-- The wall's switches, with their defaults, and whether it is open now.
create or replace function public.photo_rules(e public.events) returns jsonb
language sql stable security definer set search_path = public as $$
  with x as (
    select coalesce(f.photo_wall, true) as wall_on,
           case f.settings #> '{photo_wall,approve_first}' when 'true'::jsonb then true when 'false'::jsonb then false
                else e.scale = 'community' or coalesce(t.sensitive, false) end as approve_first,
           coalesce(f.settings #> '{photo_wall,early}' = 'true'::jsonb, false) as early,
           public.stage(e) as s
    from (select 1) one
    left join public.feature_toggles f on f.event_id = e.id
    left join public.event_types t on t.key = e.event_type)
  select jsonb_build_object('on', wall_on, 'approve_first', approve_first, 'early', early,
                            'open', wall_on and (s in ('live', 'post') or (s = 'pre' and early)))
  from x
$$;

revoke execute on function public.photo_access(public.events, text) from public, anon, authenticated;
revoke execute on function public.photo_rules(public.events) from public, anon, authenticated;
grant execute on function public.photo_access(public.events, text) to service_role;
grant execute on function public.photo_rules(public.events) to service_role;

-- ─────────────────────────── 3. The gallery, for guests and the TV ───────────────────────────
-- Newest first, 60 at a time (p_before pages back). Only shown photos. With
-- the guest's phone id, also how many they've added and how many wait for
-- the host. Returns a little about the event (title and colours) for the
-- photos page, the TV slideshow and the table cards.

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
      select jsonb_agg(jsonb_build_object('id', x.id, 'w', x.width, 'h', x.height, 'by', x.added_by, 'at', x.ready_at)
                       order by x.ready_at desc)
      from (select * from public.event_photos
            where event_id = e.id and status = 'shown' and (p_before is null or ready_at < p_before)
            order by ready_at desc
            limit least(greatest(coalesce(p_limit, 60), 1), 200)) x), '[]'::jsonb) else '[]'::jsonb end,
    'mine', case when v_dev is null then null else jsonb_build_object(
      'added', (select count(*) from public.event_photos where event_id = e.id and device = v_dev
                  and (status <> 'uploading' or created_at > now() - interval '1 hour')),
      'waiting', (select count(*) from public.event_photos where event_id = e.id and device = v_dev and status = 'waiting')) end
  );
end $$;

-- ─────────────────────────── 4. Adding a photo ───────────────────────────
-- Called by the app's server (/api/photos) with the public key, before it
-- stores the files. Anyone may call it: all it does is reserve a row, which
-- only shows once photo_stored() is given the secret it returns. Reasons:
-- bad_photo, no_event, private, off, closed, busy (300 in 10 minutes per
-- event), full (the plan's photos), your_share (this phone's share).
-- Reservations not finished within an hour stop counting.

create or replace function public.add_photo(p_type text, p_slug text, p_token text, p_device text, p_name text,
  p_width integer, p_height integer, p_bytes integer)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  e public.events;
  r jsonb;
  p public.plans;
  v_name   text := nullif(btrim(coalesce(p_name, '')), '');
  v_all    int;
  v_mine   int;
  v_id     uuid;
  v_secret text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  if coalesce(p_device, '') !~ '^[a-z0-9]{16,40}$'
     or coalesce(p_width, 0) not between 16 and 4096 or coalesce(p_height, 0) not between 16 and 4096
     or coalesce(p_bytes, 0) not between 1 and 4194304 or char_length(coalesce(v_name, '')) > 60 then
    return jsonb_build_object('ok', false, 'reason', 'bad_photo');
  end if;

  -- Lock the event, so two phones can never both take the last place.
  select * into e from public.events where event_type = p_type and slug = p_slug and status <> 'draft' for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_event'); end if;
  if not public.photo_access(e, p_token) then return jsonb_build_object('ok', false, 'reason', 'private'); end if;
  r := public.photo_rules(e);
  if not (r->>'on')::boolean then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  if not (r->>'open')::boolean then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;

  if (select count(*) from public.event_photos where event_id = e.id and created_at > now() - interval '10 minutes') >= 300 then
    return jsonb_build_object('ok', false, 'reason', 'busy');
  end if;
  select * into p from public.plans where key = e.plan;
  select count(*), count(*) filter (where device = p_device) into v_all, v_mine
    from public.event_photos
    where event_id = e.id and (status <> 'uploading' or created_at > now() - interval '1 hour');
  if p.photo_limit is not null and v_all >= p.photo_limit then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;
  if p.photos_per_guest is not null and v_mine >= p.photos_per_guest then
    return jsonb_build_object('ok', false, 'reason', 'your_share', 'per_guest', p.photos_per_guest);
  end if;

  insert into public.event_photos (event_id, width, height, bytes, added_by, device, upload_secret)
  values (e.id, p_width, p_height, p_bytes, v_name, p_device, v_secret)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'event_id', e.id, 'secret', v_secret,
                            'left', case when p.photos_per_guest is null then null else p.photos_per_guest - v_mine - 1 end);
end $$;

-- The files are stored: show the photo, or hold it for the host's OK.
create or replace function public.photo_stored(p_id uuid, p_secret text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  ph public.event_photos;
  e  public.events;
  v_status text;
begin
  select * into ph from public.event_photos
  where id = p_id and status = 'uploading' and upload_secret = p_secret and created_at > now() - interval '1 hour'
  for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_upload'); end if;
  select * into e from public.events where id = ph.event_id;
  v_status := case when (public.photo_rules(e)->>'approve_first')::boolean then 'waiting' else 'shown' end;
  update public.event_photos set status = v_status, ready_at = now(), upload_secret = null where id = p_id;
  return jsonb_build_object('ok', true, 'status', v_status);
end $$;

-- ─────────────────────────── 5. "Please remove this photo" ───────────────────────────
-- Any guest can ask. The photo comes down at once and the host sees why; if
-- the host shows it again, a later request is noted but doesn't hide it.
-- At most 20 requests an hour per event, so nobody can empty a wall.

create or replace function public.ask_photo_removal(p_type text, p_slug text, p_token text, p_photo uuid, p_note text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  e  public.events;
  ph public.event_photos;
begin
  if char_length(coalesce(p_note, '')) > 200 then return jsonb_build_object('ok', false, 'reason', 'note'); end if;
  select * into e from public.events where event_type = p_type and slug = p_slug and status <> 'draft';
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_event'); end if;
  if not public.photo_access(e, p_token) then return jsonb_build_object('ok', false, 'reason', 'private'); end if;
  select * into ph from public.event_photos where id = p_photo and event_id = e.id and status = 'shown' for update;
  if not found then return jsonb_build_object('ok', true, 'hidden', true); end if;
  if (select count(*) from public.event_photos where event_id = e.id and removal_asked_at > now() - interval '1 hour') >= 20 then
    return jsonb_build_object('ok', false, 'reason', 'busy');
  end if;
  update public.event_photos
     set removal_asked_at = now(),
         removal_note = nullif(btrim(coalesce(p_note, '')), ''),
         status = case when kept_at is null then 'hidden' else status end
   where id = ph.id
   returning * into ph;
  return jsonb_build_object('ok', true, 'hidden', ph.status = 'hidden');
end $$;

-- ─────────────────────────── 6. Removing photos for good ───────────────────────────
-- The owner and co-hosts only. Deletes the rows and returns which files the
-- app should delete from R2. Helpers can hide photos but not delete them.

create or replace function public.remove_photos(p_ids uuid[]) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v jsonb;
begin
  if auth.uid() is null or coalesce(cardinality(p_ids), 0) not between 1 and 200 then return '[]'::jsonb; end if;
  with gone as (
    delete from public.event_photos ph
    where ph.id = any(p_ids) and public.is_event_host(ph.event_id, 'co_host')
    returning ph.event_id, ph.id)
  select coalesce(jsonb_agg(jsonb_build_object('event_id', gone.event_id, 'id', gone.id)), '[]'::jsonb) into v from gone;
  return v;
end $$;

revoke execute on function public.public_photos(text, text, text, text, timestamptz, integer) from public;
revoke execute on function public.add_photo(text, text, text, text, text, integer, integer, integer) from public;
revoke execute on function public.photo_stored(uuid, text) from public;
revoke execute on function public.ask_photo_removal(text, text, text, uuid, text) from public;
revoke execute on function public.remove_photos(uuid[]) from public, anon;
grant execute on function public.public_photos(text, text, text, text, timestamptz, integer) to anon, authenticated, service_role;
grant execute on function public.add_photo(text, text, text, text, text, integer, integer, integer) to anon, authenticated, service_role;
grant execute on function public.photo_stored(uuid, text) to anon, authenticated, service_role;
grant execute on function public.ask_photo_removal(text, text, text, uuid, text) to anon, authenticated, service_role;
grant execute on function public.remove_photos(uuid[]) to authenticated, service_role;
revoke execute on function public.photo_reviewed() from public, anon, authenticated;
