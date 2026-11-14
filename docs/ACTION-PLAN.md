# Your action plan

*For Prakash. Updated 14 November 2026 (late night). The full plan is `docs/CONCEPT.md`.*

Tick `[x]` when a step is done, or just tell Claude Code. If a screen looks different from the steps, describe what you see. **Never paste a secret key into the chat or any file.**

---

## Done

- [x] Design agreed, logo C chosen, six questions answered (13–14 Nov).
- [x] Supabase set up. All three database files run: [0001](../supabase/migrations/0001_init.sql), [0002](../supabase/migrations/0002_grants_and_ai_limit.sql), [0003](../supabase/migrations/0003_running_order_and_menu.sql) (14 Nov).
- [x] Gemini key working. Check any time: https://in2min2.com/api/health should say `"ai":"ready"`.
- [x] in2min2.com bought and connected (14 Nov).
- [x] Email sender (Resend) and the code emails set up (14 Nov).
- [x] First phone test, and your notes from it built (14 Nov).
- [x] Festive launch confirmed; fee rules, memorial rule and your details given for the drafts (14 Nov).

## Now

### [ ] 1. Run two database files (6 minutes)

They switch on guests' replies, the festive designs and effects, and the main photo and WhatsApp preview picture. Until they've run, guests see "Replies aren't open just yet".

**First file:** [`0004_replies_festive_effects.sql`](../supabase/migrations/0004_replies_festive_effects.sql)
1. In VS Code, open the file above. Press **Cmd+A**, then **Cmd+C**.
2. In Supabase, click **SQL Editor** (left menu), then **New query**.
3. Click in the empty box, press **Cmd+V**, then click **Run** (bottom right).
4. It should say **Success. No rows returned.**

**Second file:** [`0005_event_photos.sql`](../supabase/migrations/0005_event_photos.sql). Do the same four steps with this file. If it shows a red error, copy the red text into the chat.

Then tell Claude Code both ran.

### [ ] 2. Test with a second phone, such as your wife's (15 minutes, after step 1)

**On your phone:**
1. Open **in2min2.com**. Under *Festive launch*, tap **Christmas party**. If your own event opens instead, either carry on with it, or tap **Settings** (top right) › **Start a new event** and tap Christmas party again.
2. Fill in the steps. On **The look**, add a photo, then try a **Moving effect** (Snow, Fireworks, Petals).
3. On **Check and publish**, press **Publish** (or **Update my page**) and wait for **Published!**
4. Tap **Share** (top right) › **The invitation** › **WhatsApp**, and send it to your wife.

**On her phone:**
5. In WhatsApp, the message should show a picture with the event's name. If it doesn't, wait a minute and send the link again.
6. Tap the link. Check the photo, the words, the running order, the menu and **Directions**.
7. Under **Can you come?**, tap **Yes**. Type her name, choose **2** people, write a short message, and tap **Send my reply**.
8. Tap **Add to Google Calendar** (Android) or **Add to iPhone or Outlook** (iPhone). Check the date and time.
9. Close the page and open the link again. It should say **Thank you, …!** Tap **Change my reply** › **Maybe** › **Send my reply**.
10. Optional: on her phone, open **in2min2.com/builder** › **Settings** (top right) › **Sign in** with her own email. This checks that sign-in codes reach someone new.

**Back on your phone:**
11. Within a minute, the **bell** shows a new reply. Tap **See replies**: her name, the number and her message.
12. Tell Claude Code what worked and what didn't. If a screen shows **"Details for Claude Code:"**, copy that line.

### [ ] 3. Read the three drafts again, and answer the 3 yellow boxes (10 minutes)

