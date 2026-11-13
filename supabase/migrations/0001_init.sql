-- In2Min2 · first migration
-- ═══════════════════════════════════════════════════════════════════════════
-- Run once on a fresh Supabase project (SQL Editor › New query › paste › Run).
-- It creates types and tables, so it is not re-runnable.
--
-- Carried over from Golf Society Home, deliberately:
--   * IDs are uuids, never names. Money is whole pence (integer).
--   * Every event-owned row carries event_id and is protected by Row Level
--     Security. A host never sees another host's events or guests.
--   * The public never reads a table directly. Public pages call
--     security-definer functions that return only what a guest may see
--     (golf: public_event(), 0017).
--
-- Golf → In2Min2:
--   societies            → events            (one row per celebration)
--   membership roles     → event_hosts       (Secretary → owner, Organiser → co_host)
--   tee times / rounds   → sub_events        (Ceremony, Reception, Match 1 …)
--   members + handicaps  → guest_crm         (+ guest_metadata for diet, team, size …)
--   plans and limits     → plans             (hosting length, photo and guest limits)
--   event settings       → feature_toggles   (the builder's on/off switches)
--
-- Text limits on the five AI boxes match lib/ai/copy.ts. Change both together.

create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────── Reference data ───────────────────────────────

-- How big the event is. Chosen first in the builder; it decides which
-- switches a host ever sees, so a birthday never shows "car park fees".
--   personal    : friends and family (birthday, Pasni, party)
--   celebration : a big family occasion over weeks (wedding, anniversary, Bratabandha)
--   community   : a public event that may sell things (mela, tournament, fundraiser)
create type public.event_scale as enum ('personal', 'celebration', 'community');

-- What a host can buy. Prices live here, not in code, so they can change
-- without a release. PROVISIONAL launch prices: see docs/CONCEPT.md, "Pricing".
-- The plan buys TIME (how long the page stays up after the event); people
-- included rise 200 → 300 → 400 → 500, and packs of +100 cover any more.
create table public.plans (
  key                text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  name               text not null,
  price_pence        integer not null default 0 check (price_pence >= 0),
  currency           text not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),
  hosting_days_after integer not null check (hosting_days_after > 0), -- page stays up this long after the event ends
  guest_limit        integer check (guest_limit > 0),                 -- null = no limit (fair use)
  photo_limit        integer check (photo_limit > 0),                 -- null = no limit (fair use)
  photos_per_guest   integer check (photos_per_guest > 0),            -- stops one phone filling the wall
  ai_writes          integer not null default 5 check (ai_writes >= 0),
  full_res_download  boolean not null default false,
  hide_branding      boolean not null default false,                  -- "Made with In2Min2" footer
  -- In2Min2's booking fee on each ONLINE order (tickets, entries, stalls,
  -- parking), card costs included. Cash on the day is never charged.
  booking_fee_bps    integer not null default 0 check (booking_fee_bps between 0 and 2000), -- 400 = 4%
  booking_fee_pence  integer not null default 0 check (booking_fee_pence >= 0),
  scales             public.event_scale[] not null default '{personal,celebration}', -- offered to these scales
  -- More guests without changing plan: each pack adds guest_pack_size guests
  -- for guest_pack_pence. Null = not sold on this plan.
  guest_pack_size    integer check (guest_pack_size > 0),
  guest_pack_pence   integer check (guest_pack_pence >= 0),
  sort_order         integer not null default 0,
  is_active          boolean not null default true
);

insert into public.plans (key, name, price_pence, hosting_days_after, guest_limit, photo_limit, photos_per_guest, ai_writes,
                          full_res_download, hide_branding, booking_fee_bps, booking_fee_pence, scales,
                          guest_pack_size, guest_pack_pence, sort_order) values
  ('popup',     'Pop-Up',       0,   7, 200,   50, 10,  5, false, false,   0,  0, '{personal,celebration}', 100, 300, 1),
  ('season',    'Season',     900,  90, 300,  300, 20, 30, false, false,   0,  0, '{personal,celebration}', 100, 300, 2),
  ('half_year', 'Half-Year', 1500, 182, 400,  600, 20, 50, false, false,   0,  0, '{personal,celebration}', 100, 300, 3),
  ('keepsake',  'Keepsake',  2500, 365, 500, 1000, 30, 100, true, true,    0,  0, '{personal,celebration}', 100, 300, 4),
  ('community', 'Community',    0,  90, null, 2000, 20, 30, false, false, 400, 30, '{community}',           null, null, 5);

-- The first part of an event's address: in2min2.com/{event_type}/{slug}.
-- A table rather than an enum so a new type needs no migration, and each type
-- carries the defaults that make "two minutes" possible.
-- Keys must never clash with an app route (api, builder, e, dashboard, …).
create table public.event_types (
  key              text primary key check (key ~ '^[a-z]+(-[a-z]+)*$' and key not in
                     ('api','app','admin','builder','dashboard','e','c','g','live','login','signin','signup',
                      'pricing','help','terms','privacy','about','blog','static','assets','_next',
                      'contact','demo','how-it-works','communities','faq')),
  label            text not null,
  scale            public.event_scale not null,
  default_theme    text not null default 'classic',
  default_toggles  jsonb not null default '{}'::jsonb check (jsonb_typeof(default_toggles) = 'object'),
  -- Does this kind of event come round every year? Drives "Run it again" and
  -- the same-again discount (CONCEPT 5g). A wedding comes back as its
  -- anniversary (repeat_as).
  repeats_yearly   boolean not null default false,
  repeat_as        text references public.event_types(key) on update cascade,
  -- A sad or delicate occasion: never sent offers, discounts or "run it again"
  -- reminders; calm look and no celebration animation by default.
  sensitive        boolean not null default false,
  sort_order       integer not null default 0
);

