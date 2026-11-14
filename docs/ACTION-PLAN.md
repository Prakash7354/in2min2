# Your action plan

*For Prakash. Updated 14 November 2026. The full plan is `docs/CONCEPT.md`.*

Change `[ ]` to `[x]` when you finish a step, or just tell Claude Code it's done. If a screen looks different from these steps, describe what you see and you'll get the right step.

**Never paste a secret key into the chat or into any file.** A secret goes only where the steps say.

---

## Already decided by you

- The plan buys time (7 days free, 90 days £9, 6 months £15, 12 months £25). More people come in packs of +100 for £3, on any plan.
- Stripe: a sole trader account in your name, until you incorporate.
- The host or organiser checks and approves every word, in any language, before publishing.
- Free, half or full price is your decision, case by case. Every event pays full unless you change it.
- Community events must say who organises them and whether anyone profits.
- A private demo account for you; no public demo log-in.
- A website with a top menu, How it works, sign-up, sign-in and contact.
- VAT: not close to the threshold.
- **Design agreed (14 November).** Refine as we go, with "Popular", "New" and "Coming soon" labels.
- The In2Min2 wordmark is the logo. Choose how the 2s look (step 5 below).

## Done

- [x] **0. Design agreed** (14 November).
- [x] **1. Six questions answered** (13 November).
- [x] **Supabase project made and `0001_init.sql` run** (14 November). Its two public values are in the app.

## Now: about 30 minutes, in this order

### [ ] 2. Run the second database file (5 minutes)

Supabase changed its rules on 30 October: tables are no longer open to the app until they are given permission one by one. This file gives exactly the permissions In2Min2 needs, and adds a daily limit of 20 AI writes per person.

1. In VS Code, open `supabase/migrations/0002_grants_and_ai_limit.sql`. Press **Cmd+A**, then **Cmd+C**.
2. In Supabase, click **SQL Editor** (left menu), then **+** for a new query.
3. Click into the editor, press **Cmd+V**, then click **Run**.
4. You should see *Success. No rows returned*. If you see red text, copy it to Claude Code. **Run it only once.**

### [ ] 3. Let Supabase email a sign-in code (5 minutes)

In2Min2 signs people in with a 6-digit code by email, with no password. Supabase's standard email sends a link instead, so change its wording:

1. In Supabase, click **Authentication** (left menu), then **Emails** (it may be called **Email Templates**).
2. Open the **Magic Link** template.
   - **Subject:** `Your In2Min2 code`
   - **Body:** delete what is there and paste:
     ```
     <h2>Your In2Min2 sign-in code</h2>
     <p>Type this code into In2Min2:</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
     <p>It works for one hour. If you didn't ask for it, you can ignore this email.</p>
     ```
   - Click **Save**.
3. Do the same for the **Confirm signup** template (new people get this one), with the same subject and body.
4. Click **Authentication** › **URL Configuration**. Set **Site URL** to `https://in2min2.pksgrg.workers.dev` and click **Save**.

**For now, codes only go to your own email.** Supabase's built-in sender emails only members of your Supabase team, at most 2 emails an hour. That's fine for your testing. Before the pilot, we connect our own email sender (step 12), which needs the domain.

### [ ] 4. A new Gemini key (5 minutes)

The key you saved was refused by Google ("API key not valid"). It was probably a code sample rather than the key itself.

1. Go to **aistudio.google.com/api-keys** and sign in.
2. Click **Create API key**. If it asks for a project, choose or create one called `in2min2`.
3. In the list of keys, click the **copy** icon next to the new key. It's one long line of letters and numbers, often starting `AIza`. Don't copy any example code.
4. In VS Code: **Terminal › New Terminal**, type `npx wrangler secret put GEMINI_API_KEY`, press **Enter**, then **Cmd+V** and **Enter**.
5. Wait for *Success! Uploaded secret GEMINI_API_KEY*. This replaces the old key.

**Don't switch on billing in Google.** The free allowance is plenty, and each person is now limited to 20 AI writes a day.

### [ ] 5. Test it on your phone (10 minutes), then tell Claude Code what happened

1. Open https://in2min2.pksgrg.workers.dev/builder.
2. Make a test event: for example a Birthday, with a date, a start time and a venue.
3. On **The words**, sign in with **your own email**. Type the 6-digit code from the email, then press **Write it for me**.
4. On **Check and publish**, tick the box and press **Publish**.
5. Open the link it gives you. That's the page your guests will see.

### [ ] 6. Choose the logo (2 minutes)

Look at the six ideas: https://claude.ai/artifact/VqJaNQjoEiWG6JBJYnnzZE

Reply with a letter, for example **"Logo C"**.

### [ ] 7. Switch on two-step sign-in (15 minutes)

You asked what the rules say. No UK law names two-step sign-in, but data-protection law requires security that fits the risk, and the ICO recommends it for any account that can reach other people's data. Your accounts can reach every family's data, so for you it's essential. Families and organisers get an easier version (section 21 of the plan).

