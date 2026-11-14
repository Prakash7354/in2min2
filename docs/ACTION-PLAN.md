# Your action plan

*For Prakash. Updated 14 November 2026 (evening). The full plan is `docs/CONCEPT.md`.*

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
- The logo is the In2Min2 wordmark with stopwatch 2s (idea C).

## Done

- [x] **0. Design agreed** (14 November).
- [x] **1. Six questions answered** (13 November).
- [x] **Supabase project made; [`0001_init.sql`](../supabase/migrations/0001_init.sql) run** (14 November).
- [x] **2. [`0002_grants_and_ai_limit.sql`](../supabase/migrations/0002_grants_and_ai_limit.sql) run** (14 November).
- [x] **4. New Gemini key saved and working** (14 November). Check any time at https://in2min2.com/api/health: it should say `"ai":"ready"`.
- [x] **6. Logo chosen: C, the stopwatch 2s** (14 November). Now in the app and the browser-tab icon.
- [x] **in2min2.com bought and connected** (14 November). https://in2min2.com and https://www.in2min2.com both open the app. The old preview address keeps working too.
- [x] **First phone test** (14 November): signed in, "Write it for me" worked, the preview showed. Your notes from it are built (see step 2b).

## Now: about 30 minutes, in this order

### [ ] 2b. Run the third database file: [`0003_running_order_and_menu.sql`](../supabase/migrations/0003_running_order_and_menu.sql) (3 minutes)

It adds the running order's food menu, the "Food menu" switch, and "Show the whole picture" for logos. **Until it has run, pressing Publish shows "In2Min2's database needs its latest update".**

1. In VS Code, open [`supabase/migrations/0003_running_order_and_menu.sql`](../supabase/migrations/0003_running_order_and_menu.sql). Press **Cmd+A**, then **Cmd+C**.
2. In Supabase, click **SQL Editor** (left menu), then **New query**.
3. Click in the empty box, press **Cmd+V**, then click **Run** (bottom right).
4. It should say **Success. No rows returned.** Tell Claude Code it ran.

Your sign-in on 14 November failed because Supabase's built-in sender only emails members of your Supabase team. Steps 3 and 3b fix that for good.

### [ ] 3. Make the email show the code (5 minutes; skip if you've done it)

Your own sign-in worked on 14 November. That may be because your email is on the Supabase team, which the built-in sender allows (2 emails an hour). Steps 3 and 3b make it work for everyone else. Tell Claude Code if you've already done them.

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

### [ ] 3b. In2Min2's own email sender, so codes reach anyone (20 minutes)

The sender is Resend: free for 3,000 emails a month, up to 100 a day. Codes will come from `codes@in2min2.com`.

**Part A: Resend**
1. Go to **resend.com** and click **Sign up**. Use your own email.
2. Click **Domains**, then **Add domain**.
   - Domain: `in2min2.com`
   - Region: **Ireland (eu-west-1)**, the closest to the UK.
   - Click **Add**.
3. Resend shows 3 or 4 **DNS records**.
   - If it offers to add them to **Cloudflare** automatically, click that and sign in to Cloudflare when asked.
   - Otherwise, add each one by hand. In the Cloudflare dashboard click **in2min2.com** › **DNS** › **Records** › **Add record**. Copy the **Type**, **Name** and **Content** exactly as Resend shows them; for the MX record also copy the **Priority** (usually 10). Click **Save**.
4. While you're in Cloudflare's DNS page, add one more record. It helps the emails land in the inbox, not in junk:
   - **Type:** TXT
   - **Name:** `_dmarc`
   - **Content:** `v=DMARC1; p=none;`
5. Back in Resend, click **Verify DNS records**. Wait until it says **Verified**. It usually takes a few minutes; if not, refresh after half an hour.
6. In Resend click **API Keys** › **Create API key**.
   - Name: `supabase`
   - Permission: **Sending access**
   - Domain: `in2min2.com`
   - Click **Add**, then **copy** the key. It's shown only once.
   - **Don't paste it into the chat.** It goes straight into Supabase in Part B.

**Part B: Supabase**

7. Click **Authentication**, then **Emails**, then **SMTP Settings**. It may instead be under **Project Settings** › **Authentication**. Switch on **Enable custom SMTP** and fill in:
   - **Sender email:** `codes@in2min2.com`
   - **Sender name:** `In2Min2`
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** paste the Resend key
   - Click **Save**.
8. Click **Authentication** › **Rate Limits**. Set the number of emails per hour to `60`, then click **Save**.
9. Click **Authentication** › **URL Configuration**.
   - **Site URL:** `https://in2min2.com`
   - Under **Redirect URLs**, click **Add URL** and add both `https://in2min2.pksgrg.workers.dev/**` and `http://localhost:3000/**`.
   - Click **Save**.

### [ ] 5. Test it on your phone again (10 minutes), after step 2b, then tell Claude Code what happened

1. Open **https://in2min2.com/builder**.
2. On **When, where and how many**, add a **Running order**: tap the quick-add buttons (for example *Guests arrive*, *Lunch*). Lunch starts as a meal: type a few dishes in its menu.
3. On **The look**, under your photo, try **Show the whole picture** and **Fill the space**.
4. Try the three buttons at the top right: **Share**, the **bell**, and **Settings** (the cog).
5. On **Check and publish**, press **Update my page** (or **Publish**), then **Share the link** or **WhatsApp**.
6. Open the link. Check the running order and menu on the page.

If anything goes wrong, the screen shows a line starting **"Details for Claude Code:"**. Copy that line into the chat.

### [ ] 7. Switch on two-step sign-in (later, when you have 15 minutes; Claude Code will keep reminding you)

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

### [x] 12. in2min2.com: bought and connected (14 November)

The next part, the email sender, is step 3b above.

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
