-- 0004: replies that work, the festive designs, moving effects, and room for
-- each event's preview picture. (14 Nov 2026, owner: "go and build".)
--
-- 1. submit_rsvp(): the reply form on the public page. Guests never touch
--    guest_crm directly (CLAUDE.md); this function checks everything:
--    - the event is published, before the day, with replies switched on;
--    - a private event takes replies only from a guest's own link;
--    - a name (1 to 80 characters), a reply, 1 to 20 people, a note up to 280;
--    - the plan's people limit, with 10% grace (CONCEPT 5c), then a kind "full";
--    - the venue's safe capacity: beyond it, the waiting list, which moves up
--      by itself, first come first served, when places free up;
--    - at most 60 new replies in 10 minutes per event, and 2,000 in all, so a
--      bot can't flood a guest list (Turnstile comes before public launch).
--    The guest gets back a private token kept on their phone, so they can
--    change their reply later. A second reply with the token changes the
--    first; it never adds a row. Two different people with the same name both
--    stay (common in Nepali families); the host sees them and can remove one.
-- 2. Festive event types: Christmas party, New Year's Eve party, Lhosar
--    (owner, 14 Nov 2026: seasonal designs to show off the festive launch).
-- 3. events.effect: a gentle moving effect on the page: snow, fireworks,
--    marigold petals or confetti (none for memorials).
-- 4. events.share_image_key: the picture WhatsApp and others show when the
--    link is pasted, made on the host's own phone. Like cover_image_key, it
--    must sit in the event's own folder (the files themselves: 0005).
-- 5. public_event(): adds effect, the preview picture and the main photo.
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- ─────────────────────────── 1. Replies ───────────────────────────

create index guest_crm_recent_idx on public.guest_crm (event_id, created_at);

create or replace function public.submit_rsvp(p_type text, p_slug text, p_token text, p_reply jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  e public.events;
  f public.feature_toggles;
  g public.guest_crm;
  w public.guest_crm;
  v_name   text := btrim(coalesce(p_reply->>'name', ''));
  v_status text := coalesce(p_reply->>'status', '');
  v_note   text := nullif(btrim(coalesce(p_reply->>'note', '')), '');
  v_size   int;
  v_limit  int;
  v_people int;
  v_coming int;
  v_final  public.rsvp_status;
begin
  if jsonb_typeof(p_reply) is distinct from 'object' or v_status not in ('attending', 'maybe', 'declined') then
    return jsonb_build_object('ok', false, 'reason', 'bad_reply');
  end if;
  if char_length(v_name) not between 1 and 80 then
    return jsonb_build_object('ok', false, 'reason', 'name');
  end if;
  begin
    v_size := coalesce((p_reply->>'party_size')::int, 1);
  exception when others then
    v_size := 0;
  end;
  if v_size not between 1 and 20 then
    return jsonb_build_object('ok', false, 'reason', 'party_size');
  end if;
  if char_length(coalesce(v_note, '')) > 280 then
    return jsonb_build_object('ok', false, 'reason', 'note');
  end if;

  -- Lock the event, so two replies can never both take the last place.
  select * into e from public.events where event_type = p_type and slug = p_slug and status <> 'draft' for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_event'); end if;
  if public.stage(e) <> 'pre' then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  select * into f from public.feature_toggles where event_id = e.id;
  if not coalesce(f.rsvp, true) then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;

  if coalesce(p_token, '') <> '' then
    select * into g from public.guest_crm where event_id = e.id and invite_token = p_token;
  end if;
  if e.is_private and g.id is null then return jsonb_build_object('ok', false, 'reason', 'private'); end if;

  if g.id is null then
    if (select count(*) from public.guest_crm where event_id = e.id and source = 'rsvp_form'
          and created_at > now() - interval '10 minutes') >= 60
       or (select count(*) from public.guest_crm where event_id = e.id and source = 'rsvp_form') >= 2000 then
      return jsonb_build_object('ok', false, 'reason', 'busy');
    end if;
  end if;

  -- Numbers so far, not counting this guest's earlier reply.
  select coalesce(sum(party_size) filter (where rsvp_status in ('invited', 'attending', 'maybe')), 0),
         coalesce(sum(party_size) filter (where rsvp_status = 'attending'), 0)
    into v_people, v_coming
    from public.guest_crm where event_id = e.id and id is distinct from g.id;
  select p.guest_limit + e.extra_guests into v_limit from public.plans p where p.key = e.plan;

  v_final := v_status::public.rsvp_status;
  if v_status in ('attending', 'maybe') and v_limit is not null and v_people + v_size > floor(v_limit * 1.1) then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;
  if v_status = 'attending' and e.venue_capacity is not null and v_coming + v_size > e.venue_capacity then
    -- Someone already coming who asks for more places keeps what they had.
    if g.rsvp_status = 'attending' then return jsonb_build_object('ok', false, 'reason', 'no_more_room'); end if;
    v_final := 'waitlist';
  end if;

  if g.id is null then
    insert into public.guest_crm (event_id, full_name, party_size, rsvp_status, rsvp_at, rsvp_note, source)
    values (e.id, v_name, v_size, v_final, now(), v_note, 'rsvp_form')
    returning * into g;
  else
    update public.guest_crm set
      full_name   = case when g.source = 'rsvp_form' then v_name else full_name end,  -- the host's spelling stays
      party_size  = v_size,
      rsvp_status = v_final,
      rsvp_at     = case when rsvp_status is distinct from v_final then now() else coalesce(rsvp_at, now()) end,
      rsvp_note   = v_note
    where id = g.id
    returning * into g;
  end if;

  -- Places freed: the waiting list moves up, in the order people replied.
  if e.venue_capacity is not null then
    for w in select * from public.guest_crm where event_id = e.id and rsvp_status = 'waitlist' order by rsvp_at, created_at loop
      select coalesce(sum(party_size), 0) into v_coming from public.guest_crm where event_id = e.id and rsvp_status = 'attending';
      exit when v_coming + w.party_size > e.venue_capacity;
      update public.guest_crm set rsvp_status = 'attending' where id = w.id;
      if w.id = g.id then g.rsvp_status := 'attending'; end if;
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'status', g.rsvp_status, 'name', g.full_name,
                            'party_size', g.party_size, 'token', g.invite_token);
