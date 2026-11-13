# Your action plan

*For Prakash. Updated 13 November 2026 (evening). The full plan is `docs/CONCEPT.md`.*

Change `[ ]` to `[x]` when you finish a step, or just tell Claude Code it's done. If a screen looks different from these steps, describe what you see and you'll get the right step.

**Never paste a secret key into the chat or into any file.** A secret goes only where the steps say.

---

## Already decided by you (13 November)

- The plan buys time (7 days free, 90 days £9, 6 months £15, 12 months £25). More people come in packs of +100 for £3, on any plan.
- Stripe: a sole trader account in your name, until you incorporate.
- The host or organiser checks and approves every word, in any language, before publishing.
- Free, half or full price is your decision, case by case. Every event pays full unless you change it.
- Community events must say who organises them and whether anyone profits.
- A private demo account for you; no public demo log-in.
- A website with a top menu, How it works, sign-up, sign-in and contact.
- VAT: not close to the threshold.

## Now: agree the design (10 minutes)

### [ ] 0. Look at the new design on your phone, then say "agreed" or what to change

1. Open https://in2min2.pksgrg.workers.dev/builder on your phone.
2. Pick an event (try a Wedding, a Reunion and a Memorial), then tap **Next** until you reach **The look**.
3. Try the **Border** tiles (tap **Show all 18 borders**), the **Colours** families and the **Text style** tiles.
4. Tap the small preview at the top to see it full-screen.

**Once you say "agreed", the next steps are 2, 3 and 4 below.** Claude Code will remind you.

## This week: free, about 45 minutes in all

### [x] 1. Answer six questions

Done 13 November: colours A (Marigold & Indigo) for In2Min2, with all three offered to hosts; "Yes" to the other five recommendations (200/300/400/500 people, 30% and 20% returning discounts, 10% grace, `LAUNCH50` to your network first, Supabase free plan with nightly backups). Say if any of those should change.

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

- You'll trade as a sole trader in your own name for now. Do you need to register with HMRC as self-employed, and what records should you keep?
- At what income would becoming a limited company be worth it?

### [ ] 7. Find 3–5 pilot families

Look for a birthday or Pasni, an anniversary and a reunion happening in January or February. Give them the code `LAUNCH50` for a free Keepsake.

### [x] 8. Nepali wording: no separate check needed

Your decision: hosts and organisers check and approve their own words, in any language, before publishing. In2Min2's example texts are labelled as examples and corrected whenever someone suggests better wording.

### [ ] 9. Approve the privacy notice and terms

Claude Code drafts them in phase 2. Read them, and ask about anything unclear. Before the first paid community event, a one-off check by a solicitor is worth it.

### [ ] 10. Buy in2min2.com, once you're happy with the Phase 1 preview

1. In the Cloudflare dashboard, open **Domain Registration › Register Domains**.
2. Search for `in2min2.com`.
3. Click **Purchase**. It costs about £8–10 a year.

It was still free on 13 November 2026, but anyone can buy it until you do.

### [ ] 11. Supabase Pro: not yet

You asked how to avoid paying for Supabase Pro ($25 a month) before there's income. The plan:
- Stay on the free plan through building and the family pilot.
- From the first real guest, a nightly, locked copy of the database goes to In2Min2's own Cloudflare storage. This replaces Supabase's backups, and Claude Code sets it up in phase 2.
- Move to Pro when the first community event takes money, or when income passes £25 a month, whichever comes first. Claude Code will remind you.

### [x] 12. Logo: not needed

Your decision (13 November): the In2Min2 wordmark is the logo, with marigold 2s on indigo. The square icon for the browser tab and phone home screen is already made. A designer can refine it one day, but nothing waits for it.

---

## Before the community season (February–March 2027)

### [ ] 13. Write down your fee rules (5 minutes)

Your free, half or full decisions must be fair and consistent (`docs/CONCEPT.md`, section 5h). A starting point to edit:
- memorials and funerals: Free;
- registered charities and armed-forces welfare events: Half, or Free as a showcase;
- everything else: Full.

### [ ] 14. Open a Stripe account (phase 4)

1. Go to **stripe.com/gb** and click **Start now**.
2. Choose **Individual / sole trader**, in your own name, with GoChuchuro as the trading name.
3. Switch on two-step sign-in.

### [ ] 15. List the organisers to approach

Include the Gurkha Cup, Nepal Cup-style events, melas and charities. Book demos for February so they can open entries in March for the April–May season.

### [ ] 16. Run a practice gate day with 2–3 helpers

Print the posters and car park slips, scan some test passes, take some "cash", then do a cash-up.

---

## How each phase reaches you

At the end of each phase you get:
- what's new, and the link to see it;
- **exactly what was tested and how**: your own phone, a browser at phone size, or the test database;
- what was **not** tested;
- a 5-minute test to do on your own phone.
