-- 0014: food needs on the reply form (owner, 22 Nov 2026).
--
-- When the host leaves "Ask about food needs" on (Settings; feature_toggles
-- settings.food, no change needed for that), guests can tick vegetarian,
-- vegan, halal, gluten-free, nut allergy or dairy-free when they reply. Kept
-- in guest_crm.guest_metadata.food (that column has been there since 0001 for
-- diet and access needs), which only the event's own hosts can read (RLS
-- guests_read). No new table, column or grant.
--
-- The same function as 0004, plus:
--   p_reply.food  an array of those keys. Unknown keys are dropped; anything
--                 that isn't an array is refused (bad_reply). Left out, the
--                 food needs ticked before stay as they were, so a reply
--                 changed on another phone doesn't wipe them.
-- The keys must match FOOD_NEEDS in lib/catalog.ts: change both together.
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

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
  v_food   jsonb;   -- null: not sent, keep what was there
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
  if p_reply ? 'food' then
    if jsonb_typeof(p_reply->'food') is distinct from 'array' or jsonb_array_length(p_reply->'food') > 20 then
      return jsonb_build_object('ok', false, 'reason', 'bad_reply');
    end if;
    -- Only the known needs, each once, in the form's order.
    select coalesce(jsonb_agg(k order by n), '[]'::jsonb) into v_food
      from unnest(array['vegetarian', 'vegan', 'halal', 'gluten_free', 'nut_allergy', 'dairy_free']) with ordinality as a(k, n)
      where p_reply->'food' ? k;
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
    insert into public.guest_crm (event_id, full_name, party_size, rsvp_status, rsvp_at, rsvp_note, source, guest_metadata)
    values (e.id, v_name, v_size, v_final, now(), v_note, 'rsvp_form',
            case when v_food is null then '{}'::jsonb else jsonb_build_object('food', v_food) end)
    returning * into g;
  else
    update public.guest_crm set
      full_name      = case when g.source = 'rsvp_form' then v_name else full_name end,  -- the host's spelling stays
      party_size     = v_size,
      rsvp_status    = v_final,
      rsvp_at        = case when rsvp_status is distinct from v_final then now() else coalesce(rsvp_at, now()) end,
      rsvp_note      = v_note,
      guest_metadata = case when v_food is null then guest_metadata else guest_metadata || jsonb_build_object('food', v_food) end
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
