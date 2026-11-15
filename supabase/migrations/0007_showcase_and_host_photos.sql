-- 0007: up to five photos at the top of the page, with a choice of how they
-- move; and the hosts' own photos on the photo wall. (Owner, 15 Nov 2026:
-- "3-5 photos to showcase hero section ... in various choice of animation
-- style" and "organisers should also have place to upload their own photos".)
--
-- 1. events.hero_keys: up to four more photos after the main one
--    (cover_image_key). Like it, each must sit in the event's own folder of
--    the event-media bucket (0005), so the existing storage rules cover them.
--    events.hero_motion: how the photos change: fade, zoom or slide.
-- 2. public_event(): the same as 0004, plus hero_keys and hero_motion.
-- 3. The hosts' own photos: add_host_photo(), for the owner, co-hosts and
--    helpers, from the builder's Photos window. They go straight on the wall,
--    can be added before the day, and count towards the plan's photos but
--    not towards any phone's share. photo_stored() shows them at once.
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- ─────────────────────────── 1. Showcase photos ───────────────────────────

create or replace function public.media_keys_own(p_keys text[], p_event uuid) returns boolean
language sql immutable set search_path = public as $$
  select coalesce(bool_and(k ~ '^[0-9a-f-]{36}/cover-[a-z0-9]{6,40}\.(jpg|png|webp)$' and split_part(k, '/', 1) = p_event::text), true)
  from unnest(p_keys) as k
$$;
revoke execute on function public.media_keys_own(text[], uuid) from public, anon;
grant execute on function public.media_keys_own(text[], uuid) to authenticated, service_role;

alter table public.events
  add column hero_keys text[] not null default '{}',
  add column hero_motion text not null default 'fade' check (hero_motion in ('fade', 'zoom', 'slide')),
  add constraint events_hero_keys_own check (cardinality(hero_keys) <= 4 and public.media_keys_own(hero_keys, id));

grant insert (hero_keys, hero_motion), update (hero_keys, hero_motion) on public.events to authenticated;

-- ─────────────────────────── 2. The public page ───────────────────────────
-- Same as 0004, plus hero_keys and hero_motion.