insert into public.event_types (key, label, scale, default_theme, default_toggles, repeats_yearly, sensitive, sort_order) values
  ('birthday',    'Birthday',               'personal',    'modern',  '{}', true, false, 1),
  ('pasni',       'Pasni (rice feeding)',   'personal',    'festive', '{"gift_registry": true}', false, false, 2),
  ('party',       'Party',                  'personal',    'modern',  '{}', false, false, 3),
  ('ceremony',    'Family ceremony',        'personal',    'festive', '{"gift_registry": true}', false, false, 4),
  ('wedding',     'Wedding',                'celebration', 'classic', '{"gift_registry": true, "guestbook": true}', true, false, 5),
  ('engagement',  'Engagement',             'celebration', 'classic', '{"guestbook": true}', false, false, 6),
  ('anniversary', 'Wedding anniversary',    'celebration', 'classic', '{"guestbook": true}', true, false, 7),
  ('bratabandha', 'Bratabandha',            'celebration', 'festive', '{"gift_registry": true}', false, false, 8),
  ('reunion',     'Reunion or regimental day', 'celebration', 'classic', '{"guestbook": true}', true, false, 9),
  ('corporate',   'Corporate event',        'celebration', 'modern',  '{"sponsors": true}', true, false, 10),
  ('mela',        'Mela / festival',        'community',   'festive', '{"rsvp": false, "tickets": true, "stalls": true, "parking": true, "sponsors": true}', true, false, 11),
  ('sport',       'Sports tournament',      'community',   'sport',   '{"rsvp": false, "tickets": true, "team_entries": true, "stalls": true, "parking": true, "sponsors": true, "live_scores": true}', true, false, 12),
  ('charity',     'Charity or fundraiser',  'community',   'festive', '{"tickets": true, "sponsors": true}', true, false, 13),
  ('community',   'Community event',        'community',   'festive', '{"tickets": true, "sponsors": true}', true, false, 14),
  -- Several rites over days, numbers for the meal, a condolence book; never "celebration" in the wording.
  ('memorial',    'Memorial or funeral',    'celebration', 'classic', '{"guestbook": true}', false, true, 15);

-- A wedding comes back next year as its first anniversary.
update public.event_types set repeat_as = 'anniversary' where key = 'wedding';

-- ─────────────────────────────────── Types ───────────────────────────────────

create type public.event_status    as enum ('draft', 'published', 'cancelled');
-- Worked out from the clock by public.stage(), never stored. See below.
create type public.lifecycle_stage as enum ('draft', 'pre', 'live', 'post', 'expired', 'cancelled');
create type public.theme_template  as enum ('classic', 'modern', 'festive', 'sport');
-- In order of power: owner > co_host > helper (enum order is used in checks).
create type public.host_role       as enum ('owner', 'co_host', 'helper');
-- Standard: guest, plus_one, child · Commercial: sponsor, vendor, vip · Group: team
create type public.guest_category  as enum ('guest', 'plus_one', 'child', 'sponsor', 'vendor', 'vip', 'team');
create type public.rsvp_status     as enum ('invited', 'attending', 'maybe', 'declined', 'waitlist');
create type public.contact_channel as enum ('whatsapp', 'email', 'sms');

-- A short code for in2min2.com/e/{code}. No 0/o, 1/l/i: easy to read aloud.
create or replace function public.new_short_code() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  code text;
begin
  loop
    code := '';
    for i in 1..5 loop
      code := code || substr(alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % length(alphabet)), 1);
    end loop;
    exit when not exists (select 1 from public.events where short_code = code);
  end loop;
  return code;
end $$;

