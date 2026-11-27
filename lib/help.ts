// The help library (in2min2.com/help; owner, 27 Nov 2026): short answers to
// every "how do I…" a host asks, so people can help themselves. Plain data, no
// CMS and no library: each article is a title, a short line and a few blocks.
// Later the same articles are the answers an AI email helper may quote, so
// they must match the app exactly. Only write what is built: no gifts, menus
// or printable itineraries yet. Words: simple British English for readers
// whose first language may not be English. Button names are the real ones in
// Builder 2.0 (app/new); when a button is renamed, change its article.
//
// Inline marks in text: **bold** and [label](/path).

import { FESTIVE_UNTIL, PLANS, formatPence, plan } from "@/lib/catalog";

export const HELP_UPDATED = "27 November 2026";
export const HELP_EMAIL = "hello@in2min2.com";

export type Block =
  | { p: string }
  | { h: string }
  | { steps: string[] }
  | { list: string[] }
  | { tip: string }
  | { warn: string }
  | { table: string[][] };

export type Group = { key: string; title: string; line: string };

export type Article = {
  slug: string;
  group: string;
  title: string;
  summary: string;
  also?: string;                 // extra search words
  body: Block[] | ((now: number) => Block[]);
  related?: string[];            // slugs
};

export const GROUPS: Group[] = [
  { key: "start", title: "Getting started", line: "Your first invitation, in two minutes" },
  { key: "words", title: "Words and AI", line: "Write it, change it, in your language" },
  { key: "look", title: "Look, envelope and music", line: "Make it feel like yours" },
  { key: "day", title: "Day plan and details", line: "When, where and what happens" },
  { key: "share", title: "Sharing", line: "Publish, send and keep it private" },
  { key: "guests", title: "Replies and guests", line: "Who is coming, and what they need" },
  { key: "photos", title: "Photos on the day and after", line: "Guests' photos, the TV and keeping them" },
  { key: "plans", title: "Plans, payment and your page", line: "What's free, how long it's online, closing" },
  { key: "privacy", title: "Privacy and contact", line: "Your data, and how to reach us" },
];

const MAIL = `[${HELP_EMAIL}](mailto:${HELP_EMAIL})`;

