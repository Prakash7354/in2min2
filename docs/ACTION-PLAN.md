# Your action plan

*For Prakash. Updated 16 November 2026. The full plan is `docs/CONCEPT.md`.*

Tick `[x]` when a step is done, or just tell Claude Code. If a screen looks different from the steps, describe what you see. **Never paste a secret key into the chat or any file.**

---

## Done

- [x] Design agreed, logo C chosen, six questions answered (13–14 Nov).
- [x] Supabase set up. All six database files run, 0001 to [0006](../supabase/migrations/0006_photo_wall.sql) (14 Nov): replies, festive designs, the WhatsApp preview picture and the guests' photo wall.
- [x] Photo store created on Cloudflare, in Europe (14 Nov). Database files 0007, 0008 and 0009 run (15 Nov).
- [x] Database files 0010 and 0011 run: the heart photo shape, the Morning sky, announcements and live comments (16 Nov).
- [x] New look decided: dark by default with a light option, the Motion library, one thing per screen (15 Nov).
- [x] hello@in2min2.com forwards to hello@gochuchuro.com (14 Nov).
- [x] Gemini key working. Check any time: https://in2min2.com/api/health should say `"ai":"ready"`.
- [x] in2min2.com bought and connected (14 Nov).
- [x] Email sender (Resend) and the code emails set up (14 Nov).
- [x] First phone test, and your notes from it built (14 Nov).
- [x] Festive launch confirmed; fee rules, memorial rule and your details given for the drafts; the 3 yellow boxes answered (refunds, booking fee back on cancellation, accounts deleted after 2 years unused) (14 Nov).

## Now

- [ ] **Food needs on the reply form (22 Nov).** Built: guests can tick Vegetarian, Vegan, Halal, Gluten-free, Nut allergy or Dairy-free when they reply (optional; only the hosts see them). Replies shows the totals for the caterer, and "Copy the list" includes them. Hosts can switch it off in Settings (it starts off for memorials). **To make it save, run the database file [0014_food_needs.sql](../supabase/migrations/0014_food_needs.sql):** open it on your Mac, select everything (Cmd+A), copy (Cmd+C). Supabase › your project › **SQL Editor** › **New query** › paste › **Run**. You should see "Success. No rows returned." Tell Claude Code. Until then the question shows but the ticks aren't kept.

## Launch checklist (20 Nov 2026): what's left before sharing with real families

**Ready (Claude Code, 20 Nov):**
- [x] The website's **Start free** and the festive designs open the new builder (in2min2.com/new). The classic builder still works at /builder but isn't linked.
- [x] Search engines may list the builder and How it works (not the style page).
- [x] The festive launch, as you decided on 15 Nov: free family pages made before 31 January stay online **90 days** after the event, for up to **300 people and 300 photos**. Needs the database file below.
- [x] On the day, and after: the full page again (not just the photos), with quick buttons for Photos, Directions and What's on.
- [x] Privacy, Terms and Prices links are wired into the home page footer and sign-in; they appear the moment the drafts are approved.

- [x] **The new website (21 Nov):** your logo, favicon and photos; a menu and footer; the four steps as a moving phone; every kind of event with a photo or a real invitation; "See what your guests get" (the envelope, then the page, with music); the photo wheel turning with comments; prices with the festive offer; questions and answers. Mobile first, and laid out for laptops. Words in simple British English. Where each photo came from: [site-images.md](reference/site-images.md) (please add the links).

**You (in this order):**
1. [x] **✓ Done 20 Nov (checked live: the festive plan is there, until 1 February).** Run the database file [0013_festive_launch.sql](../supabase/migrations/0013_festive_launch.sql): open it on your Mac, select everything (Cmd+A), copy (Cmd+C). Supabase › your project › **SQL Editor** › **New query** › paste › **Run**. You should see "Success. No rows returned." Tell Claude Code.
2. [ ] **Backups and alert emails (found 20 Nov: the Worker can't see its two secrets, so no backup has run and no alert could be sent).** Add them again, as *runtime* secrets:
   1. Cloudflare dashboard › **Workers & Pages** › **in2min2** › **Settings**.
   2. Find the section called **Variables and Secrets** (not "Build" › "Variables and secrets", which is a different place used only while building).
   3. If `SUPABASE_SECRET_KEY` or `ALERT_EMAIL` is listed there as **Text**, delete it.
   4. **+ Add** › Type: **Secret** › Name: `SUPABASE_SECRET_KEY` › Value: the key starting `sb_secret_` (Supabase › Project Settings › API Keys › Secret keys) › **Deploy**.
   5. **+ Add** › Type: **Secret** › Name: `ALERT_EMAIL` › Value: your own email address (the one verified under in2min2.com › Email › Email Routing › Destination addresses) › **Deploy**.
   6. Tell Claude Code. Within the hour it can see whether the backup worked (ops/state.json), and you'll get an email only if something breaks. (alerts@in2min2.com is only the sender's name; it needs no mailbox.)
