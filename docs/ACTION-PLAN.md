# Your action plan

*For Prakash. Updated 16 November 2026. The full plan is `docs/CONCEPT.md`.*

Tick `[x]` when a step is done, or just tell Claude Code. If a screen looks different from the steps, describe what you see. **Never paste a secret key into the chat or any file.**

---

## Done

- [x] Design agreed, logo C chosen, six questions answered (13–14 Nov).
- [x] Supabase set up. All six database files run, 0001 to [0006](../supabase/migrations/0006_photo_wall.sql) (14 Nov): replies, festive designs, the WhatsApp preview picture and the guests' photo wall.
- [x] Photo store created on Cloudflare, in Europe (14 Nov). Database files 0007, 0008 and 0009 run (15 Nov).
- [x] Database file 0010 run: the heart photo shape and the Morning sky (16 Nov).
- [x] New look decided: dark by default with a light option, the Motion library, one thing per screen (15 Nov).
- [x] hello@in2min2.com forwards to hello@gochuchuro.com (14 Nov).
- [x] Gemini key working. Check any time: https://in2min2.com/api/health should say `"ai":"ready"`.
- [x] in2min2.com bought and connected (14 Nov).
- [x] Email sender (Resend) and the code emails set up (14 Nov).
- [x] First phone test, and your notes from it built (14 Nov).
- [x] Festive launch confirmed; fee rules, memorial rule and your details given for the drafts; the 3 yellow boxes answered (refunds, booking fee back on cancellation, accounts deleted after 2 years unused) (14 Nov).

## Now

### [ ] 0. Run database file 0011 (2 minutes)

This switches on announcements and live comments. (0010 ran on 16 Nov.)
1. Open [0011_announcements_and_cheers.sql](../supabase/migrations/0011_announcements_and_cheers.sql) in VS Code, then press **Cmd+A**, then **Cmd+C**.
2. Go to **supabase.com** › your project › **SQL Editor** (left side) › **New query**.
3. Paste with **Cmd+V**, then press **Run** (bottom right). It should say **Success. No rows returned**.
4. Tell Claude Code "0011 ran".

### [ ] 1. Try Builder 2.0 on your phone, then test it with 5 people (about 40 minutes in all)

**in2min2.com/new** is now the real builder in the new look. It's hidden (not linked anywhere) and works on the same event as the classic builder, so your test event may open straight on its Home.

**Try it yourself first (15 minutes):**
1. Open **in2min2.com/new** on your phone. To start fresh, tap **You** (the round person button, top right) › **Start a new event** › **Yes, start new**.
2. Tap **Birthday**, type a name and tap **50th**. Then tap **Another age** and use **−** or **+** (or type a number) to make it, say, an 11th. Tap **Change** beside "On the invitation" to word it your own way.
   - Watch the little card at the bottom left: it changes as you type. Tap it to see the **Preview**, then **Carry on**.
   - On each screen, tap the quick choices (**This Saturday**, **2pm**, **Community hall**). Swipe to choose a look, and add a photo.
3. On **Your invitation is ready**, tap **Sign in and write it**. Sign in with the code we email you, and watch the AI write the words.
4. Tap **Go to your event home** and open each tile:
   - **Invitation words**: tap **Shorter** or **Warmer** under a box.
   - **Day plan**: tap **Use this plan**, then tap **Food** and add a dish.
   - **Look**: swipe the looks, then try **Colours**, **Border** and **Letters**.
   - **Photos**: before publishing, tap **Try it with your photos** and pick a few. They jump on to the wheel. They stay on your phone and nobody else sees them.
5. Tap **Publish** at the bottom, turn on **I've checked it**, and tap **Publish**. The Share sheet opens: send the link to yourself on WhatsApp.
6. Try the top bar: **Share**, the **bell** (updates, and reminders of what to send when), and **You** (sign out, dark or light).
7. Press your phone's own **Back** button, or swipe back. It should go back one screen, or close the open panel.
8. Also try a **Christmas party**, a **Lhosar celebration** and a **Wedding**: each asks its own questions.

**The 5-person test.** Use colleagues, a grandparent, a teenager, and someone who isn't confident with phones.
1. On *their* phone (or yours, after **You** › **Start a new event**), open **in2min2.com/new**. Say only: *"Make an invitation for a birthday and get it ready to share."*
2. Don't help or point. Time them from the first tap to **Your invitation is ready**.
3. Note where they stop or hesitate, and anything they say out loud.
4. Afterwards, ask three questions:
   - What was easy?
   - What was confusing?
   - Would you use this for your own event?