Use an authenticator app such as Google Authenticator or Microsoft Authenticator. Keep the recovery codes somewhere safe, but not in this project folder.

1. **GitHub**:
   1. Click your photo (top right) › **Settings**.
   2. Click **Password and authentication**.
   3. Click **Enable two-factor authentication**.
2. **Cloudflare**:
   1. Go to dash.cloudflare.com.
   2. Click the person icon (top right) › **My Profile**.
   3. Open the **Authentication** tab.
   4. Under **Two-Factor Authentication**, switch it on.
3. **Google**:
   1. Go to myaccount.google.com.
   2. Click **Security**.
   3. Click **2-Step Verification**.
4. **Supabase**: click your photo (bottom left) › **Account preferences** › **Security** (multi-factor authentication).
5. **Stripe**: Stripe asks for it when you open the account.

---

## Before the January pilot

### [ ] 8. Pay the ICO data protection fee (15 minutes)

1. Go to **ico.org.uk** and search *"pay the data protection fee"*.
2. Choose **Tier 1**: **£47 by Direct Debit** or £52 by card.
3. You'll need your business name (GoChuchuro), address and turnover band.
4. The form does **not** ask about children's photos or any other kind of data.

Pay it before any real family's details go in.

### [ ] 9. Ask your accountant two things

- You'll trade as a sole trader in your own name for now. Do you need to register with HMRC as self-employed, and what records should you keep?
- At what income would becoming a limited company be worth it?

### [ ] 10. Find 3–5 pilot families

Look for a birthday or Pasni, an anniversary and a reunion happening in January or February. Give them the code `LAUNCH50` for a free Keepsake.

### [x] Nepali wording: no separate check needed

Your decision: hosts and organisers check and approve their own words, in any language, before publishing. In2Min2's example texts are labelled as examples and corrected whenever someone suggests better wording.

### [ ] 11. Approve the privacy notice and terms

Claude Code drafts them in phase 2. Read them, and ask about anything unclear. Before the first paid community event, a one-off check by a solicitor is worth it.

### [ ] 12. Buy in2min2.com, before the pilot (it's now needed for sign-in emails)

Sign-in codes must reach families' inboxes. Supabase's built-in sender only emails your own team, so before the pilot we connect our own sender (Resend: free for 3,000 emails a month, 100 a day). Its emails must come from a domain you own, such as `codes@in2min2.com`.

1. In the Cloudflare dashboard, open **Domain Registration › Register Domains**.
2. Search for `in2min2.com`.
3. Click **Purchase**. It costs about £8–10 a year.
4. Tell Claude Code. You'll then get the steps for Resend and for pointing the address at the app.

It was still free on 13 November 2026, but anyone can buy it until you do.

### [ ] 13. Supabase Pro: not yet

You asked how to avoid paying for Supabase Pro ($25 a month) before there's income. The plan:
- Stay on the free plan through building and the family pilot.
- From the first real guest, a nightly, locked copy of the database goes to In2Min2's own Cloudflare storage. This replaces Supabase's backups, and Claude Code sets it up in phase 2.
- Move to Pro when the first community event takes money, or when income passes £25 a month, whichever comes first. Claude Code will remind you.

---

## Before the community season (February–March 2027)

### [ ] 14. Write down your fee rules (5 minutes)

Your free, half or full decisions must be fair and consistent (`docs/CONCEPT.md`, section 5h). A starting point to edit:
- memorials and funerals: Free;
- registered charities and armed-forces welfare events: Half, or Free as a showcase;
- everything else: Full.

### [ ] 15. Open a Stripe account (you've started: carry on at your own pace)

1. Go to **stripe.com/gb** and click **Start now**.
2. Choose **Individual / sole trader**, in your own name, with GoChuchuro as the trading name.
3. Switch on two-step sign-in, add your bank account, and finish Stripe's identity check.
4. Leave it in **test mode** for now.

**What Claude Code needs, and when:** nothing yet. Payments are built in February (phase 4). Then you'll be asked for:
- the **test Publishable key** (starts `pk_test_`): safe to send in the chat;
- the **test Secret key** (starts `sk_test_`): never in the chat. You put it straight into Cloudflare with `npx wrangler secret put STRIPE_SECRET_KEY`, the same way as the Gemini key;
- a few clicks to switch on **Connect** (for organisers' payments), with step-by-step instructions at the time.

### [ ] 16. List the organisers to approach

Include the Gurkha Cup, Nepal Cup-style events, melas and charities. Book demos for February so they can open entries in March for the April–May season.

### [ ] 17. Run a practice gate day with 2–3 helpers

Print the posters and car park slips, scan some test passes, take some "cash", then do a cash-up.

---

## How each phase reaches you

At the end of each phase you get:
- what's new, and the link to see it;
- **exactly what was tested and how**: your own phone, a browser at phone size, or the test database;
- what was **not** tested;
- a 5-minute test to do on your own phone.