export const ARTICLES: Article[] = [
  // ───────────── Getting started ─────────────
  {
    slug: "what-is-in2min2", group: "start", title: "What is in2min2, and how does it work?",
    summary: "A beautiful invitation and event page in about two minutes, with replies and photos in one place.",
    also: "about explain intro overview",
    body: [
      { p: "in2min2 makes organising your event simple. You answer a few quick questions, pick a look, and we write the words for you. You then share **one link** on WhatsApp, Viber, text or email." },
      { h: "What your guests get" },
      { list: [
        "An invitation they open on any phone. No app and no account.",
        "A reply in one tap: yes, maybe or no, how many are coming, and a message.",
        "The date, time, directions and day plan on the same page.",
        "On the day and after: everyone's photos, comments and a thank-you page.",
      ] },
      { h: "What you get" },
      { list: [
        "Every reply counted and numbered in one place.",
        "Food needs and totals you can copy for the caterer.",
        "A page you can change at any time, with the same link.",
      ] },
      { p: "It is free to start. Read [Make your first invitation in 2 minutes](/help/first-invitation) next." },
    ],
    related: ["first-invitation", "which-kind", "plans-and-prices"],
  },
  {
    slug: "first-invitation", group: "start", title: "Make your first invitation in 2 minutes",
    summary: "Pick your kind of event, answer a few questions, check the words and publish.",
    also: "begin create new start tutorial",
    body: [
      { steps: [
        "Open [in2min2.com/new](/new) and tap what you are celebrating, for example **Birthday** or **Wedding**.",
        "Answer the quick questions. Most are taps: who it is for, the date, the place.",
        "Tap **Invitation words**. The words are written for you. Read them, and change anything you like.",
        "Tap **Look** to choose colours, a border and your photo.",
        "Tap **Preview** (the little card at the bottom) to see exactly what guests will see.",
        "When you are happy, tap **Publish**, then **Share**.",
      ] },
      { tip: "You do not need an account to start or to preview. You sign in when you publish or use the AI writer." },
      { p: "Your draft is saved on your phone as you go. You can leave and come back." },
    ],
    related: ["sign-in", "write-with-ai", "publish-your-invitation", "preview-as-guest"],
  },
  {
    slug: "account-needed", group: "start", title: "Do I need an account to start?",
    summary: "No. You only sign in when you publish or use the AI writer. Guests never need one.",
    also: "register login sign up guests account",
    body: [
      { p: "You can open the builder, answer the questions, change the look and preview your invitation **without signing in**." },
      { p: "You sign in when you:" },
      { list: ["use the AI writer", "publish your page", "look at replies or photos"] },
      { p: "There is no password. We email you a code (see [Sign in with an email code](/help/sign-in))." },
      { p: "**Your guests never need an app or an account.** They open your link and reply." },
    ],
    related: ["sign-in", "first-invitation"],
  },
  {
    slug: "sign-in", group: "start", title: "Sign in with an email code (what to do if it doesn't arrive)",
    summary: "We email you a 6-digit code. No password to remember.",
    also: "login code email not received spam promotions captcha",
    body: [
      { steps: [
        "Tap **Sign in**. Type your email address.",
        "If a small box asks you to prove you are a person, tick it.",
        "We email you a **6-digit code**. Type it in.",
      ] },
      { h: "If the code doesn't arrive" },
      { list: [
        "Wait a minute, then look in **Spam**, **Junk** and **Promotions**.",
        "Check you typed your email address correctly. Tap **Use another email** to try again.",
        "Ask for a new code. An old code stops working when a new one is sent.",
        "Still nothing? Write to " + MAIL + " and tell us the email you used.",
      ] },
      { tip: "Always use the same email address. Your events are kept under it." },
    ],
    related: ["account-needed", "contact-us"],
  },
  {
    slug: "which-kind", group: "start", title: "Which kind of event should I pick?",
    summary: "Pick the nearest one. Each kind has its own questions, colours and ready-made words.",
    also: "diwali eid holi vaisakhi lunar new year type category choose",
    body: [
      { p: "Pick the kind that is closest to your day. It sets suggested colours, questions and words. You can change it later in **Settings**." },
      { table: [
        ["If your event is…", "Pick"],
        ["A birthday of any age", "Birthday"],
        ["A wedding, mehndi, sangeet or reception", "Wedding"],
        ["A baby's first rice (Pasni or Annaprashan)", "Pasni"],
        ["A puja, naming ceremony or blessing", "Family ceremony"],
        ["A funeral or memorial", "Memorial"],
        ["Diwali, Eid, Vaisakhi, Holi or Lunar New Year at home", "Party"],
        ["A big community celebration or festival", "Mela / festival or Community"],
      ] },
      { p: "You can see each kind on its own page: [wedding](/wedding), [birthday](/birthday), [pasni](/pasni), [memorial](/memorial) and more." },
      { tip: "Changing the kind keeps your names, dates and words. It only changes the suggested colours and switches." },
    ],
    related: ["first-invitation", "private-or-google"],
  },

  // ───────────── Words and AI ─────────────
  {
    slug: "write-with-ai", group: "words", title: "How to write your invitation words with AI",
    summary: "Choose a language and a tone, tap Let the AI write, then check every word.",
    also: "artificial intelligence generate text writer",
    body: [
      { steps: [
        "On Home, tap **Invitation words**.",
        "Choose the **Language**, then the **Tone**, for example warm or formal.",
        "Tap **Let the AI write**. The words appear one box at a time.",
        "Read every box. Change anything that isn't right.",
        "Tap **Done**.",
      ] },
      { p: "Not happy with one sentence? Tap a quick choice such as **Shorter**, **Warmer**, **More formal** or **More fun**, and the AI rewrites just that part." },
      { warn: "Always read the words before you publish. The AI can make mistakes with names, dates and cultural wording." },
      { p: "Each plan includes a number of AI writes. The [plans page](/help/plans-and-prices) shows how many." },
    ],
    related: ["write-your-own", "language-choice", "who-wrote-it"],
  },
  {
    slug: "write-your-own", group: "words", title: "Change or write the words yourself",
    summary: "Every box is yours to edit. Type your own words at any time.",
    also: "edit text type own writing",
    body: [
      { steps: [
        "Tap **Invitation words**.",
        "Tap any box and type. You can delete the AI's words and write your own.",
        "Tap **Done**. Your changes show in the little card straight away.",
      ] },
      { tip: "Your own words are never overwritten unless you tap **Let the AI write** again." },
      { p: "You can also pick **A blessing at the top**, or write **Your own line at the top**, for example a prayer or a favourite saying." },
    ],
    related: ["write-with-ai", "who-wrote-it"],
  },
  {
    slug: "language-choice", group: "words", title: "Choose a language, or use two languages",
    summary: "English and Nepali are ready. Choose English, your language, or both on one invitation.",
    also: "nepali hindi punjabi gujarati bengali tamil tagalog polish translate bilingual",
    body: [
      { steps: [
        "Tap **Invitation words**.",
        "Under **Language**, choose **English**, **Your language** or **Both**.",
        "If you choose your language, pick it from the list.",
        "Tap **Let the AI write**.",
      ] },
      { p: "**Ready now:** English and Nepali (in Nepali script or in English letters)." },
      { p: "**In beta:** Hindi, Punjabi, Gujarati, Bengali, Tamil, Tagalog and Polish. Beta means they are good but not perfect, so please ask someone who knows the language to read the words." },
    ],
    related: ["write-with-ai", "write-your-own"],
  },
  {
    slug: "who-wrote-it", group: "words", title: "Why does it say who wrote each box (AI, you, ready-made)?",
    summary: "A small label shows if the words came from the AI, from you, or were ready-made.",
    also: "colour label violet green grey",
    body: [
      { p: "Each box on **Invitation words** has a small label so you always know where the words came from:" },
      { list: [
        "**Violet: written by the AI.** Please read it.",
        "**Green: written by you.**",
        "**Grey: ready-made words** that come with your kind of event.",
      ] },
      { p: "Nothing is published until you tap Publish, so you always have the last word." },
    ],
    related: ["write-with-ai", "write-your-own"],
  },

  // ───────────── Look, envelope and music ─────────────
  {
    slug: "colours-and-style", group: "look", title: "Change the colours and style",
    summary: "In Look you can change colours, background, border, letters and layout.",
    also: "theme design palette font border background layout",
    body: [
      { steps: [
        "On Home, tap **Look**.",
        "Pick a part: **Colours**, **Background**, **Border**, **Letters**, **Layout** or **Movement**.",
        "Tap a choice. The little card at the bottom changes straight away.",
        "Tap **Done**.",
      ] },
      { p: "Under **Colours** you can pick a suggested set, or choose **Your own colour**." },
      { tip: "The guest page uses your colours, so an invitation can match your outfit, your theme or your flag." },
    ],
    related: ["add-photo", "envelope-settings", "preview-as-guest"],
  },
  {
    slug: "add-photo", group: "look", title: "Add your photo and choose its shape",
    summary: "Add a photo in Look, then pick a shape such as arch, heart or polaroid.",
    also: "picture image upload frame",
    body: [
      { steps: [
        "Tap **Look**, then **Photos at the top**.",
        "Add a photo from your phone. You can add more than one.",
        "Choose how the photos change and how the photo fits.",
        "Under **Photo style**, choose a shape, for example arch, heart or polaroid.",
        "Under **Around the photo**, choose a decoration if you like.",
      ] },
      { tip: "If you add no photo, the invitation shows a monogram of your initials on your colours." },
      { warn: "Only add photos you have the right to use. For children, make sure a parent or guardian agrees." },
    ],
    related: ["colours-and-style", "private-or-google"],
  },
  {
    slug: "envelope-settings", group: "look", title: "Turn the envelope on or off, and change its colour",
    summary: "Guests can open an envelope with their name on it before they see the invitation.",
    also: "seal stamp flap opening animation",
    body: [
      { steps: [
        "Tap **Look**, then **Envelope**.",
        "Switch **Open with an envelope** on or off.",
        "Choose an **Envelope colour**.",
        "Under **Round the envelope**, choose a pattern, or keep it plain.",
      ] },
      { p: "The envelope has your names on the stamp. With a personal link, the guest's own name is on the envelope." },
      { p: "To change who it is **From** and **To**, tap **Who's invited**." },
    ],
    related: ["music", "personal-links"],
  },
  {
    slug: "music", group: "look", title: "Choose music (and why it starts after a tap)",
    summary: "Pick a gentle tune under Look › Music. It plays once the guest taps.",
    also: "song sound audio tune play",
    body: [
      { steps: ["Tap **Look**, then **Music**.", "Pick a tune from the list.", "To have no music, choose the option that says so, or leave music off."] },
      { p: "Phones do not allow a page to make a sound until the guest has touched the screen. That is why the music starts when the guest taps the envelope." },
      { tip: "If the phone is on silent, guests won't hear it. That is normal." },
    ],
    related: ["envelope-settings", "preview-as-guest"],
  },
  {
    slug: "preview-as-guest", group: "look", title: "See what guests will see before you publish",
    summary: "Tap Preview to see the invitation and the full page as a guest does.",
    also: "test check demo",
    body: [
      { steps: [
        "Tap the little card at the bottom, marked **Preview**.",
        "You see **What guests see**: the full page, then **Card only** for just the invitation.",
        "Scroll to check the time, place, day plan and the reply form.",
      ] },
      { p: "On a laptop the preview sits beside the builder and changes as you type." },
      { tip: "Look at it on your phone too, and ask someone else to open it before you share it widely." },
    ],
    related: ["publish-your-invitation"],
  },

  // ───────────── Day plan and details ─────────────
  {
    slug: "date-time-place", group: "day", title: "Add the date, time and place",
    summary: "In When and where, add the date, start and end time, the venue and parking.",
    also: "venue address map directions postcode parking",
    body: [
      { steps: [
        "On Home, tap **When and where**.",
        "Under **When**, tap a quick date or choose **The date**. Add a **Start time** and an **End time**.",
        "Under **Where**, type **The place's name** and its **Address and postcode**.",
        "Choose the **Parking** option and add a note if helpful.",
        "Tap **Done**.",
      ] },
      { p: "Guests get a **Directions** button that opens the map on their phone." },
      { tip: "Always add the postcode. It makes the map exact." },
    ],
    related: ["running-order", "limit-guests", "add-to-calendar"],
  },
  {
    slug: "running-order", group: "day", title: "Add a running order for the day",
    summary: "List what happens when. Mark meals and add dishes.",
    also: "schedule programme timetable agenda menu dishes food plan",
    body: [
      { steps: [
        "On Home, tap **Day plan**.",
        "Tap a suggested step to add it, or use **Quick add**.",
        "For each step choose the **Time** and **What**. You can add the place, a different date, or a short note.",
        "Switch on **It's a meal** to add the dishes. Tap **Popular dishes** for ideas.",
        "Tap **Done**.",
      ] },
      { p: "Guests see the running order in time order. For a wedding with several days, give each step its own date." },
      { tip: "Switch **Running order** and **Food menu** on or off in **Settings**." },
    ],
    related: ["date-time-place", "food-needs"],
  },
  {
    slug: "announce-news", group: "day", title: "Tell guests news on the day (Announce)",
    summary: "Post a short update, such as running late, the car park is full, or a weather plan.",
    also: "update message notice late weather parking",
    body: [
      { steps: [
        "Publish your page first.",
        "On Home, tap **Announce**.",
        "Choose **What kind** of update it is.",
        "Type your update and post it.",
      ] },
      { p: "Guests see your update on your page. Keep it short and clear." },
      { tip: "The bell at the top shows reminders for you, such as a nudge three days before the event." },
    ],
    related: ["publish-your-invitation"],
  },

  // ───────────── Sharing ─────────────
  {
    slug: "publish-your-invitation", group: "share", title: "Publish your invitation and get your link",
    summary: "Tap Publish, check the list, then publish. Your link never changes after that.",
    also: "go live update change edit after publishing link web address",
    body: [
      { steps: [
        "On Home, tap **Publish**. You see **Check and publish**.",
        "Fix anything marked in red. Tick that you have checked the page.",
        "Tap **All set: publish!** You are live.",
        "Tap **Share** to send your link.",
      ] },
      { h: "Changing it afterwards" },
      { p: "You can change anything at any time: the time, the place, the words. Make your change, then tap **Update my page**. **The link stays the same**, so nobody needs a new one." },
      { warn: "If you change the kind of event after publishing, the web address changes when you update. Share the new link." },
    ],
    related: ["share-apps", "preview-as-guest", "sign-in"],
  },
  {
    slug: "share-apps", group: "share", title: "Share on WhatsApp, Viber, text or email",
    summary: "Use Share, then Send it. Pick WhatsApp, Viber, text, email or Messenger.",
    also: "send whatsapp viber sms messenger facebook copy link",
    body: [
      { steps: [
        "Tap **Share** (after you publish).",
        "Under **Send it**, tap **WhatsApp**, or choose another app under **Or send it with**: Viber, Text, Email, Facebook, Messenger or **More**.",
        "The message is ready to send. Choose your group or person and send.",
      ] },
      { p: "**Copy link** puts the link on your phone so you can paste it anywhere." },
      { p: "Under **Later, send these** you find ready-made messages for reminders and the thank-you." },
      { tip: "Facebook is not offered for private events. Messenger shows only on phones." },
    ],
    related: ["qr-code", "personal-links", "private-or-google"],
  },
  {
    slug: "qr-code", group: "share", title: "Use the QR code on a printed card or poster",
    summary: "Print the QR code so guests can point their phone at it to open your page.",
    also: "scan print poster card",
    body: [
      { steps: ["Tap **Share**.", "Tap **QR code**.", "Print it, or save a picture of it, and add it to a card, a poster or a sign."] },
      { p: "Guests point their phone camera at the code to open the page. There is nothing to install." },
      { tip: "Print it at least 3 cm wide, in dark on light. Test it with your own phone first." },
    ],
    related: ["share-apps", "tv-and-table-cards"],
  },
  {
    slug: "personal-links", group: "share", title: "Send a personal link to each guest",
    summary: "Each guest gets their own link, with their name on the envelope.",
    also: "invite names envelope named guests token",
    body: [
      { steps: [
        "Tap **Who's invited**, then choose **Personal**.",
        "Open **Personal invitations**.",
        "Type each guest's name as it should be on the envelope, or paste several, **one per line**.",
        "Send each guest their own link on WhatsApp or copy it.",
      ] },
      { p: "Their reply is joined to their name, so you know who has answered." },
      { warn: "Ask guests not to forward their own link. Anyone who opens it can reply as that guest." },
      { p: "Other ways to invite: **Shared** (one link for family and friends) and **Open** (anyone)." },
    ],
    related: ["share-apps", "private-or-google", "envelope-settings"],
  },
  {
    slug: "private-or-google", group: "share", title: "Make your page private, or show it on Google",
    summary: "Private means only guests with their own link. Show on Google is an optional switch.",
    also: "search seo visible public hide indexed",
    body: [
      { p: "Both are switches in **Settings**." },
      { h: "Private event" },
      { p: "Only guests with their own **personal link** can open the page. A shared link will not work. Good for family events." },
      { h: "Show on Google" },
      { p: "Off unless you choose it. When on, anyone can find your page by searching, with its date and place shown in Google's event listings. It can be a good way to connect family and friends at home and abroad, or to fill a community day." },
      { list: [
        "Never available for a private event.",
        "Guests' photos are never shown on Google.",
        "Personal links are never shown on Google.",
      ] },
      { warn: "Leave it off if your page has a child's name or your home address." },
    ],
    related: ["personal-links", "photos-wall", "privacy-summary"],
  },

  // ───────────── Replies and guests ─────────────
  {
    slug: "how-guests-reply", group: "guests", title: "How guests reply (Yes, No, Maybe)",
    summary: "Guests tap Yes, Maybe or No, say how many are coming, and may leave a message.",
    also: "rsvp response answer",
    body: [
      { p: "On your page, guests see the reply form. They:" },
      { list: ["tap **Yes**, **Maybe** or **No**", "say how many people are coming", "can add a message", "can tick any food needs"] },
      { p: "After a Yes they can **Add to calendar**." },
      { tip: "You can switch Replies off in **Settings** if you do not need them." },
    ],
    related: ["see-replies", "food-needs", "add-to-calendar"],
  },
  {
    slug: "see-replies", group: "guests", title: "See who is coming and copy the list",
    summary: "Replies shows every reply, numbered, with totals. Copy the list for the caterer or venue.",
    also: "guest list count total numbered reminder remove",
    body: [
      { steps: [
        "On Home, tap **Replies**.",
        "At the top you see how many are coming, **Days to go** and **Places left**.",
        "Scroll to read each reply. No. 1 is the first reply in.",
        "Tap **Copy the list**, then paste it in a message or document.",
      ] },
      { p: "Tap **Send a reminder** to nudge guests who haven't replied, and **Refresh** to see new replies." },
      { p: "To remove a reply, open it and tap **Yes, remove**." },
    ],
    related: ["food-needs", "limit-guests"],
  },
  {
    slug: "food-needs", group: "guests", title: "Ask about food needs (vegetarian, halal, allergies and so on)",
    summary: "Guests tick their needs when they reply. You see totals and each person's needs.",
    also: "diet vegan vegetarian halal gluten nut allergy dairy caterer",
    body: [
      { p: "Guests can tick: vegetarian, vegan, halal, gluten-free, nut allergy or dairy-free." },
      { p: "In **Replies** you see the **Food needs** totals, and each guest's needs in their reply. **Copy the list** includes them for your caterer." },
      { h: "Turn it off" },
      { p: "Go to **Settings**. Under **Replies (RSVP)** switch off **Ask about food needs**. It is off by default for memorials." },
      { tip: "A nut allergy is marked clearly so it isn't missed." },
    ],
    related: ["see-replies", "running-order"],
  },
  {
    slug: "limit-guests", group: "guests", title: "Limit how many people can come",
    summary: "Two limits matter: your plan's people limit, and the venue's safe capacity.",
    also: "capacity waiting list full maximum places",
    body: [
      { h: "The venue's safe capacity" },
      { p: "On **When and where**, fill in **The venue's safe capacity**. When it is reached, replies stop and a waiting list takes over." },
      { h: "Your plan's people limit" },
      { p: "Each plan allows a number of people (see [What is free, and what do the paid plans add?](/help/plans-and-prices)). If you need more, you can add **+100 people** packs once paying opens." },
    ],
    related: ["date-time-place", "plans-and-prices", "see-replies"],
  },
  {
    slug: "add-to-calendar", group: "guests", title: "Guests can add the event to their calendar",
    summary: "An Add to calendar button is on your page and after a Yes. It includes a day-before reminder.",
    also: "ics reminder google apple outlook",
    body: [
      { p: "Guests see **Add to calendar** on your page and after they tap Yes. It works with Apple, Google and Outlook calendars." },
      { p: "The calendar entry has the date, time and place, and a **reminder the day before**." },
      { tip: "If you change the date or time, tell guests. A calendar entry they saved earlier will not update itself." },
    ],
    related: ["date-time-place", "how-guests-reply"],
  },

  // ───────────── Photos ─────────────
  {
    slug: "photos-wall", group: "photos", title: "Let guests share photos and comments",
    summary: "A photo wall opens on the day. Guests add photos from their phone, with no app.",
    also: "upload gallery wall comments cheers moderate approve hide remove",
    body: [
      { p: "Photos open at midnight on the day of your event. To let guests add them earlier, open **Photos** and switch on **Let guests add photos before the day**." },
      { steps: [
        "Tap **Photos** on Home to see what has been added.",
        "Switch on **Check each photo before it shows** if you want to approve first. Good for community events and memorials.",
        "Tap **Copy the photo link** or **Send the photo link on WhatsApp** to ask guests to add theirs.",
      ] },
      { p: "Every photo has a **Please remove this photo** button for guests in it. You see those under **Asked to be removed**." },
      { p: "You can hide a photo, remove it, or make it a favourite so it comes round the wheel more often." },
      { p: "Comments and cheers have their own section, with **Check words before they show**." },
    ],
    related: ["tv-and-table-cards", "photos-kept", "plans-and-prices"],
  },
  {
    slug: "tv-and-table-cards", group: "photos", title: "Show photos on a TV with a QR code",
    summary: "Open the TV wheel or slideshow on a laptop or smart TV, and print table cards.",
    also: "wheel slideshow screen big projector table cards print",
    body: [
      { steps: [
        "Open **Photos**, then find **On the day**.",
        "Tap **TV wheel** (photos turning in the sky) or **TV slideshow** (one photo at a time).",
        "Plug a laptop into the venue's TV, or open the link in a smart TV's browser. Press **Full screen**.",
        "Tap **Print table cards** for cards with a QR code, four to a page. Guests scan to add photos.",
      ] },
      { p: "New photos and comments appear on the screen as guests add them." },
      { tip: "Try it at home first. Check the venue's wifi on the day." },
    ],
    related: ["photos-wall", "qr-code"],
  },
  {
    slug: "photos-kept", group: "photos", title: "How long are photos kept, and how do I save them?",
    summary: "They stay while your page is online. Save the ones you want before your page closes.",
    also: "download keep delete storage expire",
    body: [
      { p: "Photos stay while your page is online. Your plan sets how long that is: see [How long does my page stay online?](/help/how-long-online)." },
      { p: "When your page closes, guests' photos and details are deleted 30 days later. They cannot be brought back after that." },
      { h: "Saving photos" },
      { p: "Open any photo and tap **Save this photo**. You can save them one by one." },
      { warn: "Save the photos you want before your page closes." },
      { p: "Need all of them at once? Write to " + MAIL + " before your page closes and tell us your event." },
    ],
    related: ["how-long-online", "delete-event-account", "photos-wall"],
  },

  // ───────────── Plans, payment and your page ─────────────
  {
    slug: "plans-and-prices", group: "plans", title: "What is free, and what do the paid plans add?",
    summary: "Free is free for ever. Paid plans add more people and photos, and keep your page online longer.",
    also: "price cost pay free upgrade season keepsake half-year pack people",
    body: (now) => {
      const free = plan("popup"); const festive = plan("festive");
      const paid = PLANS.filter((p) => ["season", "half_year", "keepsake"].includes(p.key));
      const row = (p: typeof free) => [p.name, p.pricePence ? formatPence(p.pricePence) : "Free", String(p.guestLimit), String(p.photoLimit)];
      const ai = [free, ...paid].map((p) => `${p.name} ${p.aiWrites}`).join(", ");
      return [
        ...(now < FESTIVE_UNTIL ? [{ p: `**Until 31 January 2027, every family event is free** with up to ${festive.guestLimit} people and ${festive.photoLimit} photos, online until 90 days after your event.` }] : []),
        { p: "**Memorials are always free.**" },
        { table: [["Plan", "Price", "People", "Photos"], row(free), ...paid.map(row)] },
        { p: `**AI writes included:** ${ai}. How long each plan keeps your page online is in [How long does my page stay online?](/help/how-long-online).` },
        { p: `Need more people? Each extra 100 people is ${formatPence(free.packPence ?? 300)}.` },
        { p: "Paid plans are one payment for one event. There is nothing to renew or cancel." },
        { warn: "Paying opens in February 2027. Until then every page is free." },
        { p: "Community events (melas, tournaments) have their own plan with a small booking fee. It is coming soon." },
      ];
    },
    related: ["how-long-online", "refunds", "limit-guests"],
  },
  {
    slug: "how-long-online", group: "plans", title: "How long does my page stay online, and how do I close it early?",
    summary: "It depends on your plan. You can close it yourself at any time.",
    also: "close early expire reopen end finish remove offline",
    body: (now) => [
      ...(now < FESTIVE_UNTIL ? [{ p: "Until 31 January 2027, a family page stays online until **90 days after your event**, free." }] : []),
      { list: [
        `**Free plan:** ${plan("popup").duration} from the day you publish.`,
        "**Season:** 90 days after the event.",
        "**Half-Year:** 6 months after the event.",
        "**Keepsake:** 12 months after the event.",
        "**Memorials:** 90 days after the event.",
      ] },
      { p: "Open **Settings**, then **Your page online**, to see the exact date." },
      { h: "Close it early" },
      { steps: ["Open **Settings**.", "Under **Your page online**, tap **Close the page now**.", "Tap **Yes, close it now**."] },
      { p: "Guests who open the link then see **This page is now closed**." },
      { h: "Open it again" },
      { p: "Tap **Open it again**. You can do this **within 30 days of closing, and only while your plan's time has not run out**. After that it cannot be reopened." },
      { warn: "Once a page has closed for good, guests' details and photos are deleted and cannot be brought back." },
    ],
    related: ["photos-kept", "plans-and-prices", "delete-event-account"],
  },
  {
    slug: "refunds", group: "plans", title: "How do I pay, and what is the refund rule?",
    summary: "Payments are taken by Stripe, opening February 2027. Refunds are for genuine cases: write to us.",
    also: "payment card stripe money back cancel cooling off 14 days",
    body: [
      { warn: "Paying opens in February 2027. Until then every page is free." },
      { h: "Paying" },
      { p: "You pay once for one event, by card, Apple Pay or Google Pay. Payments are taken securely by **Stripe**. We never see your card number. You see the price before you pay." },
      { h: "Refunds" },
      { p: `If something has gone wrong, write to ${MAIL}. Please tell us what happened and attach anything that helps, such as a screenshot, your receipt or the order email. We look at every request and refund genuine cases.` },
      { p: "This does not affect your legal rights as a consumer." },
    ],
    related: ["plans-and-prices", "contact-us"],
  },
  {
    slug: "delete-event-account", group: "plans", title: "Delete my event or my account, and what happens to guests' data",
    summary: "When an account is closed, everything is deleted. Write to us and we do it.",
    also: "remove erase data gdpr close account forget",
    body: [
      { p: "You can delete your event, or your whole account, at any time." },
      { h: "How" },
      { p: `Write to ${MAIL} from the email address you sign in with. Say whether you want one event or the whole account deleted. We confirm by email when it is done.` },
      { h: "What is deleted" },
      { list: [
        "Your event pages, words, photos and settings.",
        "Guests' replies, names, messages, food needs and photos.",
        "Your account and email address.",
      ] },
      { p: "Once an account is closed we do not keep any of it. UK data protection law does not let us keep personal data longer than we need it." },
      { h: "What we may still hold" },
      { list: [
        "**Payment records**, such as invoices, which the law requires us to keep for tax (6 years). These stay with our payment company, Stripe, and hold no guest information.",
        "**Backups**, which clear automatically within 30 days.",
      ] },
      { warn: "Deleting cannot be undone. Save any photos you want first." },
    ],
    related: ["photos-kept", "how-long-online", "privacy-summary"],
  },

  // ───────────── Privacy and contact ─────────────
  {
    slug: "privacy-summary", group: "privacy", title: "Privacy: what we keep and who can see it",
    summary: "We keep what we need to run your event, and delete it on a timetable.",
    also: "data protection gdpr ico cookies safe secure",
    body: [
      { list: [
        "Only people you send the link to can open your page, unless you switch on **Show on Google**.",
        "Guests' details and photos are visible to you, and your co-hosts. Never to other hosts.",
        "Guests' details and photos are deleted 30 days after your page closes.",
        "Payment records are kept for tax. Backups clear within 30 days.",
        "We use what you add only to run your event, and never in our own advertising unless you say yes.",
      ] },
      { p: "Read the full [privacy notice](/privacy) and the [terms](/terms)." },
      { p: `Questions about your data? Write to ${MAIL}.` },
    ],
    related: ["delete-event-account", "private-or-google", "contact-us"],
  },
  {
    slug: "contact-us", group: "privacy", title: "Contact us",
    summary: "Use the form, or email us. A real person replies.",
    also: "email help support message phone",
    body: [
      { p: "Use the [contact form](/contact), or email " + MAIL + "." },
      { p: "Please tell us:" },
      { list: ["the email address you sign in with", "the name of your event", "what you were trying to do"] },
      { p: "We reply by email. Please check your spam folder if you hear nothing." },
    ],
    related: ["report-problem", "refunds"],
  },
  {
    slug: "report-problem", group: "privacy", title: "Report a problem",
    summary: "Tell us what happened, and what you saw, so we can fix it quickly.",
    also: "bug error broken not working fault",
    body: [
      { p: "Send us a message through the [contact form](/contact). The more we know, the faster we fix it." },
      { list: [
        "What you tapped, and what you expected.",
        "What happened instead, and any message on the screen.",
        "Your phone and browser, for example iPhone, Safari.",
        "A screenshot, if you can.",
      ] },
      { tip: "Try closing the page and opening it again first. Often that fixes it." },
    ],
    related: ["contact-us"],
  },
];

export function articleOf(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
export function bodyOf(a: Article, now: number): Block[] {
  return typeof a.body === "function" ? a.body(now) : a.body;
}
export function groupOf(key: string): Group {
  return GROUPS.find((g) => g.key === key) ?? GROUPS[0];
}
// Plain text of a block list, for structured data and search.
export function plainText(blocks: Block[]): string {
  const strip = (s: string) => s.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return blocks.map((b) =>
    "p" in b ? strip(b.p) : "h" in b ? strip(b.h) : "steps" in b ? b.steps.map(strip).join(" ") : "list" in b ? b.list.map(strip).join(" ")
      : "tip" in b ? strip(b.tip) : "warn" in b ? strip(b.warn) : b.table.map((r) => r.join(" ")).join(" ")).join(" ");
}
