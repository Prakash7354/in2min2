-- 0011: announcements from the hosts to guests, and guests' live comments
-- and cheers on the photo show.
-- (Owner, 16 Nov 2026: "announcement functions from host to guests for any
-- news updates, change of weather plan, car park full, we are excited…",
-- then "go with announcements", and "on the live photo show, whether on TV
-- or on the phone, display guests' comments like on YouTube or Zoom live
-- shows: people cheering, loving, goosebumps or advice, with popular icons
-- and emojis … people might enjoy reading them later".)
--
-- 1. event_announcements: the owner and co-hosts post short updates (up to
--    10 a day, 280 letters each). Every host can read them; guests see them
--    through public_live() only.
-- 2. event_cheers: guests' comments and emoji cheers, sent from the photos
--    page with no account through post_cheer(), with the same limits on
--    each phone as the photos (a device id, never a name). A comment with
--    words waits for an OK when the host checks first (the default for
--    community events and memorials, like photos); an emoji alone shows at
--    once. Any host, helpers too, can hide one; the owner and co-hosts can
--    delete.
-- 3. The host's switches sit in feature_toggles.settings.cheers:
--    { on, approve_first, tv: "right" | "bottom" | "off" } (cheer_rules()).
-- 4. public_live(): what guests and the TV poll every few seconds: the
--    announcements, the cheer switches, and the newest comments (after a
--    time, so each poll brings only new ones). The same access as the
--    photos: public, or a private event's guest link or photo key.
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- ─────────────────────────── 1. Announcements ───────────────────────────

create table public.event_announcements (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  kind       text not null default 'info' check (kind in ('info', 'urgent', 'happy')),
  body       text not null check (char_length(btrim(body)) between 1 and 280),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index event_announcements_event_idx on public.event_announcements (event_id, created_at desc);

alter table public.event_announcements enable row level security;
create policy announcements_read on public.event_announcements for select to authenticated
  using (public.is_event_host(event_id));
create policy announcements_post on public.event_announcements for insert to authenticated
  with check (public.is_event_host(event_id, 'co_host')
              and (select count(*) from public.event_announcements a
                   where a.event_id = event_announcements.event_id and a.created_at > now() - interval '1 day') < 10);
create policy announcements_remove on public.event_announcements for delete to authenticated
  using (public.is_event_host(event_id, 'co_host'));

revoke all on public.event_announcements from anon, authenticated;   -- the public: through public_live() only
grant select, delete on public.event_announcements to authenticated;
grant insert (event_id, kind, body) on public.event_announcements to authenticated;
grant all on public.event_announcements to service_role;

-- ─────────────────────────── 2. Comments and cheers ───────────────────────────

create table public.event_cheers (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  device     text not null check (device ~ '^[a-z0-9]{16,40}$'),
  name       text check (char_length(name) <= 40),
  body       text check (char_length(body) <= 140),
  emoji      text check (emoji in ('clap', 'love', 'party', 'wow', 'laugh', 'fire', 'pray', 'tears')),
  status     text not null default 'shown' check (status in ('shown', 'waiting', 'hidden')),
  created_at timestamptz not null default now(),
  check (nullif(btrim(coalesce(body, '')), '') is not null or emoji is not null)
);
create index event_cheers_event_idx on public.event_cheers (event_id, created_at desc);
create index event_cheers_device_idx on public.event_cheers (event_id, device, created_at);

alter table public.event_cheers enable row level security;
create policy cheers_read on public.event_cheers for select to authenticated
  using (public.is_event_host(event_id));
create policy cheers_review on public.event_cheers for update to authenticated
  using (public.is_event_host(event_id)) with check (public.is_event_host(event_id));
create policy cheers_remove on public.event_cheers for delete to authenticated
  using (public.is_event_host(event_id, 'co_host'));

revoke all on public.event_cheers from anon, authenticated;   -- the public: through post_cheer() and public_live() only
grant select, delete on public.event_cheers to authenticated;
grant update (status) on public.event_cheers to authenticated;
grant all on public.event_cheers to service_role;

-- ─────────────────────────── 3. The host's switches ───────────────────────────

create or replace function public.cheer_rules(e public.events) returns jsonb
language sql stable security definer set search_path = public as $$
  with x as (
    select coalesce(f.settings #> '{cheers,on}' <> 'false'::jsonb, true) and coalesce(f.photo_wall, true) as cheers_on,
           case f.settings #> '{cheers,approve_first}' when 'true'::jsonb then true when 'false'::jsonb then false
                else e.scale = 'community' or coalesce(t.sensitive, false) end as approve_first,
           case when f.settings #>> '{cheers,tv}' in ('right', 'bottom', 'off') then f.settings #>> '{cheers,tv}' else 'right' end as tv
    from (select 1) one
    left join public.feature_toggles f on f.event_id = e.id
    left join public.event_types t on t.key = e.event_type)
  select jsonb_build_object('on', cheers_on, 'approve_first', approve_first, 'tv', tv,
                            'open', cheers_on and (public.photo_rules(e)->>'open')::boolean)
  from x
$$;

-- ─────────────────────────── 4. Sending a cheer ───────────────────────────
-- Reasons: bad, no_event, closed, private, off, not_open, busy.

create or replace function public.post_cheer(p_type text, p_slug text, p_token text, p_device text,
  p_name text, p_body text, p_emoji text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  e        public.events;
  r        jsonb;
  v_body   text := nullif(btrim(coalesce(p_body, '')), '');
  v_name   text := nullif(btrim(coalesce(p_name, '')), '');
  v_emoji  text := nullif(btrim(coalesce(p_emoji, '')), '');
  v_status text;
  v_id     uuid;
begin
  if coalesce(p_device, '') !~ '^[a-z0-9]{16,40}$'
     or (v_body is null and v_emoji is null)
     or char_length(coalesce(v_body, '')) > 140 or char_length(coalesce(v_name, '')) > 40
     or (v_emoji is not null and v_emoji not in ('clap', 'love', 'party', 'wow', 'laugh', 'fire', 'pray', 'tears')) then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;
  select * into e from public.events where event_type = p_type and slug = p_slug and status <> 'draft';
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_event'); end if;
  if public.stage(e) in ('expired', 'cancelled') then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  if not public.photo_access(e, p_token) then return jsonb_build_object('ok', false, 'reason', 'private'); end if;
  r := public.cheer_rules(e);
  if not (r->>'on')::boolean then return jsonb_build_object('ok', false, 'reason', 'off'); end if;
  if not (r->>'open')::boolean then return jsonb_build_object('ok', false, 'reason', 'not_open'); end if;
  -- Each phone: 20 comments and 80 cheers in all per 10 minutes; each event: 5,000.
  if (v_body is not null and (select count(*) from public.event_cheers
        where event_id = e.id and device = p_device and body is not null and created_at > now() - interval '10 minutes') >= 20)
     or (select count(*) from public.event_cheers where event_id = e.id and device = p_device and created_at > now() - interval '10 minutes') >= 80
     or (select count(*) from public.event_cheers where event_id = e.id and created_at > now() - interval '10 minutes') >= 5000 then
    return jsonb_build_object('ok', false, 'reason', 'busy');
  end if;
  v_status := case when v_body is not null and (r->>'approve_first')::boolean then 'waiting' else 'shown' end;
  insert into public.event_cheers (event_id, device, name, body, emoji, status)
    values (e.id, p_device, v_name, v_body, v_emoji, v_status) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'status', v_status);
end $$;

-- ─────────────────────────── 5. What guests and the TV see ───────────────────────────

create or replace function public.public_live(p_type text, p_slug text, p_token text default null, p_after timestamptz default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  e public.events;
  s public.lifecycle_stage;
  r jsonb;
begin
  select * into e from public.events where event_type = p_type and slug = p_slug and status <> 'draft';
  if not found then return null; end if;
  s := public.stage(e);
  if s in ('expired', 'cancelled') then return jsonb_build_object('stage', s); end if;
  if not public.photo_access(e, p_token) then return jsonb_build_object('stage', s, 'private', true); end if;
  r := public.cheer_rules(e);
  return jsonb_build_object(
    'stage', s,
    'now', now(),
    'announcements', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'kind', a.kind, 'body', a.body, 'at', a.created_at) order by a.created_at desc)
      from (select * from public.event_announcements where event_id = e.id order by created_at desc limit 10) a), '[]'::jsonb),
    'cheer_rules', r,
    'cheers', case when (r->>'on')::boolean then coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'body', c.body, 'emoji', c.emoji, 'at', c.created_at) order by c.created_at desc)
      from (select * from public.event_cheers
            where event_id = e.id and status = 'shown' and (p_after is null or created_at > p_after)
            order by created_at desc limit 80) c), '[]'::jsonb) else '[]'::jsonb end
  );
end $$;

revoke execute on function public.cheer_rules(public.events) from public, anon, authenticated;
revoke execute on function public.post_cheer(text, text, text, text, text, text, text) from public;
revoke execute on function public.public_live(text, text, text, timestamptz) from public;
grant execute on function public.cheer_rules(public.events) to service_role;
grant execute on function public.post_cheer(text, text, text, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.public_live(text, text, text, timestamptz) to anon, authenticated, service_role;
