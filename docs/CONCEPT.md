# In2Min2: concept, business plan and build plan

*Version 2, 13 November 2026. Owner: Prakash (GoChuchuro). Repository: `Prakash7354/in2min2`. Preview: https://in2min2.pksgrg.workers.dev*

This is the source of truth for what In2Min2 is and how it gets built. Claude Code: read this, then `CLAUDE.md`, then the code. Two kinds of statement appear:

- **Decided**: the owner has said so. Build to it.
- **Recommended**: advice not yet confirmed by the owner. Build it so it is easy to change (prices live in the `plans` table, not in code), and keep it under "Open decisions" (section 21) until he confirms.

---

## 1. The idea

**Your event online in two minutes, from invitation to memory book, on one link. From a child's birthday to a Gurkha Cup.** (Decided)

A host picks what they are celebrating and how big it is, types a few facts, and presses one button. In2Min2 writes the words in English, Nepali or both, dresses them in a ready-made design, and gives back one link to share anywhere. The page changes by itself: invitation and RSVP before the day, live schedule, photos and scores on the day, thank-you and memory book afterwards. Hosts flip switches and choose from ready-made styles. Nobody edits a web page. It must be simple enough for a 12-year-old.

## 2. Three scales of event (Decided by the owner, 13 Nov 2026)

The first question in the builder is "How big is your event?". The answer decides which switches a host ever sees, so a birthday host is never shown car park fees.

| Scale | Examples | Typical life | What it needs |
| --- | --- | --- | --- |
| **Personal**: friends and family | Birthday, Pasni (rice feeding), party, house-warming | About a week either side | Invitation card, RSVP, map, photos, thank-you |
| **Celebration**: a big family occasion | Wedding, engagement, wedding anniversary, Bratabandha | Planned over weeks; **90 days is the sweet spot** | Several functions (Mehndi, Ceremony, Reception), separate guest lists, honoured family, gifts, guestbook, two languages |
| **Community and sport**: a public event | Mela, Gurkha Cup-style football tournament, fundraiser, cultural show | Months of entries and sales before; results and photos after | Tickets, team entries and fees, the draw, fixtures, live scores, business stalls, sponsors, car parking, receipts, cash on the day |

The scale is stored on the event (`events.scale`, filled from the event type) and can be changed by the host.

## 3. Who it is for first (Recommended)

**UK Nepali and South Asian families and communities**, starting with the owner's own network (GoChuchuro, the Andover, Aldershot and Farnborough area, the Gurkha community, Golf Society Home). The big tools are built for one-day American weddings. Nobody serves a five-function wedding with a family-only Mehndi, invitations in mixed Nepali and English, relatives abroad, or a community football tournament with stalls and parking. WhatsApp is already how these invitations travel; In2Min2 keeps that habit and adds a real guest list. Then all UK celebrations, then clubs and organisers who run events every year.

## 4. What others charge (researched November 2026)

*Figures come mostly from comparison sites, several run by competitors, and some conflict. Check each vendor's own page before quoting them publicly.*

**Invitations, websites and photos (personal and celebration)**

| What a host needs | What they use today | What it costs | In2Min2 |
| --- | --- | --- | --- |
| A birthday or Pasni invitation | A Canva card in WhatsApp; Partiful; Evite free | Free | Pop-Up, free |
| A wedding invitation | Greenvelope; Paperless Post | About $19 (20 guests) to $99 (100 guests); Paperless Post about $1 a guest | Included |
| A wedding website | Joy, Zola (free); UK one-off sites | Free; UK sites £60–90 (e.g. £89.99 one-off) | Included |
| Guest photo sharing | GuestPix, Kululu, Fotify | About $29–119 per event; free tiers hold 50–100 photos for about 30 days | Included |
| Own web address | Joy, Zola | About $18–20 a year | £10 a year plus the domain (about £8–10 a year) |

**Tickets and tournaments (community and sport)**

| Tool | What it charges |
| --- | --- |
| Eventbrite (UK) | About 6.95% + 59p **per ticket** (most sources; one says 3.7% + 59p + 2.9%) |
| TicketSource | Free to organisers; booking fee about 4% + 65p per ticket (another source says 7% + VAT) |
| Ticket Tailor | About 26–60p per ticket, plus Stripe's card fee |
| Tournify (tournament tool) | About $45 per tournament |
| LeagueRepublic (league tool) | About €17.90 a month |
| Challonge | $0.75 per paid order; Premier $14.99 a year |

**Conclusion:** a wedding host who pays for an invitation, a website and a photo app today spends £40–200. A tournament organiser pays a ticketing site per ticket **and** a tournament tool. In2Min2 does all of it, so it can charge less than any one of them and still make money, because serving an event costs pennies (section 15).

## 5. Pricing (Recommended launch prices; owner to confirm)

