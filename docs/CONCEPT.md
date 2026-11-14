# In2Min2: concept, business plan and build plan

*Version 3.7, 14 November 2026 (night). Live at https://in2min2.com. Owner: Prakash (GoChuchuro). Repository: `Prakash7354/in2min2`. Preview: https://in2min2.pksgrg.workers.dev*

This is the source of truth for what In2Min2 is and how it gets built. Claude Code: read this, then `CLAUDE.md`, then the code. The owner's step-by-step list is `docs/ACTION-PLAN.md`. Two kinds of statement appear:

- **Decided**: the owner has said so. Build to it.
- **Recommended**: advice not yet confirmed by the owner. Build it so it is easy to change (prices and limits live in the `plans` table, not in code), and keep it in section 23 until he confirms.

**What changed in version 3.7 (14 Nov 2026, night):**
- Migration 0003 has run, and our own email sender (Resend) is set up. Nothing is waiting in the database.
- **Share** (top right, and step 7) lists every link with a ready-made message for each moment, and links can jump to a part of the page (7, 11).
- Drafts of the privacy notice, the terms (with the data agreement for guests' details) and **Prices and fair fees** (the written fee rules) are at `/privacy`, `/terms` and `/pricing`, waiting for the owner's approval (22).
- The owner said yes to the festive launch, postponed two-step sign-in, and asked that no event or organiser be named publicly (23).
- A market check and free-licence design sources (4b).

**What changed in version 3.5 (14 Nov 2026, afternoon):**
- in2min2.com is bought and connected.
- Logo C (stopwatch 2s) is in the app.
- Migration 0002 has run, and the Gemini key works (checked at /api/health).
- Next is our own email sender (Resend), so sign-in codes reach everyone (17a).

**What changed in version 3.4 (14 Nov 2026):**
- The owner agreed the design.
- Steps now carry big numbers, and tiles carry "Popular", "New" and "Coming soon" labels (7).
- Supabase is connected: sign-in by emailed code, publishing, and the public event page (20, phase 1b).
- A second migration gives the permissions Supabase no longer grants by default, and limits AI writes to 20 a day per person (19).
- Advice recorded on:
  - a festive launch offer (5e);
  - two-step sign-in (21);
  - Canva (7d);
  - the email sender and domain needed before the pilot (17a).

**What changed in version 3.3 (owner's design review, 13 Nov 2026):** far more choice in the look, "like shopping on the high street", with a professional side for regiments, charities, memorials and corporate events (7, step 5; 7d):
- 18 borders drawn for each kind of event;
- 30 colour sets in 8 families, with fewer pinks, festival colour blends, and dark styles;
- 10 text styles, each with fonts for six scripts.

Also: In2Min2's own screens look more formal; the wordmark is the logo (18d); the guest dashboard comes in phase 2 (9).

**What changed in version 3.2:** the owner chose colours A for In2Min2 itself, asked for all three brand palettes to be offered to hosts, and said "Yes, go" (taken as yes to the other open recommendations; section 23). Phase 1 started: the builder's seven steps, the live preview and the In2Min2 colours are built (section 20).

**What changed in version 3.1 (owner's answers of 13 Nov 2026, evening):**
- Pricing shape confirmed: the plan buys time, and people come in packs. People included are now 200, 300, 400 and 500 (5b, Recommended).
- Next year and more than one event: "Run it again" with carry-over, same-again and welcome-back discounts (5g).
- Free, half or full: the owner decides each case; the system never does (5h).
- Community events must say who organises them and whether anyone profits (5h).
- A memorial or funeral event type, handled quietly (2, 5g).
- The In2Min2 website, a private demo account, and colour options for the logo (18b–18d).
- Stripe as a sole trader; stay on Supabase's free plan with our own nightly backups until income covers Pro (14b, 17a, 21).

**What changed in version 3:**
- The owner agreed the launch prices and every item in the old open-decisions list.
- New sections cover:
  - guest-number limits, warnings and upgrades (5c);
  - payment trust (14a) and how money flows (14b);
  - planning, safety and coordination (10);
  - video through YouTube and Facebook (12b);
  - storage at scale (17b);
  - security and resilience (21);
  - privacy and the law, including children's photos (22).
- Languages are now open-ended (8b).
- Sport events can have any sport and any age group (13b).
- New event types: reunion or regimental day, and charity.

---

## 1. The idea

**Your event online in two minutes, from invitation to memory book, on one link. From a child's birthday to a community tournament, a charity walk or a regimental reunion.** (Decided)

A host picks what they are celebrating and how big it is, types a few facts, and presses one button. In2Min2 writes the words in their languages, dresses them in a ready-made design, and gives back one link to share anywhere.

The page changes by itself:
- before the day, the invitation and replies;
- on the day, the live schedule, photos and scores;
- afterwards, the thank-you and memory book.

Hosts flip switches and choose from ready-made styles. Nobody edits a web page. It must be simple enough for a 12-year-old.

**In2Min2 is GoChuchuro's main product** (Decided). More people need it, more often, than any of the other products. It is simple, and nobody is tied in for long.

## 2. Three scales of event (Decided)

The first question in the builder is "How big is your event?". The answer decides which switches a host ever sees, so a birthday host is never shown car park fees.

| Scale | Examples | Typical life | What it needs |
| --- | --- | --- | --- |
| **Personal**: friends and family | Birthday, Pasni (rice feeding), party, house-warming | About a week either side | Invitation card, RSVP, map, parking, photos, thank-you |
| **Celebration**: a big family or group occasion | Wedding, engagement, wedding anniversary, Bratabandha, **reunion, regimental day**, **memorial or funeral** (handled quietly, 5g) | Planned over weeks; **90 days is the sweet spot** | Several functions (Mehndi, Ceremony, Reception), separate guest lists, honoured family, gifts, guestbook, two languages, guest numbers for the venue and caterer |
| **Community and sport**: a public event | Mela, community football or volleyball tournament, **charity fundraiser**, cultural show | Months of entries and sales before; results and photos after | Tickets (paid or free), team entries, the draw, fixtures, live scores, stalls, sponsors, parking, receipts, cash on the day, head count against capacity |

The scale is stored on the event (`events.scale`, filled from the event type) and the host can change it. Event types live in a table, so adding one (school reunion, Teej, Dashain party) needs no code change. Each type also says whether it comes round every year, and whether it is a sensitive occasion (5g).

## 3. Who it is for first (Recommended)

1. **UK Nepali and South Asian families and communities**, starting with the owner's network:
   - GoChuchuro;
   - the Andover, Aldershot and Farnborough area;
   - the Gurkha and ex-Service community;
   - Golf Society Home.
2. **Then all UK celebrations, including other communities** through their own languages (section 8b). For example, Filipino families can use English and Tagalog from day one.
3. **Then the clubs, associations and committees that run events every year:** veterans' associations, regimental associations, charities and sports clubs.

The big tools are built for one-day American weddings. None of them handles:
- a five-function wedding with a family-only Mehndi;
- invitations in mixed Nepali and English;
- relatives watching from abroad;
- a community football tournament with stalls and parking.

WhatsApp is already how these invitations travel. In2Min2 keeps that habit and adds a real guest list.

Golf Society Home keeps its own social-event builder for golf days. In2Min2 is for everything else.

## 4. What others charge (researched November 2026)

*Figures come mostly from comparison sites, several run by competitors, and some conflict. Check each vendor's own page before quoting them publicly (section 5d).*

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

**Conclusion:** today a wedding host who pays for an invitation, a website and a photo app spends £40–200. A tournament organiser pays a ticketing site per ticket **and** a tournament tool. In2Min2 does all of it, so it can charge less than any one of them and still make money, because serving an event costs pennies (section 17).

### 4b. Getting to a competitive level (researched 14 Nov 2026; Recommended)

*Most comparison pages are written by competitors, so treat their claims with care.*

**What others offer now:**
- **Free party apps** (Partiful, Evite): free invitations, replies and updates to guests. Partiful added paid tickets in June 2026, starting in the USA.
- **Wedding suites** (Joy, Zola): a free website and replies; premium digital cards cost extra.
- **Guest photo apps** (Kululu, GuestPix, Wedibox, GuestCam): guests scan a QR code and upload with no app. Most add a live slideshow for a TV, and some an audio or video guestbook. Usually a one-off fee of about $39–99.
- **Event and ticket platforms** (Luma, Eventbrite): registration, QR check-in and messages to attendees. Luma's free plan takes 5% of paid tickets.

**Where In2Min2 is already ahead:** two languages including Nepali; one link through every stage; a running order with menus; community tools; lower fees than any ticketing rival (5d).

**Gaps to close, in order:**
1. **Replies that work**, with the guest list, numbers and "Add to calendar". Today the reply buttons are only a preview.
2. **The main photo on the guest page**, and the **picture WhatsApp shows** when the link is pasted (`opengraph-image`). WhatsApp is how these invitations travel.
3. **Updates to guests:** reminders, and "something changed" messages.
4. **The photo wall:** a QR code on table cards, no app needed, and a live slideshow for a TV.
5. **Small delights:** the invitation opening like an envelope; seasonal effects (snow, fireworks, marigold petals); a voice-note guestbook (24).
6. **Posters with a QR code**, print-ready.

**Free-licence sources that are safe to build in** (ask the owner before adding each one; CLAUDE.md):
- **Icons:** Lucide (ISC licence) or Tabler (MIT), one consistent set for the whole app.
- **Festive pictures:** Microsoft's Fluent Emoji (MIT; commercial use allowed). These are 3D-style pictures such as a Christmas tree, gift, fireworks, party popper and diya lamp, for seasonal designs and the share images.
- **Moving stickers:** Google's Noto Emoji Animation (CC BY 4.0: allowed if we credit Google).
- **Effects:** canvas-confetti (ISC) for petals, snow and fireworks; already planned (17a).
- **QR codes and print-ready posters:** `qrcode` and `pdf-lib` (both MIT).
- **Fonts:** Google Fonts (Open Font Licence), already in use.
- **Not used:** Canva elements, Freepik, Pinterest, or stock photos built into templates (7d). Hosts use their own photos.

**Seasonal showcase for the festive launch (Recommended):** Christmas party, New Year's Eve and Tamu Lhosar (30 December) designs, each with:
- its own colours and border;
- an effect: snow, fireworks or marigold petals;
- the home page banner "Festive launch: free until 31 January 2027".

## 5. Pricing (Decided by the owner, 13 Nov 2026, as launch prices)

### 5a. Principles

1. **Pay once per event.** Events are occasional; subscriptions are only for organisers who run events all year.
2. **Charge for time and size, never for switches.** Every switch works on every plan. Size means the number of people.
3. **Stay below the market on purpose at launch.** Call them "launch prices". It is easy to raise prices for *new* customers later, and one-off buyers have nothing to renew, so there is no backlash.
4. **Upgrade any time, even after the event**, by paying the difference. The best moment to sell is when a family sees their Pasni photos and the page closes in 7 days.
5. **Never hold memories hostage.** Before a free page closes, the host can download the photos at standard quality, for free.
6. **Community events pay nothing up front.** There is a fee only when money comes in online, and only on that sale. Organisers are often volunteers and can't pay before entries come in. Free events pay nothing at all.

### 5b. Personal and celebration events: time sets the plan, people add packs

**How it works (Decided, owner, 13 Nov 2026):** the plan is *how long the page stays up*. Each plan includes a starting number of people, and any plan can add more in packs of 100 for £3, as many as needed.

The page is live from the moment it is published. It stays up for this long *after* the event:

| | **Pop-Up** | **Season** ★ | **Half-Year** | **Keepsake** |
| --- | --- | --- | --- | --- |
| Best for | Birthdays, Pasni, parties, memorials | Anniversaries, engagements, Bratabandha, reunions | Weddings planned well ahead | Weddings and milestones to keep |
| Price | **Free** | **£9** | **£15** | **£25** |
| Online after the event | 7 days | 90 days | 6 months | 12 months |
| People included | **200** | **300** | **400** | **500** |
| More people | +100 for £3 | +100 for £3 | +100 for £3 | +100 for £3 |
| Photos (per guest) | 50 (10) | 300 (20) | 600 (20) | 1,000 (30) |
| AI writes | 5 | 30 | 50 | 100 |
| Download | Standard quality | Standard quality | Standard quality | Full resolution, as a ZIP |
| "Made with In2Min2" | Shown | Shown | Shown | Removed |

★ The sweet spot the owner described. £9 for 90 days is cheaper than every paid invitation or photo app in section 4.

**Why 200, 300, 400 and 500 people (agreed 13 Nov 2026; the owner asked for numbers between 200 and 500):**
- **200 on the free plan** covers almost every birthday, Pasni and family party. So the free page is truly useful and gets shared, and that is the hook. What makes people pay is time and photos: the page closing after 7 days, and 50 photos filling up.
- **Each step adds 100 people**, the same as one pack. That makes it easy to explain: "the next plan gives you 100 more people *and* more time".
- **People cost In2Min2 almost nothing** (a guest is a few hundred bytes). Photos and time are what cost. So the price follows time, and people are cheap to add.
- **Weddings (300–600 people)** land on Half-Year or Keepsake, perhaps with a pack. A 600-person Keepsake wedding is £25 + £3 = £28, still below every rival in section 4.

**Examples:**

| Event | Plan | People | Price |
| --- | --- | --- | --- |
| One-week birthday | Pop-Up | 250 | £0 + £3 = **£3** |
| 90-day anniversary | Season | 380 | £9 + £3 = **£12** |
| 12-month wedding | Keepsake | 650 | £25 + £6 = **£31** |

Each plan's price, people and pack live in the `plans` table, so changing them needs no new release. (Built: `plans.guest_pack_size`, `plans.guest_pack_pence`, `events.extra_guests`.)

### 5c. How limits, warnings and upgrades work (Recommended; database part built)

**The first payment.** In the builder, after "When and where", one question: **"About how many people?"**, a number (`events.expected_guests`). With the date, it picks the plan and shows the price before anything is paid, with any discount (5g, 5h) already taken off: *"90 days, up to 400 people: £12"*.

- **Pop-Up** needs no card.
- **Paid plans** go through Stripe Checkout: card, Apple Pay or Google Pay, about 20 seconds, with a receipt by email.
- **The launch offer** code (5e) replaces the payment.

The browser can never change the plan. Only the payment webhook or the offer function can.

**What counts.** People invited or coming are counted by party size: a family of four counts as 4. Those who declined and those on the waiting list don't count. This is the same number the venue and caterer need, so the host has every reason to keep it true (section 10). (Built: `event_usage()` returns people, attending, limit, level, venue capacity left, and AI writes left.)

**The warnings.** In the dashboard, by email, and as one tap from the share screen:

| Level | When | What the host sees |
| --- | --- | --- |
| Near | 80% of the limit | "You've invited 160 of 200 people. Room for 40 more." |
| Full | 100% | "You're full. Add 100 more people for £3." One tap to pay |
| Over | Above 100% | Guests' replies still work up to 10% over, so no guest is ever turned away at the door by the app. After that, new replies pause with a kind message ("The host is updating the guest list; please check back soon") and the host gets a one-tap upgrade. Existing guests are never affected |
| Closing | 7 days and 1 day before the page closes | "Keep your memories for longer", with the price of the next plan |

**Photo limits** work the same way: near, full, then "add more photos" by moving up a plan.

**Venue capacity is different from the plan limit.** It is a safety number the host types from the venue (`events.venue_capacity`). Replies and tickets stop at it, and a waiting list takes over. No payment ever lifts it.

### 5d. Community and sport events: free to set up, paid only from online sales

| | **Community** |
| --- | --- |
| Set-up | **Free**, with every organiser tool: teams, the draw, fixtures, live scores, stalls, sponsors, parking, gate scanning, cash sales |
| Online orders | **4% + 30p per order**, card costs included, added to the buyer's total by default (the organiser can choose to absorb it instead) |
| Cash and card on the day | **No In2Min2 fee.** Recording cash sales and receipts is free |
| Free events and free tickets | **No fee at all.** Free tickets still give QR passes and a head count |
| Online after the event | 90 days (Keepsake upgrade £25 for 12 months) |
| Photos | 2,000, approved by the organiser before showing |

**Is the fee automatic and fair?** Yes, it is automatic. The fee is taken by Stripe at the moment of each online payment (section 14b). Nobody sends an invoice or chases payment. The organiser's dashboard shows every order as: price, booking fee, card cost and amount to your bank.

It is fair because it is:
- per **order**, not per ticket;
- nothing on cash;
- nothing on free events;
- below every rival in section 4.

**Worked example:** a family buys 4 entries at £5 online (one £20 order).

| Platform | Fees on that order |
| --- | --- |
| Eventbrite (6.95% + 59p per ticket) | about £3.75 |
| TicketSource (about 4% + 65p per ticket) | about £3.40 |
| Ticket Tailor (26–60p per ticket + Stripe) | about £1.54–2.90 |
| **In2Min2 (4% + 30p per order)** | **£1.10** |

A lone car park pass: £3 + 42p = £3.42 online, against £5 at the gate. The buyer still saves £1.58.

**The hook for organisers (Decided, owner's words):** *"No upfront cost. No guesswork. No cash flow needed. You pay nothing until your first online sale, and then only a small part of that sale. Cash on the day is always free."*

**Show the comparison where organisers decide.** Show it on the community sign-up page and in the organiser's dashboard after each event ("This event's online sales would have cost about £X in fees elsewhere").

UK advertising rules (the CAP Code) require comparisons to be accurate, checkable and up to date. So each figure must:
- name the rival;
- show the date it was checked;
- link to the rival's own price page.

Re-check them every three months.

### 5e. Launch offers (Decided; counter built)

- **Pop-Up stays free for good.** It is the "try it" hook: a family sees how good their birthday page looks, and upgrades when they want to keep it.
- **Free Keepsake for the first 50 families.** The code `LAUNCH50` is entered in the builder or used through a link the owner shares.
  - The database counts claims and stops at 50, so from the 51st family normal prices apply without anyone counting.
  - The pricing page can show *"12 of 50 free places left"*.
  - One place per account. Deleting the event and starting again doesn't give a second place.
  - Built: `offers`, `offer_claims`, `claim_offer()`, `offer_places_left()`, with checks.
  - More offers (e.g. `ORGANISER5` for 5 organisers) are one row each in the `offers` table.
- **Free Organiser for the first 5 community events**, in return for feedback and permission to show their page as an example (phase 6).
- **Festive launch (Decided, owner, 14 Nov 2026: "seasonal event design would be a lovely way to showcase the free launch offer until 31 January").** Paying only opens in February (phase 4), so every event published before then is free in any case. Say so proudly:
  - **"Festive launch: In2Min2 is free until 31 January 2027."** It's a clear end date, it ties in with Christmas, New Year and the pilot, and it's honest.
  - Then the normal prices start. Pop-Up stays free for ever, and `LAUNCH50` carries on for the first 50 families.
  - **Organisers:** "No In2Min2 fee on your first event's online sales", for organisers who sign up before 31 March 2027. Stripe's own card cost still applies. This beats a 30-day trial, because their sales come in April–May.
  - **Why not "30 days free on every plan" for good:** events are one-off, so a 30-day trial is the whole event for free for most families. A dated launch offer creates urgency and then ends.
- **"Coming soon" labels** show what isn't finished: Sports tournament (team tools in March) and Mela (ticket sales in February). The page itself can be made now.

### 5f. Add-ons and subscriptions

| | Price | Notes |
| --- | --- | --- |
| More people | +100 for £3 | Any personal or celebration plan |
| Own web address | £10 a year | The host buys the domain (about £8–10 a year) and connects it in two steps. SSL is automatic through Cloudflare for SaaS: 100 addresses free, then about $0.10 a month each |
| Keep it longer | Pay the difference to the next plan; Keepsake +12 months £10 | |
| **Organiser** subscription (phase 6) | £10 a month or £100 a year | For clubs and committees that run several events: booking fee drops to 2.5% + 25p, own logo, no In2Min2 footer, every event kept 12 months. Compare LeagueRepublic at about €17.90 a month |
| Cash gifts (phase 4) | No In2Min2 fee at launch | The guest covers the card cost. "Every penny reaches the family" |

### 5g. Next year, and more than one event (Decided, owner's idea of 13 Nov 2026)

Many events come round every year: birthdays, anniversaries, a community tournament, a regimental day, a charity walk. Others happen once: a wedding, a Pasni. The event type knows which (`event_types.repeats_yearly`, built), and a wedding comes back as its anniversary (`event_types.repeat_as`, built).

**1. The same event next year: "Run it again", 30% off.**
- When the page closes, the host is asked: *"Will you hold this again next year?"*
  - **Yes, keep it** (free): the guest list, functions, honoured family, words, look and switches are kept for up to 13 months after the event, with the page offline (`events.keep_for_next_year`, built). Photos follow the plan as normal.
  - **No**: everything is deleted 30 days after closing, as now.
- About 8 weeks before the date next year: *"Your tournament is coming up. Set up 2027 in one tap."* One tap makes a draft copy with next year's date and everything carried over. The host checks it and publishes.
- **30% off** the plan and guest packs, applied by itself. There's no code to type, so nothing to lose or pass around.
- A wedding's "next year" is its first anniversary: *"Your first anniversary is on 14 March. Make a page for it, 30% off, with your wedding guest list ready."*
- Community events carry over their competitions, products and prices, stalls and sponsors. Their booking fee is per sale, so the 30% doesn't apply to them. The carry-over and the same address every year are their hook. A fee level the owner set (5h) carries over too, and he can change it.
- All the years of one event share a `series_id` (built). That is how the system knows it's a repeat. To count, the new date must be at least 9 months after the last one.

**2. A different event: "Welcome back", 20% off.**
- A host who paid for an event in the last 12 months gets 20% off their next one. It is applied by itself and shown as *"Welcome back: 20% off"*.
- Example: a family's Pasni in March, then a grandparent's birthday in August.

**3. Rules that keep it simple:**
- Discounts never stack. The single best one applies: the owner's fee level (5h), same-again or welcome-back.
- The owner's own codes (`LAUNCH50`, or one he makes for a group) still work, typed or through a link.
- **Sensitive occasions are never sent offers.** A memorial or funeral (`event_types.sensitive`, built) gets no discount emails and no "run it again" reminders, with calm colours and no celebration animation. The family can still copy it themselves.

**4. Many events a year:**
- Clubs and committees: the **Organiser** subscription (5f), with every event kept 12 months and data kept between events.
- Families with four or more events a year: perhaps a **Family Year** pass later (for example £39 a year for every personal and celebration event). Decide after the pilot, from real numbers.

*When:* the "Keep it for next year?" question comes in phase 3 with the closing emails, so pilot families can say yes. "Run it again" and the discounts come in phase 6, well before the first repeats in late 2027. The database fields are ready now.

### 5h. Free, half or full: the owner decides (Decided, owner, 13 Nov 2026)

The system can't know whether an event is sensitive or deserving, so it never decides. **Every event pays the normal prices by default.** The owner can set any one event to:

| Fee level | What the event pays In2Min2 | Example |
| --- | --- | --- |
| **Full** (default) | 100%: the normal plan, packs and booking fee | Almost everything |
| **Half** | 50%: e.g. Season £4.50; booking fee 2% + 15p | A registered charity's fundraiser |
| **Free** | Nothing | A funeral; a large free community tournament as a showcase |

- Stripe's own card cost (about 1.5% + 20p) still applies to online sales on Half and Free. In2Min2 can't waive it, just as a card machine still charges.
- **How organisers ask:** an *"Ask about a reduced fee"* link on the pricing page and the organiser dashboard opens a short form: organiser, event, why, and a charity number if they have one. It goes to the owner by email. Nobody gets a reduction without asking.
- **How the owner sets it:** on the admin page (phase 4), choose Full, Half or Free and add a note. Until then: Supabase › **Table Editor** › `events` › the `charge_percent` column (100, 50 or 0). Built: `events.charge_percent` and `events.charge_note`, which only the server can change, with checks.
- **Does any law say some events must be free?** No. No UK law requires a booking service to give free or cheaper service to charities, the armed forces or funerals, so the system doesn't need to know. One legal point does matter. Under the Equality Act 2010, the decision must not depend on religion, race or another protected characteristic. So write down simple rules and apply them the same way to everyone, for example:
  - memorials and funerals: Free;
  - registered charities and armed-forces welfare events: Half, or Free as a showcase;
  - everything else: Full.
- **Can the system check a charity?** Partly. A charity number can be looked up on the Charity Commission's register (England and Wales), OSCR (Scotland) or the Charity Commission for Northern Ireland. Small charities (income under £5,000) don't have to register, so a missing number doesn't mean "not a charity". The owner checks by hand; an automatic check could come later (24).

**Who is behind a community event (Decided, owner: "remove this anonymity").**
- Before a community event can be published, the organiser gives:
  - the organiser's name;
  - what kind of organiser: family, individual, business, community group, club, charity, armed forces association or faith group;
  - **"Is anyone making a profit from this event?"**;
  - a charity number, if any;
  - a contact to show.
- The database refuses to publish a community event without the first three (built and tested).
- The public page shows it: *"Organised by Riverside Community Association · Charity 1234567 · Not for profit"*. Buyers see who they are paying and whether anyone profits.
- Anyone who takes money online also passes Stripe's identity check (name, address, date of birth, bank). So nobody sells tickets anonymously.
- Prices are the same for profit and not-for-profit events by default. The answer helps the owner judge fee requests. A false answer breaks the terms: the owner can move the event to Full or take it down.

## 6. The life of an event (Decided)

The page changes by the clock alone, in the event's own time zone (`public.stage()`):

| Stage | When | Personal and celebration | Community and sport |
| --- | --- | --- | --- |
| **Before** | From publishing to midnight on the day | Invitation card, countdown, functions, map and parking, RSVP, gifts | Poster, countdown, buy tickets and parking, team entry and stall applications, the draw, fixtures |
| **On the day** | Midnight until the end | Big "Add your photos" button, live schedule, directions, live stream | Live scores and tables, "now on pitch 3", stall map, photos, buy on the day, live stream |
| **After** | Until the plan ends | Thank-you message, gallery, videos, guestbook, feedback | Results, winners, top scorer, sponsors thanked, gallery, feedback |
| **Closed** | After the plan ends | "This event has ended"; host can upgrade | Same |

The owner agreed this flow for the first build; it will be refined from pilot feedback.

## 7. The builder: simple enough for a 12-year-old (Decided in outline; details Recommended)

**What you see is what guests get (Decided).** The preview is a live mirror. Every word typed, colour picked or switch flipped shows instantly:
- On a phone, a small live card sits at the top of each step; tap it to see it full-screen.
- On a computer, the preview sits beside the form.

There is never a separate "preview mode" that looks different from the real page.

**One question per screen.** Big buttons, a progress bar, everything saved as you go, and Back is always allowed. Each choice has one short line underneath saying what it does. Target: a published page in under two minutes with the defaults.

1. **What are you celebrating?** Picture tiles: Birthday, Pasni, Wedding, Anniversary, Reunion, Mela, Tournament, Charity… The scale is picked automatically and shown: "This looks like a Celebration. Change".
2. **Who is it for?** The **stars**: the child, the couple, the birthday person, the regiment, or the tournament itself. Then **"Family to honour"**: parents, grandparents and close family, with names and optional photos. They appear with pride on the card and page ("With blessings from") (`event_people` table, built).
   - **Community events: who's organising.** Name, kind of organiser, "Is anyone making a profit?", charity number and a contact. Needed before publishing (5h).
3. **When, where and how many.**
   - Date and time.
   - Venue: type the address or paste a Google Maps link.
   - **Parking**, with one tap: *Free car park · Paid parking · Street parking · No parking*, plus a short note ("40 spaces behind the hall"). Shown to guests with a directions button. Built: `events.parking`, `events.parking_note`.
   - **Running order (owner's request, 14 Nov 2026, from Golf Society Home's running order and menu; built).** What happens when: quick-add buttons for each kind of event, then a time, what, and optionally a place, a date and a short note. Anything that is a meal carries its **menu** (course and dish, up to 20 dishes), shown under that meal on the page like a printed menu card. Guests see it in time order on the event page; on the day it marks **On now** and **Next**. Two switches: **Running order** (`feature_toggles.schedule`) and **Food menu** (`feature_toggles.menu`, 0003). Stored in `sub_events` (a meal is `kind = 'meal'` with `details.menu`).
   - **About how many people?** This sets the plan and price (5c).
   - **Venue's safe capacity** (optional; asked straight away for community events).
4. **The words.**
   - Choose up to two languages (section 8b).
   - Press **"Write it for me"** and the boxes fill in both languages, each with a character counter. It sits in its own highlighted panel (owner, 14 Nov 2026: "make the AI writing a bit obvious"); without an account it says "Sign in and write it for me" and writes straight after sign-in.
   - Every box has small buttons: *Shorter · Warmer · More formal · More fun · Rewrite*.
   - Edit anything.
5. **The look (Decided in outline, owner, 13 Nov 2026: "verities makes people … feel good like shopping in the high street").** Every choice is shown on the host's own card, never as a settings form. Suggestions for this kind of event come first, then everything else. Built in `lib/catalog.ts` and `components/event/`; checked by `npm run test:db`.
   - **Main photo**, made smaller on the phone with its location data removed. **How it fits** (0003, `events.cover_fit`): *Fill the space* (photos) or *Show the whole picture* (logos and posters: never cropped, on a soft blurred copy of itself). A square or tall picture starts as "whole". A Hero photo runs edge to edge above the border, so the border never sits under it (owner's test, 14 Nov 2026).
   - **Border (18, drawn in code, in the event's own colours):**

     | Border | Suggested for |
     | --- | --- |
     | Plain · Fine lines | Corporate, memorial, anyone who wants it quiet |
     | Ornate scrolls · Art Deco | Weddings, anniversaries, galas, engagements |
     | Laurel | Regimental days, reunions, awards, remembrance |
     | Flowers · Leafy vine | Weddings, birthdays, charities |
     | Marigold garland · Dhaka pattern · Lotus & mandala | Pasni, Bratabandha, pujas, Dashain and Tihar, Nepali weddings |
     | Balloons · Confetti · Bunting · Stars | Birthdays, parties, fêtes, melas |
     | Sunburst · Festival frame | Melas, charity days, festivals (a bold colour-blend frame) |
     | Sport stripes · Pitch lines | Tournaments |

     Each event type lists its suggestions in order, and the first is where it starts (`EVENT_TYPES[].borders`; `events.border`).
   - **Colours (30 sets in 8 families, every one checked for readability):**
     - **In2Min2:** Marigold & Indigo, Lali Gurans, Himalayan Dusk (the three the owner wants hosts to have).
     - **Formal:** Navy & Gold, Regimental Green, Black & Gold (dark), Burgundy & Gold, Charcoal & Silver, Black & White.
     - **Nepali and South Asian:** Red & Gold, Dhaka Red, Saffron & Maroon, Tihar Night (dark).
     - **Modern:** Sage & Terracotta, Ocean & Coral, Royal Blue, Garden Green, Lavender & Sage.
     - **Festival colours:** Festival Rainbow, Sunset Mela, Holi Colours, Northern Lights (dark), Confetti Brights. These are colour blends, like a festival poster.
     - **Party:** Citrus Pop, Pastel Party (the only pink-led set, as the owner asked for fewer pinks).
     - **Sport:** Pitch Green, Team Red & Black, Stadium Night (dark).
     - **Calm:** Calm Grey, Lily White & Sage, for memorials.
     - Then "your own colour", with the text colour picked automatically.
   - **Text style (10), each with matching letters for Nepali and Hindi, Punjabi, Gujarati, Bengali and Tamil** (all free Google Fonts, self-hosted; a phone downloads only what the event shows):

     | Style | Feel | Headline font (Latin; Devanagari) |
     | --- | --- | --- |
     | Classic | Traditional serif | Playfair Display; Tiro Devanagari |
     | Formal | Engraved capitals: regimental, memorial, corporate | Cinzel; Tiro Devanagari |
     | Elegant | Light italic serif | Cormorant Garamond; Noto Serif |
     | Calligraphy | Flowing script for weddings | Great Vibes; Amita |
     | Heritage | Bold, beautiful Nepali and Hindi headlines | Rozha One |
     | Contemporary | Soft modern serif | Fraunces; Noto Serif |
     | Clean | Plain and modern | Inter; Noto Sans |
     | Poster | Tall capitals for sport and melas | Bebas Neue; Mukta |
     | Playful | Round and friendly, for children | Baloo 2 (and its Punjabi, Gujarati, Bengali and Tamil sisters) |
     | Handwritten | Like a note from a friend | Caveat; Kalam |

   - **Layout:** Classic (centred), Modern (left-aligned with a colour band), Festive (centred with a bright label), Poster (big capitals).
   - **Photo style**, 4 presets:
     - *Hero*: the photo fills the top, with the words over it.
     - *Arch*: the photo sits in an arch or circle frame, ideal for a child or a couple.
     - *Polaroid*: three tilted photos, fun for birthdays.
     - *Split*: photo on one side, words on the other, for sport and corporate.
   - **Motion:** on or off. When on, animation appears only at a few key moments (7b).
6. **Switches.** Only those for this scale, each with an icon and one line ("Car parking: sell parking passes online, cheaper than on the day").
7. **Check and publish.**
   - Previews in tabs: **Invitation card · Event page · On the day · After the event**, with a phone/computer toggle.
   - The price, if any, and a short checklist: "I've checked the names, date, venue and numbers."
   - Then **Publish**, which opens the share screen (section 11).

**Top-right corner, as in most apps (owner's request, 14 Nov 2026; built):**
- **Share** (owner, 14 Nov 2026 night: "all of these links made available here"): before publishing it explains that publishing comes first. After publishing it opens a panel, also shown on step 7 (`app/builder/share-links.tsx`):
  - "One link does it all": the event link is the whole page and changes by itself through the stages;
  - the link and the short link (`/e/{code}`, for posters and reading aloud);
  - a ready-made message for each moment, each with **Share**, **WhatsApp** and **Copy**: the invitation, the running order (jumps to `#running-order`), directions and parking (`#where`), a reminder, on the day, and thank you;
  - what's coming: a personal link per guest, and a poster with a QR code.

  The public page has **Share this page** for guests.
- **The bell (Updates)**: what needs doing (sign in, still needed to publish, changes not live yet), and later each guest's reply (phase 2).
- **Settings** (a cog, or the host's initial once signed in): who is signed in, shortcuts to switches, the look and publishing, start a new event, sign out.
- **Sign-in** opens in its own window (a sheet from the bottom on a phone) with two numbered steps, so it never looks like part of the page.

**Flow of the words (Decided):** AI suggests → host edits → saved automatically → host approves (the checklist) → publish. Nothing goes live unapproved.

### 7b. Animation only where it counts (Recommended)

1. **The invitation opening**: the card unfolds or an envelope opens the first time a guest taps the link (2 seconds, tap to skip).
2. **The main photo**: a slow, gentle zoom.
3. **The countdown**: digits flip.
4. **Saying "Yes" to the RSVP**: a short shower of marigold petals (confetti for parties).
5. **The live photo wall**: each new photo slides in.
6. **Tournaments**: the draw reveals each team like a World Cup draw; a goal flashes on the big screen.

Everything else stays still. People who have reduced motion switched on see no animation.

### 7c. How it should feel: beautiful, warm, trusted (Decided in spirit, 13 Nov 2026)

- **About people and pride, not technology.**
  - The stars are big.
  - Parents and grandparents are named with honour ("With blessings from").
  - Photos come first, and the words are warm.
  - Every screen should make a mother, a father, an auntie or a team manager feel proud to share it.
- **For everyone who plans.** Women and men both organise these events, often together.
  - The templates run from soft and floral to classic, bold and sporty.
  - Thirty colour sets in eight families, from formal navy and gold to festival colour blends, including all three of In2Min2's own (7, step 5).
  - Nothing assumes who the host is.
- **Easy for grandparents.**
  - Large text and strong contrast.
  - One big action per screen.
  - Works on old phones and slow 4G.
  - Reading the page never needs an account.
- **Calm and trustworthy.**
  - No adverts and no pop-ups.
  - The organiser's real name and contact are on the page.
  - Every payment step explains itself in plain words (14a).
  - "Made with In2Min2" stays small.
- **Small moments of delight**, only at the six moments in 7b.
- **Quiet for sad occasions.** A memorial or funeral gets calm colours, no petals or confetti, gentle wording that never says "celebrate", and no offers (5g).

## 8. The AI writer and languages

### 7d. Design artwork: what we can do, and who owns it (owner's question, 13 Nov 2026)

**Drawn in code (now).** Every border is drawn by In2Min2's own code, as shapes rather than pictures. That means:
- In2Min2 owns them outright;
- they stay sharp on any phone;
- they cost nothing to show;
- they change colour with the event.

Code drawing suits crisp, modern, flat designs: garlands, laurels, Art Deco, confetti, patterns. It does not suit painterly watercolour (butterflies, Christmas baubles, hand-painted flowers).

**Pictures found online can't be used.** Pinterest, Canva, Freepik and similar sites can't be copied into the app.
- Pinterest images belong to other people.
- Canva's licence doesn't allow its elements to be taken into another product.
- Most stock licences don't allow their art in an app where customers make their own designs.

**To go further, three options (Recommended, in this order):**
1. **Commission an illustrator** for a signature set, for example 6–10 hand-drawn borders for weddings, Pasni, memorials and melas.
   - Ask for SVG files and a written transfer of full commercial rights.
   - Get quotes from UK illustrators, or on Upwork or Fiverr. Prices vary widely, so compare several.
   - The code adds each one as a new border, in the event's colours where the artwork allows.
2. **AI-generated artwork** with Google's Gemini image model, on the account we already use for the AI writer.
   - Good for one-off backgrounds and textures.
   - Each picture needs checking and tidying, and Google's terms must be checked before commercial use.
3. **Figma**, the free design tool, if a designer joins: Claude Code can read Figma designs once the owner connects it.

Canva stays useful for the owner's own posters and social posts.

**Canva on a paid plan (owner's question, 14 Nov 2026).** A paid plan does not change this. Canva's licence lets Pro elements be used inside Canva designs. It does not allow them to be taken out and built into another app, or used as files that customers design with. The owner can send Canva patterns as *inspiration*, and In2Min2 draws its own versions in code, which is legal and owned outright. One exception is worth checking: Canva says images made with its AI tools fall under separate AI terms that allow commercial use. If wanted, read those terms before relying on it.

### 8a. "Trained" without the cost of training (Recommended)

The route is built: `app/api/generate-copy/route.ts`. It has five boxes with strict lengths and uses Gemini's strict JSON output:

| Box | Limit (characters) |
| --- | --- |
| Headline | 45 |
| Invitation | 180 |
| Page welcome | 450 |
| Guest note | 140 |
| Thank-you | 220 |

To make it write like a local expert:

- **A prompt library per event type** (`lib/ai/prompts/<type>.ts`). Each covers:
  - what the event is;
  - what guests need to know;
  - the tone that suits it;
  - 2–3 example texts **written or approved by the owner**.

  Gemini follows examples very closely, so this is cheaper and better than fine-tuning.
- **A phrase bank per language** (`lib/ai/phrases/<language>.ts`). For Nepali: शुभ विवाह, हार्दिक निमन्त्रणा, आशीर्वाद, plus the common English and Romanised forms.
- **Two languages in one call**: the reply carries both languages' boxes, each within its limit, adapted rather than translated word for word. They are stored as the main boxes plus `copy_translations` (built, length-checked in the database).
- **One-tap rewrites** of a single box (Shorter, Warmer…), each counted as one AI write.
- **Learning from edits**: with the host's consent, keep anonymous before-and-after pairs and use the best to improve the examples each month.
- **Never invent facts**, ignore instructions hidden in the facts, and trim anything over a limit. All built.

### 8b. Any language, added without rebuilding (Recommended, owner's question of 13 Nov 2026)

The database already accepts any language code (`events.languages`, e.g. `{tl,en}` for Tagalog and English). Gemini writes well in well over 100 languages. Free Noto fonts cover almost every script. So a new language is a small addition: a phrase-bank file, a font and a native speaker's check. There is no new database and no new design.

Three levels, shown honestly in the language picker:

| Level | Languages | What it means |
| --- | --- | --- |
| **Ready** (launch) | English, Nepali, Nepali in English letters | Full phrase bank and examples; matching fonts in every text style |
| **AI-written** (launch, labelled "Beta, please ask a native speaker to check") | Hindi, Punjabi, Gujarati, Bengali, Tamil, Tagalog (Filipino), Polish and other left-to-right languages | Gemini writes them; fonts from Noto; we promote a language to Ready when a community helps check its phrase bank |
| **Later** | Urdu, Arabic and other right-to-left languages | The whole page layout flips, so these need design work first |

**Who checks the words (Decided, owner, 13 Nov 2026):** the host or organiser, in every language. They save, approve and publish their own text, and nothing goes live unapproved (7). In2Min2's own example texts are labelled as examples, and are corrected whenever a user suggests a better wording.

**Fonts for other languages (owner's question, 13 Nov 2026).** The AI writes the words; nobody has to design fonts.
- Every text style already has a matching free Google font for Devanagari (Nepali, Hindi), Gurmukhi (Punjabi), Gujarati, Bengali and Tamil.
- The phone uses the right one for each letter automatically. A Punjabi guest sees Punjabi letters in the same style as the English headline.
- Tagalog and Polish use Latin letters, so every style already works for them.
- A new script needs only one more font per style, added to `components/event/fonts.ts`.

Filipino families can use In2Min2 from day one: Tagalog uses English letters, so they get the beta level straight away. The **buttons and menus** stay in English at first. Translating the interface comes later (backlog), starting with Nepali and Hindi.

## 9. Guest list (the CRM)

**The guest dashboard: who's coming, by category (owner's request, 13 Nov 2026; phase 2, with the replies).** One screen, always up to date, shows:
- **Coming, maybe, can't come, not replied yet**, counted in people (a family of four is 4).
- **By category:** family, friends, VIPs, children, teams, sponsors, stall holders, plus the host's own tags (e.g. "Bride's side").
- **By function:** who's coming to the Mehndi, the ceremony and the reception.
- **Diets and access needs**, totalled for the caterer.
- **Against the limits:** people against the plan's limit and against the venue's safe capacity (5c, 10).
- **One-tap lists:** "not replied yet" with a WhatsApp reminder ready to send; export for the caterer and venue.

One table, `guest_crm`, holds a wedding guest, a child, a sponsor, a stall holder and a football team.

- **Categories:** guest, plus-one, child, sponsor, vendor, VIP, team.
- **Free tags:** "Bride's side", "Committee".
- **Extra details** go in `guest_metadata`: diet, access needs, shirt size, squad list, food hygiene rating.
- **Per-function invitations** (`sub_event_guests`) keep the Mehndi family-only.
- **Adding guests:** paste a list, upload a CSV, or on Android pick straight from phone contacts.
- **On the day:** helpers check people in by scanning their QR code.
- **Export for the caterer:** numbers and diets per function (section 10).
- **Feedback afterwards:** one tap for a star rating, plus an optional comment, sent with the thank-you. Only the host sees the replies.

## 10. Planning, safety and coordination (owner's request, 13 Nov 2026; Recommended)

The owner's aim is to replace paper lists, guesswork, extra volunteers and endless phone calls with numbers everyone can trust: the host, the venue, the caterer, and for big events the council.

**What In2Min2 does:**
- **True numbers, live.**
  - People invited, coming, maybe and declined, per function.
  - Adults and children.
  - Diets and access needs.
  - All from guests' own replies, not estimates.
- **Stops at capacity.** Replies and tickets close when the venue's safe capacity is reached, and a waiting list takes over (5c).
- **Live count on the day.** For ticketed events, the Gate screen counts each scan:
  - "1,240 in; capacity 1,500".
  - Car parks the same: "212 of 300 spaces used".

  It counts people in, not out, unless exits are scanned too. The screen says so.
- **Helpers with roles:** gate, car park, check-in, photos. Each has their own sign-in and sees only their job. Their names and phone numbers are listed for the day.
- **Stall holders' papers:** their food hygiene rating, public liability insurance and expiry dates are collected on the application, and the organiser sees what is missing.
- **The event pack**, one tap, a PDF for the venue, caterer or council:
  - the event's details and timings;
  - expected and confirmed numbers per function, with diets;
  - capacity;
  - parking;
  - stall holders and their certificates;
  - sponsors;
  - helpers and contacts;
  - the organiser's own safety notes (first aid, fire marshal, meeting point);
  - dated: "Prepared with In2Min2 on 2 May 2027 at 10:14".
- **Feedback** after the event (section 9), so next year is better.

**What it does not do: say this honestly everywhere.**
- In2Min2 keeps accurate records and checklists. It **does not certify that an event is safe**.
- The organiser and the venue stay responsible for safety.
- For large public events, many councils ask for an event management plan through their Safety Advisory Group. The event pack supplies its numbers and lists, but it isn't the plan itself.
- Never use words like "safety approved" or "compliant".

## 11. Sharing everywhere (owner's request, 13 Nov 2026)

- **One Share button.**
  - On a phone, it opens the phone's own share menu (the Web Share API). WhatsApp, Messenger, Instagram messages, Viber, Telegram, Signal, IMO, Snapchat, SMS and email all appear if installed.
  - On a computer: buttons for WhatsApp, Facebook, Messenger, X, LinkedIn, Telegram, email and Copy link.
- **Rich previews everywhere.**
  - Every link shows the invitation picture, title and date when pasted into WhatsApp, iMessage, Facebook, Messenger, X, LinkedIn, Telegram, Viber, Slack or Discord.
  - The picture is generated automatically for each event (Next.js `opengraph-image`).
  - Check the CPU time on Workers: the free plan allows 10 ms per request. Picture generation will probably need Workers Paid ($5 a month), which is already planned for launch.
- **Instagram, TikTok, Facebook Stories and WhatsApp Status** don't accept a link in a post, so the host gets ready-made images:
  - a **story** (1080×1920) and a **square post** (1080×1080) of the invitation card, with a QR code and the short link;
  - Instagram's link sticker carries the link;
  - later, a 10-second video of the card opening, for Reels, TikTok and Status.
- **Personal links by WhatsApp.**
  - Each guest's row has a WhatsApp button. It opens WhatsApp on the host's own phone with the message and the guest's personal link already typed.
  - No WhatsApp Business account, no cost, and it comes from a number the guest knows.
  - Email and SMS buttons work the same way.
- **Posters and QR codes, made automatically.** The app already knows the title, date, venue, main photo, colours, text style and short link.
  - A poster template lays these onto an A4 or A5 page and adds a QR code.
  - It is drawn **on the host's own phone or computer** (free, no server cost), and the host taps **Download poster** to get a print-ready PDF or picture. They print at home or at any print shop.
  - The same goes for table cards ("Scan to add your photos"), the "Pay here" gate poster, and numbered car park slips.
  - Melas put the posters in shop windows.
- **Short links**: `in2min2.com/e/x9k2`, easy to read aloud or type from a poster. Shown in the Share panel (7).
- **Links to a part of the page** (built 14 Nov 2026): `#running-order`, `#where` and `#reply` open the page at that section, which glows briefly. Only the public page has these ids (`EventView anchors`).
- **Where replies came from**: each shared link carries its channel (`?via=wa`), so the host sees "most replies came from WhatsApp".
- **Calendar**: "Add to calendar" (`.ics` and Google Calendar) after every RSVP or purchase.

## 12. Photos and video

### 12a. Photos (Recommended)

Most events need tens to a few hundred photos. A big mela or tournament may get 1,000–2,000 in a day, and the total across all events will be large. The design handles all of these cheaply:

- **Limits per plan** (section 5) and **per guest**, so one phone can't fill the wall.
- **The phone shrinks each photo before upload**: about 1600px, around 300–400 KB, plus a small thumbnail.
  - That makes uploads 10 times faster on venue Wi-Fi and 4G, and 10 times cheaper to store.
  - Shrinking also **removes the hidden GPS location** that phone photos carry. This is important for children's safety (section 22).
  - Keepsake also keeps the original (location removed) for the full-resolution download.
- **An upload queue that survives bad signal**: photos wait on the phone and send themselves when the signal returns (IndexedDB, as built in Taxelfi).
- **Straight to storage**: each upload goes from the phone directly to Cloudflare R2 with a signed link; the app never carries the file.
- **Approve-first** is the default for community events and for any event that turns it on. Family events show photos at once if the host prefers. Optional automatic screening of unsuitable images uses Cloudflare Workers AI (free daily allowance).
- **Gallery**: thumbnails load as you scroll, with albums by function or by match. "Download all" streams a ZIP.
- **Privacy**:
  - Galleries are never listed by search engines.
  - The host can switch off downloads.
  - Every photo has a "Please remove this photo" button.
  - **No face recognition, ever.**
  - Photos are deleted 30 days after a page closes, with a warning email first.

**Why Cloudflare R2 (the owner asked whether it is the best choice).** Yes. Galleries are viewed and downloaded far more often than they are uploaded, and R2 charges **nothing for downloads**. The alternatives all do:

| | Storage | Downloads |
| --- | --- | --- |
| **Cloudflare R2** | 10 GB free, then about $0.015 per GB a month | **Free** |
| Supabase Storage | 1 GB free on the free plan | Charged after a quota |
| Amazon S3 | About $0.023 per GB a month | About $0.09 per GB |
| Cloudflare Images | Priced per image stored and served | Included |

### 12b. Video: connect to YouTube and Facebook instead of storing it (Recommended, owner's request)

In2Min2 doesn't store video at launch. Video is heavy to upload on venue 4G and slow to process. Instead, it **connects** to the platforms people already use:

- **Live on the day.**
  - The host or a helper pastes a YouTube Live or Facebook Live link in the builder.
  - On the day, the page shows the stream with a **Watch live** button, for relatives abroad. The big screen can show it too.
  - A short guide card, "How to go live from your phone", links to YouTube's and Facebook's own instructions.
- **After the event.** The host pastes a YouTube video or playlist link (the wedding film, tournament highlights) and it plays inside the memory book.
- **Guests' own videos.**
  - Guests tap **Add a video link** and paste a YouTube, Facebook, Google Photos, Google Drive or iCloud link.
  - The host approves it, and it shows as a card with a thumbnail.
  - The host can also add a **shared album link** (e.g. Google Photos) for full-quality originals.
- **Later:** short clips of up to 30 seconds on paid plans. Because R2 has no download fees, this is affordable when wanted.

This is "we connect you", never "we can't do video".

## 13. Community and sport events (owner's request, 13 Nov 2026)

### 13a. Things to sell or give, and who gets them free

Every paid or free item is a **product** with switches. One screen, one row per product:

| Product | Online price | On-the-day price | Free for | Example |
| --- | --- | --- | --- | --- |
| Entry (adult, child, family) | £5 | £7 | Children under 5, teams, stall holders, sponsors | Mela entry |
| Car park pass | **£3** | **£5** | Each team 2 passes, each stall 1, sponsors | 300 spaces |
| Team entry | £150 per team | Not sold on the day | (organiser's choice) | Open division |
| Business stall | £40 small, £60 food | Not sold on the day | Charity stalls | 30 pitches |
| Sponsorship | Gold £500 / Silver £250 / Bronze £100 | — | — | Logos on page, big screen and results |
| Donation | Any amount | Any amount | — | Fundraisers |
| **Free ticket** | £0 | £0 | Everyone | A free community tournament that still needs numbers and parking control |

- **The online price ends at a set time** (e.g. Friday 23:59) and the on-the-day price takes over automatically.
- **Capacity** is set per product ("300 spaces"). It shows sold out by itself.
- **Free allowances are automatic**: when a team or stall is approved, its free parking passes appear in their confirmation.
- **Applications need approval** for team entries and stalls. The organiser accepts, then the applicant pays. If they paid first and are refused, they are refunded.

### 13b. Competitions, teams, the draw, fixtures and live scores (reuses golf's draw and live score card)

- **Any sport, any group.**
  - One event can hold several **competitions**, e.g. men's football Open, Veterans football and Ladies volleyball at the same community tournament.
  - Each has its own sport, entry fee, format, draw and fixtures, all on one page.
  - The organiser names the groups (Open, Veterans 35+, Ladies, Under-16, Army, Civilian…).
- **Eligibility is the organiser's job, not the system's (Decided).**
  - In2Min2 stores **no dates of birth, no ID documents and no player ages**.
  - When entering, the team manager ticks *"Our players meet this competition's rules"*. The organiser checks ages and identity in their own way.
  - This keeps the system light and cuts the data-protection burden.
- **Team entry form**: team name, club, manager's name and phone, kit colours. The squad list is **optional and minimal**: shirt numbers, with names only if the organiser asks. Then come approval, payment (or free), a waiting list and a closing date.
- **Formats**:
  - groups then knockout (World Cup style);
  - straight knockout with byes;
  - league (everyone plays everyone);
  - knockout with a Plate competition for first-round losers.
- **The draw**: seeded pots, groups of 3–5, and rules such as "teams from the same club in different groups". It can be automatic, or a **live draw** shown on a big screen and streamed, with the reveal animation.
- **Fixtures are generated automatically** across pitches or courts and time slots, from match length, breaks and rest between a team's games. There are printable sheets, and the public page has filters by pitch or "My team".
- **Live scores**: each pitch's referee or marshal has a private link with a PIN (golf's personal score-card links) and enters goals or points on their phone. Tables and the bracket update live for everyone.
- **Big-screen mode** (`/live/{code}`) runs on a TV or projector. It cycles through live scores, next fixtures, sponsor logos and the photo wall.
- **Results and awards**: winners, runners-up, top scorer, best goalkeeper, fair play. A results image is made automatically, ready to share.

**A free showcase.** A large, free community tournament costs In2Min2 almost nothing to support. It is a perfect public showcase. Whether it's free is the owner's call (5h): he sets its fee level to Free and asks the organisers' permission to show it.

### 13c. Business stalls and sponsors

Stall holders apply online with:
- business name and category (food, goods, services, charity);
- description and logo;
- stall size, and whether they need power;
- uploads of their food hygiene rating and public liability insurance, with expiry dates (councils and venues ask for these).

On approval they get:
- a stall number;
- a "Who's here" listing on the public page (useful promotion for them);
- a QR pass for arrival.

Sponsors choose a tier and pay online, or are added by hand. Their logos appear on the page, the big screen and the results images (golf's sponsor cards).

## 14. Money, receipts and proof of payment

### 14a. Making online payment feel safe (owner's request, 13 Nov 2026)

Many people in the community still prefer cash and distrust paying online. In2Min2 never forces online payment, and makes it feel safe:

- **Plain words at the moment of paying:** *"Pay safely by card, Apple Pay or Google Pay. Your card details go straight to Stripe, a payment company used by millions of businesses. In2Min2 never sees them. Your money goes to Riverside Community Association's bank account."*
- **Who you're paying**, always visible:
  - the organiser's name, contact and refund policy;
  - the event's real-world details;
  - the In2Min2 page on their own event address, not a strange payment site.
- **Apple Pay and Google Pay first.** No card number to type is the biggest trust boost there is.
- **A reason to pay online:** "Save £1.58: £3.42 online, £5 at the gate."
- **Proof straight away:** a confirmation screen, an email with an order number, and QR codes.
- **Social proof:** "212 families have already booked parking", shown only when it is true.
- **Cash is always welcome** and recorded properly (14c), so nobody feels pushed.
- **No tricks:** no countdown pressure and no pre-ticked extras.

### 14b. How the money flows (owner's question: "how does billing work for me and for organisers?")

**Rule: In2Min2 never holds anyone else's money.** That keeps it out of e-money regulation.

1. **Hosts buying a plan (Season, Half-Year, Keepsake, guest packs).**
   - The host pays by Stripe Checkout into **In2Min2's own Stripe account**, which pays out to the owner's bank automatically every few days. The account is a **sole trader account in Prakash's name**, trading as GoChuchuro, until the business is incorporated (Decided, 13 Nov 2026).
   - Stripe charges 1.5% + 20p on standard UK cards. On a £9 plan the owner keeps about £8.67.
   - Stripe sends the host a receipt, and a webhook switches the plan on.
2. **Community sales (tickets, parking, entries, stalls).** These use **Stripe Connect**.
   - Each organiser connects their own bank account once: a 5–10 minute identity check run by Stripe.
   - For each online order, the buyer pays the price plus the booking fee into the **organiser's** Stripe account (a "direct charge").
   - Stripe takes its card fee. In2Min2's share moves to In2Min2 automatically as an "application fee". The organiser is paid out to their bank on a schedule.
   - Worked example (£20 order):

     | | Amount |
     | --- | --- |
     | Buyer pays (£20 + £1.10 booking fee) | £21.10 |
     | Stripe's card fee | about 52p |
     | In2Min2 keeps | about 58p |
     | Organiser receives | **£20.00** |

   - Premium and overseas cards cost more, so on those orders In2Min2 keeps less (about 30p).
   - **Choose Stripe's "Stripe handles pricing for your users" option.** With it, In2Min2 pays no monthly fee per organiser and no payout fees. The other option costs the platform £2 a month for each active organiser plus 0.25% + 10p per payout.
   - With direct charges, refunds and disputes sit with the organiser's account, and Stripe covers the loss risk for those accounts.
3. **In2Min2's own running costs** are charged to the owner's card monthly: Cloudflare, Supabase, Resend, and Google if Gemini billing is on (section 17).

**Cheapest automated methods:**
- Cards and wallets through Stripe at launch.
- For larger payments such as £150 team entries, **Pay by Bank** (open banking through Stripe, no card needed) can be cheaper. Check Stripe's UK price in phase 4.
- Cash is recorded free.
- No card reader is needed: card payers on the day use the "Pay here" QR poster.

**Tax and records (check with an accountant):**
- VAT applies only above the £90,000 a year threshold.
- Keep sales records for 6 years. Stripe and the In2Min2 sales list hold them.

### 14c. Proof of purchase for every kind of payment

| How they pay | What they get as proof | How it is checked |
| --- | --- | --- |
| **Online in advance** (card, Apple Pay, Google Pay) | Instantly: a confirmation page and an email with an order number (e.g. `EV-000123`) and **one QR code per item** (entry, car park pass, team entry, stall). A "My tickets" page they can reopen from the email, with no account. Stripe's own receipt too. Later: Add to Google Wallet (free) and Apple Wallet (needs an Apple developer account, £79 a year) | Gate helpers scan the QR with their phone's camera in the In2Min2 **Gate** screen: green tick, "already used", or "wrong day" |
| **Card on the day** | The buyer scans a **"Pay here" QR poster** at the gate and pays on their own phone at the on-the-day price. They get the same email and QR, so no card reader is needed | Same scan |
| **Cash on the day** | The helper taps "+1 car park £5 cash" in the Gate screen. That makes a numbered receipt the buyer can photograph from the helper's screen (as a QR), or have sent by text or email. For cars: **pre-printed numbered dashboard slips** from a free In2Min2 PDF, each with a QR; the helper marks the slip number as sold | Marshals check the slip on the windscreen; the QR proves it is genuine |

**For the organiser:**
- Every sale (online, card on the day, cash) appears in one list with the time, product, method and which helper took it.
- At the end of the day each helper's **cash-up** shows the cash they should hold, the amount counted, and any difference.
- Exports go to CSV for the club's accounts or charity records.
- Refunds work from the same list: online orders go back to the card; cash refunds are recorded.

**Planned tables (phase 4):** `products`, `orders`, `order_items` (each with its QR token and used-at time), `cash_sales` and `cash_ups`, with the same Row Level Security pattern. QR passes are signed so the Gate screen can check them **without signal** (section 21).

## 15. Automation: the system does the chores (Recommended)

1. The page changes stage by the clock.
2. Every RSVP or purchase gets an instant confirmation with a calendar file and QR codes.
3. A reminder email goes out 24 hours before, plus a ready-typed WhatsApp reminder the host can forward in one tap.
4. The day after: a thank-you email to everyone who came, with the gallery link ("Your photos are ready") and the one-tap feedback.
5. Guest-number and photo warnings at 80% and 100%, each with a one-tap upgrade (5c).
6. Seven days and one day before a page closes, the host is emailed with an upgrade link. 30 days after closing, photos and guest details are deleted.
7. A waiting list moves up automatically when someone declines, and replies stop at venue capacity.
8. Products sell out by themselves, and the online price switches to the on-the-day price at its cut-off time.
9. The organiser gets a daily sales summary, an alert when something is nearly sold out, and a list of missing stall documents.
10. Tournaments: fixtures are made from the draw; tables and brackets update from scores; the results image is ready the moment the final ends.
11. Payments change plans and complete orders instantly (Stripe webhooks). Launch-offer places count themselves down.
12. Forms are protected from bots and spam (Cloudflare Turnstile, invisible to people).

## 16. Reusing Golf Society Home

Golf Society Home is made of:
- the HTML prototype pages, served as static files;
- plain JavaScript in `boot/`;
- one Cloudflare Worker (`worker/`) for share cards, email reminders on a cron, and weather;
- Supabase, with about 65 migrations.

It is **not Next.js** and has **no Stripe**. Reuse its database patterns, rules, SQL and tested logic, not its screens. It lives at `~/Desktop/GoChuchuro Folder/Golf Society Home Folder/golfsocietyhome/`.

| Golf | In2Min2 | Status |
| --- | --- | --- |
| `0001_init.sql`, `0002_policies.sql` (role helpers) | `is_event_host(event, min_role)` | Done |
| `0017_public_event.sql`, `0019_public_society.sql` | `public_event()`, `resolve_short_code()` | Done |
| `0018`, `0053` reply limit, `0056` one reply each, `0058` first reply stands | `submit_rsvp()` | Next |
| `0059_guest_card_link.sql` (`/c/` tokens) | Guest personal links; referee score links | Schema done |
| `0005_signin.sql` email-code sign-in | Supabase Auth email code with `@supabase/ssr` | Phase 1 |
| `0021`–`0023` sponsors, `lib/sponsor.ts` | Sponsors (section 13c) | Port |
| `0032`, `0048`, `0049` plans and limits | `plans`, guest packs, `event_usage()` | Done; port the photo-limit checks |
| `0014`, `0038`, `0042`, `0057` photos and gallery | Photo wall on R2 | Port moderation rules |
| `0034_email_log.sql`, `worker/email.js` (Resend, daily cron) | Reminders and closing emails | Port |
| `worker/index.js` share card | `generateMetadata`, `opengraph-image.tsx` | Next.js native |
| The draw, tee times and groups; live score card on phones; leaderboard and Order of Merit | Tournament draw and fixtures; live match scores; league tables | Port the logic (section 13b) |
| `0063_festivals.sql`, `prototype/festivals.js` | Festival calendar, Nepali date | Port |
| `lib/slug.ts`, reserved words | Slugs; reserved words in the `event_types` check | Done |
| `check:empty`, `check:others` (Playwright) | "Brand-new host sees no crash", "No host sees another host's guests" | `npm run test:db` proves it in the database; add Playwright later |
| `CLAUDE.md` standing rules | `CLAUDE.md` | Carried over |

## 17. Technology, services and growth

### 17a. Services: free to start (Decided unless marked)

| Part | Service | Free allowance (check current terms) | When to pay |
| --- | --- | --- | --- |
| App | Next.js 16 on **Cloudflare Workers** (OpenNext) | 100,000 requests a day; 10 ms CPU per request | Workers Paid ($5 a month) at launch: share pictures and busy events need more CPU |
| Database, sign-in, live updates | **Supabase** (London; project `txwpptuijtfeomzmakdx`, made 14 Nov 2026) | 500 MB, 50,000 monthly users, 2 free projects. **Built-in email only reaches the project's own team, 2 an hour**, so the pilot needs our own sender (Resend) and the domain. **Free projects pause after a week without use, and have no backups** | **Stay free until income covers it** (Recommended, owner's question): our own nightly backup replaces Supabase's (section 21). Move to Pro ($25 a month) when the first community event takes money, or when income passes £25 a month, whichever comes first |
| Photos | **Cloudflare R2** | 10 GB | About $0.015 per GB a month; no download fees |
| AI words | **Gemini** `gemini-3.5-flash-lite` through `@google/genai` | Free quota; UK users get the paid-tier data terms (prompts not used to improve Google's products) | Turn on billing only after sign-in protects the writer (section 21) |
| Email | **Resend** | 3,000 a month, **but only 100 a day** | Pro ($20 a month) before an event that sends hundreds of confirmations in a day |
| Payments | **Stripe** Checkout and Connect | No monthly fee | UK cards 1.5% + 20p; Connect with "Stripe handles pricing" has no platform fees (14b) |
| Spam protection | Cloudflare **Turnstile** | Free | — |
| Visitor counts | Cloudflare **Web Analytics** | Free, no cookie banner | — |
| Maps | **Google Maps Embed** and direction links | Free | — |
| Video | YouTube and Facebook embeds | Free | — |
| Share images, QR codes, fonts, animation | `next/og`, `qrcode`, Google Fonts (Noto for every script), Motion, canvas-confetti | Free, open source (ask the owner before adding each library) | — |
| Photo screening (optional) | Cloudflare **Workers AI** | Free daily allowance | Pay per use |
| Scheduled jobs | Supabase `pg_cron` or a small cron Worker | Free | — |
| Later | SMS (Twilio, about 4p a text), WhatsApp Business messages, Google Wallet (free), Apple Wallet (£79 a year), SumUp card reader (one-off hardware) | | When asked for |

**Running cost:**
- £0 a month while building and through the family pilot (plus the ICO fee and the domain, which are yearly).
- Then each service is paid for only when it is needed: Workers Paid (about £4) when share pictures need it; Supabase Pro (about £20) when community money starts; Resend Pro (about £16) before a big event's emails.
- About £40–45 a month with all three. One Season sale a week covers it.

**Hosting notes:**
- `cacheComponents` is **off** in `next.config.ts`. With it on, every page hung under OpenNext (tested 12 Nov 2026).
- Cloudflare builds every push to `main`: build `npx opennextjs-cloudflare build`, deploy `npx opennextjs-cloudflare deploy`. Confirmed working by the owner, 13 Nov 2026.

**Secrets** never go in the code or GitHub. They go in `.env.local` locally and as Worker secrets on Cloudflare.
- **Secret values:** `GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- **Public values:** `GEMINI_MODEL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### 17b. Will it hold up as it grows? (owner's question; Recommended)

Yes, because **pages are temporary by design**. Storage is a rolling window, not a growing pile: photos and guest details are deleted 30 days after a page closes. Rough figures at **1,000 events a month**:

| | How much | Cost |
| --- | --- | --- |
| Photos | About 150 per event × 0.4 MB = 60 MB each; held about 3 months on average, so about 180 GB at any time | About $2.70 a month on R2, with downloads free |
| Database | About 150,000 guest rows a month, deleted when pages close | Well inside Supabase Pro's 8 GB |
| App | Workers scale by themselves; there's no server to grow | Workers Paid includes 10 million requests a month |
| Email | The cost that grows fastest | Kept down by sharing through the host's own WhatsApp; Resend's bigger plans when needed |

Even if only 3 in 10 of those events paid £9, income would be about £2,700 a month, against costs in the low hundreds.

**Keepsake originals** (3–5 MB each) are the only large files, and only on the plan that pays for them.

## 18. Addresses and domain (Decided)

| Address | What |
| --- | --- |
| `in2min2.com/{type}/{slug}` | The event page, e.g. `/wedding/meenu-jose`, `/sport/riverside-cup-2027` |
| `in2min2.com/e/{code}` and `?g={token}` | Short link, and a guest's personal link |
| `in2min2.com/live/{code}` | Big screen |
| `in2min2.com/privacy`, `/terms`, `/pricing` | Privacy notice, terms, and prices and fair fees (drafts, 14 Nov 2026) |
| `in2min2.com/dashboard/…` | Host and organiser area |
| `jamesandangeeta.com` | Own-domain add-on |

Event types can never clash with app routes; the database checks this. Event pages are never listed by search engines (`noindex`), because they carry names. Offer a random slug for private events.

**Domain: in2min2.com (Decided; bought and connected 14 Nov 2026).** It is distinctive and neutral enough for every kind of event. It is attached to the Worker as a custom domain (with www) in `wrangler.jsonc`, so Cloudflare makes the DNS records and certificate. Sign-in emails will come from `codes@in2min2.com` through Resend.
- **Still unregistered on 13 Nov 2026** (WHOIS check).
- The owner will buy it once he has seen the Phase 1 preview working. It costs about £8–10 a year at Cloudflare. Until it's bought, someone else could register it.
- Also check the name on the UK IPO trade mark search (classes 41 and 42) and reserve the social media handles.

### 18b. The In2Min2 website: home page, sign-in and contact (Decided, owner, 13 Nov 2026)

The home page sells In2Min2 and explains it. It is built in phase 2, with screenshots from the demo account (18c).

**Top menu:** logo · How it works · Pricing · Communities · Contact · **Sign in** · **Start free** (button). On a phone: logo, **Start free**, and a menu button (☰) for the rest.

**Sections, top to bottom:**
1. **Opening:** one line ("Your event online in two minutes, from invitation to memory book"), a phone showing an invitation that moves through its stages, and two buttons: *Start free* and *See how it works*.
2. **How it works**, in three steps with small moving pictures: *Choose what you're celebrating → We write it in your languages → Share one link: invitation, live day, memory book.*
3. **Every kind of event:** picture tiles (birthday, Pasni, wedding, anniversary, reunion, mela, tournament, charity).
4. **Pricing:** the four plans; a slider, "About how many people?", that shows the price; the launch offer ("12 of 50 free places left"); and "Community events: free to set up".
5. **For communities and clubs:** the dated fee comparison (5d), safe payment (14a), gate scanning, and the event pack for venues (10).
6. **Safe and private:** no adverts, data kept in London, "Delete everything", and the ICO registration number.
7. **Questions and answers.**
8. **Contact:** a short form (protected by Turnstile) that emails the owner, and "Ask about a reduced fee" (5h).
9. **Footer:** privacy, terms, cookies (none used), ICO number, "A GoChuchuro product".

There is no public demo log-in (owner's decision). Visitors see "How it works" and screenshots, and the owner shows the live demo himself. The home page is listed by search engines; event pages never are.

### 18c. Demo account (Decided, owner, 13 Nov 2026)

A private account that only the owner signs in to. It has two uses: screenshots for the website and social posts, and showing In2Min2 to a family or organiser without opening anyone's real event.

- **Sample events**, with made-up names and no real people's photos: a birthday, a Pasni, a five-function wedding, an anniversary, a reunion, a charity walk, and a two-sport tournament with a draw, fixtures and scores.
- **Safe by design** (`events.is_demo`, built; only the server sets it):
  - every page shows a small "Demo" label;
  - payments use Stripe's test mode, so no real money moves;
  - no emails or texts are sent;
  - never listed by search engines.
- **"Reset demo"** button, plus a nightly reset, puts every sample back as it was. A demo can get messy, and the next one still starts clean.
- Built in phase 2, before the website needs screenshots.

### 18d. Colours and logo (Decided, owner, 13 Nov 2026: A, Marigold & Indigo)

The **brand colours** are for In2Min2's own screens: the website, sign-in, dashboard and builder, and the small "Made with In2Min2" footer. Each event page keeps its own template and colours (7). So the brand must sit calmly beside a wedding, a football final and a memorial.

Three options are drawn on a comparison page for the owner: https://claude.ai/artifact/3JA1Qkc6JzKqpjMoQwCP2v (private to the owner).

| Option | Colours | Feel |
| --- | --- | --- |
| **A. Marigold & Indigo** (chosen for In2Min2 itself; built into the app) | Deep indigo, marigold, soft rose, warm cream | Calm and trusted, festive without being loud. Marigold is the garland of Tihar and weddings, and the RSVP petals (7b) |
| **B. Lali Gurans** | Rhododendron crimson, midnight navy, marigold, ivory | The warmest and most Nepali (the national flower). Red is strong on memorial and payment screens |
| **C. Himalayan Dusk** | Plum, peach, teal, snow white | Soft and modern; teal brings in sport |

All three are also offered to hosts as event colours (7).

**The logo is the wordmark (Decided, owner, 13 Nov 2026): no separate logo image is needed.**
- "In2Min2" in Bricolage Grotesque, indigo, with the two 2s in marigold.
- The square icon (browser tab, phone home screen) is a marigold 2 on an indigo square: `app/icon.svg`.
- "Made with In2Min2" on event pages uses the same wordmark.
- A designer can refine it later, but nothing waits for it.

**In2Min2's own screens look professional, not like a party (owner, 13 Nov 2026):** indigo carries the buttons and headings, marigold is only a small accent, and there are no pink panels. The party colours belong to the hosts' events.

## 19. The database (built: `supabase/migrations/0001_init.sql`, not yet run on Supabase)

**Tables:**
- `plans` (with guest packs; 200, 300, 400 and 500 people) and `event_types` (with reunion, charity and memorial; whether each repeats yearly, what it repeats as, and whether it is sensitive);
- `events` (with parking, expected guests, venue capacity and extra guests; the organiser's name, kind, profit answer, charity number and contact; the fee level and its note; the series; keep-for-next-year; the demo flag);
- `event_hosts`, `event_people`, `sub_events`, `guest_crm`, `sub_event_guests` and `feature_toggles`;
- `offers` and `offer_claims`.

**Functions:**
- `stage()`, `event_settings()`, `public_event()`, `resolve_short_code()`, `is_event_host()` and `copy_fits()`;
- `event_usage()`, `claim_offer()` and `offer_places_left()`.

`npm run test:db` runs it on real Postgres 17 (PGlite, with stand-ins for Supabase's `auth`) and checks **149 rules**, plus **62 checks** that the builder's catalogue (`lib/catalog.ts`) still matches the database and that prices add up. Among them:
- Each host sees only their own events. Helpers read, co-hosts edit, owners manage and delete.
- The public reads no table. Drafts are invisible. Private events and invite-only functions open only with a guest's link.
- The browser can never set a plan, hosting length, guest packs, own domain, AI usage or money.
- Scale follows the event type, and a free plan follows the scale. A paid plan is never changed by it.
- Both languages are held to the same text limits, and the thank-you stays hidden until after the event in both.
- The stars come first on the page, then the honoured family.
- The stage moves by the clock, and an upgrade brings a closed page back.
- Guests see parking but never the planning numbers.
- Head count adds party sizes and skips those who declined. Warnings fire at 80% and 100%, and a guest pack lifts the limit.
- Launch offer:
  - only the owner can claim, one place per account;
  - not for community events;
  - stops exactly at the last place;
  - deleting and starting again can't claim twice;
  - the public can see places left but can't claim.
- One delete removes an event's guest list, switches and hosts.
- Plans include 200, 300, 400 and 500 people.
- Fee level: only the server sets Full, Half or Free (100, 50 or 0); hosts can't, and the public never sees it or its note.
- A community event can't be published without its organiser, kind and profit answer, and the public then sees them. Family events need none of this.
- A wedding repeats as its anniversary; a memorial is sensitive and never prompted to repeat; every event starts its own series, which hosts can't change.
- A demo event tells its page to show the "Demo" label; hosts can't set it.

**Next migrations:**
- **`0002_grants_and_ai_limit.sql` (14 Nov 2026):** explicit rights for anon, authenticated and service_role, because Supabase stopped granting them automatically on 30 Oct 2026. Plus `ai_usage` and `take_ai_write()`: 20 AI writes a day per signed-in person. The test harness is now as strict as Supabase (no automatic rights), so a missing grant fails the checks.
- `price_quote()`: plan plus packs, then the single best of fee level, same-again or welcome-back (phase 4, when payments need it; the builder already shows prices from `lib/catalog.ts` `quote()`, checked against the same numbers);
- `repeat_event()`: "Run it again" into the same series (phase 6);
- an admin list for the owner's page (phase 4);
- `submit_rsvp()`, with capacity, the 10% grace and the waiting list;
- `photos`, `guestbook_entries` and `video_links`;
- `products`, `orders`, `order_items`, `cash_sales` and `cash_ups`;
- `competitions`, `teams` and `matches`;
- `helpers_roles` and `stall_documents`;
- `email_log`, `slug_history` and `custom_domains`.

## 20. Build plan and calendar (Recommended; the owner wants smaller events ready first and big events ready before the season)

Small events run all year, so the personal and celebration side comes first and can launch as soon as it is good. Tournaments start in **April–May**, and organisers need to see a working demo **by February** to plan, talk and advertise. So the community phases must be finished by early March 2027.

| Phase | What | Target | Done when |
| --- | --- | --- | --- |
| **0** | Next.js on Cloudflare with Git builds, AI writer route, database (140 checks), this plan | Done 12–13 Nov 2026 | Done |
| **1** | **The builder** (section 7): live preview, styles, honoured family, parking and numbers, the price from "About how many people?", AI in two languages, Supabase sign-in, save and publish, launch-offer code | Mid-December 2026 | A new host publishes a good-looking event in under 2 minutes on the owner's own phone |
| 1a (done 13 Nov) | In2Min2 colours and fonts; the seven builder steps; the live preview (card, page, on the day, after) drawn by the same code the public page will use; ten palettes; prices with packs; the draft saved on the device; the AI writer in two languages | | Tested in Chrome at phone and computer width |
| 1a+ (done 13 Nov) | Design review: 18 borders, 30 colour sets in 8 families, 10 text styles with fonts for six scripts, layouts, the wordmark logo and icon, a more formal In2Min2 look | | Tested in Chrome at phone and computer width |
| 1b (built 14 Nov) | Sign-in by a 6-digit emailed code; publish and update to the database; `LAUNCH50`; the AI writer only for signed-in hosts, 20 a day; the public page `/{type}/{slug}` and short link `/e/{code}`, drawn by the same code as the preview; numbered steps; labels | Live once the owner runs 0002 and sets the email template | A host publishes from their phone and opens the guest link |
| 1c (built 14 Nov, evening) | After the owner's first phone test: the running order with menus and two switches (0003); the photo above the border and "show the whole picture"; a smarter event page (countdown, date-and-place card, timeline, big reply buttons, minimum text sizes); Share, the bell and Settings at the top right; the AI writer panel; sign-in in its own window; Share on the public page | Live once the owner runs 0003 | The owner adds a running order with a menu on his phone and sees it on the guest link |
| 1d (built 14 Nov, night) | The Share panel with every link and a ready-made message per moment; links to parts of the page; drafts of the privacy notice, terms and prices and fair fees | | Tested in Chrome at phone width |
| **2** | The public page through its four stages; sharing everywhere (section 11); RSVP with limits and capacity; **the guest dashboard (9)**; reminders; privacy notice and terms; **the In2Min2 website (18b) and the demo account (18c)**; nightly backups (21) | Early January 2027 | A guest replies from a WhatsApp link on a real phone |
| **Pilot 1** | 3–5 family events from the owner's network (Pop-Up and `LAUNCH50`) | From January 2027 | Real families use it; feedback collected |
| **3** | Guest-list tools, the photo wall and gallery, video links, the event pack, feedback; closing emails with "Keep it for next year?" (5g) | January–February 2027 | 200 photos from 20 phones in an hour without failure |
| **4** | Stripe: plan upgrades and guest packs; then products, orders, QR passes, the Gate screen (works offline), cash sales and cash-up; **the owner's admin page** (fee levels, offer codes, demo reset) and "Ask about a reduced fee" (5h); organiser details for community events | February 2027 | A test mela sells entry and parking online and on the day, with every sale accounted for |
| **5** | Competitions: any sport and group, team entries, the draw, fixtures, live scores, big screen | February–early March 2027 | A 16-team test tournament runs from draw to final, with two sports at once |
| **Organiser demos** | Show organisers a working demo; free for the first 5 | February–March 2027 | Entries open for the April–May season |
| **6** | "Run it again" with same-again and welcome-back discounts (5g); Organiser subscription; own domains; extras (section 24) | After the season starts, before the first repeats in late 2027 | |

Each phase ends deployed to the preview, with exactly what was tested stated: real phone, browser at phone width, local Worker or PGlite. The dates depend on the owner's time for testing and decisions. If a real tournament date is fixed sooner, phases 4–5 move ahead of phase 3.

## 21. Security and resilience (owner: "crucial")

**Against data leaks:**
- **Row Level Security on every table**, with a check for each role (owner, co-host, helper, another host, the public). There are 165 checks today, plus 63 on the builder's catalogue and prices, and they run before every commit.
- **The public reads no table**, only functions that return what a guest may see. Server-only columns (plan, money, domain) can't be written from a browser.
- **Hold as little as possible:**
  - no dates of birth, ID documents or player ages;
  - no card numbers, ever (Stripe holds them);
  - photo locations are stripped;
  - guest data is deleted after the page closes.
- **Unguessable links:**
  - guest links use 32-character random tokens;
  - pages are never listed by search engines;
  - private events are available.
- **Secrets** are only in Cloudflare and `.env.local`, never in GitHub. The service key is used only on the server.
- **Two-step sign-in (owner's question, 14 Nov 2026: single or double, and how much burden?).** No UK law names it. UK GDPR requires security "appropriate to the risk", and the ICO recommends multi-factor sign-in for accounts that reach other people's data. The balance:
  - **The owner's own accounts** (GitHub, Cloudflare, Supabase, Stripe, Google, domain registrar): two-step recommended, because they can reach every family's data. **Postponed by the owner on 14 Nov 2026**; remind him once, before the pilot. Checked steps are in `docs/ACTION-PLAN.md` step 9.
  - **Hosts:** a 6-digit code by email each time they use a new device, and no password at all. That is already "something you have" (the inbox). They stay signed in on their own phone. Risky actions ask for a fresh code: deleting everything, exporting a guest list, changing who can help.
  - **Organisers taking money:** Stripe checks their identity and protects their payouts with its own two-step sign-in. In2Min2 offers an authenticator app as an option (phase 4) and may require it for organisers with large sales.
  - **Guests:** no account at all. Their personal link is the key.
  - **Card payments:** the bank's own checks (Strong Customer Authentication) run inside Stripe, so In2Min2 adds nothing there.
- **Bots and abuse:**
  - Turnstile on forms;
  - rate limits on the AI writer and replies;
  - "Report this page" on every page;
  - a staff switch to take a page down.
- **Before launch:**
  - a security review of the whole code (`/security-review`);
  - dependency alerts switched on in GitHub;
  - the AI writer must require sign-in and count `ai_writes_used`.

**Against system failure:**
- **Backups without paying for Pro yet** (owner's question). From the first real guest, a **nightly, encrypted copy** of the database goes to a private Cloudflare R2 store that In2Min2 controls.
  - It is made by a scheduled GitHub job using Supabase's own export tool: about a minute a night, well inside GitHub's free allowance. Supabase itself advises free projects to export their data regularly.
  - Copies are kept 30 days, then deleted.
  - A restore is practised once before the pilot, so we know it works.
  - Later, Supabase Pro adds its own daily backups, and the nightly copy carries on as a second copy.
- **Pausing:** a free Supabase project pauses after a week without use. Real use and the nightly backup keep it awake. If it ever pauses, one click restores it and no data is lost.
- **No single server:** Cloudflare runs the app in many places at once.
- **Separate test and live databases** from the first real guest: test on staging, never on real events.
- **The Gate screen works without signal.** QR passes are signed so a phone can check them offline. Cash sales and scans are saved on the phone and sent when the signal returns.
- **Paper fallback** for every big day: a printable door list, numbered car park slips and the event pack.
- **Watching:**
  - Cloudflare's logs and alerts are switched on;
  - an uptime check emails the owner if the site stops answering (choose the service in phase 2);
  - a support contact is on every organiser's dashboard for the day.
- **If data is ever exposed:** tell the ICO within 72 hours if people are at risk, and tell the affected hosts. A one-page plan goes in `docs/` before launch.

## 22. Privacy and the law: before anything else (owner: "crucial before anything else"; Recommended, not legal advice)

**The ICO fee.**
- Tier 1 (up to £632,000 turnover or 10 staff) is **£52 a year, or £47 by Direct Debit** (checked November 2026).
- **The form asks about the size of the organisation, not what data you hold, so there is nothing to declare about children's photos there.**
- Pay it before the first real guest's details go in (the January pilot). Not paying risks a £400 fixed penalty.

**Children's photos.** Photos of children are personal data and need extra care, but they are allowed with the right safeguards.

Who is responsible for what:
- A family sharing photos among their own guests is close to personal or household use.
- A community organiser publishing photos in an official role is responsible for them, like a school.
- In2Min2 stores photos on the host's behalf, and is directly responsible for accounts and for the service's safety. The terms must say all this clearly.

Built in (section 12a):
- link-only galleries, never in search engines;
- approve-first for community events;
- a "Please remove this photo" button on every photo;
- no face recognition;
- location stripped from photos;
- downloads can be switched off;
- automatic deletion after closing.

For community events:
- a photo notice on the page, tickets and posters: "Photos will be taken. Tell a steward if you'd rather not be photographed";
- team managers confirm they have parents' permission for under-18 players in team photos.

The **Children's Code** applies to online services likely to be seen by children. Accounts are for adults (18+). Guest pages may be seen by children, so the defaults stay high-privacy: no tracking, no adverts, no location, no nudges.

**The documents needed before the pilot** (a one-off check by a solicitor is worth it before the first paid community event).

**Drafted 14 Nov 2026 (owner's request), waiting for his approval:** `/privacy`, `/terms` (including the data agreement for guests' details, section 5) and `/pricing` (prices, launch offers and the written fee rules), built on `components/legal/legal-page.tsx`.
- While `DRAFT` is true, each says so at the top and is `noindex`, and nothing links to it.
- On approval: set `DRAFT` to false; fill the marked gaps (owner's full name, business address, ICO number); link the pages from sign-in, publishing and the page footers.
- Contact everywhere: `hello@in2min2.com`, forwarded to the owner by Cloudflare Email Routing (free; ACTION-PLAN step 3).
- **Name and address:** the Electronic Commerce Regulations 2002 require the trader's name, a postal address and an email on the website. The owner plans a virtual business address for GoChuchuro, which also keeps his home off the ICO's public register.
- Photo storage (phase 3) must use an R2 bucket with the EU jurisdiction, as the privacy notice says "stored files in Europe".

The full list:
1. A privacy notice in plain English, with a short version a child could follow.
2. Terms for hosts and organisers, including a data-processing section: In2Min2 processes guest data on their behalf.
3. A DPIA (data protection impact assessment, using the ICO's free template), because of children's photos and public events.
4. A photo policy and acceptable use rules.
5. A refund policy, before the first sale.
6. A cookie statement: no tracking cookies, so no cookie banner.

**The "Delete everything" button (Decided in principle; database delete built and tested).** One button in the dashboard, with a clear confirmation. It deletes the event's guest list, photos, messages, family names and switches. Why:
1. **Safety:** data that isn't kept can't leak.
2. **The law:** UK GDPR says personal data must be kept no longer than needed.
3. **Cost:** nobody pays to store what nobody needs.
4. **Trust:** "We delete, we don't keep" is a selling point.

Before deleting:
- Community organisers are prompted to download their sales list and cash-ups first, for their accounts.
- In2Min2 keeps only its own record of what was paid to In2Min2 (amount and date, no guest details), as the law requires for 6 years.

The same deletion runs automatically 30 days after a page closes.

**Other legal steps:**
- **Stripe as a sole trader in Prakash's name** (Decided), trading as GoChuchuro, until the business is incorporated. Register with HMRC as self-employed if not already (ask the accountant).
- **Keeping guest lists for next year** (5g): the privacy notice says the host may keep the list for up to 13 months to invite people again. Any guest can ask to be removed, and the list is deleted after 13 months.
- **Fee decisions** (5h) follow written rules, applied the same way to everyone (Equality Act 2010).
- Keep records for 6 years.
- VAT applies only above £90,000 a year (not close yet, owner, 13 Nov 2026).
- Do a trade mark check for "In2Min2" at the UK IPO.
- Follow the CAP Code for any competitor comparison (5d).

## 23. Decisions

**Decided by the owner, 13 Nov 2026:**
- Price shape: the plan buys time (Pop-Up free 7 days, Season £9 90 days, Half-Year £15 6 months, Keepsake £25 12 months). People come in packs of +100 for £3, on any plan, as many as needed.
- Community: free set-up, 4% + 30p per online order, nothing on cash or free events.
- Photo limits: 50, 300, 600 and 1,000; 2,000 for community events.
- Fee levels: Full (default), Half or Free, set only by the owner when someone asks. The system never decides (5h).
- Community events must say who organises them and whether anyone profits (5h).
- Repeat events and multiple events get carry-over and automatic discounts (5g).
- Stripe: a sole trader account in Prakash's name until incorporation.
- The host or organiser checks and approves every word, in any language, before publishing.
- A private demo account; no public demo log-in.
- A marketing website with a top menu, How it works, sign-up, sign-in and contact.
- Colours: A, Marigold & Indigo, for In2Min2's own screens; hosts choose from all three brand palettes and more (13 Nov 2026, night).
- The design review (13 Nov 2026, late):
  - more variety and modern mixes, fewer pinks;
  - festival colour blends;
  - borders drawn for each kind of event;
  - a professional look for formal events and for In2Min2 itself;
  - lots of text styles;
  - the wordmark is the logo;
  - a guest dashboard by category.
- Design agreed (14 Nov 2026), refined as we go, with "Popular", "New" and "Coming soon" labels and big step numbers.
- After the first phone test (14 Nov 2026, evening): a running order with a food menu, each with an on/off switch, shown on the page before the event; Share, a notification bell and Settings at the top right; a more obvious AI writer; sign-in that stands apart from the page; the photo no longer too big or cropped.
- Stripe: the owner is opening the account; nothing is needed from it until phase 4.
- ICO fee and the domain: once the foundation is ready, before the pilot. The domain is now needed before the pilot for sign-in emails.
- "Yes, go" (13 Nov 2026, night), taken as yes to the five other recommendations below; any can still be changed:
  - people included 200, 300, 400 and 500;
  - same event next year 30% off, a different event 20% off, automatic and never stacked; keeping the guest list for next year free;
  - replies allowed 10% over the limit before they pause;
  - `LAUNCH50` shared with the owner's network first, then public if places remain after January;
  - Supabase's free plan, with our own nightly backups, until the first community event takes money or income passes £25 a month.
- Own web address: £10 a year.
- Organiser subscription: £10 a month or £100 a year, in phase 6.
- Free Keepsake for the first 50 families, stopping automatically.
- Pop-Up stays free as the "try it" hook.
- Smaller events first. Tournaments ready before the April–May season.
- In2Min2 is GoChuchuro's main product.
- Domain: in2min2.com, bought once the preview satisfies the owner.
- Eligibility checks (ages) belong to organisers; no ages or ID are stored.
- Video by connecting YouTube and Facebook, not uploading.
- The preview is a live mirror of the real page.

- Logo: idea C, each 2 in a stopwatch face (14 Nov 2026). `components/brand/wordmark.tsx`, `app/icon.svg`.
- in2min2.com bought and connected (14 Nov 2026).
- Two-step sign-in on the owner's accounts: postponed by the owner (14 Nov 2026: "if not required by law, stay without for now"). Remind him once, before the pilot.

**Decided by the owner, 14 Nov 2026 (night):**
- Festive launch: free until 31 January 2027, shown off with seasonal designs (5e). Taken as yes to the whole recommendation, including the organisers' first event fee-free before 31 March.
- No event or organiser is named in public material. In2Min2 is built ready for large community events, whoever signs up, and is advertised as early as possible.
- Share: all the links in one place, to share any or all of them when the host wants (7).
- Fee rules, terms and privacy: drafted for him to read (22).
- ICO fee before January, or before links go to people beyond the pilot.
- Sole trader in his own name, with a virtual business address for GoChuchuro.
- Posters and car park slips: made by In2Min2 as print-ready PDF or PNG, printed at home on any connected printer or at a print shop (11).

**Still open (Recommended answers in brackets):**
1. Memorials and funerals free automatically, by his written rule (`/pricing`)? (Yes)
2. Refunds: full within 14 days of paying; the unused part if the event has passed; a full refund if In2Min2 fails on the day (`/terms` 8)? (Yes)
3. If an organiser cancels, the booking fee goes back to buyers too (`/terms` 9)? (Yes)
4. Accounts unused for 2 years are deleted after an email (`/privacy` 6)? (Yes)
5. What to build next (4b). (Working replies and the guest list; the photo on the guest page and the WhatsApp preview picture; then festive designs and the festive offer on the home page, all by about 1 December.)

## 24. More ideas (backlog)

- **Local calendar date** beside the English date, shown only when that language is chosen, so it is never narrow:
  - Nepali Bikram Sambat with *sait* time first;
  - later the Hindu, Islamic Hijri and Chinese lunar calendars.
- Overseas guests see times in their own time zone.
- **Voice-note guestbook** for grandparents. A 30-second voice note is about 120 KB, smaller than one photo, so storage isn't a problem.
- Cash gifts in customary amounts (£51, £101, £501).
- A seating plan.
- A printed photobook from the gallery (affiliate income).
- A vendor directory grown from stall holders and suppliers (vendors pay to be listed).
- A 10-second video of the card opening, for Reels and TikTok.
- The interface (buttons) in Nepali and Hindi.
- Short video clips up to 30 seconds (12b).
- More event types as they appear: school reunions, Teej and Dashain gatherings, charity dinners.
- An automatic charity-number check against the charity registers (5h).
- A Family Year pass, if pilot families run several events a year (5g).

## 25. Sources (November 2026 research)

- **Invitations and websites:**
  - [Greenvelope platform comparison](https://www.greenvelope.com/resources/best-digital-invitation-platforms)
  - [Greenvelope pricing guide](https://www.greenvelope.com/resources/how-digital-invitation-pricing-works)
  - [Joy: save-the-date platforms 2026](https://withjoy.com/blog/best-digital-save-the-date-platforms-for-2026-weddings/)
  - [Paperlust: wedding websites compared](https://paperlust.co/blog/?p=21139)
  - [Your Wedding Invites (Bridebook)](https://bridebook.com/uk/wedding-stationery/your-wedding-invites-braintree-essex-cswXo4jQyg)
  - [Bespokevites (Guides for Brides)](https://guidesforbrides.co.uk/wedding-stationery/london-central/bespokevites/165300)
  - [Evite You (Bridebook)](https://bridebook.com/uk/wedding-stationery/evite-you-london-greater-london-csmgbMll6X)
- **Photo apps:**
  - [Wedibox comparison 2026](https://www.wedibox.com/compare/best-wedding-photo-sharing-apps)
  - [Wedibox vs Kululu](https://www.wedibox.com/compare/kululu)
  - [Knipsmig on GuestPix](https://knipsmig.com/alternatives/guestpix)
  - [Fotify 2026](https://fotify.app/blog/best-event-photo-sharing-apps-2026)
- **Free event pages:**
  - [Luma vs Partiful](https://help.luma.com/p/luma-vs-partiful)
  - [Toolradar: Partiful](https://toolradar.com/tools/partiful)
- **Ticketing:**
  - [Checkout Page: Eventbrite fees 2026](https://checkoutpage.com/blog/eventbrite-fees)
  - [Ticket Tailor on Eventbrite fees](https://www.tickettailor.com/eventbrite-fees-and-cost)
  - [UK ticketing fees audit 2026](https://ticketing-fees.pages.dev/uk-ticketing-fees-audit-2026/)
  - [tickts: UK fees comparison](https://tickts.co.uk/blog/ticketing-fees-comparison-uk-platforms)
  - [Capterra: Ticket Tailor pricing](https://www.capterra.com/p/112510/Ticket-Tailor/pricing/)
  - [Capterra UK: TicketSource](https://www.capterra.co.uk/software/143073/ticketsource)
- **Tournaments:**
  - [Tournify pricing](https://tournifyapp.com/en/pricing)
  - [GetApp: LeagueRepublic](https://www.getapp.com/all-software/a/leaguerepublic/)
  - [Tech Insider: Challonge 2026](https://tech-insider.org/?p=28121)
- **Payments:**
  - [Stripe UK pricing](https://stripe.com/gb/pricing)
  - [Stripe Connect UK pricing](https://stripe.com/gb/connect/pricing)
  - [Stripe Pay by Bank](https://docs.stripe.com/payments/pay-by-bank)
  - [Stripe UK fees 2026](https://www.wearefounders.uk/stripe-fees-uk-2026/)
- **Privacy:**
  - [ICO data protection fee](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee)
  - [Government response: fee increase to £52](https://gov.uk/government/consultations/data-protection-fee-regime-proposed-changes/outcome/data-protection-fee-regime-government-response)
  - [ICO fixed penalties](https://ico.org.uk/about-the-ico/our-information/fixed-penalties-for-failure-to-pay-the-data-protection-charge/)
  - [ICO: photos at school events](https://ico.org.uk/for-the-public/schools/photos/)
  - [GOV.UK: photos and videos in schools](https://www.gov.uk/guidance/data-protection-in-schools/taking-and-using-photos-and-videos-and-using-cctv-in-schools)
  - [NSPCC photography guidance](https://learning.nspcc.org.uk/research-resources/briefings/photography-sharing-images-guidance/)
- **Services:**
  - [Supabase pricing guide 2026](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)
  - [Supabase free tier limits 2026](https://automationatlas.io/answers/supabase-free-tier-limits-2026/)
  - [Supabase free tier in practice](https://dev.to/mahdi_benrhouma_fe1c6005/supabase-free-tier-limits-in-2026-what-you-actually-get-and-when-you-will-hit-them-4mhe)
  - [Resend free tier 2026](https://automationatlas.io/answers/resend-free-tier-explained-2026/)
  - [Gemini API terms](https://ai.google.dev/gemini-api/terms_preview)
  - [Gemini data logging policy](https://ai.google.dev/gemini-api/docs/logs-policy)
  - [Cloudflare for SaaS plans](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/)
- **Domains:**
  - [.events prices](https://domainoffer.net/tld/events/namecheap)
  - [.day at Cloudflare](https://domainoffer.net/tld/day/cloudflare)
- **Market check, 14 Nov 2026:**
  - [Partiful adds ticketing (Pulse)](https://www.pulse.bot/marketing/news/partiful-adds-inapp-ticketing-turning-its-social-platform-into-a-paidevent-marketplace-f1e21f34-b773-4906-b34f-19f859e5747b/)
  - [Luma vs Partiful (Luma)](https://help.luma.com/p/luma-vs-partiful)
  - [Greenvelope: digital invitation platforms](https://www.greenvelope.com/resources/best-digital-invitation-platforms)
  - [Kululu wedding photo app](https://www.kululu.com/wedding-photo-sharing-app)
  - [Wedibox: wedding photo apps 2026](https://www.wedibox.com/compare/best-wedding-photo-sharing-apps)
  - [Fotify: wedding photo apps 2026](https://fotify.app/blog/best-wedding-photo-sharing-apps-2026/)
  - [Fluent Emoji licence (Iconify)](https://icon-sets.iconify.design/fluent-emoji-high-contrast/)
  - [Google: Noto Emoji animation, CC BY 4.0](https://developers.googleblog.com/updates-to-emoji-new-characters-new-animation-new-color-customization-and-more)
  - [Tamu Lhosar 2026 date](https://www.officeholidays.com/amp/holidays/nepal/tamu-lhosar)
- **Two-step sign-in, checked 14 Nov 2026:**
  - [GitHub](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication)
  - [Cloudflare](https://developers.cloudflare.com/fundamentals/user-profiles/2fa/)
  - [Google](https://support.google.com/accounts/answer/185839)
  - [Supabase](https://supabase.com/docs/guides/platform/multi-factor-authentication)
- **Market:**
  - [Guides for Brides: South Asian wedding trends](https://guidesforbrides.co.uk/wedding-ideas/south-asian-wedding-trends)
  - [Hitched: average wedding cost 2026](https://www.theknotww.com/press-releases/the-average-cost-of-a-wedding-in-2026-around-21990-according-to-hitched)
- **Hosting:**
  - [OpenNext Cloudflare](https://opennext.js.org/cloudflare/get-started)
  - [Gemini models](https://aistudio.google.com/docs/models)
