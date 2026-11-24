# Plan: the Free plan, the three limits, upgrades and the prices section

Written 24 Nov 2026 from the owner's answers (Opus, planning only, no code yet).
**Decided** = the owner chose it on 24 Nov 2026. **Recommended** = not yet confirmed.
This replaces the Pop-Up row of CONCEPT 5b from 1 February 2027.

## 1. Decisions (owner, 24 Nov 2026)

1. **Pop-Up becomes "Free"**: always free, **100 people, 25 photos, online 14 days counted from the day it is published** (not from the event). Building and editing before publishing is unlimited and costs nothing. (Decided)
2. **Free page that would close before its event**: the Publish screen warns, before publishing: *"Your free page closes on 3 March, before your event on 10 March. Publish nearer the day, or choose Season."* It never blocks. (Decided)
3. **Paid plans keep their clock**: online from publishing **until** 90 days / 6 months / 12 months **after the event**. (Decided)
4. **Running out mid-event**: people: **+100 for £3** on any plan (already in the database). Photos or more days: **move up a plan and pay only the difference**. No separate photo or day packs. (Decided)
5. **Prices section**: the festive banner stays as it is. Only the **Season** card shows ~~£9~~ *Free until 31 January*, because the festive offer gives exactly Season's allowance. Half-Year and Keepsake show their price. (Decided)
6. **Memorials** stay free with a kinder allowance: online until 90 days after the service, 300 people, 300 photos. A family is never sold to. (Recommended)
7. **Free photos per phone**: 5 (so one phone can't fill all 25). (Recommended)

Why 14 days and not 7: invitations usually go out 1 to 3 weeks ahead, so 7 days would make the free page close before most events and feel broken. 14 days covers a small party sent ~10 days ahead plus a few days of photos afterwards. The catch is built in: **the earlier you publish, the fewer days you have after the event**, which is exactly when families want the photos. Season (until 90 days after the event) fixes that.

## 2. The plans from 1 February 2027

| | **Free** | **Season** ★ | **Half-Year** | **Keepsake** |
| --- | --- | --- | --- | --- |
| Price | Free, always | £9 | £15 | £25 |
| Online | 14 days from publishing | until 90 days after the event | until 6 months after | until 12 months after |
| People | 100 | 300 | 400 | 500 |
| Photos (per phone) | 25 (5) | 300 (20) | 600 (20) | 1,000 (30) |
| AI writes | 5 | 30 | 50 | 100 |
| More people | +100 for £3 | +100 for £3 | +100 for £3 | +100 for £3 |
| Extras | | | | Full-resolution download, no in2min2 badge |

Every design, the envelope and music, replies with food needs, the day plan, add to calendar, QR code and the photo wall work on **every** plan (CONCEPT 5a: charge for time and size, never for switches).

Paying the difference: Free → Season £9, Free → Half-Year £15, Season → Half-Year £6, Season → Keepsake £16, Half-Year → Keepsake £10. People packs already bought are kept.

## 3. How each limit is caught

| Limit | What counts | Where it is checked (already built) | What changes in 0017 |
| --- | --- | --- | --- |
| **People** | Party size of every **Yes** and **Maybe** reply, plus every personal invitation the host adds. Declined and the waiting list don't count. Views of the link can't be counted (a WhatsApp link can be forwarded), so it is never a gate. | `submit_rsvp` (0014): replies still work up to **10% over**, then pause kindly. `event_usage()` gives the level: near 80%, full, over. | Free's number 200 → 100. |
| **Photos** | Every photo uploaded by guests, the host or a photographer. | `add_photo` / `add_photographer_photo` (0006, 0009) say "full" at the limit; per-phone limit too. | Free's number 50 → 25, per phone 10 → 5. |
| **Days online** | `events.hosting_until`, worked out by the trigger `set_hosting_until()`. After it, `stage()` is "expired" and the page says "This page is now closed". | 0013 / 0016 trigger. | Free: `published_at + 14 days` instead of event date + days. Paid and memorials: unchanged rule. |

Limits are read live from the `plans` table, so when a host moves up, every limit lifts **at that moment** and the trigger works out the new closing date by itself.

## 4. What the host sees when running out (on the day too)

1. **Near (80%)**: in the bell and by email: *"92 of 100 people. Room for 8 more."*
2. **Full**: one tap: *"Add 100 people for £3"* or *"Move to Season: £9, 300 people, 300 photos, online until 90 days after the event"*.
3. **Pay**: Stripe Checkout, Apple Pay or Google Pay, about 20 seconds, receipt by email. The browser never changes the plan: only Stripe's webhook does (service key).
4. **Straight away**: limits lift; guests who were paused can reply or upload again.

What guests see when full: replies: *"The host is updating the guest list; please check back soon."* Photos: *"The photo wall is full for now; the host has been told."* Nobody already coming is ever affected.

**Closing soon** (free and paid): bell and email 3 days and 1 day before closing: *"Your page closes on Friday. Keep it online until 90 days after the event for £9."* Before a page closes the host can always **download the photos free** (CONCEPT 5a: never hold memories hostage). After closing, the host can still upgrade within 30 days and the page comes back (0015 reopen).

## 5. The prices section on the home page (`app/page.tsx`, `app/site.css`)

- Keep the festive banner exactly as it is.
- Heading over the cards: **"Prices"** with a short line *"Pay once per event. No subscription."*
- Four cards, each the same shape: name, price, then **4 to 5 ticks**, then "Best for".

```
Free               Season  [Our pick]      Half-Year          Keepsake
Free               ~~£9~~ Free until 31 Jan £15                £25
always             then £9                 from 1 February    from 1 February
✓ 14 days online   ✓ Online until 90 days ✓ Until 6 months   ✓ Until 12 months
  from publishing    after the event        after the event    after the event
✓ 100 people       ✓ 300 people           ✓ 400 people       ✓ 500 people
✓ 25 photos        ✓ 300 photos           ✓ 600 photos       ✓ 1,000 photos
✓ 5 AI writes      ✓ 30 AI writes         ✓ 50 AI writes     ✓ 100 AI writes
✓ Every design,    ✓ Everything in Free   ✓ Everything in    ✓ Full-quality
  envelope, music                           Season             download, no badge
Small parties      Anniversaries,         Weddings planned   Weddings and
                   reunions               well ahead         milestones to keep
```

- Under the cards, one line: *"Run out on the day? Add 100 people for £3, or move up and pay only the difference. Memorials are always free."* plus the community line.
- The struck-out £9 is lawful only because £9 is really charged from 1 February (UK pricing rules on introductory offers). If that changes, remove the strikethrough.
- Every tick must be built before it shows (check the Keepsake full-quality download and badge removal when building).
- The same numbers feed `lib/site-facts.ts` (FAQ, JSON-LD, `/llms.txt`), `/pricing` and the builder's plan words (`app/new/sheets.tsx`), all from `PLANS` in `lib/catalog.ts`.

## 6. Build order

| Step | What | Model | Migration |
| --- | --- | --- | --- |
| 1 ✅ built 24 Nov (owner runs 0017) | **0017**: Free = 100 people, 25 photos (5 per phone), 14 days from publishing; plan name "Free" (key stays `popup`); a free `memorial` plan (Recommended) taken by sensitive types; `PLANS` in `lib/catalog.ts` and `catalog.test.mjs` / `schema.test.mjs` to match. Festive pages are not touched. | Sonnet 5.5 (medium) | 0017, owner runs it |
| 2 ✅ built 24 Nov | Prices section and `/pricing` as in section 5; site facts and builder words. | Sonnet 5.5 (medium) | none |
| 3 | Publish screen warning (section 1, item 2) and the bell's "closes on" words for Free. | Sonnet 5.5 (medium) | none |
| 4 | Closing-soon nudges by email from the Worker cron; free photo download before closing. | Sonnet 5.5 (medium) | none |
| 5 | **Payments and upgrades** (Stripe Checkout, webhook, pay the difference, +100 people). Must be live **before 1 February 2027**, or free hosts from then have no way to upgrade. | `/plan` on Opus 5.5 (high) first, then Sonnet | yes |

Steps 1 and 2 go together (the tests check the website's numbers and the database agree). Nothing changes for anyone until 1 February: until then every family page is on the festive plan.
