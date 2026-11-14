-- 0003: the running order with its food menu, and how the main photo fits.
-- (14 Nov 2026, after the owner's first test on a phone.)
--
-- 1. A "Food menu" switch beside "Running order" (feature_toggles.schedule).
--    On by default: a menu only shows once the host has typed one.
-- 2. A meal in the running order (sub_events.kind = 'meal') carries its menu in
--    sub_events.details: {"menu": [{"course": "Starter", "dish": "Chicken momo"}, …]}.
--    menu_fits() keeps it small: up to 20 dishes, course up to 40 characters,
--    dish 1 to 160. The whole details object stays under 8 kB.
-- 3. events.cover_fit: 'fill' crops the photo to fill its space; 'whole' shows
--    the whole picture (logos, posters). The host may write it, like the other
--    look columns (the column grants from 0001 are kept and extended).
-- 4. public_event(): the running order only when its switch is on, each meal's
--    menu only when the menu switch is on, and cover_fit for the photo.
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- ─────────────────────────── 1. The menu switch ───────────────────────────

alter table public.feature_toggles
  add column menu boolean not null default true;   -- food menu shown with its meal in the running order

-- ─────────────────────────── 2. Menus on meals ───────────────────────────

create or replace function public.menu_fits(d jsonb) returns boolean
language sql immutable as $$
  select d->'menu' is null or (
    jsonb_typeof(d->'menu') = 'array'
    and jsonb_array_length(d->'menu') <= 20
    and not exists (
      select 1 from jsonb_array_elements(d->'menu') as m(item)
      where jsonb_typeof(m.item) <> 'object'
         or char_length(coalesce(m.item->>'course', '')) > 40
         or char_length(coalesce(m.item->>'dish', '')) not between 1 and 160))
$$;
revoke execute on function public.menu_fits(jsonb) from public, anon;
grant execute on function public.menu_fits(jsonb) to authenticated, service_role;

alter table public.sub_events
  add constraint sub_events_menu_fits check (public.menu_fits(details)),
  add constraint sub_events_details_small check (octet_length(details::text) <= 8000);

-- ─────────────────────────── 3. How the photo fits ───────────────────────────

alter table public.events
  add column cover_fit text not null default 'fill' check (cover_fit in ('fill', 'whole'));
grant insert (cover_fit), update (cover_fit) on public.events to authenticated;

-- ─────────────────────────── 4. The public page ───────────────────────────
-- Same as 0001 except: f (the switches) is read once; sub_events are sent only
-- when the running order is switched on; a meal's menu only when the menu is
-- switched on; and the event carries cover_fit.

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
      -- Second-language boxes; the thank-you stays hidden until after the event here too.
      'translations', case when s = 'post' then e.copy_translations else
        (select coalesce(jsonb_object_agg(l.lang, l.box - 'post_event_thank_you'), '{}'::jsonb)
           from jsonb_each(e.copy_translations) as l(lang, box)) end,
      'scale', e.scale,
      'theme', e.theme, 'palette', e.palette, 'primary_color', e.primary_color,
      'text_style', e.text_style, 'border', e.border, 'photo_style', e.photo_style, 'motion', e.motion,
      'cover_image_key', e.cover_image_key, 'cover_fit', e.cover_fit,
      'hide_branding', (select p.hide_branding from public.plans p where p.key = e.plan)),
    'people', coalesce((
      select jsonb_agg(jsonb_build_object('role', p.role, 'relation', p.relation, 'names', p.names,
                                          'names_local', p.names_local, 'photo_key', p.photo_key)
             order by p.role desc, p.sort_order)   -- 'star' before 'honour'
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