5. Send Claude Code the times and notes. The goal: a newcomer finishes in under 2 minutes without help.

**Two kinds of test** (both use **in2min2.com/new**; no other link is needed):
- **Play test (now):** testers make a pretend event on their own phone and try everything, including **Announce**, **Photos** › **Try it with your photos**, and the comments on the photos page. Nothing else is needed first.
- **Real small event (after the play test):** a real birthday or get-together with real guests, the TV wheel, and comments on the night. Before this one, Claude Code should build the **nightly backup** (Supabase's free plan keeps none, so a mistake could lose real replies), and you should approve the drafts (step 3) so the privacy page is live.

The classic builder stays at **in2min2.com/builder** until you're happy with the new one. The style page is still at **in2min2.com/new/style**.

### [ ] 2. Test with a second phone, such as your wife's (20 minutes)

**On your phone:**
1. Open **in2min2.com**. Under *Festive launch*, tap **Christmas party**. If your own event opens instead, either carry on with it, or tap **Settings** (top right) › **Start a new event** and tap Christmas party again.
2. Fill in the steps. On **The look**, add a main photo, then tap **+ Add photos** for up to four more, and pick **How they change** (Zoom in, Zoom out or Slide). Try a **Moving effect** too (Snow, Fireworks, Petals).
3. On **Check and publish**, press **Publish** (or **Update my page**) and wait for **Published!**
4. Still on that step, tap **Photos, TV slideshow and table cards**. Turn on **Let guests add photos before the day** (your party is weeks away, so photos would otherwise open on the day). Close the window.
5. Tap **Share** (top right) › **The invitation** › **WhatsApp**, and send it to your wife.

**On her phone:**
6. In WhatsApp, the message should show a picture with the event's name. If it doesn't, wait a minute and send the link again.
7. Tap the link. Check the photo, the words, the running order, the menu and **Directions**.
8. Under **Can you come?**, tap **Yes**. Type her name, choose **2** people, write a short message, and tap **Send my reply**.
9. Tap **Add to Google Calendar** (Android) or **Add to iPhone or Outlook** (iPhone). Check the date and time.
10. Further down, under **Photos**, tap **Add your photos**. Choose 3 photos from her phone, and take one new photo with the camera.
11. Close the page and open the link again. It should say **Thank you, …!**, and her photos should show under Photos. With 3 or more photos they turn on a **wheel**: swipe it, and tap a photo to open it large. Add one more photo and watch it arrive with confetti. Tap the **heart** under the wheel: the count goes up on your phone too.

**Back on your phone:**
12. Within a minute, the **bell** shows her reply. Tap **See replies**: her name, the number and her message.
13. Tap the bell again › **See photos**. Her photos are **On the wall**. Tap one › **Hide it**, and check it has gone from her page.
    In the same window, tap **Add your photos** and add two of your own. They show on her page straight away.
    Still in the Photos window, try a **Sky behind the photo wheel** (Day, Evening, Night, Galaxy or Northern lights), then look at her page again.
    Under **Your photographer**, add a pretend photographer (your own name and @instagram), tap **Copy their link**, open it in your phone's browser and add three photos. On her page they show **Photo: …** and a **Book them** card.
14. In the same window, tap **Print table cards with a QR code**. Point her phone's camera at a card on your screen: it should open the photos page.
15. Optional, on a laptop: open the **TV wheel** (or the **TV slideshow**) from the same window, press **Full screen**, then add a photo from her phone. Within 15 seconds it arrives with **New**. In the Photos window, tap a photo › **Make it a favourite**: it comes round more often, marked **Host's pick**.
16. Tell Claude Code what worked and what didn't. If a screen shows **"Details for Claude Code:"**, copy that line.

### [ ] 3. Approve the three drafts (10 minutes)

Everything you decided is now in them, and the yellow boxes are gone. The ICO number says "to be provided at launch".
- [Privacy notice](https://in2min2.com/privacy)
- [Terms](https://in2min2.com/terms)
- [Prices and fair fees](https://in2min2.com/pricing)

When you're happy, tell Claude Code **"approve the drafts"**. It removes the "Draft" label and links them from the bottom of every page and from sign-in.

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