**Principles**

1. **Pay once per event.** Events are occasional; subscriptions are only for organisers who run events all year.
2. **Charge for time and size, never for switches.** Every switch works on every plan.
3. **Stay below the market on purpose at launch.** Label them "launch prices". It is easy to raise prices for *new* customers later; one-off buyers have nothing to renew, so there is no backlash.
4. **Upgrade any time, even after the event**, by paying the difference. The best moment to sell is when a family sees their Pasni photos and the page closes in 7 days.
5. **Never hold memories hostage.** Before a free page closes, the host can download the photos at standard quality, free.
6. **Community events pay through the sales they make, not up front.** Organisers are often volunteers and can't pay before entries come in.

**Personal and celebration events, one payment per event.** The page is live from the moment it is published, and stays up for this long *after* the event:

| | **Pop-Up** | **Season** ★ | **Half-Year** | **Keepsake** |
| --- | --- | --- | --- | --- |
| Best for | Birthdays, Pasni, parties | Anniversaries, engagements, Bratabandha | Weddings planned well ahead | Weddings and milestones to keep |
| Price | **Free** | **£9** | **£15** | **£25** |
| Online after the event | 7 days | 90 days | 6 months | 12 months |
| Guests | 50 | 200 | 400 | 800 |
| Photos (per guest) | 50 (10) | 300 (20) | 600 (20) | 1,000 (30) |
| AI writes | 5 | 30 | 50 | 100 |
| Download | Standard quality | Standard quality | Standard quality | Full resolution, as a ZIP |
| "Made with In2Min2" | Shown | Shown | Shown | Removed |

★ The sweet spot the owner described. £9 for 90 days sits below every paid invitation or photo app in section 4.

**Community and sport events: free to set up, paid from sales**

| | **Community** |
| --- | --- |
| Set-up | **Free**, with every organiser tool: teams, draw, fixtures, live scores, stalls, sponsors, parking, gate scanning, cash sales |
| Online orders | **4% + 30p per order**, card costs included, added to the buyer's total by default (the organiser can absorb it instead) |
| Cash and card on the day | **No In2Min2 fee.** Recording cash sales and receipts is free |
| Online after the event | 90 days (Keepsake upgrade £25 for 12 months) |
| Photos | 2,000, approved by the organiser before showing |

Worked example: a family buys 4 entries at £5 online (one £20 order).

| Platform | Fees on that order |
| --- | --- |
| Eventbrite (6.95% + 59p per ticket) | about £3.75 |
| TicketSource (about 4% + 65p per ticket) | about £3.40 |
| Ticket Tailor (26–60p per ticket + Stripe) | about £1.54–2.90 |
| **In2Min2 (4% + 30p per order)** | **£1.10** |

The fee is **per order, not per ticket**, so a family that adds a car park pass to the same basket pays one fee. On a £20 order In2Min2 keeps about 55p after Stripe. On a lone £3 car park pass it keeps about 15p, so the checkout should nudge "add parking to your entry". Check UK Stripe Connect costs before launch; non-UK cards cost more.

**Add-ons and subscriptions**

| | Price | Notes |
| --- | --- | --- |
| Own web address | £10 a year | The host buys the domain (about £8–10 a year) and connects it in two steps; automatic SSL through Cloudflare for SaaS (100 hostnames free, then about $0.10 a month each) |
| Keep it longer | Pay the difference to the next plan; Keepsake +12 months £10 | |
| **Organiser** subscription (phase 6) | £10 a month or £100 a year | For clubs and committees that run several events: booking fee drops to 2.5% + 25p, own logo, no In2Min2 footer, every event kept 12 months. Compare LeagueRepublic at about €17.90 a month |
| Cash gifts (phase 4) | No In2Min2 fee at launch | The guest covers the card cost. "Every penny reaches the family" |

**Launch offers:** free Keepsake for the first 50 families from the owner's network, and free Organiser for the first 5 community events, in return for feedback and permission to show their page.

## 6. The life of an event (Decided)

The page changes by the clock alone, in the event's own time zone (`public.stage()`):

| Stage | When | Personal and celebration | Community and sport |
| --- | --- | --- | --- |
| **Before** | From publishing to midnight on the day | Invitation card, countdown, functions, map, RSVP, gifts | Poster, countdown, buy tickets and parking, team entry and stall applications, the draw, fixtures |
| **On the day** | Midnight until the end | Big "Add your photos" button, live schedule, directions | Live scores and tables, "now on pitch 3", stall map, photos, buy on the day |
| **After** | Until the plan ends | Thank-you message, gallery, guestbook | Results, winners, top scorer, sponsors thanked, gallery |
| **Closed** | After the plan ends | "This event has ended"; host can upgrade | Same |