end $$;
revoke execute on function public.submit_rsvp(text, text, text, jsonb) from public;
grant execute on function public.submit_rsvp(text, text, text, jsonb) to anon, authenticated, service_role;

-- ─────────────────────────── 2. Festive event types ───────────────────────────

insert into public.event_types (key, label, scale, default_theme, default_toggles, repeats_yearly, sensitive, sort_order) values
  ('christmas',   'Christmas party',        'personal',    'festive', '{}', true, false, 16),
  ('new-year',    'New Year’s Eve party',   'personal',    'festive', '{}', true, false, 17),
  ('lhosar',      'Lhosar celebration',     'community',   'festive', '{"tickets": true, "sponsors": true}', true, false, 18)
on conflict (key) do nothing;

-- ─────────────────────────── 3. Moving effects ───────────────────────────

alter table public.events
  add column effect text not null default 'none' check (effect in ('none', 'snow', 'fireworks', 'petals', 'confetti'));

-- ─────────────────────────── 4. The preview picture ───────────────────────────

alter table public.events
  add column share_image_key text,
  add constraint events_cover_key_own check (cover_image_key is null
    or (cover_image_key ~ '^[0-9a-f-]{36}/cover-[a-z0-9]{6,40}\.(jpg|png|webp)$' and split_part(cover_image_key, '/', 1) = id::text)),
  add constraint events_share_key_own check (share_image_key is null
    or (share_image_key ~ '^[0-9a-f-]{36}/share-[a-z0-9]{6,40}\.(jpg|png)$' and split_part(share_image_key, '/', 1) = id::text));

grant insert (effect, share_image_key), update (effect, share_image_key) on public.events to authenticated;

-- ─────────────────────────── 5. The public page ───────────────────────────
-- Same as 0003, plus effect and share_image_key.

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
