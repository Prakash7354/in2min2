-- 0010: a heart photo shape, and a morning sky behind the photo wheel.
-- (Owner, 16 Nov 2026: "add a subtle modern stylish love shape", and "a young
-- morning sky with a tender sun rising in the corner … inspirational for
-- birthdays".)
--
-- 1. events.photo_style may now be 'heart' too.
-- 2. photo_rules(): the host may choose the 'morning' sky. The same as 0009
--    otherwise.
--
-- No new table, so no new grants: photo_style keeps its column grants
-- (0001), and photo_rules() keeps its own (0006).
--
-- The host's credit line at the bottom of the page ("Hosted by …") needs no
-- change here: it sits in feature_toggles.settings.credit, which hosts can
-- already write and public_event() already returns (as features.settings).
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- ─────────────────────────── 1. The heart ───────────────────────────

alter table public.events drop constraint events_photo_style_check;
alter table public.events add constraint events_photo_style_check
  check (photo_style in ('hero', 'arch', 'polaroid', 'split', 'heart'));

-- ─────────────────────────── 2. The morning sky ───────────────────────────

create or replace function public.photo_rules(e public.events) returns jsonb
language sql stable security definer set search_path = public as $$
  with x as (
    select coalesce(f.photo_wall, true) as wall_on,
           case f.settings #> '{photo_wall,approve_first}' when 'true'::jsonb then true when 'false'::jsonb then false
                else e.scale = 'community' or coalesce(t.sensitive, false) end as approve_first,
           coalesce(f.settings #> '{photo_wall,early}' = 'true'::jsonb, false) as early,
           case when f.settings #>> '{photo_wall,sky}' in ('morning', 'day', 'evening', 'night', 'galaxy', 'aurora')
                then f.settings #>> '{photo_wall,sky}' else 'auto' end as sky,
           public.stage(e) as s
    from (select 1) one
    left join public.feature_toggles f on f.event_id = e.id
    left join public.event_types t on t.key = e.event_type)
  select jsonb_build_object('on', wall_on, 'approve_first', approve_first, 'early', early, 'sky', sky,
                            'open', wall_on and (s in ('live', 'post') or (s = 'pre' and early)))
  from x
$$;