## 7. The builder: simple enough for a 12-year-old (Decided in outline; details Recommended)

**One question per screen.** Big buttons, a progress bar, everything saved as you go, Back always allowed. Under each choice, one short line saying what it does. Target: a published page in under two minutes with the defaults.

1. **What are you celebrating?** Picture tiles (Birthday, Pasni, Wedding, Anniversary, Mela, Tournament…). The scale is picked automatically and shown: "This looks like a Celebration. Change".
2. **Who is it for?** The **stars**: the child, the couple, the birthday person, or the tournament itself. Then **"Family to honour"**: parents, grandparents and close family, with names and optional photos. They appear with pride on the card and page ("With blessings from") (`event_people` table, built).
3. **When and where.** Date and time; venue by typing the address or pasting a Google Maps link.
4. **The words.** Choose languages: English, Nepali, Nepali in English letters, or two of them. Press **"Write it for me"** and the boxes fill in both languages, each with a character counter. Every box has small buttons: *Shorter · Warmer · More formal · More fun · Rewrite*. Edit anything.
5. **The look.** Four ready-made choices, each shown as a picture, never a settings form:
   - **Template:** Classic, Modern, Festive, Sport, each with 6 colour swatches (plus "your own colour"; text colour is picked automatically so it stays readable).
   - **Text style**, 5 presets from plain to calligraphic, each with a matching Devanagari font (all free Google Fonts):

     | Preset | Feel | Fonts (Latin + Devanagari) |
     | --- | --- | --- |
     | Clean | Plain black and white, modern | Inter + Noto Sans Devanagari |
     | Classic | Traditional serif | Playfair Display + Noto Serif Devanagari |
     | Elegant | Italic serif headline, light body | Cormorant Garamond Italic + Noto Serif Devanagari |
     | Calligraphy | Script headline for weddings | Great Vibes + Cormorant; Kalam for Devanagari |
     | Bold | Strong poster lettering for sport and melas | Bebas Neue + Mukta |

   - **Photo style**, 4 presets: *Hero* (photo fills the top, words over it), *Arch* (photo in an arch or circle frame, ideal for a child or a couple), *Polaroid* (three tilted photos, fun for birthdays), *Split* (photo one side, words the other, for sport and corporate).
   - **Motion:** on or off. When on, animation appears only at a few key moments (section 7b).
6. **Switches.** Only those for this scale, each with an icon and one line ("Car parking: sell parking passes online, cheaper than on the day").
7. **Check and publish.** Previews in tabs: **Invitation card · Event page · On the day · After the event**, with a phone/computer toggle. A short checklist: "I've checked the names, date and venue." Then **Publish**, which opens the share screen (section 10).

**Flow of the words (Decided):** AI suggests → host edits → saved automatically → host approves (the checklist) → publish. Nothing goes live unapproved.

### 7b. Animation only where it counts (Recommended)

1. **The invitation opening**: the card unfolds or an envelope opens the first time a guest taps the link (2 seconds, tap to skip).
2. **The main photo**: a slow, gentle zoom.
3. **The countdown**: digits flip.
4. **Saying "Yes" to the RSVP**: a short shower of marigold petals (confetti for parties).
5. **The live photo wall**: each new photo slides in.
6. **Tournaments**: the draw reveals each team like a World Cup draw; a goal flashes on the big screen.

Everything else stays still. People who have reduced motion switched on see no animation.

## 8. The AI writer: "trained" without the cost of training (Recommended)

The route is built: `app/api/generate-copy/route.ts`, with five boxes of strict length (headline 45, invitation 180, page welcome 450, guest note 140, thank-you 220 characters) and Gemini's strict JSON output. To make it write like a local expert:

- **A prompt library per event type** (`lib/ai/prompts/<type>.ts`): what the event is, what guests need to know, the tone that suits it, and 2–3 example texts **written or approved by the owner**. Gemini follows examples very closely; this is cheaper and better than fine-tuning.
- **A phrase bank per language**: शुभ विवाह, हार्दिक निमन्त्रणा, आशीर्वाद, and the common English and Romanised Nepali forms.
- **Two languages in one call**: the reply carries both languages' boxes, each within its limit, adapted rather than word-for-word. Stored as the main boxes plus `copy_translations` (built, length-checked in the database).
- **One-tap rewrites** of a single box (Shorter, Warmer…), each counted as one AI write.
- **Learning from edits**: keep anonymous before-and-after pairs (with the host's consent) and use the best to improve the examples each month.
- **Never invent facts**, ignore instructions hidden in the facts, and trim anything over a limit. All built.

## 9. Guest list (the CRM)

One table, `guest_crm`, holds a wedding guest, a child, a sponsor, a stall holder and a football team. Categories: guest, plus-one, child, sponsor, vendor, VIP, team. Free tags ("Bride's side", "Committee"). Extra details go in `guest_metadata` (diet, access needs, shirt size, squad list, food hygiene rating). Per-function invitations (`sub_event_guests`) keep the Mehndi family-only. Add guests by pasting a list, from a CSV, or on Android straight from phone contacts. On the day, helpers check people in by scanning their QR code. Export for the caterer: numbers and diets per function.

## 10. Sharing everywhere (owner's request, 13 Nov 2026)

- **One Share button.** On a phone it opens the phone's own share menu (the Web Share API), so WhatsApp, Messenger, Instagram messages, Viber, Telegram, Signal, IMO, Snapchat, SMS and email all appear if installed. On a computer: buttons for WhatsApp, Facebook, Messenger, X, LinkedIn, Telegram, email and Copy link.
- **Rich previews everywhere.** Every link shows the invitation picture, title and date when pasted into WhatsApp, iMessage, Facebook, Messenger, X, LinkedIn, Telegram, Viber, Slack or Discord. The picture is generated automatically for each event (Next.js `opengraph-image`, free, runs on Cloudflare).
- **Instagram, TikTok, Facebook Stories and WhatsApp Status** don't accept a link in a post, so the host gets ready-made images: a **story** (1080×1920) and a **square post** (1080×1080) of the invitation card, with a QR code and the short link. Instagram's link sticker carries the link. Later: a 10-second video of the card opening, for Reels, TikTok and Status.
- **Personal links by WhatsApp.** Each guest's row has a WhatsApp button. It opens WhatsApp on the host's own phone with the message and the guest's personal link already typed. There's no WhatsApp Business account, no cost, and it comes from a number the guest knows. Email and SMS buttons work the same way.
- **Posters and QR codes**: a printable A4/A5 poster and table cards ("Scan to add your photos"), free PDFs. Melas put them in shop windows.
- **Short links**: `in2min2.com/e/x9k2`, easy to read aloud or type from a poster.
- **Where replies came from**: each shared link carries its channel (`?via=wa`), so the host sees "most replies came from WhatsApp".
- **Calendar**: "Add to calendar" (`.ics` and Google Calendar) after every RSVP or purchase.

## 11. Photos (Recommended, revised 13 Nov 2026)

Most events need tens to a few hundred photos; a big mela or tournament may get 1,000–2,000 in a day, and the total across all events will be large. The design handles all of these cheaply:

- **Limits per plan** (section 5) and **per guest**, so one phone can't fill the wall.
- **The phone shrinks each photo before upload** (about 1600px, around 300–400 KB, plus a small thumbnail). That's 10 times faster on venue Wi-Fi and 4G, and 10 times cheaper to store. Keepsake also keeps the original for the full-resolution download.
- **An upload queue that survives bad signal**: photos wait on the phone and send themselves when the signal returns (IndexedDB, as built in Taxelfi).
- **Straight to storage**: each upload goes from the phone directly to Cloudflare R2 with a signed link; the app never carries the file.
- **Approve-first for public events**, show-at-once for family events (host's choice). Optional automatic screening of unsuitable images with Cloudflare Workers AI (free daily allowance).
- **Gallery**: thumbnails load as you scroll, with albums by function or by match. "Download all" streams a ZIP.
- **Cost**: R2 gives 10 GB free, about 25,000 resized photos across all events, then about $0.015 per GB a month, with no download fees. 2,000 photos is about 0.8 GB.
- **Privacy**: galleries are never listed by search engines; the host can switch off downloads; photos are deleted 30 days after a page closes, with a warning email first.
- **No video uploads at launch** (heavy and costly). Link a YouTube or Facebook live stream instead, so relatives abroad can watch.

## 12. Community and sport events (owner's request, 13 Nov 2026)

### 12a. Things to sell, and who gets them free

Every paid or free item is a **product** with switches. One screen, one row per product:

| Product | Online price | On-the-day price | Free for | Example |
| --- | --- | --- | --- | --- |
| Entry (adult, child, family) | £5 | £7 | Children under 5, teams, stall holders, sponsors | Mela entry |
| Car park pass | **£3** | **£5** | Each team 2 passes, each stall 1, sponsors | 300 spaces |
| Team entry | £150 per team | Not sold on the day | (organiser's choice) | Gurkha Cup Open division |
| Business stall | £40 small, £60 food | Not sold on the day | Charity stalls | 30 pitches |
| Sponsorship | Gold £500 / Silver £250 / Bronze £100 | — | — | Logos on page, big screen and results |
| Donation | Any amount | Any amount | — | Fundraisers |

- **The online price ends at a set time** (e.g. Friday 23:59) and the on-the-day price takes over automatically.
- **Capacity** per product ("300 spaces"); it shows sold out by itself.
- **Free allowances are automatic**: when a team or stall is approved, its free parking passes appear in their confirmation.
- **Applications need approval** for team entries and stalls: the organiser accepts, then the applicant pays, or has paid and is refunded if refused.

### 12b. Teams, the draw, fixtures and live scores (reuses golf's draw and live score card)

- **Divisions**: Open, Veterans 35+, Women, Under-16, each with its own entry fee and format.
- **Team entry form**: team name, club, manager's name and phone, kit colours, squad list with shirt numbers. Approval, payment, waiting list and closing date.
- **Formats**: groups then knockout (World Cup style); straight knockout with byes; league (everyone plays everyone); knockout with a Plate competition for first-round losers.
- **The draw**: seeded pots, groups of 3–5, rules such as "teams from the same club in different groups". Either automatic or a **live draw** shown on a big screen and streamed, with the reveal animation.
- **Fixtures generated automatically** across pitches and time slots, from match length, breaks and rest between a team's games. Printable sheets; on the public page, filters by pitch or "My team".
- **Live scores**: each pitch's referee or marshal has a private link with a PIN (golf's personal score-card links) and enters goals on their phone. Tables and the bracket update live for everyone.
- **Big-screen mode** (`/live/{code}`) on a TV or projector cycles through live scores, next fixtures, sponsor logos and the photo wall.
- **Results and awards**: winners, runners-up, top scorer, best goalkeeper, fair play. A results image is made automatically, ready to share.

### 12c. Business stalls and sponsors

Stall holders apply online with business name, category (food, goods, services, charity), description, logo, size, whether they need power, and uploads of their food hygiene rating and public liability insurance (councils and venues ask for these). On approval they get a stall number, a "Who's here" listing on the public page (useful promotion for them), and a QR pass for arrival. Sponsors choose a tier, pay online or are added by hand, and their logos appear on the page, the big screen and the results images (golf's sponsor cards).

## 13. Money, receipts and proof of payment (owner's request, 13 Nov 2026)

**Rule: In2Min2 never holds anyone's money.** Hosts' and organisers' sales go through Stripe Connect (Express) straight to their own bank account. In2Min2 takes its fee automatically from each order. This keeps In2Min2 out of e-money regulation. Hosts complete Stripe's identity check once.

**Proof of purchase for every kind of payment:**

| How they pay | What they get as proof | How it is checked |
| --- | --- | --- |
| **Online in advance** (card, Apple Pay, Google Pay) | Instantly: a confirmation page and email with an order number (e.g. `GC-000123`) and **one QR code per item** (entry, car park pass, team entry, stall). A "My tickets" page they can reopen from the email, with no account. Stripe's own payment receipt too. Later: Add to Google Wallet (free) and Apple Wallet (needs an Apple developer account, £79 a year) | Gate helpers scan the QR with their phone's camera in the In2Min2 **Gate** screen: green tick, "already used", or "wrong day" |
| **Card on the day** | The buyer scans a **"Pay here" QR poster** at the gate and pays on their own phone at the on-the-day price. They get the same email and QR, so no card reader is needed | Same scan |
| **Cash on the day** | The helper taps "+1 car park £5 cash" in the Gate screen. That makes a numbered receipt the buyer can photograph from the helper's screen (as a QR), or have sent by text or email. For cars: **pre-printed numbered dashboard slips** from a free In2Min2 PDF, each with a QR; the helper marks the slip number as sold | Marshals check the slip on the windscreen; the QR proves it is genuine |

**For the organiser:** every sale (online, card on the day, cash) appears in one list with time, product, method and which helper took it. At the end of the day each helper's **cash-up** shows the cash they should hold and the amount counted, with any difference. Exports go to CSV for the club's accounts or charity records. Refunds work from the same list (online orders back to the card; cash refunds recorded).

**Plan purchases by hosts** (Pop-Up to Season and so on) use Stripe Checkout, and a webhook changes the plan. The browser can never change a plan; the database forbids it.

Planned tables (phase 4): `products`, `orders`, `order_items` (each with its QR token and used-at time), `cash_sales` and `cash_ups`, with the same Row Level Security pattern.

## 14. Automation: the system does the chores (Recommended)

1. The page changes stage by the clock.
2. Every RSVP or purchase gets an instant confirmation with a calendar file and QR codes.
3. Reminder email 24 hours before, plus a ready-typed WhatsApp reminder the host can forward in one tap.
4. The day after: a thank-you email to everyone who came, with the gallery link ("Your photos are ready").
5. Seven days and one day before a page closes, the host is emailed with an upgrade link. 30 days after closing, photos are deleted.
6. A waiting list moves up automatically when someone declines.
7. Products sell out by themselves, and the online price switches to the on-the-day price at its cut-off time.
8. The organiser gets a daily sales summary, and an alert when something is nearly sold out.
9. Tournaments: fixtures are made from the draw; tables and brackets update from scores; the results image is ready the moment the final ends.
10. Payments change plans and complete orders instantly (Stripe webhooks).
11. Forms are protected from bots and spam (Cloudflare Turnstile, invisible to people).

## 15. Technology and services: free to start (Decided unless marked)

| Part | Service | Free allowance (check current terms) | When to pay |
| --- | --- | --- | --- |
| App | Next.js 16 on **Cloudflare Workers** (OpenNext) | 100,000 requests a day | Workers Paid ($5 a month) once big events run |
| Database, sign-in, live updates | **Supabase** (London) | 500 MB, 200 live connections. **Free projects pause after 7 days without use** | Pro ($25 a month) before the first real event |
| Photos | **Cloudflare R2** | 10 GB | About $0.015 per GB a month; no download fees |
| AI words | **Gemini** `gemini-3.5-flash-lite` through `@google/genai` | Free quota; UK users get the paid-tier data terms (prompts not used to improve Google's products) | Turn on billing for higher limits; pennies per hundred writes |
| Email | **Resend** | 3,000 a month, **but only 100 a day** | Pro ($20 a month) before an event that sends hundreds of confirmations in a day |
| Payments | **Stripe** Checkout and Connect | No monthly fee | About 1.5% + 20p per UK card payment, plus Connect fees |
| Spam protection | Cloudflare **Turnstile** | Free | — |
| Visitor counts | Cloudflare **Web Analytics** | Free, no cookie banner | — |
| Maps | **Google Maps Embed** and direction links | Free | — |
| Share images, QR codes, fonts, animation | `next/og`, `qrcode`, Google Fonts (Devanagari included), Motion, canvas-confetti | Free, open source | — |
| Photo screening (optional) | Cloudflare **Workers AI** | Free daily allowance | Pay per use |
| Scheduled jobs | Supabase `pg_cron` or a small cron Worker | Free | — |
| Later | SMS (Twilio, about 4p a text), WhatsApp Business messages, Google Wallet (free), Apple Wallet (£79 a year), SumUp card reader (one-off hardware) | | When asked for |

**Running cost:** £0 a month while building. About £40–45 a month once real events run (Supabase Pro, Resend Pro, Workers Paid). One Season sale a week covers it.

**Hosting notes:**
- `cacheComponents` is **off** in `next.config.ts`; with it on, every page hung under OpenNext (tested 12 Nov 2026).
- Cloudflare builds every push to `main` (build `npx opennextjs-cloudflare build`, deploy `npx opennextjs-cloudflare deploy`; confirmed working by the owner 13 Nov 2026).

**Secrets** never go in the code or GitHub: `.env.local` locally, Worker secrets on Cloudflare. They are `GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. The public values are `GEMINI_MODEL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## 16. Reusing Golf Society Home

Golf is the HTML prototype pages served as static files, plain JavaScript in `boot/`, one Cloudflare Worker (`worker/`: share cards, email reminders on a cron, weather) and Supabase with about 65 migrations. It is **not Next.js** and has **no Stripe**. Reuse its database patterns, rules, SQL and tested logic, not its screens. It lives at `~/Desktop/GoChuchuro Folder/Golf Society Home Folder/golfsocietyhome/`.

| Golf | In2Min2 | Status |
| --- | --- | --- |
| `0001_init.sql`, `0002_policies.sql` (role helpers) | `is_event_host(event, min_role)` | Done |
| `0017_public_event.sql`, `0019_public_society.sql` | `public_event()`, `resolve_short_code()` | Done |
| `0018`, `0053` reply limit, `0056` one reply each, `0058` first reply stands | `submit_rsvp()` | Next |
| `0059_guest_card_link.sql` (`/c/` tokens) | Guest personal links; referee score links | Schema done |
| `0005_signin.sql` email-code sign-in | Supabase Auth email code with `@supabase/ssr` | Phase 1 |
| `0021`–`0023` sponsors, `lib/sponsor.ts` | Sponsors (section 12c) | Port |
| `0032`, `0048`, `0049` plans and limits | `plans` table | Done; port the limit checks |
| `0014`, `0038`, `0042`, `0057` photos and gallery | Photo wall on R2 | Port moderation rules |
| `0034_email_log.sql`, `worker/email.js` (Resend, daily cron) | Reminders and closing emails | Port |
| `worker/index.js` share card | `generateMetadata`, `opengraph-image.tsx` | Next.js native |
| The draw, tee times and groups; live score card on phones; leaderboard and Order of Merit | Tournament draw and fixtures; live match scores; league tables | Port the logic (section 12b) |
| `0063_festivals.sql`, `prototype/festivals.js` | Festival calendar, Nepali date | Port |
| `lib/slug.ts`, reserved words | Slugs; reserved words in the `event_types` check | Done |
| `check:empty`, `check:others` (Playwright) | "Brand-new host sees no crash", "No host sees another host's guests" | `npm run test:db` proves it in the database; add Playwright later |
| `CLAUDE.md` standing rules | `CLAUDE.md` | Carried over |

## 17. Addresses

| Address | What |
| --- | --- |
| `in2min2.com/{type}/{slug}` | The event page, e.g. `/wedding/meenu-jose`, `/sport/gurkha-cup-2027` |
| `in2min2.com/e/{code}` and `?g={token}` | Short link, and a guest's personal link |
| `in2min2.com/live/{code}` | Big screen |
| `in2min2.com/dashboard/…` | Host and organiser area |
| `jamesandangeeta.com` | Own-domain add-on |

Event types can never clash with app routes; the database checks this. Event pages are never listed by search engines (`noindex`), because they carry names. Offer a random slug for private events.

**Domain (Recommended): in2min2.com.** It's the most trusted, people type .com by habit, and it auto-links everywhere and costs about £8–10 a year at Cloudflare. .events renews at about $38–62 a year; .day is cheap but reads oddly. If the .com is taken, choose .events. Check the name on the UK IPO trade mark search (classes 41 and 42) and reserve the social media handles.

## 18. The database (built: `supabase/migrations/0001_init.sql`, not yet run on Supabase)

Tables: `plans`, `event_types`, `events`, `event_hosts`, `event_people`, `sub_events`, `guest_crm`, `sub_event_guests`, `feature_toggles`. Functions: `stage()`, `event_settings()`, `public_event()`, `resolve_short_code()`, `is_event_host()`, `copy_fits()`.

`npm run test:db` runs it on real Postgres 17 (PGlite, with stand-ins for Supabase's `auth`) and checks 82 rules. Among them:
- Each host sees only their own events; helpers read, co-hosts edit, owners manage.
- The public reads no table; drafts are invisible; private events and invite-only functions open only with a guest's link.
- The browser can never set a plan, hosting length, own domain, AI usage or money.
- Scale follows the event type; a free plan follows the scale (community events get the Community plan); a paid plan is never changed by it.
- Both languages are held to the same text limits; the thank-you stays hidden until after the event in both.
- The stars come first on the page, then the honoured family.
- The stage moves by the clock, and an upgrade brings a closed page back.

**Next migrations:** `submit_rsvp()`; `photos`, `guestbook_entries`; `products`, `orders`, `order_items`, `cash_sales`, `cash_ups`; `divisions`, `teams`, `matches`; `email_log`, `slug_history`, `custom_domains`.

## 19. Build plan

Each phase ends deployed to the preview, with exactly what was tested stated.

| Phase | What | Done when |
| --- | --- | --- |
| **0** (done 12–13 Nov 2026) | Next.js on Cloudflare with Git builds, AI writer route, database schema with 82 checks, this plan | Done |
| **1** | **The builder** (section 7) with all four previews, style presets, honoured family and AI in two languages; Supabase sign-in; save and publish | A new host publishes a good-looking event in under 2 minutes on a phone |
| **2** | The public page through its four stages; sharing everywhere (section 10); RSVP; reminders | A guest replies from a WhatsApp link on a real phone |
| **3** | Guest list tools; the photo wall and gallery | 200 photos from 20 phones in an hour without failure |
| **4** | Stripe: plan upgrades, then products, orders, QR passes, the Gate screen, cash sales and cash-up | A test mela sells entry and parking online and on the day, with every sale accounted for |
| **5** | Tournaments: divisions, team entries, the draw, fixtures, live scores, big screen | A 16-team test tournament runs from draw to final |
| **6** | Organiser subscription, own domains, extras (section 22) | |
| **Launch** | Buy in2min2.com, privacy notice and terms, ICO fee, monitoring | |

If a real tournament is booked sooner, phases 4–5 can come before phase 3 for community events.

## 20. Risks and guardrails

- **Privacy (UK GDPR).** Names, phone numbers and photos of children. Pay the ICO fee, publish a privacy notice, let hosts delete everything, delete photos after closing, never list event pages in search engines.
- **AI cost.** Before launch the writer must require a signed-in host and count `ai_writes_used` against the plan. Today it is open on the preview but has no key.
- **Abuse.** "Report this page" on every public page; a staff switch to take a page down; Turnstile on forms; approve-first photos on public events.
- **Money.** Stripe Connect only; In2Min2 never holds funds. A refund policy page before the first sale.
- **Small payments.** Stripe's fixed 20p eats small orders; encourage one basket per family.
- **Accessibility.** Automatic colour contrast, 16px inputs, works one-handed, reduced motion respected.

## 21. Open decisions for the owner

1. Launch prices: Pop-Up free (7 days), Season £9 (90 days), Half-Year £15 (6 months), Keepsake £25 (12 months). Yes, or change?
2. Community events: free set-up and 4% + 30p per online order, paid by the buyer by default, with nothing on cash. Yes?
3. Limits: guests 50 / 200 / 400 / 800, and photos 50 / 300 / 600 / 1,000, with 2,000 for community events.
4. Own web address at £10 a year, with the host buying the domain.
5. Organiser subscription at £10 a month or £100 a year. In phase 6, or sooner for golf societies?
6. Is there a real tournament or mela date we should build towards? It decides whether phases 4–5 move earlier.
7. Languages at launch: English, Nepali, Nepali in English letters. Add Hindi and Punjabi later?
8. Buy in2min2.com now?

## 22. More ideas (backlog)

Nepali (Bikram Sambat) date and *sait* time beside the English date · overseas guests see times in their own time zone · live stream link on the day · voice-note guestbook for grandparents · cash gifts in customary amounts (£51, £101, £501) · seating plan · printed photobook from the gallery (affiliate income) · vendor directory grown from stall holders and suppliers (vendors pay to be listed) · a 10-second video of the card opening for Reels and TikTok · the interface in Nepali and Hindi · golf societies' annual dinners as In2Min2 events.

## 23. Sources (November 2026 research)

- Invitations and websites: [Greenvelope platform comparison](https://www.greenvelope.com/resources/best-digital-invitation-platforms), [Greenvelope pricing guide](https://www.greenvelope.com/resources/how-digital-invitation-pricing-works), [Joy: save-the-date platforms 2026](https://withjoy.com/blog/best-digital-save-the-date-platforms-for-2026-weddings/), [Paperlust: wedding websites compared](https://paperlust.co/blog/?p=21139), [Your Wedding Invites (Bridebook)](https://bridebook.com/uk/wedding-stationery/your-wedding-invites-braintree-essex-cswXo4jQyg), [Bespokevites (Guides for Brides)](https://guidesforbrides.co.uk/wedding-stationery/london-central/bespokevites/165300), [Evite You (Bridebook)](https://bridebook.com/uk/wedding-stationery/evite-you-london-greater-london-csmgbMll6X)
- Photo apps: [Wedibox comparison 2026](https://www.wedibox.com/compare/best-wedding-photo-sharing-apps), [Wedibox vs Kululu](https://www.wedibox.com/compare/kululu), [Knipsmig on GuestPix](https://knipsmig.com/alternatives/guestpix), [Fotify 2026](https://fotify.app/blog/best-event-photo-sharing-apps-2026)
- Free event pages: [Luma vs Partiful](https://help.luma.com/p/luma-vs-partiful), [Toolradar: Partiful](https://toolradar.com/tools/partiful)
- Ticketing: [Checkout Page: Eventbrite fees 2026](https://checkoutpage.com/blog/eventbrite-fees), [Ticket Tailor on Eventbrite fees](https://www.tickettailor.com/eventbrite-fees-and-cost), [UK ticketing fees audit 2026](https://ticketing-fees.pages.dev/uk-ticketing-fees-audit-2026/), [tickts: UK fees comparison](https://tickts.co.uk/blog/ticketing-fees-comparison-uk-platforms), [Capterra: Ticket Tailor pricing](https://www.capterra.com/p/112510/Ticket-Tailor/pricing/), [Capterra UK: TicketSource](https://www.capterra.co.uk/software/143073/ticketsource)
- Tournaments: [Tournify pricing](https://tournifyapp.com/en/pricing), [GetApp: LeagueRepublic](https://www.getapp.com/all-software/a/leaguerepublic/), [Tech Insider: Challonge 2026](https://tech-insider.org/?p=28121)
- Services: [Supabase pricing guide 2026](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/), [Resend free tier 2026](https://automationatlas.io/answers/resend-free-tier-explained-2026/), [Gemini API terms](https://ai.google.dev/gemini-api/terms_preview), [Gemini data logging policy](https://ai.google.dev/gemini-api/docs/logs-policy), [Cloudflare for SaaS plans](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/), [Stripe UK fees 2026](https://www.wearefounders.uk/stripe-fees-uk-2026/)
- Domains: [.events prices](https://domainoffer.net/tld/events/namecheap), [.day at Cloudflare](https://domainoffer.net/tld/day/cloudflare)
- Market: [Guides for Brides: South Asian wedding trends](https://guidesforbrides.co.uk/wedding-ideas/south-asian-wedding-trends), [Hitched: average wedding cost 2026](https://www.theknotww.com/press-releases/the-average-cost-of-a-wedding-in-2026-around-21990-according-to-hitched)
- Hosting: [OpenNext Cloudflare](https://opennext.js.org/cloudflare/get-started), [Gemini models](https://aistudio.google.com/docs/models)
