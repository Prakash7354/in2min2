# Your action plan

*For Prakash. Updated 14 November 2026 (late night, photo wall live). The full plan is `docs/CONCEPT.md`.*

Tick `[x]` when a step is done, or just tell Claude Code. If a screen looks different from the steps, describe what you see. **Never paste a secret key into the chat or any file.**

---

## Done

- [x] Design agreed, logo C chosen, six questions answered (13–14 Nov).
- [x] Supabase set up. All six database files run, 0001 to [0006](../supabase/migrations/0006_photo_wall.sql) (14 Nov): replies, festive designs, the WhatsApp preview picture and the guests' photo wall.
- [x] Photo store created on Cloudflare, in Europe (14 Nov).
- [x] hello@in2min2.com forwards to hello@gochuchuro.com (14 Nov).
- [x] Gemini key working. Check any time: https://in2min2.com/api/health should say `"ai":"ready"`.
- [x] in2min2.com bought and connected (14 Nov).
- [x] Email sender (Resend) and the code emails set up (14 Nov).
- [x] First phone test, and your notes from it built (14 Nov).
- [x] Festive launch confirmed; fee rules, memorial rule and your details given for the drafts; the 3 yellow boxes answered (refunds, booking fee back on cancellation, accounts deleted after 2 years unused) (14 Nov).

## Now

### [ ] 1. Test with a second phone, such as your wife's (20 minutes)

**On your phone:**
1. Open **in2min2.com**. Under *Festive launch*, tap **Christmas party**. If your own event opens instead, either carry on with it, or tap **Settings** (top right) › **Start a new event** and tap Christmas party again.
2. Fill in the steps. On **The look**, add a photo, then try a **Moving effect** (Snow, Fireworks, Petals).
3. On **Check and publish**, press **Publish** (or **Update my page**) and wait for **Published!**
4. Still on that step, tap **Photos, TV slideshow and table cards**. Turn on **Let guests add photos before the day** (your party is weeks away, so photos would otherwise open on the day). Close the window.
5. Tap **Share** (top right) › **The invitation** › **WhatsApp**, and send it to your wife.

**On her phone:**
6. In WhatsApp, the message should show a picture with the event's name. If it doesn't, wait a minute and send the link again.
7. Tap the link. Check the photo, the words, the running order, the menu and **Directions**.
8. Under **Can you come?**, tap **Yes**. Type her name, choose **2** people, write a short message, and tap **Send my reply**.
9. Tap **Add to Google Calendar** (Android) or **Add to iPhone or Outlook** (iPhone). Check the date and time.
10. Further down, under **Photos**, tap **Add your photos**. Choose 3 photos from her phone, and take one new photo with the camera.
11. Close the page and open the link again. It should say **Thank you, …!**, and her photos should show under Photos. Tap one: it opens large.

**Back on your phone:**
12. Within a minute, the **bell** shows her reply. Tap **See replies**: her name, the number and her message.
13. Tap the bell again › **See photos**. Her photos are **On the wall**. Tap one › **Hide it**, and check it has gone from her page.
14. In the same window, tap **Print table cards with a QR code**. Point her phone's camera at a card on your screen: it should open the photos page.
15. Optional, on a laptop: open the **TV slideshow** from the same window, press **Full screen**, then add a photo from her phone. Within 15 seconds it shows with **New**.
16. Tell Claude Code what worked and what didn't. If a screen shows **"Details for Claude Code:"**, copy that line.

### [ ] 2. Approve the three drafts (10 minutes)

Everything you decided is now in them, and the yellow boxes are gone. The ICO number says "to be provided at launch".
- [Privacy notice](https://in2min2.com/privacy)
- [Terms](https://in2min2.com/terms)
- [Prices and fair fees](https://in2min2.com/pricing)

When you're happy, tell Claude Code **"approve the drafts"**. It removes the "Draft" label and links them from the bottom of every page and from sign-in.

### [ ] 3. Choose what Claude Code builds next

See the recommendation in the chat, then reply "go" or change the order.

## Before the January pilot, or before sharing links widely

- [ ] **4. A virtual business address for GoChuchuro.** For now your home address is on the drafts, as you chose. When you have a virtual address, send it to Claude Code and it's swapped in everywhere. It also keeps your home off the ICO's public register.
- [ ] **5. Pay the ICO fee (15 minutes).** ico.org.uk › search *"pay the data protection fee"* › **Tier 1**, £47 by Direct Debit. Use the virtual address. Send Claude Code the registration number; it goes on the privacy page.
- [ ] **6. Ask your accountant:** do you need to register with HMRC as self-employed, and at what income is a limited company worth it?
- [ ] **7. Find 3–5 pilot families** with events in January or February. Give them the code `LAUNCH50`.
- [ ] **8. Two-step sign-in: postponed (your decision, 14 Nov).** No law names it, but it's recommended before real families' details go in. The steps below were checked against each site's own help pages on 14 Nov. Use an authenticator app (Google Authenticator or Microsoft Authenticator), and keep the recovery codes safe, but not in this project folder.
  - **GitHub:** your photo (top right) › **Settings** › **Password and authentication** (left, under "Access") › **Enable two-factor authentication** › scan the QR code with the app › type the 6-digit code › **Download** the recovery codes › **I have saved my recovery codes**.
  - **Cloudflare:** the person icon (top right) › **My Profile** › **Authentication** › under Two-Factor Authentication, **Set up** › Mobile App Authentication, **Add** › scan the QR code and type the code › your password (twice) › **Next** › **Download** the backup codes › **Next**.
  - **Google:** myaccount.google.com › **Security & sign-in** (left menu) › under "How you sign in to Google", **2-Step Verification** › follow the screens.
  - **Supabase:** while signed in, open supabase.com/dashboard/account/security › add an authenticator app › save the 10 recovery codes it shows once.
  - **Stripe** asks for it when you finish setting up the account.

## Before the community season (February–March 2027)

- [ ] **9. Stripe:** carry on at your own pace. Nothing is needed until February.
- [ ] **10. List organisers to approach:** tournaments, melas, festivals, charity days and cultural shows. We don't name any event publicly. In2Min2 will be ready for events of that size, whoever signs up. Book demos for February.
- [ ] **11. A practice gate day** with 2–3 helpers. In2Min2 makes the posters and numbered car park slips itself (February). Print them on your own printer from your phone or computer, or download them as a PDF or picture for a print shop.
- [ ] **12. Supabase Pro: not yet.** Move when the first community event takes money, or income passes £25 a month. Claude Code will remind you.

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
