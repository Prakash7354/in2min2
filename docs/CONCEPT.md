# In2Min2: concept, business plan and build plan

*Written 12 November 2026. Owner: Prakash (GoChuchuro). Repository: `Prakash7354/in2min2`.*

This is the source of truth for what In2Min2 is and how it gets built. Claude Code: read this, then `CLAUDE.md`, then the code. Two kinds of statement appear below:

- **Decided**: the owner has said so. Build to it.
- **Recommended**: my advice, not yet confirmed by the owner. Build so it is easy to change (prices live in the `plans` table, not in code), and list it under "Open decisions" (section 21) until he confirms.

---

## 1. The idea in one line

**Your event online in two minutes, from invitation to memory book, on one link.**

A host types four facts (what, who, when and where, language). In2Min2 writes the words, dresses them in a ready-made design, and gives back one link to share on WhatsApp. That link changes by itself as the event moves along: an invitation with RSVP before the day, a live schedule and photo upload on the day, and a thank-you note with everyone's photos afterwards. The host never edits a web page. They flip switches.

## 2. Who it is for

**Beachhead: UK Nepali and South Asian families and communities** (Recommended)

- Family ceremonies: Subha Pasni (rice feeding), Bratabandha, naming ceremonies, birthdays, anniversaries.
- Weddings with several functions: Mehndi, Haldi, Sangeet, Ceremony, Reception, each with a different guest list.
- Community events: Dashain and Tihar gatherings, Teej, Lhosar, melas, fundraisers.
- Sports: community football, volleyball and cricket tournaments with team entries and sponsors.

Why start here:

1. **The owner is inside this community** (GoChuchuro, the Andover and Aldershot area, the Golf Society Home network). The first 100 hosts can come from people he knows, not from paid ads.
2. **The big tools do not serve it.** Joy, Zola and The Knot are built around one-day American weddings. They have nothing for a five-function wedding where the Mehndi is family only, for invitations in mixed Nepali and English, or for relatives abroad following along.
3. **WhatsApp is how these invitations already travel.** Today that means a JPEG card in a family group and replies lost in the chat. In2Min2 keeps the WhatsApp habit and adds a proper RSVP list.
4. **The events are frequent and cross-generational.** One Subha Pasni reaches 100+ guests, and several of them will host something within the year.

**Then:** all UK celebrations (birthdays, parties, mainstream weddings), then **organisers who run events repeatedly**: clubs, community committees, sports leagues, golf societies, event planners. They become a subscription (section 11).

## 3. The market (researched November 2026)

| Category | Examples | What they charge | What they lack for us |
| --- | --- | --- | --- |
| Free wedding websites | Joy, Zola | Website and RSVP free; extras paid (custom domain about $18–20 a year) | Built for one-day US weddings; no multi-function invite lists; little multilingual support |
| Paid digital invitations | Greenvelope, Paperless Post, Evite | Greenvelope about $19 (20 guests) to $99 (100 guests); Paperless Post about $1 per guest; Evite Premium about $250 a year | Invitation only: no live day, no photo wall, no memory book |
| Free social event pages | Partiful, Luma | Free; Luma Plus about $59–69 a month for organisers | Built for young US social life and meetups; no cultural templates, no gifts, no keepsake |
| Guest photo apps | GuestPix, Kululu, Fotify | One-off per event: GuestPix about $39–119, Kululu free / $39 / $99 | Photos only: no invitation, RSVP or guest list |

*Figures come from comparison pages, several written by competitors. Check each vendor's own pricing page before quoting them in marketing.*

**The gap:** nobody joins invitation, RSVP, the live day, the photo wall and the memory book under one link at one fair price, and nobody designs for multi-function South Asian events. A host buying a paid invitation (about $20–60) plus a photo app (about $39–119) today spends far more than In2Min2's recommended prices.

## 4. What makes In2Min2 different