-- The second language's text boxes, {"ne": {"card_headline": …, …}}, held to
-- the same limits as the main boxes (lib/ai/copy.ts).
create or replace function public.copy_fits(t jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(t) = 'object' and not exists (
    select 1 from jsonb_each(t) as l(lang, box)
    where l.lang !~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?$'
       or jsonb_typeof(box) <> 'object'
       or char_length(coalesce(box->>'card_headline', ''))        > 45
       or char_length(coalesce(box->>'card_invite_body', ''))     > 180
       or char_length(coalesce(box->>'landing_page_story', ''))   > 450
       or char_length(coalesce(box->>'guest_note_box', ''))       > 140
       or char_length(coalesce(box->>'post_event_thank_you', '')) > 220)
$$;

-- ─────────────────────────────────── Events ───────────────────────────────────

create table public.events (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_type          text not null references public.event_types(key) on update cascade,
  scale               public.event_scale not null,   -- filled from the type if not given (set_hosting_until)
  slug                text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  short_code          text not null unique,
  title               text not null check (char_length(title) between 1 and 120),
  host_names          text check (char_length(host_names) <= 120),

  -- When and where. The event's own time zone decides when "the day" starts.
  timezone            text not null default 'Europe/London',
  starts_at           timestamptz not null,
  ends_at             timestamptz,
  venue_name          text check (char_length(venue_name) <= 120),
  venue_address       text check (char_length(venue_address) <= 300),
  venue_lat           numeric(9,6) check (venue_lat between -90 and 90),
  venue_lng           numeric(9,6) check (venue_lng between -180 and 180),
  -- Shown to guests: is there parking, and is it free?
  parking             text not null default 'unknown' check (parking in ('unknown', 'none', 'free', 'paid', 'street')),
  parking_note        text check (char_length(parking_note) <= 140),  -- "Free car park behind the hall, 40 spaces"

  -- Numbers for planning, never shown to guests. expected_guests is the
  -- host's own estimate (it suggests the plan); venue_capacity is the most
  -- people the venue safely holds (replies and tickets stop there, phase 2).
  expected_guests     integer check (expected_guests between 1 and 100000),
  venue_capacity      integer check (venue_capacity between 1 and 100000),

  -- Who is behind the event, shown on the public page. A community event
  -- can't be published without it (check below), so nobody sells tickets
  -- anonymously and buyers can see whether anyone profits. Anyone taking
  -- money online is also identity-checked by Stripe.
  organiser_name      text check (char_length(organiser_name) <= 120),
  organiser_type      text check (organiser_type in ('family', 'individual', 'business', 'community_group',
                                                     'club', 'charity', 'armed_forces', 'faith')),
  for_profit          boolean,                      -- "Is anyone making a profit from this event?"
  charity_number      text check (charity_number ~ '^[A-Z0-9]{4,12}$'), -- optional; the owner checks it on the charity register
  organiser_contact   text check (char_length(organiser_contact) <= 120), -- the phone or email the organiser chooses to show

  -- The facts given to the AI, kept so "Generate again" needs no retyping.
  language_mix        text check (char_length(language_mix) <= 80),
  tone                text check (char_length(tone) <= 60),

  -- One or two languages, main first: '{en}', '{ne,en}', '{en,ne-Latn}' (Nepali in English letters).
  languages           text[] not null default '{en}' check (cardinality(languages) between 1 and 2
                        and array_to_string(languages, ',') ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(,[a-z]{2,3}(-[A-Z][a-z]{3})?)?$'),

  -- The five AI text boxes, in the main language. Limits match lib/ai/copy.ts.
  card_headline        text check (char_length(card_headline) <= 45),
  card_invite_body     text check (char_length(card_invite_body) <= 180),
  landing_page_story   text check (char_length(landing_page_story) <= 450),
  guest_note_box       text check (char_length(guest_note_box) <= 140),
  post_event_thank_you text check (char_length(post_event_thank_you) <= 220),
  -- The same five boxes in the second language: {"ne": {"card_headline": "…", …}}
  copy_translations    jsonb not null default '{}'::jsonb check (public.copy_fits(copy_translations)),
  ai_writes_used       integer not null default 0 check (ai_writes_used >= 0),

  -- The look: a template plus a few ready-made choices. Nothing is free-form.
  theme               public.theme_template not null default 'classic',
  primary_color       text not null default '#E11D48' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  text_style          text not null default 'classic'
                        check (text_style in ('clean', 'classic', 'elegant', 'calligraphy', 'bold')),
  photo_style         text not null default 'arch'
                        check (photo_style in ('hero', 'arch', 'polaroid', 'split')),
  motion              boolean not null default true,  -- the few animations at key moments
  cover_image_key     text,                       -- object key in the R2 photos bucket

  -- Plan and hosting. Set by the server after payment, never by the browser
  -- (see the column grants at the end of this file).
  plan                text not null default 'popup' references public.plans(key),
  extra_hosting_days  integer not null default 0 check (extra_hosting_days >= 0),
  extra_guests        integer not null default 0 check (extra_guests >= 0),  -- guest packs bought
  hosting_until       timestamptz,                -- filled in by set_hosting_until()
  custom_domain       text unique check (custom_domain = lower(custom_domain) and custom_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  -- What share of In2Min2's normal charges this event pays: 100 (full, the
  -- default), 50 (half) or 0 (free). Set only by the owner of In2Min2 when an
  -- organiser asks (a memorial, a charity, an armed-forces event); the system
  -- can't judge that. Applies to the plan, guest packs and the booking fee.
  -- Stripe's own card cost still applies to online sales.
  charge_percent      integer not null default 100 check (charge_percent in (0, 50, 100)),
  charge_note         text check (char_length(charge_note) <= 200),  -- why, for his records
  -- Every year of the same event shares a series. "Run it again" copies an
  -- event into its series, which is how carry-over and the same-again
  -- discount know it is a repeat (CONCEPT 5g).
  series_id           uuid not null default gen_random_uuid(),
  -- The owner's demo account: marked "Demo", never charged, never emails.
  is_demo             boolean not null default false,

  status              public.event_status not null default 'draft',
  published_at        timestamptz,
  is_private          boolean not null default false, -- true: only guests with their own link can open it
  -- When the page closes, keep the guest list and settings (not the photos)
  -- for up to 13 months so next year's event can start from them. Otherwise
  -- everything is deleted 30 days after closing.
  keep_for_next_year  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (event_type, slug),
  check (ends_at is null or ends_at >= starts_at),
  -- A community event can't go public without saying who runs it and whether anyone profits.
  constraint community_organiser_named check (scale <> 'community' or status <> 'published'
    or (organiser_name is not null and organiser_type is not null and for_profit is not null))
);

alter table public.events alter column short_code set default public.new_short_code();
create index events_owner_idx on public.events (owner_id);
create index events_starts_idx on public.events (starts_at);
create index events_series_idx on public.events (series_id);

-- Who runs an event. The creator is added as owner automatically.
--   owner   : everything, including plan, payments, deleting and adding hosts
--   co_host : edits the event, guests and photos
--   helper  : sees the guest list (door check-in) and moderates photos
create table public.event_hosts (
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.host_role not null default 'co_host',
  added_at   timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_hosts_user_idx on public.event_hosts (user_id);

-- The people the day is about, and the family it honours. Shown with pride
-- on the card and the page: the stars large, the honoured family in a row
-- beneath ("With blessings from").
--   star   : the child, the couple, the birthday person, the team
--   honour : parents, grandparents, uncles and aunts, the committee
create table public.event_people (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  role        text not null default 'star' check (role in ('star', 'honour')),
  relation    text check (char_length(relation) <= 40),        -- "Bride", "Parents", "Grandparents"
  names       text not null check (char_length(names) between 1 and 120),
  names_local text check (char_length(names_local) <= 120),     -- in the second language's script
  photo_key   text,                                            -- R2 object key
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index event_people_event_idx on public.event_people (event_id, role, sort_order);

-- ──────────────────────────────── Sub-events ────────────────────────────────
-- The parts of the day, or the days of a festival: Mehndi, Ceremony,
-- Reception; Match 1, Final; Day 1, Day 2. Golf's tee times and rounds.

create table public.sub_events (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 80),
  kind          text not null default 'other' check (kind ~ '^[a-z_]+$'), -- ceremony, reception, mehndi, match, meal, other…
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  venue_name    text check (char_length(venue_name) <= 120),            -- null = same as the main event
  venue_address text check (char_length(venue_address) <= 300),
  venue_lat     numeric(9,6) check (venue_lat between -90 and 90),
  venue_lng     numeric(9,6) check (venue_lng between -180 and 180),
  description   text check (char_length(description) <= 500),
  dress_code    text check (char_length(dress_code) <= 140),
  capacity      integer check (capacity > 0),
  invite_only   boolean not null default false,  -- shown only to guests invited to it (e.g. a family-only Mehndi)
  sort_order    integer not null default 0,
  details       jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'), -- e.g. {"home_team": …, "pitch": 2}
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, event_id),
  check (ends_at is null or ends_at >= starts_at)
);
create index sub_events_event_idx on public.sub_events (event_id, starts_at);

-- ──────────────────────────────── Guest CRM ────────────────────────────────
-- One row per invitee, of any kind: a wedding guest, a child, a sponsor, a
-- stall vendor, or a whole team entry. New kinds go in guest_category; new
-- details go in guest_metadata (no migration needed).
--
-- Head count: party_size is the number of people THIS row stands for. A
-- person is 1. A team entry or an unnamed "family of four" is 4. A named
-- plus-one gets its own row (category plus_one, primary_guest_id set) with
-- party_size 1. Attending head count = sum(party_size) where attending.

create table public.guest_crm (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  category          public.guest_category not null default 'guest',
  tags              text[] not null default '{}',            -- free labels: "Bride's side", "Committee", "Gold sponsor"
  full_name         text not null check (char_length(full_name) between 1 and 120),
  organisation      text check (char_length(organisation) <= 120),   -- sponsors, vendors, teams, companies
  email             text check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone             text check (phone ~ '^\+[1-9][0-9]{6,14}$'),     -- international format, +447700900123
  preferred_channel public.contact_channel not null default 'whatsapp',
  primary_guest_id  uuid,                                      -- plus-ones and children belong to a main guest
  party_size        smallint not null default 1 check (party_size between 1 and 500),
  table_label       text check (char_length(table_label) <= 40),
  team_name         text check (char_length(team_name) <= 80),

  rsvp_status       public.rsvp_status not null default 'invited',
  rsvp_at           timestamptz,
  rsvp_note         text check (char_length(rsvp_note) <= 500),
  checked_in_at     timestamptz,

  -- Their own link: in2min2.com/e/{short_code}?g={invite_token}. Opens the
  -- page with their name, their sub-events and a one-tap reply (golf: /c/…).
  invite_token      text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  invited_at        timestamptz,
  last_contacted_at timestamptz,
  source            text not null default 'host' check (source in ('host', 'rsvp_form', 'import', 'self_signup')),

  -- Diet, allergies, access needs, shirt size, sponsor tier, handicap…
  guest_metadata    jsonb not null default '{}'::jsonb check (jsonb_typeof(guest_metadata) = 'object'),

  -- Money, written only by the Stripe webhook (phase 5). Whole pence.
  amount_due_pence  integer not null default 0 check (amount_due_pence >= 0),
  amount_paid_pence integer not null default 0 check (amount_paid_pence >= 0),

  consent_updates   boolean not null default false,            -- may we email them about THIS event's changes
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (id, event_id),
  -- A plus-one must belong to a guest of the same event.
  foreign key (primary_guest_id, event_id) references public.guest_crm (id, event_id) on delete cascade
);
create index guest_crm_event_idx    on public.guest_crm (event_id, category);
create index guest_crm_rsvp_idx     on public.guest_crm (event_id, rsvp_status);
create index guest_crm_primary_idx  on public.guest_crm (primary_guest_id);
-- One main-guest row per email per event (golf 0056: one reply each).
create unique index guest_crm_one_email on public.guest_crm (event_id, email)
  where email is not null and primary_guest_id is null;

-- Who is invited to, and coming to, which part of the event.
create table public.sub_event_guests (
  sub_event_id uuid not null,
  guest_id     uuid not null,
  event_id     uuid not null,
  rsvp_status  public.rsvp_status not null default 'invited',
  primary key (sub_event_id, guest_id),
  -- Both must belong to the same event.
  foreign key (sub_event_id, event_id) references public.sub_events (id, event_id) on delete cascade,
  foreign key (guest_id, event_id)     references public.guest_crm (id, event_id) on delete cascade
);
create index sub_event_guests_guest_idx on public.sub_event_guests (guest_id);
create index sub_event_guests_event_idx on public.sub_event_guests (event_id);

-- ─────────────────────────────── Feature toggles ───────────────────────────────
-- The builder's on/off switches, one row per event, created with the event
-- from its type's defaults. Every switch works on every plan; plans differ in
-- how long the page stays up and how many guests and photos it holds.
-- Which switches a host SEES depends on the event's scale (lib config), so a
-- birthday host is never shown tickets, stalls or parking.

create table public.feature_toggles (
  event_id        uuid primary key references public.events(id) on delete cascade,
  -- every scale
  ai_copy         boolean not null default true,   -- AI text generation
  rsvp            boolean not null default true,   -- RSVP form before the day
  countdown       boolean not null default true,
  schedule        boolean not null default true,   -- sub-events timeline
  map_directions  boolean not null default true,   -- interactive map and directions
  photo_wall      boolean not null default true,   -- live photo wall on the day, gallery after
  auto_reminders  boolean not null default true,   -- email reminder 24 hours before
  -- personal and celebration
  gift_registry   boolean not null default false,  -- gift list link or cash gifts
  guestbook       boolean not null default false,  -- written messages from guests
  -- community and sport
  tickets         boolean not null default false,  -- entry tickets: online price and on-the-day price
  team_entries    boolean not null default false,  -- teams apply and pay to enter; draw and fixtures
  stalls          boolean not null default false,  -- businesses apply for a stall
  parking         boolean not null default false,  -- car park passes
  live_scores     boolean not null default false,  -- results and tables update live
  sponsors        boolean not null default false,  -- sponsor logos and tiers
  settings        jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
                  -- options per switch, e.g. {"gift_registry": {"url": "…"}, "photo_wall": {"approve_first": true}}
  updated_at      timestamptz not null default now()
);

-- ─────────────────────────────── Launch offers ───────────────────────────────
-- "Free Keepsake for the first 50 families": a code with a fixed number of
-- places. claim_offer() takes a place atomically, so the 51st family sees the
-- normal price with no one counting by hand. One place per account.

create table public.offers (
  code        text primary key check (code ~ '^[A-Z0-9]{4,20}$'),
  label       text not null,
  plan        text not null references public.plans(key),
  max_claims  integer not null check (max_claims > 0),
  claims      integer not null default 0 check (claims >= 0),
  ends_at     timestamptz,
  is_active   boolean not null default true,
  check (claims <= max_claims)
);

create table public.offer_claims (
  offer_code text not null references public.offers(code),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  event_id   uuid references public.events(id) on delete set null,  -- kept if the event is deleted, so it can't be claimed twice
  claimed_at timestamptz not null default now(),
  primary key (offer_code, owner_id)
);

insert into public.offers (code, label, plan, max_claims) values
  ('LAUNCH50', 'Free Keepsake for the first 50 families', 'keepsake', 50);

-- ─────────────────────────────── Triggers ───────────────────────────────

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger events_touch           before update on public.events          for each row execute function public.touch_updated_at();
create trigger sub_events_touch       before update on public.sub_events      for each row execute function public.touch_updated_at();
create trigger guest_crm_touch        before update on public.guest_crm       for each row execute function public.touch_updated_at();
create trigger feature_toggles_touch  before update on public.feature_toggles for each row execute function public.touch_updated_at();

-- Scale, plan and how long the page stays up.
--   * Scale comes from the event type unless the host chose one.
--   * A free plan follows the scale (community events get the Community plan,
--     whose income is the booking fee). A paid plan is never changed here.
--   * Hosting = the event's end (or start) + the plan's days + any extension.
create or replace function public.set_hosting_until() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.scale is null
     or (tg_op = 'UPDATE' and new.event_type is distinct from old.event_type
         and new.scale is not distinct from old.scale) then
    select t.scale into new.scale from public.event_types t where t.key = new.event_type;
  end if;
  if new.plan in ('popup', 'community') then
    new.plan := case when new.scale = 'community' then 'community' else 'popup' end;
  end if;

  select coalesce(new.ends_at, new.starts_at)
         + make_interval(days => p.hosting_days_after + new.extra_hosting_days)
    into new.hosting_until
    from public.plans p where p.key = new.plan;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

create trigger events_hosting before insert or update of plan, scale, event_type, starts_at, ends_at, extra_hosting_days, status
  on public.events for each row execute function public.set_hosting_until();

-- A new event gets its owner as host and its switches from the type's defaults.
create or replace function public.event_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  defaults jsonb;
  t public.feature_toggles;
begin
  insert into public.event_hosts (event_id, user_id, role) values (new.id, new.owner_id, 'owner');

  select default_toggles into defaults from public.event_types where key = new.event_type;
  -- Start from the column defaults, then lay the type's defaults over them.
  insert into public.feature_toggles (event_id) values (new.id) returning * into t;
  t := jsonb_populate_record(t, coalesce(defaults, '{}'::jsonb) - 'event_id');
  delete from public.feature_toggles where event_id = new.id;
  insert into public.feature_toggles select (t).*;
  return new;
end $$;

create trigger events_created after insert on public.events
  for each row execute function public.event_created();

-- ────────────────────────────── Helpers ──────────────────────────────

-- Does the signed-in person run this event, at least at this level?
-- (owner < co_host < helper in enum order, so "role <= min_role".)
create or replace function public.is_event_host(e uuid, min_role public.host_role default 'helper')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.event_hosts h
    where h.event_id = e and h.user_id = auth.uid() and h.role <= min_role)
$$;

-- Where the event is in its life, from the clock alone. No host ever has to
-- flip the page from invitation to live to memory book.
--   pre     : invitation, countdown, RSVP
--   live    : from midnight (event's time zone) on the day until it ends: photo upload, live schedule
--   post    : thank-you message and gallery, until hosting_until
--   expired : page closed (the host can still extend)
-- Callable from the API as a computed column: events?select=*,stage
create or replace function public.stage(e public.events) returns public.lifecycle_stage
language sql stable set search_path = public as $$
  select (case
    when e.status = 'cancelled' then 'cancelled'
    when e.status = 'draft'     then 'draft'
    when now() >= e.hosting_until then 'expired'
    when now() >= coalesce(e.ends_at,
           (((e.starts_at at time zone e.timezone)::date + 1)::timestamp at time zone e.timezone)) then 'post'
    when now() >= (((e.starts_at at time zone e.timezone)::date)::timestamp at time zone e.timezone) then 'live'
    else 'pre'
  end)::public.lifecycle_stage
$$;

-- The builder's single settings object: { theme_config, feature_flags, feature_settings }.
-- Runs as the caller, so Row Level Security decides who may read it.
create or replace function public.event_settings(p_event uuid) returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'scale',            e.scale,
    'languages',        to_jsonb(e.languages),
    'theme_config',     jsonb_build_object('template', e.theme, 'primary_color', e.primary_color,
                          'text_style', e.text_style, 'photo_style', e.photo_style, 'motion', e.motion),
    'feature_flags',    to_jsonb(f) - 'event_id' - 'settings' - 'updated_at',
    'feature_settings', f.settings)
  from public.events e join public.feature_toggles f on f.event_id = e.id
  where e.id = p_event
$$;

-- The dashboard's "how full is my event" panel and the upgrade prompts.
-- Head count = people invited or coming (declined and waiting list don't
-- count). Levels: ok, near (80%), full (100%), over. Runs as the caller.
create or replace function public.event_usage(p_event uuid) returns jsonb
language sql stable security invoker set search_path = public as $$
  with e as (
    select ev.*, p.guest_limit + ev.extra_guests as guest_limit, p.guest_pack_size, p.guest_pack_pence,
           greatest(p.ai_writes - ev.ai_writes_used, 0) as ai_writes_left
    from public.events ev join public.plans p on p.key = ev.plan where ev.id = p_event),
  g as (
    select coalesce(sum(party_size) filter (where rsvp_status in ('invited', 'attending', 'maybe')), 0)::int as people,
           coalesce(sum(party_size) filter (where rsvp_status = 'attending'), 0)::int as attending
    from public.guest_crm where event_id = p_event)
  select jsonb_build_object(
    'people', g.people,
    'attending', g.attending,
    'guest_limit', e.guest_limit,
    'level', case when e.guest_limit is null       then 'ok'
                  when g.people >  e.guest_limit     then 'over'
                  when g.people =  e.guest_limit     then 'full'
                  when g.people >= e.guest_limit * 0.8 then 'near'
                  else 'ok' end,
    'guest_pack', case when e.guest_pack_size is null then null
                       else jsonb_build_object('size', e.guest_pack_size, 'pence', e.guest_pack_pence) end,
    'expected_guests', e.expected_guests,
    'venue_capacity', e.venue_capacity,
    'capacity_left', e.venue_capacity - g.attending,
    'hosting_until', e.hosting_until,
    'ai_writes_left', e.ai_writes_left)
  from e, g
$$;

-- Take a launch-offer place for one of your own events. Locks the offer row,
-- so two families can never both take the last place.
create or replace function public.claim_offer(p_event uuid, p_code text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  e public.events;
  o public.offers;
begin
  select * into e from public.events where id = p_event;
  if not found or e.owner_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'not_owner');
  end if;
  select * into o from public.offers where code = upper(trim(p_code)) for update;
  if not found or not o.is_active or (o.ends_at is not null and now() >= o.ends_at) then
    return jsonb_build_object('ok', false, 'reason', 'no_offer');
  end if;
  if not exists (select 1 from public.plans p where p.key = o.plan and e.scale = any (p.scales)) then
    return jsonb_build_object('ok', false, 'reason', 'not_for_this_event');
  end if;
  if e.plan <> 'popup' then
    return jsonb_build_object('ok', false, 'reason', 'already_upgraded');
  end if;
  if exists (select 1 from public.offer_claims c where c.offer_code = o.code and c.owner_id = e.owner_id) then
    return jsonb_build_object('ok', false, 'reason', 'already_claimed');
  end if;
  if o.claims >= o.max_claims then
    return jsonb_build_object('ok', false, 'reason', 'all_taken');
  end if;

  insert into public.offer_claims (offer_code, owner_id, event_id) values (o.code, e.owner_id, e.id);
  update public.offers set claims = claims + 1 where code = o.code;
  update public.events set plan = o.plan where id = e.id;
  return jsonb_build_object('ok', true, 'plan', o.plan, 'places_left', o.max_claims - o.claims - 1);
end $$;

-- "12 of 50 free places left", for the pricing page. Anyone may ask.
create or replace function public.offer_places_left(p_code text) returns integer
language sql stable security definer set search_path = public as $$
  select greatest(max_claims - claims, 0) from public.offers
  where code = upper(trim(p_code)) and is_active and (ends_at is null or now() < ends_at)
$$;

-- The public event page's data. Only published events; only what a guest may
-- see; never the guest list. A private event opens only with a guest's token,
-- and invite-only sub-events show only to guests invited to them.
create or replace function public.public_event(p_type text, p_slug text, p_token text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  e public.events;
  g public.guest_crm;
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
      'theme', e.theme, 'primary_color', e.primary_color,
      'text_style', e.text_style, 'photo_style', e.photo_style, 'motion', e.motion,
      'cover_image_key', e.cover_image_key,
      'hide_branding', (select p.hide_branding from public.plans p where p.key = e.plan)),
    'people', coalesce((
      select jsonb_agg(jsonb_build_object('role', p.role, 'relation', p.relation, 'names', p.names,
                                          'names_local', p.names_local, 'photo_key', p.photo_key)
             order by p.role desc, p.sort_order)   -- 'star' before 'honour'
      from public.event_people p where p.event_id = e.id), '[]'::jsonb),
    'features', (select to_jsonb(f) - 'event_id' - 'updated_at' from public.feature_toggles f where f.event_id = e.id),
    'sub_events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', se.id, 'title', se.title, 'kind', se.kind, 'starts_at', se.starts_at, 'ends_at', se.ends_at,
               'venue_name', se.venue_name, 'venue_address', se.venue_address, 'venue_lat', se.venue_lat, 'venue_lng', se.venue_lng,
               'description', se.description, 'dress_code', se.dress_code)
             order by se.starts_at, se.sort_order)
      from public.sub_events se
      where se.event_id = e.id
        and (not se.invite_only
             or exists (select 1 from public.sub_event_guests sg where sg.sub_event_id = se.id and sg.guest_id = g.id))
    ), '[]'::jsonb),
    'guest', case when g.id is null then null else jsonb_build_object(
      'name', g.full_name, 'rsvp_status', g.rsvp_status, 'party_size', g.party_size) end
  );