Your name, address and the memorial and charity rules are now in. The ICO number says "to be provided at launch".
- [Privacy notice](https://in2min2.com/privacy)
- [Terms](https://in2min2.com/terms)
- [Prices and fair fees](https://in2min2.com/pricing)

Nothing links to them yet, and search engines are told to ignore them, until you approve.

### [ ] 4. Make hello@in2min2.com arrive at hello@gochuchuro.com (5 minutes, free)

Forwarding works well and costs nothing. When you're ready for a paid mailbox, the address stays the same.
1. Go to **dash.cloudflare.com** and click **in2min2.com**.
2. In the left menu click **Email**, then **Email Routing**. If asked, click **Get started** (or **Enable Email Routing**), then **Add records and enable**.
3. Click the **Destination addresses** tab › **Add destination address** › type `hello@gochuchuro.com` › **Save**. Open the email Cloudflare sends to hello@gochuchuro.com and click **Verify email address**.
4. Back in Cloudflare, click **Routing rules** › **Create address**.
   - **Custom address:** `hello`
   - **Action:** Send to an email
   - **Destination:** `hello@gochuchuro.com`
   - Click **Save**.
5. Test it: send an email to hello@in2min2.com from another account.

Your replies will come from hello@gochuchuro.com, which is fine for now.

### [ ] 5. Choose what Claude Code builds next

See the recommendation in the chat, then reply "go" or change the order.

## Before the January pilot, or before sharing links widely

- [ ] **6. A virtual business address for GoChuchuro.** For now your home address is on the drafts, as you chose. When you have a virtual address, send it to Claude Code and it's swapped in everywhere. It also keeps your home off the ICO's public register.
- [ ] **7. Pay the ICO fee (15 minutes).** ico.org.uk › search *"pay the data protection fee"* › **Tier 1**, £47 by Direct Debit. Use the virtual address. Send Claude Code the registration number; it goes on the privacy page.
- [ ] **8. Ask your accountant:** do you need to register with HMRC as self-employed, and at what income is a limited company worth it?
- [ ] **9. Find 3–5 pilot families** with events in January or February. Give them the code `LAUNCH50`.
- [ ] **10. Two-step sign-in: postponed (your decision, 14 Nov).** No law names it, but it's recommended before real families' details go in. The steps below were checked against each site's own help pages on 14 Nov. Use an authenticator app (Google Authenticator or Microsoft Authenticator), and keep the recovery codes safe, but not in this project folder.
  - **GitHub:** your photo (top right) › **Settings** › **Password and authentication** (left, under "Access") › **Enable two-factor authentication** › scan the QR code with the app › type the 6-digit code › **Download** the recovery codes › **I have saved my recovery codes**.
  - **Cloudflare:** the person icon (top right) › **My Profile** › **Authentication** › under Two-Factor Authentication, **Set up** › Mobile App Authentication, **Add** › scan the QR code and type the code › your password (twice) › **Next** › **Download** the backup codes › **Next**.
  - **Google:** myaccount.google.com › **Security & sign-in** (left menu) › under "How you sign in to Google", **2-Step Verification** › follow the screens.
  - **Supabase:** while signed in, open supabase.com/dashboard/account/security › add an authenticator app › save the 10 recovery codes it shows once.
  - **Stripe** asks for it when you finish setting up the account.

## Before the community season (February–March 2027)

- [ ] **11. Stripe:** carry on at your own pace. Nothing is needed until February.
- [ ] **12. List organisers to approach:** tournaments, melas, festivals, charity days and cultural shows. We don't name any event publicly. In2Min2 will be ready for events of that size, whoever signs up. Book demos for February.
- [ ] **13. A practice gate day** with 2–3 helpers. In2Min2 makes the posters and numbered car park slips itself (February). Print them on your own printer from your phone or computer, or download them as a PDF or picture for a print shop.
- [ ] **14. Supabase Pro: not yet.** Move when the first community event takes money, or income passes £25 a month. Claude Code will remind you.

---

## Decided by you

- **Prices:** the plan buys time: 7 days free, 90 days £9, 6 months £15, 12 months £25. More people cost £3 per 100. Community events: free to set up, 4% + 30p per online order, nothing on cash or free events.
- **Festive launch:** free until 31 January 2027 (14 Nov).
- **Free, half or full:** written rules on the [Prices](https://in2min2.com/pricing) page. Memorials and funerals are free automatically; misuse breaks the terms. Charities and armed forces welfare events get half price on request, with evidence by email or letter.
- **Your business:** Stripe as a sole trader in your name; a virtual business address for GoChuchuro.
- **Events:**
  - The host or organiser checks every word before publishing.
  - Community events show who organises them and whether anyone profits.
  - No event or organiser is named publicly.
- **Look and website:** design agreed; logo C; a private demo account; a website with a top menu.
- **Two-step sign-in:** postponed for now.

## How each phase reaches you

At the end of each phase you get:
- what's new, with links;
- exactly what was tested and how;
- what wasn't tested;
- a short test to try on your own phone.