1. **Two minutes, really.** Four facts, then AI words, a ready design and one link. The name is the promise; every screen is judged against it.
2. **One link for the whole life of the event.** The same link is the invitation, then the live page, then the memory book. Guests never need a second link or an app.
3. **Built for many functions and many places.** Separate guest lists per function, family abroad following along, time zones shown for overseas guests.
4. **WhatsApp first.** Every guest gets a personal link the host sends from their own phone in one tap (section 8). No WhatsApp Business account and no messaging costs.
5. **Bilingual by default.** The AI writes in the language mix the host asks for ("English with Nepali phrases", "Hinglish"). Templates carry cultural details: festival dates, auspicious times (*sait*), and optionally the Nepali (Bikram Sambat) date beside the English one.
6. **No app download for anyone.** Hosts and guests use the browser. It installs to the home screen like an app if they want.

## 5. The event's life: one page, four stages (Decided)

The page changes by the clock alone, in the event's own time zone (`public.stage()` in the database):

| Stage | When | What guests see |
| --- | --- | --- |
| **Pre-event** (RSVP mode) | From publishing until midnight on the day | Invitation card, countdown, schedule, map, RSVP form, gift and registry links, Add to calendar |
| **Live** (day-of mode) | Midnight on the day until the event ends | A large "Upload photos" button replaces RSVP; live schedule with "now" and "next"; directions; live photo wall |
| **Post-event** (celebration mode) | From the end until the plan's hosting ends | The AI-written thank-you, the photo gallery, the guestbook, download photos |
| **Expired** | After hosting ends | A short "This event has ended" page; the host can extend or upgrade |

Add a fifth, host-only moment: **7 days and 1 day before expiry**, email the host: "Your memories go offline on …: keep them for £X". This is the main upgrade moment (section 11).

## 6. The builder: switches, not a web editor (Decided)

**The rule:** the host never drags boxes around. They choose, toggle and type into labelled boxes. Everything is driven by one settings object (`event_settings()` returns `{ theme_config, feature_flags, feature_settings }`).

**Look (three choices only):**

