# Your action plan

*For Prakash. Updated 13 November 2026. The full plan is `docs/CONCEPT.md`.*

Change `[ ]` to `[x]` when you finish a step, or just tell Claude Code it's done. If a screen looks different from these steps, describe what you see and you'll get the right step.

**Never paste a secret key into the chat or into any file.** A secret goes only where the steps say.

---

## This week: free, about 45 minutes in all

### [ ] 1. Answer six questions (5 minutes)

Reply in the chat with your answers, for example: *"1 yes, 2 yes, 3 network first, 4 ask accountant, 5 me, 6 yes"*.

1. Extra people in packs of 100 for £3, on any plan?
2. Allow guests' replies up to 10% over the limit before they pause?
3. The `LAUNCH50` code: share it only with your network, or also publicly with "places left"?
4. Will the Stripe account be in your name as a sole trader, or a limited company? (Ask your accountant.)
5. Who can check the Nepali wording and example texts? (About an hour.)
6. Offer a Nepal Cup-style event In2Min2 for free, as a showcase?

### [ ] 2. Switch on two-step sign-in (15 minutes)

This is the single biggest protection against someone breaking in. Use an authenticator app such as Google Authenticator or Microsoft Authenticator. Keep the recovery codes somewhere safe, but not in this project folder.

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

### [ ] 3. Gemini key (10 minutes): makes "Generate text" work

1. Go to **aistudio.google.com** and sign in with your Google account.
2. Click **Get API key** (left side), then **Create API key**.
3. If it asks for a project, choose to create a new one. Name it `in2min2` if it lets you.
4. Click **Copy** next to the key.
5. In VS Code, open the menu **Terminal › New Terminal**.
6. Type `npx wrangler secret put GEMINI_API_KEY` and press **Enter**.
7. When it says *Enter a secret value*, press **Cmd+V**, then **Enter**. Nothing appears while you paste; that's normal.
8. Wait for *Success! Uploaded secret GEMINI_API_KEY*.
9. Open https://in2min2.pksgrg.workers.dev/builder, fill in the boxes and press **Generate text**. Tell Claude Code what happened.

**Don't switch on billing in Google yet.** The free allowance is plenty for testing. Until sign-in is built, anyone who found the page could run up a bill.

### [ ] 4. Supabase: the database (15 minutes)

1. Go to **supabase.com**, then click **Start your project** › **Continue with GitHub**.
2. If it asks you to create an organisation:
   1. Name it **GoChuchuro**.
   2. Choose type **Personal** and plan **Free**.
   3. Click **Create organization**.
3. Click **New project**:
   - **Name:** `in2min2`
   - **Database password:** click **Generate a password**, then save it in your password manager. You'll rarely need it.
   - **Region:** the one that says **London**.
   - Click **Create new project**, then wait about 2 minutes.
4. In the left menu, click **SQL Editor**, then the **+** button for a new query.
5. In VS Code, open `supabase/migrations/0001_init.sql`. Press **Cmd+A**, then **Cmd+C**.
6. Back in Supabase:
   1. Click into the editor and press **Cmd+V**.
   2. Click **Run** (bottom right).
   3. If it warns about *destructive operations*, click **Run this query**.
7. You should see *Success. No rows returned*.
   - If you see red text, copy it to Claude Code.
   - **Don't run the file a second time.** It only works once.
8. Find the two public values and send them in the chat. Both are safe to share:
   - **Project URL**: click **Connect** at the top of the project page. It looks like `https://abcdefgh.supabase.co`.
   - **Publishable key**: in **Project Settings** (gear icon) › **API Keys**. It starts `sb_publishable_`.
9. **Never send the Secret key** (it starts `sb_secret_`). Claude Code will show you how to put it straight into Cloudflare.

---

## Before the January pilot

### [ ] 5. Pay the ICO data protection fee (15 minutes)

1. Go to **ico.org.uk** and search *"pay the data protection fee"*.
2. Choose **Tier 1**: **£47 by Direct Debit** or £52 by card.
3. You'll need your business name (GoChuchuro), address and turnover band.
4. The form does **not** ask about children's photos or any other kind of data.

Pay it before any real family's details go in.

### [ ] 6. Ask your accountant two things

- Should the Stripe account be in your name as a sole trader, or a limited company?
- Is there anything to note about VAT? (VAT only applies above £90,000 a year.)

### [ ] 7. Find 3–5 pilot families

Look for a birthday or Pasni, an anniversary and a reunion happening in January or February. Give them the code `LAUNCH50` for a free Keepsake.

### [ ] 8. Check the Nepali wording (about an hour)

Claude Code will draft the phrase bank and example texts. You, or someone in the family, read them and correct anything that sounds wrong.

### [ ] 9. Approve the privacy notice and terms

Claude Code drafts them in phase 2. Read them, and ask about anything unclear. Before the first paid community event, a one-off check by a solicitor is worth it.

### [ ] 10. Buy in2min2.com, once you're happy with the Phase 1 preview

1. In the Cloudflare dashboard, open **Domain Registration › Register Domains**.
2. Search for `in2min2.com`.
3. Click **Purchase**. It costs about £8–10 a year.

It was still free on 13 November 2026, but anyone can buy it until you do.

### [ ] 11. Upgrade Supabase to Pro ($25 a month) the week before the pilot

The free plan has no backups and pauses itself after 7 days. Claude Code will remind you.

---

## Before the community season (February–March 2027)

### [ ] 12. Open a Stripe account (phase 4)

1. Go to **stripe.com/gb** and click **Start now**.
2. Open it in the business name your accountant suggests.
3. Switch on two-step sign-in.

### [ ] 13. List the organisers to approach

Include the Gurkha Cup, Nepal Cup-style events, melas and charities. Book demos for February so they can open entries in March for the April–May season.

### [ ] 14. Run a practice gate day with 2–3 helpers

Print the posters and car park slips, scan some test passes, take some "cash", then do a cash-up.

---

## How each phase reaches you

At the end of each phase you get:
- what's new, and the link to see it;
- **exactly what was tested and how**: your own phone, a browser at phone size, or the test database;
- what was **not** tested;
- a 5-minute test to do on your own phone.