create or replace function public.public_event(p_type text, p_slug text, p_token text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  e public.events;
  g public.guest_crm;
  f public.feature_toggles;
  s public.lifecycle_stage;
begin
  select * into e from public.events where event_type = p_type and slug = p_slug and status <> 'draft';
  if not found then return null; end if;

  if p_token is not null then
    select * into g from public.guest_crm where event_id = e.id and invite_token = p_token;
  end if;

  s := public.stage(e);
  if s in ('expired', 'cancelled') then
    return jsonb_build_object('stage', s, 'title', e.title);
  end if;
  if e.is_private and g.id is null then
    return jsonb_build_object('stage', s, 'private', true);
  end if;

  select * into f from public.feature_toggles where event_id = e.id;

  return jsonb_build_object(
    'stage', s,
    'event', jsonb_build_object(
      'type', e.event_type, 'slug', e.slug, 'short_code', e.short_code,
      'title', e.title, 'host_names', e.host_names,
      'timezone', e.timezone, 'starts_at', e.starts_at, 'ends_at', e.ends_at,
      'venue_name', e.venue_name, 'venue_address', e.venue_address, 'venue_lat', e.venue_lat, 'venue_lng', e.venue_lng,
      'parking', e.parking, 'parking_note', e.parking_note,
      'organiser_name', e.organiser_name, 'organiser_type', e.organiser_type, 'for_profit', e.for_profit,
      'charity_number', e.charity_number, 'organiser_contact', e.organiser_contact,
      'is_demo', e.is_demo,
      'card_headline', e.card_headline, 'card_invite_body', e.card_invite_body,
      'landing_page_story', e.landing_page_story, 'guest_note_box', e.guest_note_box,
      'post_event_thank_you', case when s = 'post' then e.post_event_thank_you end,
      'languages', to_jsonb(e.languages),
      'translations', case when s = 'post' then e.copy_translations else
        (select coalesce(jsonb_object_agg(l.lang, l.box - 'post_event_thank_you'), '{}'::jsonb)
           from jsonb_each(e.copy_translations) as l(lang, box)) end,
      'scale', e.scale,
      'theme', e.theme, 'palette', e.palette, 'primary_color', e.primary_color,
      'text_style', e.text_style, 'border', e.border, 'photo_style', e.photo_style, 'motion', e.motion,
      'effect', e.effect,
      'cover_image_key', e.cover_image_key, 'cover_fit', e.cover_fit, 'share_image_key', e.share_image_key,
      'hero_keys', to_jsonb(e.hero_keys), 'hero_motion', e.hero_motion,
      'hide_branding', (select p.hide_branding from public.plans p where p.key = e.plan)),
    'people', coalesce((
      select jsonb_agg(jsonb_build_object('role', p.role, 'relation', p.relation, 'names', p.names,
                                          'names_local', p.names_local, 'photo_key', p.photo_key)
             order by p.role desc, p.sort_order)
      from public.event_people p where p.event_id = e.id), '[]'::jsonb),
    'features', (select to_jsonb(ft) - 'event_id' - 'updated_at' from public.feature_toggles ft where ft.event_id = e.id),
    'sub_events', case when coalesce(f.schedule, true) then coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', se.id, 'title', se.title, 'kind', se.kind, 'starts_at', se.starts_at, 'ends_at', se.ends_at,
               'venue_name', se.venue_name, 'venue_address', se.venue_address, 'venue_lat', se.venue_lat, 'venue_lng', se.venue_lng,
               'description', se.description, 'dress_code', se.dress_code,
               'menu', case when coalesce(f.menu, true) and se.kind = 'meal' then se.details->'menu' end)
             order by se.starts_at, se.sort_order)
      from public.sub_events se
      where se.event_id = e.id
        and (not se.invite_only
             or exists (select 1 from public.sub_event_guests sg where sg.sub_event_id = se.id and sg.guest_id = g.id))
    ), '[]'::jsonb) else '[]'::jsonb end,
    'guest', case when g.id is null then null else jsonb_build_object(
      'name', g.full_name, 'rsvp_status', g.rsvp_status, 'party_size', g.party_size) end
  );
end $$;

-- ─────────────────────────── 3. The hosts' own photos ───────────────────────────

alter table public.event_photos add column by_host boolean not null default false;

-- Reasons: sign_in, bad_photo, no_event (not found, or not your event), off
-- (the photo wall is switched off), closed (the page has closed), busy, full.
create or replace function public.add_host_photo(p_event uuid, p_name text, p_width integer, p_height integer, p_bytes integer)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  e public.events;
  p public.plans;
  v_all    int;
  v_id     uuid;
  v_name   text := nullif(btrim(coalesce(p_name, '')), '');
  v_secret text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'reason', 'sign_in'); end if;
  if coalesce(p_width, 0) not between 16 and 4096 or coalesce(p_height, 0) not between 16 and 4096
     or coalesce(p_bytes, 0) not between 1 and 4194304 or char_length(coalesce(v_name, '')) > 60 then
    return jsonb_build_object('ok', false, 'reason', 'bad_photo');
  end if;
  select * into e from public.events where id = p_event for update;
  if not found or not public.is_event_host(p_event) then return jsonb_build_object('ok', false, 'reason', 'no_event'); end if;
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

  insert into public.event_photos (event_id, width, height, bytes, added_by, device, upload_secret, by_host)
  values (e.id, p_width, p_height, p_bytes, v_name, replace(auth.uid()::text, '-', ''), v_secret, true)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'event_id', e.id, 'secret', v_secret);
end $$;
revoke execute on function public.add_host_photo(uuid, text, integer, integer, integer) from public, anon;
grant execute on function public.add_host_photo(uuid, text, integer, integer, integer) to authenticated, service_role;

-- Same as 0006, except a host's own photo never waits for an OK.
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
  v_status := case when ph.by_host or not (public.photo_rules(e)->>'approve_first')::boolean then 'shown' else 'waiting' end;
  update public.event_photos set status = v_status, ready_at = now(), upload_secret = null where id = p_id;
  return jsonb_build_object('ok', true, 'status', v_status);
end $$;