- **Template:** Classic, Modern, Festive, Sport. Each is a complete, tested design for invitation card, page, live wall and gallery.
- **Main colour:** from a curated set per template, plus a custom picker. Text colour is chosen automatically to stay readable (golf's `check:colours` rule).
- **Font pairing:** 4–6 tested pairs per template, including at least one that renders Devanagari well (for example Noto Serif Devanagari with a Latin partner).

**Switches** (`feature_toggles` table; defaults come from the event type):

| Switch | Default on for | Notes |
| --- | --- | --- |
| AI writing | all | Capped per plan (5 / 30 / 100 writes) |
| RSVP | all | Per-function RSVP when there are sub-events |
| Countdown | all | |
| Schedule | all | Sub-events timeline |
| Map and directions | all | Embedded map plus "Open in Google Maps / Apple Maps" |
| Gifts | weddings, ceremonies | A registry link, or cash gifts through Stripe (phase 5) |
| Photo wall | all | Uploads open on the day; gallery after |
| Guestbook | weddings | Written messages; voice notes later |
| Tickets and tiers | melas, sport | Paid or tiered entry (phase 5) |
| Sponsors | melas, sport, community, corporate | Logo tiers (golf's sponsor cards) |
| Reminders | all | Email 24 hours before |

**Recommended principle: every switch works on every plan.** Plans differ only in how long the page stays up and how many guests and photos it holds. The host never meets a locked switch, which keeps the builder simple and honest. The only paid-only items are add-ons (own domain, extra time).

**The AI writer (built, `app/api/generate-copy/route.ts`):** five boxes with hard limits: headline 45, invitation 180, page welcome 450 (two paragraphs), guest note 140, thank-you 220 characters. These limits supersede the 30/200 in the first concept draft. Gemini returns strict JSON (`responseSchema`), the server trims anything over a limit at a sentence break, and every box stays editable. Each press of Generate counts against the plan's `ai_writes`.

## 7. Guest list (the CRM)

One table, `guest_crm`, handles a wedding guest, a sponsor and a football team alike.

- **Categories:** guest, plus-one, child (standard); sponsor, vendor, VIP (commercial); team (group). New kinds are an enum value. New details go in `guest_metadata` (diet, allergies, access needs, shirt size, sponsor tier, handicap…) with no migration.
- **Tags:** free labels such as "Bride's side", "Committee" or "Gold sponsor", for filtering and bulk messages.
- **Head count:** `party_size` is the number of people a row stands for. A named plus-one is its own row linked to the main guest. A team entry is one row with a party size of 15.
- **Per-function invitations:** `sub_event_guests` decides who sees the family-only Mehndi.
- **Adding guests quickly:** paste a list, upload a CSV, or on Android pick from phone contacts (the browser Contact Picker). On iPhone, paste or type, since the Contact Picker isn't available there.
- **On the day:** helpers check guests in by scanning their personal QR code at the door (`checked_in_at`).
- **Export:** CSV for caterers (numbers and diets per function) and seating.

## 8. Sharing and messages

- **Personal links:** `in2min2.com/e/x9k2?g=<token>` opens the page with the guest's name and functions and a one-tap reply (golf's `/c/` links).
- **One-tap WhatsApp send:** the host's guest list has a WhatsApp button per guest. It opens WhatsApp on the host's phone with the message and personal link already typed (`wa.me` with text). There's no WhatsApp Business API, no cost and no spam risk, and it comes from a number the guest knows. Email and SMS buttons work the same way (`mailto:` and `sms:`).
- **Share cards:** every event link shows a proper preview (title, date and cover picture) in WhatsApp, iMessage and Facebook. Next.js `generateMetadata` and `opengraph-image.tsx` replace golf's `worker/index.js` share card.
- **Calendar:** an "Add to calendar" `.ics` file and a Google Calendar link after RSVP. `.ics` is already built in Taxelfi.
- **Reminders:** an automatic email 24 hours before (Resend, as in golf). SMS later as a paid pack, since each message has a real cost.
- **Printed QR cards:** a free PDF of table cards ("Scan to share your photos") for the live wall.

## 9. Photos: the live wall and the memory book

- **Guests upload from the browser**, no app and no sign-in, through a link or a QR code on the tables.
- **Resized on the phone before upload** (about 2048px plus a thumbnail). It's faster on venue Wi-Fi and 4G and keeps storage costs down. Keepsake also keeps the original for the full-resolution download.
- **Storage on Cloudflare R2** (Decided in the first draft; recommended over Supabase Storage): no download (egress) fees, which matters when 200 guests browse a gallery.
- **Moderation:** the host chooses "show at once" or "approve first" (golf 0042 approved photos show). Hide and delete in one tap.
- **Big-screen mode:** `/live/<code>` is a full-screen slideshow for a TV or projector at the venue, a strong "wow" moment that sells the product to every guest present.
- **Children and privacy:** many of these events centre on a baby or children. Galleries are not listed by search engines, private events need a guest link, and the host can switch off downloads.

## 10. Money

Build in this order; each is a separate phase.

1. **The host pays In2Min2 for a plan.** Stripe Checkout, one-off payments, and a webhook that sets `events.plan` with the service key. This is simple and comes early.
2. **Guests pay hosts: tickets, entry fees and cash gifts.** Stripe Connect (Express accounts), so the money goes straight to the host's own bank account and **In2Min2 never holds anyone's money**. That keeps In2Min2 out of e-money and safeguarding regulation. Hosts complete Stripe's identity check once.
3. **Sponsor payments** for melas and tournaments go through the same Connect route.

**Golf Society Home has no Stripe integration.** Its Money screens record fees by hand. Payments are new work, not a port.

UK card fees are about 1.5% + 20p for UK cards (third-party guides, 2026). Connect adds its own fees, and UK Connect pricing was not confirmed in research, so check stripe.com/gb/pricing before setting the platform fee.

## 11. Pricing (Recommended; owner to confirm)

**Principles**

- **Pay per event, once.** Events are occasional, and people resent subscriptions for a one-off party. Subscriptions are for organisers who run events all year.
- **Charge for time and size, never for switches.** Free is fully featured but small and short.
- **Price in pounds.** The first market is the UK. Stripe handles other currencies later.
- **Upgrade any time, even after the event**, paying the difference. The best moment to sell is when the host sees 400 photos of their child's Pasni and the page closes in 7 days.
- **Never hold memories hostage.** Before a free page expires, the host can always download the photos at standard quality for free. Paying keeps them online and gives full resolution. This keeps goodwill and word of mouth.

**Per-event plans** (already seeded in `plans`; change prices there, not in code)

| | **Pop-Up** | **Season** | **Keepsake** |
| --- | --- | --- | --- |
| Price | Free | **£19** once | **£39** once |
| Page stays up | 7 days after the event | 90 days after | 12 months after |
| Guests | up to 50 | up to 300 | no set limit (fair use) |
| Photos | 150 | 2,000 | 10,000, plus short videos |
| AI writes | 5 | 30 | 100 |
| Download | standard quality | standard quality | full resolution, as a ZIP |
| "Made with In2Min2" footer | shown | shown | removed |
| Every switch | yes | yes | yes |

The first draft had Season at $15 and Keepsake at $39. In pounds, £19 and £39 sit well below a paid invitation plus a photo app (section 3), and £39 matches the draft's top price.

**Add-ons**

| Add-on | Recommended price | Notes |
| --- | --- | --- |
| Own web address (white-label) | **£25** for the hosting period | The host's own domain, e.g. `jamesandangeeta.com`, with automatic SSL through Cloudflare for SaaS (100 hostnames free, then about $0.10 a month each). They buy the domain themselves at first; selling domains comes later. |
| Extra year online | £15 | For Season and Keepsake |
| SMS reminders | £5 per 100 | Later; covers the real cost of each text |

**For organisers (phase 6)**

| | **Organiser** | **Planner Pro** |
| --- | --- | --- |
| For | Clubs, community committees, leagues, golf societies | Event planners and venues |
| Price | £12 a month or £120 a year | £39 a month |
| What | Unlimited events at Season level, own logo, sponsor tools, team entries, co-hosts | Everything in Organiser, plus own brand and domain on every event, and hand-over to the client |

**Payment fees (phase 5)**

- **Tickets:** a platform fee of about 2.5% + 20p, paid by the buyer by default; the host can choose to absorb it. Confirm after checking Stripe Connect UK costs.
- **Cash gifts:** no In2Min2 fee at launch; the guest covers the card fee. "Every penny reaches the couple" is a strong message in a culture of cash gifts (*shagun*, *dakshina*). Review once real costs are known.

**Cost of serving one event (rough, check current prices):** R2 storage is about $0.015 per GB a month with the first 10 GB free, so 10,000 resized photos (about 6 GB) cost about $1 a year. Gemini Flash-Lite costs fractions of a penny per write. Resend's free tier covers 3,000 emails a month. A Stripe fee on £39 is about 79p. Margins on paid plans are above 90%. The real costs are building and marketing it.

## 12. The domain (Recommended: **in2min2.com**)

| | in2min2.**com** | in2min2.**events** | in2min2.**day** |
| --- | --- | --- | --- |
| Trust and habit | Highest; people type .com by habit | Descriptive, but people add ".com" anyway | Cute, but unclear meaning |
| WhatsApp, SMS and email | Auto-links everywhere; best email delivery | Mostly fine; newer endings are filtered as spam more often | Same as .events |
| Yearly cost (renewal) | About £8–10 (Cloudflare at cost) | About $38–62 at most registrars | About $10–20 |
| Fits the name | "In2Min2" is the brand; .com keeps it clean | Long: 14 characters | Reads oddly: "in two min two day" |

**Verdict:** buy **in2min2.com** as the only address that matters. All routing works as `in2min2.com/{event-type}/{slug}` (e.g. `in2min2.com/wedding/meenu-jose`).

- Check availability and buy at **Cloudflare Registrar** (at-cost prices, and the domain lands where the Worker already lives).
- **If .com is taken,** choose in2min2.events over .day (it says what you do), and accept the higher renewal.
- **Optional:** in2min2.day as a cheap redirect to protect the name. Skip .events if you have .com.
- Before launch, check the name "In2Min2" on the UK IPO trade mark search (classes 41 and 42), and reserve the Instagram, TikTok and Facebook handles.
- **Number names get misspelt** ("intomintoo", "in2mins"). Always show the name written down, in every video and on every card.

## 13. Addresses on the site

| Address | What |
| --- | --- |
| `in2min2.com/` | Marketing home |
| `in2min2.com/{type}/{slug}` | The public event page, e.g. `/mela/london-2026` |
| `in2min2.com/e/{code}` | Short link (5 characters, no confusable letters); redirects to the full address |
| `in2min2.com/e/{code}?g={token}` | A guest's personal link |
| `in2min2.com/live/{code}` | Big-screen photo wall |
| `in2min2.com/dashboard/…` | Host area (signed in) |
| `jamesandangeeta.com` | Own-domain add-on, same page |

- Event types are a fixed, seeded list (`event_types`) and can never clash with app routes; the check is in the database.
- Slugs can contain real names, so offer a random slug for private events, and **never let search engines list event pages** (`noindex`). This is golf's rule: invitations carry names and phone numbers.
- When a host renames a slug, keep the old one as a redirect (add a `slug_history` table when it is built).

## 14. Growth plan (Recommended)

1. **Built-in word of mouth.** Every free page carries a small "Made with In2Min2: make yours in 2 minutes" link. One wedding puts that in front of 200 people, several of whom host something soon. The big-screen wall at the venue is the live advert.
2. **Community launch.** Offer free Keepsake to the first 50 hosts from the owner's network in exchange for feedback and permission to show their page as an example. Approach Nepali and South Asian community organisations about their next mela or tournament: sponsor pages show the product to everyone there.
3. **Partners with referral codes.** Photographers, decorators, caterers, venues and DJs get a code; their clients get 10% off, and the partner gets 20% of the sale or a free Keepsake. Vendors are already in the CRM (`category = vendor`), so a vendor directory can grow from it later.
4. **Short videos.** The name sells itself: "Wedding invite, RSVP list and photo wall, done in 2 minutes", as a real screen recording for TikTok, Reels and Shorts. Post in English and Nepali.
5. **Seasons.** Plan campaigns around the wedding season (spring and summer), Dashain and Tihar (autumn), Diwali, Eid, Vaisakhi, Lhosar and the summer mela season. Golf's festival calendar (`0063_festivals`) is a ready starting point.
6. **Search.** Rank the marketing pages and template galleries ("Subha Pasni invitation", "Bratabandha invitation card", "Nepali wedding website"), never the event pages.
7. **Cross-sell from Golf Society Home.** Societies' annual dinners, presentation nights and charity days are In2Min2 events, and golf organisers already trust the brand family.

## 15. Creative extras (backlog, roughly in order of value for effort)

| Idea | Why it matters |
| --- | --- |
| Nepali date (Bikram Sambat) and *sait* time beside the English date | Instantly feels made for this community; nobody else does it |
| Overseas guests see times in their own time zone | Family in Nepal, India, Hong Kong and the US follow along |
| Live stream link on the live page | Relatives abroad watch the ceremony (YouTube or Facebook link, no hosting cost) |
| Voice-note guestbook | Grandparents can leave a blessing without typing |
| Cash gifts in auspicious amounts (£51, £101, £501) | Matches how gifts are given |
| Teams, groups and a fixtures table for tournaments | Golf's draw and tee-time logic, reused |
| Printed photobook from the gallery | Affiliate income after the event |
| Seating plan | Common wedding request; later |
| Vendor directory | Grows out of the CRM; vendors pay to be listed |
| Interface in Nepali and Hindi as well as English | After launch; AI copy already handles languages |

## 16. Technology (Decided unless marked)

| Part | Choice | Notes |
| --- | --- | --- |
| App | **Next.js 16** (App Router, TypeScript, Tailwind) | `cacheComponents` is **off**: with it on, the OpenNext build hung on every page (tested 12 Nov 2026) |
| Hosting | **Cloudflare Workers** via `@opennextjs/cloudflare` | Worker name `in2min2`; preview at `in2min2.<account>.workers.dev` until the domain is bought |
| Database and sign-in | **Supabase** (Postgres, Row Level Security, email-code sign-in) | London region; separate staging project, as in golf |
| Photos | **Cloudflare R2** | Uploads go straight from the browser with signed URLs |
| AI | **Google Gemini** through `@google/genai` | Default model `gemini-3.5-flash-lite` (set by `GEMINI_MODEL`). The older `@google/generative-ai` package lost support on 30 Nov 2025 |
| Email | **Resend** | As in golf |
| Payments | **Stripe** Checkout, then Connect Express | Section 10 |
| Own domains | **Cloudflare for SaaS** custom hostnames | Automatic SSL per host domain |
| Scheduled jobs | Supabase `pg_cron`, or a small separate cron Worker | Reminders, expiry emails, clean-up (Recommended) |

**Secrets** never go in the code or GitHub. Locally they live in `.env.local` (git-ignored). On Cloudflare they are Worker secrets (`npx wrangler secret put NAME`, or Dashboard › Workers › in2min2 › Settings › Variables and Secrets, type Secret).

| Name | Secret? | Used for |
| --- | --- | --- |
| `GEMINI_API_KEY` | Secret | AI writer |
| `GEMINI_MODEL` | Public (`wrangler.jsonc`) | Which Gemini model |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Phase 1 |
| `SUPABASE_SECRET_KEY` | Secret | Server-only writes (plan changes, webhooks) |
| `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Secret | Later phases |

## 17. Reusing Golf Society Home

**Be clear about what golf is.** The live golf product is the HTML prototype pages served as static files, plain JavaScript in `boot/`, one Cloudflare Worker (`worker/`: share cards, email reminders on a cron and weather), and Supabase with about 65 migrations. It is **not Next.js** and has **no Stripe**. So In2Min2 reuses golf's **database patterns, rules, SQL and tested logic**, not its screens. Read the golf file, then write the Next.js version.

Golf lives at `~/Desktop/GoChuchuro Folder/Golf Society Home Folder/golfsocietyhome/`.

| Golf | In2Min2 | How |
| --- | --- | --- |
| `supabase/migrations/0001_init.sql`, `0002_policies.sql` (RLS helpers `is_officer`, `has_role`) | `0001_init.sql`: `is_event_host(event, min_role)` | Done: same pattern |
| `0017_public_event.sql`, `0019_public_society.sql` | `public_event()`, `resolve_short_code()` | Done: public pages read only through security-definer functions |
| `0018`, `0053` reply limit, `0056` one reply each, `0058` first reply stands | `submit_rsvp()` (next migration) | Port the rules; never open `guest_crm` to anonymous inserts |
| `0059_guest_card_link.sql` (`/c/` tokens) | `guest_crm.invite_token` and `/e/{code}?g=` | Done in schema; build the page |
| `0005_signin.sql`, email-code sign-in in `boot/` | Supabase Auth email code with `@supabase/ssr` | Rewrite in Next.js |
| `0021`–`0023` sponsors, `lib/sponsor.ts` | Sponsors as `guest_crm` (category sponsor) plus a sponsor strip | Port `lib/sponsor.ts` logic |
| `0032`, `0048`, `0049` plans and limits | `plans` table | Done; port the limit checks |
| `0014_images`, `0038` captions, `0042` approved photos, `0057_gallery` | Photo wall and gallery (R2 instead of Supabase Storage) | Port moderation rules |
| `0034_email_log.sql`, `worker/email.js` (Resend, daily 08:00 cron) | 24-hour reminders, expiry emails | Port; keep the email log |
| `worker/index.js` (WhatsApp share card) | `generateMetadata` and `opengraph-image.tsx` | Next.js does this natively |
| `0063_festivals.sql`, `prototype/festivals.js` | Festival calendar, Nepali date | Port |
| `lib/slug.ts`, `reserved_slugs` | Slug rules; reserved words in the `event_types` check | Done in schema; port `slug.ts` |
| `scripts/check:empty`, `check:others` (Playwright) | "Brand-new host sees no crash", "No host sees another host's guests" | Rebuild as Playwright tests; `supabase/tests/schema.test.mjs` already proves it at database level |
| `CLAUDE.md` standing rules | `CLAUDE.md` here | Carried over |

## 18. The database (built: `supabase/migrations/0001_init.sql`)

Tables: `plans`, `event_types`, `events`, `event_hosts`, `sub_events`, `guest_crm`, `sub_event_guests`, `feature_toggles`. Functions: `stage()`, `event_settings()`, `public_event()`, `resolve_short_code()`, `is_event_host()`.

Guarantees, each proved by `npm run test:db` (62 checks on real Postgres 17 via PGlite, with stand-ins for Supabase's `auth` schema):

- A host sees and changes only their own events; helpers read, co-hosts edit, owners manage hosts.
- The public reads no table directly. Draft events are invisible, private events open only with a guest's link, and invite-only functions show only to invited guests.
- The browser can never set a plan, hosting length, custom domain, AI usage or money; the server sets those after payment.
- The stage moves from pre to live, post and expired by the clock, and an upgrade brings an expired page back.

**Next migrations:** `submit_rsvp()`, `photos`, `guestbook_entries`, `payments` / `orders`, `ticket_tiers`, `email_log`, `slug_history`, `custom_domains`.

## 19. Build plan

Each phase ends deployed to the preview address, with what was tested stated plainly.

| Phase | What | Done when |
| --- | --- | --- |
| **0** (done 12 Nov 2026) | Repository, Next.js 16 on Cloudflare Workers, AI writer route and test page, database schema with tests | Preview loads; 62 database and 19 route checks pass |
| **1** | Supabase projects (live and staging), run 0001, email-code sign-in, host dashboard: create event (type, facts, AI, look) and publish | A new host can sign in, create, AI-write and publish an event in under 2 minutes |
| **2** | Public event page `/{type}/{slug}` with the four stages, share cards, `/e/{code}`, `submit_rsvp()`, personal links, `.ics` | A guest replies from a WhatsApp link on a phone; the host sees it |
| **3** | Guest list: add, paste, CSV, tags, per-function invites, WhatsApp/email/SMS buttons, check-in, export; 24-hour reminder email | A 100-guest wedding with 3 functions can be run |
| **4** | Photo wall: R2 uploads, phone-side resize, moderation, big-screen mode, gallery, ZIP | 200 photos from 20 phones in an hour without failure |
| **5** | Stripe: plan purchase and upgrades, then Connect for tickets and gifts | A paid upgrade changes the plan only through the webhook |
| **6** | Own domains (Cloudflare for SaaS), Organiser subscription, sponsors, teams and fixtures | |
| **Launch** | Buy in2min2.com, privacy and terms pages, ICO fee, monitoring | |

## 20. Risks and guardrails

- **Privacy (UK GDPR).** Guest names, phones, emails and photos of children. Register with the ICO (the data protection fee), publish a privacy notice, let hosts delete everything, and delete photos when hosting ends (or soon after, with a warning first). Never list event pages in search engines.
- **AI cost.** The writer costs money per call. **Before launch it must require a signed-in host and count `ai_writes_used` against the plan.** Today it is open on the preview but has no key, so it can't spend anything.
- **Abuse of public pages.** Free pages could host spam or scams. Add a "Report this page" link and a staff switch to take a page down.
- **Payments regulation.** Use Connect so In2Min2 never holds guests' money.
- **Cost surprises.** Photo limits per plan; resize on the phone; R2 has no download fees.
- **Accessibility.** Templates meet contrast rules automatically; every photo upload works one-handed on a phone; 16px inputs (golf rule).

## 21. Open decisions for the owner

1. Prices: Pop-Up free, Season £19, Keepsake £39, own domain £25, extra year £15. Yes, or change?
2. Plan limits: 50 / 300 / no limit guests, and 150 / 2,000 / 10,000 photos.
3. "Every switch on every plan": agree?
4. Ticket fee (2.5% + 20p suggested) and no fee on gifts at launch.
5. Free standard-quality photo download before a free page expires: agree?
6. Domain: buy in2min2.com (and optionally in2min2.day as a redirect).
7. Beachhead: start with the UK Nepali and South Asian community, as above?
8. Organiser and Planner Pro subscriptions: build in phase 6, or sooner for your golf societies?

## 22. Sources (November 2026 research)

- Digital invitation pricing: [Greenvelope platform comparison](https://www.greenvelope.com/resources/best-digital-invitation-platforms), [Greenvelope pricing guide](https://www.greenvelope.com/resources/how-digital-invitation-pricing-works), [Joy: digital save-the-date platforms 2026](https://withjoy.com/blog/best-digital-save-the-date-platforms-for-2026-weddings/), [Paperlust: Joy, Zola, The Knot compared](https://paperlust.co/blog/?p=21139), [Dupple: free invitation makers 2026](https://dupple.com/learn/best-free-invitation-makers)
- Photo apps: [Wedibox comparison 2026](https://www.wedibox.com/compare/best-wedding-photo-sharing-apps), [Wedibox vs Kululu](https://www.wedibox.com/compare/kululu), [Knipsmig on GuestPix pricing](https://knipsmig.com/alternatives/guestpix), [Fotify: event photo apps 2026](https://fotify.app/blog/best-event-photo-sharing-apps-2026)
- Free event pages: [Luma vs Partiful (Luma help)](https://help.luma.com/p/luma-vs-partiful), [Toolradar: Partiful](https://toolradar.com/tools/partiful)
- Domains: [domainoffer.net .events prices](https://domainoffer.net/tld/events/namecheap), [domainoffer.net .day at Cloudflare](https://domainoffer.net/tld/day/cloudflare)
- Own domains: [Cloudflare for SaaS plans](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/)
- Stripe UK: [Wise: Stripe charges UK](https://wise.com/gb/blog/stripe-payments-charges-uk), [We Are Founders: Stripe fees UK 2026](https://www.wearefounders.uk/stripe-fees-uk-2026/)
- Market context: [Guides for Brides: South Asian wedding trends](https://guidesforbrides.co.uk/wedding-ideas/south-asian-wedding-trends), [Hitched average wedding cost 2026](https://www.theknotww.com/press-releases/the-average-cost-of-a-wedding-in-2026-around-21990-according-to-hitched)
- Gemini: [Gemini models](https://aistudio.google.com/docs/models), [deprecated generative-ai-js](https://github.com/google-gemini/deprecated-generative-ai-js)
- Cloudflare hosting for Next.js: [OpenNext Cloudflare get started](https://opennext.js.org/cloudflare/get-started), [Workers Builds branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)
