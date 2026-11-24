# Plan: day plan, thank-you page, gifts and a fuller Replies dashboard

Written 24 Nov 2026 from the owner's answers. **Recommended** = not yet confirmed.

## Done on 24 Nov 2026 (no database change)
- One link already moves invitation, on the day, after, by the clock.
- "Coming soon" notes: invitation (no day plan yet), on the day (no plan yet).
- The reply confirmation says the plan will be on the same link.
- The host's special instruction box (`guest_note_box`) now sits **before** the running order, on the invitation page and on the day.

## Outstanding (in this order)
1. **Nudge the host**: **built 24 Nov 2026** in the bell (`updates()` in `app/new/sheets.tsx`, from 3 days before): "Your event is tomorrow: check your day plan and thank-you words". Later an email from the Worker cron.
2. **After page "coming soon"**: **built 24 Nov 2026** (`After` in `components/event/event-view.tsx`: "Photos will be shared here soon").
   Also built: "Add to calendar" button on the guest page and after a Yes (`lib/calendar.ts`, `add-to-calendar.tsx`, `calendar.ics` route; a day-before reminder is in the file).
3. **Host photos on the thank-you page**: the host uploads their own (same R2 `PHOTOS` store, flagged `by_host`), so the room is never empty. Needs a migration (0017) and RLS tests.
4. **Replies dashboard, more columns**: party size, food needs and allergies (already stored), gift amount, and the guest's comment. Gift total at the bottom. **Built 24 Nov 2026 in Builder 2.0** (`app/new/panels/replies.tsx`, helpers in `app/builder/replies.tsx`, styles `.b2-fact` in `app/new/new.css`), except the gift amount and total, which wait for gifts (item 5): each reply shows People, Food needs (an allergy has a gold ring) and the guest's message in its own box; filter chips (All, Coming, Maybe, Can't come, Waiting list, With a message, With food needs) and the food-total chips filter the list (tap "Nut allergy" to see whose). The old `/builder` dialog is unchanged.
5. **Gifts (critical: money, plan on Opus first)**
   - Guest side: amount chips £25, £51, £101, £151, £201 and "Other"; a reason chip for the comment: "Couldn't come", "Couldn't stand in the queue", "Had to leave early", "Blessings".
   - Host side: Settings › Gifts: choose how guests pay, with a step-by-step guide.
   - Options, cheapest first: (a) bank transfer shown on the page (no fees; host types sort code and account number, the guest sends it from their banking app; the host ticks "received"), (b) a link to the host's own PayPal.me or Monzo.me (free for friends and family), (c) Stripe Connect (card, Apple Pay; Stripe's fee of about 1.5% + 20p UK cards plus the Connect fee; the host needs a verified Stripe account). Recommended: start with (a) and (b), add (c) later.
   - Money is "whole pence". For (c) the money is written only by the server after Stripe's webhook, as the standing rules say.
   - Needs the owner's decision: does in2min2 take a cut? Does it hold money? **Decided by the owner, 24 Nov 2026: in2min2 never holds money; gifts go straight to the host.**
   - Legal check first (UK): taking payments for someone else can need FCA permissions; Stripe Connect handles that if the host is the merchant.
6. **Special instructions** ("no khata", "flowers available", "online gift if you can't queue"): text goes in the existing box above; a link to the gift section can sit in the same note. Recommended: also a "Good to know" line on the card.

## Questions still open
- Gift options and who pays Stripe's fees.
- Whether memorials show gifts at all (default off).
