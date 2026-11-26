-- 0018: enquiries and the owner's admin (owner's decisions, 26 Nov 2026;
-- docs/PLAN-admin-enquiries.md).
--
-- in2min2.com/contact lets anyone send the owner a message. in2min2.com/admin
-- (sign in with the normal email code) shows them, with a few totals.
--
--   public.admins      who may open /admin. Only the owner's SQL (or the
--                      server) can add a person: see "Make yourself the admin"
--                      at the bottom. Nobody's email is written in this file.
--   public.enquiries   every message. `source` says which business it came
--                      from ('in2min2'), so a later Gochuchuro hub can gather
--                      messages from in2min2 and Golf Society Home.
--   submit_enquiry()   the only way a message gets in (the public never touches
--                      the table). Checks the lengths and the email, ignores a
--                      filled-in hidden "website" box (a robot), and stops
--                      floods: 3 an hour from one email, 30 an hour in total.
--   is_admin()         true for a signed-in admin.
--   admin_overview()   the totals on the admin home page. Nothing for anyone
--                      who isn't an admin.
--
-- Admins can read enquiries, change only their status, the replied time and
-- their own private notes (never what the person wrote), and delete one (a
-- "please delete my data" request). Enquiries are in the nightly backup
-- automatically (0012 copies every table).
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

-- 1. Who may open /admin.
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy admins_self on public.admins for select to authenticated using (user_id = auth.uid());
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
grant all on public.admins to service_role;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- 2. The messages.
create table public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  source      text not null default 'in2min2' check (char_length(source) between 1 and 40),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (char_length(email) between 5 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone       text check (char_length(phone) <= 40),
  message     text not null check (char_length(message) between 5 and 2000),
  status      text not null default 'new' check (status in ('new', 'replied', 'archived', 'spam')),
  replied_at  timestamptz,
  notes       text check (char_length(notes) <= 2000)
);
create index enquiries_status_idx on public.enquiries (status, created_at desc);
alter table public.enquiries enable row level security;
create policy enquiries_admin_read   on public.enquiries for select to authenticated using (public.is_admin());
create policy enquiries_admin_update on public.enquiries for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enquiries_admin_delete on public.enquiries for delete to authenticated using (public.is_admin());
revoke all on public.enquiries from anon, authenticated;
grant select, delete on public.enquiries to authenticated;
grant update (status, replied_at, notes) on public.enquiries to authenticated;
grant all on public.enquiries to service_role;

-- 3. Sending one.
create or replace function public.submit_enquiry(p_name text, p_email text, p_phone text, p_message text, p_website text default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_name    text := btrim(coalesce(p_name, ''));
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_phone   text := nullif(btrim(coalesce(p_phone, '')), '');
  v_message text := btrim(coalesce(p_message, ''));
begin
  -- The hidden box only a robot fills in: say thank you, keep nothing.
  if nullif(btrim(coalesce(p_website, '')), '') is not null then
    return jsonb_build_object('ok', true);
  end if;
  if char_length(v_name) not between 1 and 120 then
    return jsonb_build_object('ok', false, 'reason', 'name');
  end if;
  if char_length(v_email) not between 5 and 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('ok', false, 'reason', 'email');
  end if;
  if char_length(coalesce(v_phone, '')) > 40 then
    return jsonb_build_object('ok', false, 'reason', 'phone');
  end if;
  if char_length(v_message) not between 5 and 2000 then
    return jsonb_build_object('ok', false, 'reason', 'message');
  end if;
  if (select count(*) from public.enquiries where lower(email) = v_email and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.enquiries where created_at > now() - interval '1 hour') >= 30 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;
  insert into public.enquiries (name, email, phone, message) values (v_name, v_email, v_phone, v_message);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.submit_enquiry(text, text, text, text, text) from public;
grant execute on function public.submit_enquiry(text, text, text, text, text) to anon, authenticated, service_role;

-- 4. The totals on /admin. Counts only: no names, no messages.
create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r jsonb;
begin
  if not public.is_admin() then
    return null;
  end if;
  select jsonb_build_object(
    'enquiries', jsonb_build_object(
      'new',     (select count(*) from public.enquiries where status = 'new'),
      'total',   (select count(*) from public.enquiries where status <> 'spam'),
      'week',    (select count(*) from public.enquiries where status <> 'spam' and created_at > now() - interval '7 days')),
    'accounts',  jsonb_build_object(
      'total',   (select count(*) from auth.users),
      'hosts',   (select count(distinct owner_id) from public.events)),
    'events', jsonb_build_object(
      'total',     (select count(*) from public.events),
      'published', (select count(*) from public.events where status = 'published'),
      'drafts',    (select count(*) from public.events where status = 'draft'),
      'week',      (select count(*) from public.events where created_at > now() - interval '7 days'),
      'month',     (select count(*) from public.events where created_at > now() - interval '30 days')),
    'replies', jsonb_build_object(
      'total',     (select count(*) from public.guest_crm where rsvp_at is not null),
      'week',      (select count(*) from public.guest_crm where rsvp_at > now() - interval '7 days'),
      'attending', (select coalesce(sum(party_size), 0) from public.guest_crm where rsvp_status = 'attending')),
    'photos', jsonb_build_object(
      'total',     (select count(*) from public.event_photos)),
    'ai', jsonb_build_object(
      'week',      (select coalesce(sum(writes), 0) from public.ai_usage where day > current_date - 7)),
    'by_plan', (select coalesce(jsonb_agg(jsonb_build_object('key', plan, 'n', n) order by n desc), '[]'::jsonb)
                  from (select plan, count(*) n from public.events where status = 'published' group by plan) x),
    'by_type', (select coalesce(jsonb_agg(jsonb_build_object('key', event_type, 'n', n) order by n desc), '[]'::jsonb)
                  from (select event_type, count(*) n from public.events group by event_type order by count(*) desc limit 8) x),
    'days', (select coalesce(jsonb_agg(jsonb_build_object(
                'day', d::date,
                'events',    (select count(*) from public.events    where created_at::date = d::date),
                'enquiries', (select count(*) from public.enquiries where created_at::date = d::date and status <> 'spam')
              ) order by d), '[]'::jsonb)
               from generate_series(current_date - 13, current_date, interval '1 day') d)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated, service_role;

-- 5. Make yourself the admin (run once, AFTER you have signed in to
-- in2min2.com once with your email, so your account exists). Change
-- YOUR-EMAIL-HERE to the email you sign in with, keeping the quote marks:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'YOUR-EMAIL-HERE'
--   on conflict do nothing;
--
-- It says "Success. 1 row" when it worked, "0 rows" if that email hasn't
-- signed in yet. To add a second person later, run the same line with their
-- email.