end $$;

-- in2min2.com/e/{code} → the event's full address. Published events only.
create or replace function public.resolve_short_code(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('type', event_type, 'slug', slug)
  from public.events where short_code = lower(p_code) and status = 'published'
$$;

-- ─────────────────────────── Row Level Security ───────────────────────────

alter table public.plans            enable row level security;
alter table public.event_types      enable row level security;
alter table public.events           enable row level security;
alter table public.event_hosts      enable row level security;
alter table public.sub_events       enable row level security;
alter table public.event_people     enable row level security;
alter table public.guest_crm        enable row level security;
alter table public.sub_event_guests enable row level security;
alter table public.feature_toggles  enable row level security;
alter table public.offers           enable row level security;  -- no policies: reached only through claim_offer()
alter table public.offer_claims     enable row level security;

-- Prices and event types are public (they are on the pricing page).
create policy read_plans       on public.plans       for select to anon, authenticated using (is_active);
create policy read_event_types on public.event_types for select to anon, authenticated using (true);

-- Events. "owner_id = auth.uid()" is there as well as is_event_host() because
-- the owner's host row is added by a trigger that runs after the insert has
-- already been checked.
create policy events_read   on public.events for select to authenticated
  using (owner_id = auth.uid() or public.is_event_host(id));
create policy events_create on public.events for insert to authenticated
  with check (owner_id = auth.uid());
create policy events_edit   on public.events for update to authenticated
  using (public.is_event_host(id, 'co_host')) with check (public.is_event_host(id, 'co_host'));
create policy events_delete on public.events for delete to authenticated
  using (owner_id = auth.uid());

-- Hosts: every host sees the team; only the owner changes it.
create policy hosts_read  on public.event_hosts for select to authenticated using (public.is_event_host(event_id));
create policy hosts_write on public.event_hosts for all    to authenticated
  using (public.is_event_host(event_id, 'owner')) with check (public.is_event_host(event_id, 'owner'));

-- Sub-events, guests, switches: any host reads; owner and co-hosts write.
create policy sub_events_read  on public.sub_events for select to authenticated using (public.is_event_host(event_id));
create policy sub_events_write on public.sub_events for all    to authenticated
  using (public.is_event_host(event_id, 'co_host')) with check (public.is_event_host(event_id, 'co_host'));

create policy people_read  on public.event_people for select to authenticated using (public.is_event_host(event_id));
create policy people_write on public.event_people for all    to authenticated
  using (public.is_event_host(event_id, 'co_host')) with check (public.is_event_host(event_id, 'co_host'));

create policy guests_read  on public.guest_crm for select to authenticated using (public.is_event_host(event_id));
create policy guests_write on public.guest_crm for all    to authenticated
  using (public.is_event_host(event_id, 'co_host')) with check (public.is_event_host(event_id, 'co_host'));

create policy sub_guests_read  on public.sub_event_guests for select to authenticated using (public.is_event_host(event_id));
create policy sub_guests_write on public.sub_event_guests for all    to authenticated
  using (public.is_event_host(event_id, 'co_host')) with check (public.is_event_host(event_id, 'co_host'));

create policy toggles_read on public.feature_toggles for select to authenticated using (public.is_event_host(event_id));
create policy toggles_edit on public.feature_toggles for update to authenticated
  using (public.is_event_host(event_id, 'co_host')) with check (public.is_event_host(event_id, 'co_host'));

-- ─────────────────────────── Column grants ───────────────────────────
-- Row Level Security decides WHICH rows; these decide WHICH COLUMNS a
-- signed-in host may write. Plan, hosting, custom domain, AI usage, money,
-- the charge percent, the series and the demo flag are written only by the
-- server (service role) after a payment, a check or the owner's decision.

revoke insert, update on public.events from anon, authenticated;
grant insert (event_type, scale, slug, title, host_names, timezone, starts_at, ends_at,
              venue_name, venue_address, venue_lat, venue_lng, parking, parking_note,
              expected_guests, venue_capacity, organiser_name, organiser_type, for_profit,
              charity_number, organiser_contact, language_mix, tone, languages,
              card_headline, card_invite_body, landing_page_story, guest_note_box, post_event_thank_you,
              copy_translations, theme, primary_color, text_style, photo_style, motion,
              cover_image_key, status, is_private, keep_for_next_year)
  on public.events to authenticated;
grant update (event_type, scale, slug, title, host_names, timezone, starts_at, ends_at,
              venue_name, venue_address, venue_lat, venue_lng, parking, parking_note,
              expected_guests, venue_capacity, organiser_name, organiser_type, for_profit,
              charity_number, organiser_contact, language_mix, tone, languages,
              card_headline, card_invite_body, landing_page_story, guest_note_box, post_event_thank_you,
              copy_translations, theme, primary_color, text_style, photo_style, motion,
              cover_image_key, status, is_private, keep_for_next_year)
  on public.events to authenticated;

revoke insert, update on public.guest_crm from anon, authenticated;
grant insert (event_id, category, tags, full_name, organisation, email, phone, preferred_channel,
              primary_guest_id, party_size, table_label, team_name, rsvp_status, rsvp_at, rsvp_note,
              checked_in_at, invited_at, last_contacted_at, source, guest_metadata, consent_updates)
  on public.guest_crm to authenticated;
grant update (category, tags, full_name, organisation, email, phone, preferred_channel,
              primary_guest_id, party_size, table_label, team_name, rsvp_status, rsvp_at, rsvp_note,
              checked_in_at, invited_at, last_contacted_at, guest_metadata, consent_updates)
  on public.guest_crm to authenticated;

-- Switches are created by the trigger, never inserted from the browser.
revoke insert on public.feature_toggles from anon, authenticated;

-- Reference data is changed from the dashboard only.
revoke insert, update, delete on public.plans, public.event_types from anon, authenticated;

-- The anonymous public reaches event data only through these.
revoke all on public.events, public.event_hosts, public.sub_events, public.event_people, public.guest_crm,
              public.sub_event_guests, public.feature_toggles from anon;
grant execute on function public.public_event(text, text, text) to anon, authenticated;
grant execute on function public.resolve_short_code(text)       to anon, authenticated;
grant execute on function public.offer_places_left(text)        to anon, authenticated;

-- Offers: nobody reads or writes the tables; a signed-in host claims through
-- the function, which checks they own the event.
revoke all on public.offers, public.offer_claims from anon, authenticated;
revoke execute on function public.claim_offer(uuid, text) from public, anon;
grant  execute on function public.claim_offer(uuid, text) to authenticated;

-- NEXT MIGRATIONS (docs/CONCEPT.md, "Build plan"):
--   submit_rsvp(): security-definer, with golf's reply rules (0053 reply limit,
--     0056 one reply each, 0058 first reply stands). Never open guest_crm to anon inserts.
--     Stops at venue_capacity (waiting list after); past the plan's guest limit
--     it allows 10% grace, then pauses replies and tells the host (CONCEPT 5c).
--   photos, guestbook_entries
--   products, orders, order_items, cash_sales (tickets, entries, stalls, parking, receipts)
--   divisions, teams, matches (tournaments: draw, fixtures, live scores)
--   price_quote(): plan + packs, then the best ONE of charge_percent, same-again
--     (series) or welcome-back discount (CONCEPT 5g, 5h). Phase 1.
--   repeat_event(): "Run it again" — copies an event into its series with next
--     year's date (repeat_as for weddings), guests only if keep_for_next_year.
