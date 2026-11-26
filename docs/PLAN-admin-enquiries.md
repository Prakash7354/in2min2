# Plan: /contact, /admin and enquiries (owner, 26 Nov 2026)

Goal: every message to in2min2 arrives in one place, the owner's own admin at
in2min2.com/admin, instead of in email. Built for in2min2 only; the Gochuchuro
hub (one inbox over in2min2 and Golf Society Home) comes later and links to this.

## Decisions (owner)
- Address `/admin`, signed in with the normal in2min2 email code. Just the owner for now; a second person is one SQL line.
- One simple contact form: name, email, optional phone, message.
- Enquiries are read and managed in /admin. **Replying:** a "Reply by email" button opens the owner's own email app with the address, subject and the person's message filled in (a `mailto:` link). The admin can't send email itself: Cloudflare's email service only sends to the owner's own address. Update 26 Nov: Resend (free: 3,000 a month, 100 a day) now sends replies from the admin, from hello@in2min2.com (`/api/admin/reply`, secret `RESEND_API_KEY`).
- The admin home also shows totals (accounts, events, replies, photos, AI writes, plans, enquiries) from `admin_overview()`.

## Built
- `0018_enquiries_and_admin.sql`: `admins`, `enquiries`, `submit_enquiry()`, `is_admin()`, `admin_overview()`; tests in `supabase/tests/schema.test.mjs`.
- `app/contact/` (form, honeypot box named `website`, Turnstile not added: add if spam arrives).
- `app/admin/` (sign-in, totals, enquiries with New / Replied / Archived / Spam, private notes, delete).
- Footer "Contact us", sitemap `/contact`, robots keeps `/admin` out, privacy line.
- Worker hourly check emails "N new enquiries: open in2min2.com/admin" (needs the Worker secret `SUPABASE_SECRET_KEY`).

## Later
- Gochuchuro hub: `enquiries.source` is ready ('in2min2'); the hub gathers from each business by a small push or pull, never a shared database.
- Delete enquiries 12 months after last touched (Recommended, not built).
- Payments and revenue totals once Stripe is built.

## Added 26 Nov 2026
- "Reply here" box (Resend), "Connected services" tab (`lib/admin-services.ts`), Money placeholder.