3. [x] **Approved 20 Nov, subject to the ICO number and address.** Approve the three drafts ([Privacy](https://in2min2.com/privacy), [Terms](https://in2min2.com/terms), [Prices](https://in2min2.com/pricing)): read them, then tell Claude Code "approve the drafts".
4. [ ] **ICO:** pay the data protection fee (ico.org.uk › "pay the data protection fee" › Tier 1, £47) and send Claude Code the registration number.
5. [ ] **Business address:** send Claude Code the address to show (a virtual address keeps your home off the public register).
6. [ ] **Gemini paid tier:** Google AI Studio › your project › **Billing** › set up billing, so guests' details are covered by Google's paid terms (the free tier may use what's sent to improve their models).
7. [ ] Then Claude Code removes "Draft", puts in the ICO number and address, and the site is ready to share.


### Your list of 19 Nov, put in order

**Done (19 Nov), live after the next deploy:**
- [x] Publishing now also needs **where it is** and **the invitation words** (as well as the date and time). Publish lists what's missing; tapping it takes you there.
- [x] Many events with the same title: each gets its own address automatically (…-birthday, …-birthday-2, …-birthday-3).
- [x] **Hosted by** box on the Publish screen, shown at the bottom of the page (e.g. "Hosted by the Gurung family").
- [x] Love heart in red; the phone wheel sits in the middle until comments arrive.
- [x] Sign-in: **Send the code again** (after 60 seconds), and a hint to check Junk for codes@in2min2.com.
- [x] Your border designs as **B5 Christmas greenery, B6 Golden roses, B7 Ornate flowers, B8 Wedding lines**. Each takes the event's colours.
- [x] **Look › Background**: 9 of your painted backgrounds. Choosing one also picks letter colours that read well on it.
- [x] **More backgrounds (19 Nov):** emerald, royal blue, rani pink and indigo, each glowing and as a gold lattice (jali), plus four soft modern ones.
- [x] **Music and the envelope (19 Nov):** Look › **Envelope & music**. Your three tunes (Happy Birthday, We Wish You a Merry Christmas, Wedding vows); this kind of event's tune comes first. Where each tune came from: [music.md](reference/music.md).
  - Guests first see the envelope's **front, like real post**: the event's title above it, **From** top left (like a return address), a stamp and postmark with the date, and **To** in the middle.
  - A hand shows where to tap, but **a tap anywhere** opens it. It turns over, the wax seal with the initials breaks, the flap lifts, the card slides out, and the music fades in and repeats. A button at the bottom left turns it off.
  - Without the envelope, guests get a "Play music" button. Phones set to reduce movement get a quick fade.
- [x] **Who's invited (19 Nov):** a new tile on Home, also under Share › Personal invitations. Three ways to invite:
  - **Personal:** type each guest's name (or paste a list: "Maya & family, 4"); each gets their own link that can't be guessed. Their name is on the envelope, their reply is linked to them, and only these links open a private event. Send each by WhatsApp or copy it; the list shows who's been sent and who's replied.
  - **Shared:** one link to pass round. The envelope says "To Our family and friends" (or your choice).
  - **Open:** for anyone: "To Everyone, all welcome", "Teams, stalls and sponsors", or your own words.
  - **From** is on every envelope, made from the names you've given (e.g. "Ram & Gita Gurung"), or your own words.
- [x] **Clearer builder (19 Nov, evening):**
  - **Each part has its own job colour.** Boxes you type in are light, like paper. Quick choices are tinted buttons, and the one you picked turns gold.
  - **Each word box says who wrote it:** a violet edge for the AI, green for your own words, grey for ready-made.
  - **Each area has its own colour**, the same on its Home tile and its screen: Words gold, Who's invited postbox red, When and where teal, Look purple.
- [x] **Moving guidance (19 Nov, evening):**
  - A first-time **welcome** with **See what your guests get**: the real envelope with a guest's name, then the invitation, with music.
  - A **tapping hand** on the first screens (Tap one, Swipe for more, Watch, Publish when you're happy). Each one goes once it's been done.
  - **See what your guests get** on "Your invitation is ready" too, with your own event.
- [x] **Faster AI writer (19 Nov, late):** the AI now writes without "thinking" first, and the words appear in the boxes as they're written (a violet glow while it writes), instead of all at the end. If it goes quiet for 20 seconds it stops and says so; if it stops part-way, your earlier words come back.
- [x] **Every kind starts complete (19 Nov, evening):**
  - Family and celebration events start with the **envelope on**.
  - **Music** starts on where the tune plainly fits: Happy Birthday for a birthday, the Christmas tune for Christmas, Wedding vows for weddings, engagements and anniversaries. Memorials and public events start quiet.
  - With no photo yet, the photo space shows the **initials as a monogram** in the event's own colours, instead of an empty grey box.

**Done (20 Nov), from your phone, wife's and son's tests:**
- [x] **Photos page on a phone:** bigger photos on the wheel; a heart on every photo (tap it to love it), "♡ Love" under the wheel, and double-tap a photo when it's open full-size. The comment box stays short until someone starts typing.
- [x] **TV page on a phone or tablet:** the comments column only appears once there are comments (until then the photos use the whole width); on a phone or upright tablet comments run along the bottom; the photos sit below the title; a smaller QR card. "From the hosts" with a small t.
- [x] **The hand is gold** in the builder (it was white like the words), and it now guides the whole way: Check your words → Let the AI write → When you're happy (Publish) → Turn on "I've checked it" → All set: publish! → Send it.
- [x] **Anything missing glows red** with "Needed to publish", and Publish takes you straight to it.
- [x] **You're live!** after publishing: which plan you're on and for how long, "one step left: send your invitation", and "Enjoy your amazing day!"
- [x] **Moving touches around the photo** (Look › Photos › Around the photo): Glow, Ripples, Bubbles or Sparkles, in the event's colours, for the arch, heart and polaroid shapes. Weddings and anniversaries start with Glow, engagements Ripples, birthdays Bubbles, Pasni and Bratabandha Sparkles.
- [x] **Safety job:** the first night's backup didn't arrive. The job now tries again every hour until one works, and notes what happened, so Claude Code can see why. (Step 4E waits for the first backup.)

**Waiting for your decision (20 Nov):** see Claude Code's message of 20 Nov: how long free pages stay up, the festive 90 days, and which kinds of event to build for first.

**Next, Claude Code (in this order; each builds on the one before):**
1. [x] **Safety before real guests (built 19 Nov; switch it on with step 4 below):** nightly backup and a practice-restore tool, error emails, an hourly database check that also keeps the free Supabase plan awake, and the anti-spam check on sign-in.
2. [x] **Your events on every device (built 19 Nov, late):**
   - **Your events** (a button at the top of Home, in **You**, and on the first screens) lists every event in your account, coming up first, then past ones. Tap one to open it on this phone or laptop.
   - Opening another event never loses work: one not yet published, or with changes not yet live, is kept on that phone and shows as "Only on this phone" or "Changes not live yet".
   - Events you co-host show too, marked **Co-host**.
   - **On a laptop** (a wide screen), the builder sits on the left and a live preview of the invitation or page on the right, changing as you type.
3. **Edit, save and remove beside the invitation** on Home (remove asks first, and can be undone for 30 days).
4. **Co-hosts** (a mum and son building together): invite by link. The database already has co-hosts; this adds the screens.
5. **Link pictures:** each event's own picture when its link is shared on WhatsApp or Facebook, and a share-as-image button for Instagram.
6. **Install on the phone:** "Add to Home Screen" with the In2Min2 icon. No app store needed.
7. **3D-style icons** from Microsoft's free Fluent Emoji set.
8. After the real-event test: the **marketing website** with the animated "how it works", then the ads and the quiz.
9. After the tests: AI quick-fill from one sentence, an "Other" event type, "show the thank-you page now", and "What's new" notes for hosts.

**You:**
- Ask testers to mark the code email **Not junk**.
- Nothing to do for the email records: checked on 19 Nov, in2min2.com already has all three (DKIM, SPF and DMARC). Codes landing in Junk is normal for a new address; it gets better as people mark it Not junk.
- Keep collecting notes and screenshots from testers.
- New designs: see "Making designs" at the end of this file.
- More music: download tunes into the **music** folder on your Mac (Pixabay is fine; never a film song or chart hit) and tell Claude Code. See [music.md](reference/music.md).

### [ ] 1. Try Builder 2.0 on your phone, then test it with 5 people (about 40 minutes in all)

**in2min2.com/new** is now the real builder in the new look. It's hidden (not linked anywhere) and works on the same event as the classic builder, so your test event may open straight on its Home.

**Try it yourself first (15 minutes):**
1. Open **in2min2.com/new** on your phone. To start fresh, tap **You** (the round person button, top right) › **Start a new event** › **Yes, start new**. You'll see the new **welcome** first; it shows until someone taps **Let's start** on that phone.
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

**Links for testers:** **in2min2.com/new/guide** (how it works, 2 minutes) and **in2min2.com/new** (make an event). They don't need to sign in to build, preview, change the look or try the photo wheel. Signing in (an emailed code, free) is only needed for the AI writer and for publishing, and so for replies, photos and comments. Until they publish, their event stays only on their own phone.

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

### [x] 4. Switch on the safety net (done 19 Nov; only E is left, for Claude Code)

**A. ✓ Done 19 Nov.** Run the database file [0012_backup.sql](../supabase/migrations/0012_backup.sql)
1. Open the file on your Mac, select everything (Cmd+A) and copy (Cmd+C).
2. Supabase › your project › **SQL Editor** › **New query** › paste › **Run**.
3. You should see "Success. No rows returned." Tell Claude Code.

**B. ✓ Done 19 Nov.** Give the Worker the database's secret key (for the nightly backup)
1. Supabase › **Project Settings** (the cog) › **API Keys** › **Secret keys**. Copy the key that starts `sb_secret_`. If there isn't one, tap **Add new secret key** and name it `worker-backup`.
2. Cloudflare dashboard › **Workers & Pages** › **in2min2** › **Settings** › **Variables and Secrets** › **+ Add**.
3. Type: **Secret**. Variable name: `SUPABASE_SECRET_KEY`. Value: paste the key. Tap **Deploy**.
4. Never paste this key into a chat or a file.

**C. ✓ Done 19 Nov.** Say where alerts go
1. Cloudflare dashboard › **in2min2.com** › **Email** › **Email Routing** › **Destination addresses**. Check your own email address shows **Verified**.
2. **Workers & Pages** › **in2min2** › **Settings** › **Variables and Secrets** › **+ Add**. Type: **Secret**. Name: `ALERT_EMAIL`. Value: that same email address. Tap **Deploy**.
3. From then on you get an email only if something breaks, plus a short "All well" every Monday morning. Forward any alert to Claude Code.

**D. ✓ Done 19 Nov** (live in the sign-in since the push that afternoon). The anti-spam check on sign-in (Turnstile)
1. Cloudflare dashboard › **Turnstile** › **Add widget**. Name: `In2Min2 sign-in`. Hostnames: `in2min2.com`, `www.in2min2.com`, `in2min2.pksgrg.workers.dev`. Mode: **Managed**. Tap **Create**.
2. ✓ Site key received 19 Nov and built into the sign-in. Keep the **Secret key** to yourself (never in a chat).
3. Only after Claude Code says the site key is live: Supabase › **Authentication** › **Attack Protection** › turn on **Captcha protection** › provider **Turnstile** › paste the **Secret key** › **Save**. (Doing this first would stop everyone signing in.)

**E. Practice restore:** after the first night's backup, Claude Code loads it into a throwaway copy on your Mac and checks every row. Nothing for you to do.

## Before the January pilot, or before sharing links widely

**Claude Code will remind you when we reach testing with real people (owner, 17 Nov):**
- [ ] Register with the ICO (data protection fee) and add a business address for the privacy page.
- [ ] Turn on Google AI (Gemini) billing, so guests' details are covered by the paid terms.
- [ ] Approve the legal drafts.
- [ ] Then watch Supabase and Cloudflare R2 use against user numbers, and move to paid plans only when the numbers say so.

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
- **19 Nov:** music from our own licensed library, started by the guest's tap and looping with an off button; Microsoft Fluent Emoji 3D icons; the marketing site, ads and quiz after the real-event test; safety first.

## How each phase reaches you

At the end of each phase you get:
- what's new, with links;
- exactly what was tested and how;
- what wasn't tested;
- a short test to try on your own phone.

## Making designs (for you)

**Borders:** a PNG at least 1,500 pixels wide, on a see-through background, one design per file, named B9, B10… Keep the middle empty: decorations only in the outer band (about a sixth of the width on each side). Claude Code turns them into single-colour drawings that take each event's colours. Fine lines work best; solid filled shapes and shading don't survive the conversion (that's why "elegant blue-gold" and "ornate gold frame" couldn't be used as borders).

**Backgrounds:** WebP or JPG, 1,200 × 1,800 pixels (portrait), under 300 KB each, with a calmer middle where the words go. If it has its own frame painted in, say so in the file name (e.g. "…-frame-bg.webp").

**Rights:** only images you made yourself, or with a licence that allows business use. Keep a note of where each came from.
