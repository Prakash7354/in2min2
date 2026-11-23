// The website's page for each kind of event (owner, 23 Nov 2026: "yes, build
// the event pages; more coverage is better"), at in2min2.com/{type}, above
// the guests' own pages at /{type}/{slug}. Written for people, and for search
// engines and AI assistants answering questions like "online Pasni
// invitation". Simple British English; only what's built (the samples are the
// builder's own, lib/site-samples.ts). The owner checks the cultural wording.

export type KindPage = {
  type: string;            // the event type: the address and the builder's ?type=
  name: string;            // short, for links
  title: string;           // the browser tab and search result
  description: string;     // the search result's line
  kicker: string;
  h1: string;
  intro: string;
  points: [string, string][];
  questions: { q: string; a: string }[];
  related: string[];
  photo?: string;          // a site photo for the top, beside the invitation
  noFree?: true;           // the page answers "is it free" itself
};

const NEPALI = "Yes. The AI writer drafts the words in Nepali script or in English letters, and one invitation can show English and Nepali together.";
const LANGS = "Yes. The AI writer drafts the words in English and Nepali (Nepali script or English letters), with Hindi, Punjabi, Gujarati, Bengali, Tamil and more in beta, and one invitation can show two languages.";
const TICKETS = "Not yet. Online tickets, parking passes and business stalls arrive in February 2027. You can make the page and share the programme now.";

export const KIND_PAGES: KindPage[] = [
  {
    type: "birthday", name: "Birthdays",
    title: "Online birthday invitations with replies and photos | in2min2",
    description: "Make a birthday invitation on your phone in two minutes, free. Guests reply in one tap, see the plan and directions, and share photos on the day.",
    kicker: "Birthdays", h1: "Birthday invitations, ready in two minutes",
    intro: "From a first birthday to a 60th, make a bright invitation and party page on your phone. Send one link on WhatsApp, and every reply comes back to you, counted and numbered.",
    points: [
      ["Any age, any style", "Tap 1st, 18th, 50th or any other age. Pick balloons, confetti, or something calm and classic."],
      ["Happy Birthday music", "Guests open an envelope with their name on it, and the music starts with a tap."],
      ["The party plan", "Guests arrive, games, food, cake: a plan with times, and a menu if you’re serving food."],
      ["Everyone’s photos", "Guests add photos on the day, and they turn on a photo wheel. Put it on the TV for everyone."],
    ],
    questions: [
      { q: "Can I make a surprise party invitation?", a: "Yes. Only people you send the link to can see it, so just don’t send it to the birthday star. For more privacy, make the event private and give each guest their own link." },
      { q: "Is it good for children’s parties?", a: "Yes. Parents get the invitation on their phone, reply with how many are coming, and can tell you about food needs such as a nut allergy." },
    ],
    related: ["party", "anniversary", "pasni"],
  },
  {
    type: "pasni", name: "Pasni",
    title: "Pasni and Annaprashan invitations online (rice feeding ceremony) | in2min2",
    description: "Make a Pasni or Annaprashan invitation on your phone, free, in English, Nepali or Hindi. A day plan with puja, rice feeding and blessings, replies with food needs, and photos.",
    kicker: "Pasni and Annaprashan (rice feeding)", h1: "Pasni and Annaprashan invitations",
    intro: "Invite family and friends to your baby’s first rice: a Pasni, Annaprashan or rice-feeding ceremony. Make a beautiful invitation on your phone in two minutes, in English, Nepali or Hindi, and send one link to everyone, near and far.",
    points: [
      ["Ready for the day", "The plan is ready: guests arrive, puja, rice feeding, lunch, then tika and blessings. Change anything with a tap."],
      ["Traditional looks", "Rich sindoor red and gold, painted frames or soft colours, with your baby’s photo in an arch, heart or polaroid."],
      ["Nepali food menu", "Add the lunch menu in a few taps: momo, dal bhat, goat curry, sel roti, kheer and more."],
      ["Blessings from far away", "Relatives who can’t come can send a message with their reply, and see the photos afterwards."],
    ],
    questions: [
      { q: "When is a Pasni held?", a: "Many families hold the Pasni (also called Annaprashan) when the baby is about six months old for a boy, or five months for a girl, on a date the family priest suggests." },
      { q: "Can I write the invitation in Nepali or Hindi?", a: LANGS },
      { q: "Can guests tell me if they’re vegetarian?", a: "Yes. When they reply, guests can tick vegetarian, vegan, halal, gluten-free, nut allergy or dairy-free, and you see the totals for the kitchen." },
    ],
    related: ["bratabandha", "ceremony", "birthday"],
  },
  {
    type: "bratabandha", name: "Bratabandha",
    title: "Bratabandha invitation online, in English and Nepali | in2min2",
    description: "Make a Bratabandha invitation in English and Nepali, free. A day plan with puja and tika, replies with numbers and food needs, and photos for the whole family.",
    kicker: "Bratabandha", h1: "Bratabandha invitations, in English and Nepali",
    intro: "Invite the family to this important day for your son. Make a Bratabandha invitation on your phone in two minutes, with the plan for the day, the place and directions, all on one link.",
    points: [
      ["The day in order", "Puja, the Bratabandha ceremony, lunch, then tika and blessings, with times guests can follow."],
      ["Words that fit", "Ready-made words for a sacred day, or let the AI write them in English and Nepali. You check every word."],
      ["An early start", "Many ceremonies start early. A ready-made reminder message for the day before helps everyone arrive on time."],
      ["Photos from everyone", "Uncles, aunts and cousins add their photos, so you have the whole day in one gallery."],
    ],
    questions: [
      { q: "What is a Bratabandha?", a: "Bratabandha is a Hindu coming-of-age ceremony for boys, when they receive the sacred thread (janai). Families invite relatives for the puja, a meal and blessings." },
      { q: "Can relatives in Nepal see it?", a: "Yes. The link opens on any phone, anywhere in the world. Guests don’t need an app or an account." },
      { q: "Can I write the invitation in Nepali?", a: NEPALI },
    ],
    related: ["pasni", "ceremony", "wedding"],
  },
  {
    type: "ceremony", name: "Family ceremonies",
    title: "Invitations for pujas and family ceremonies | in2min2",
    description: "Invite family to a puja, a naming ceremony (Namkaran or Nwaran), a house blessing or any family ceremony. The day plan, directions, replies and photos on one link, free.",
    kicker: "Family ceremonies", h1: "Invitations for pujas and family ceremonies",
    intro: "A puja, a naming ceremony (Namkaran or Nwaran), a house blessing, a Satyanarayan katha or a special family prayer: make an invitation that suits the occasion, with the plan for the day and the way to get there.",
    points: [
      ["The right plan", "Guests arrive, puja, lunch, then tika and blessings, with times, ready to change."],
      ["Calm, traditional looks", "Soft colours or red and gold, with a photo of the family or the place."],
      ["One link for everyone", "Send it on WhatsApp, Viber or by text. Elders can read it in Nepali, and Hindi, Punjabi or Gujarati in beta."],
      ["Replies you can count", "See who is coming and how many, numbered, with any food needs, so the kitchen knows how much to cook."],
    ],
    questions: [
      { q: "Which ceremonies can I use it for?", a: "Any family ceremony: a puja, a naming ceremony, a house blessing and more. Give it your own name and change the day plan to match." },
      { q: "Can I keep it to family only?", a: "Yes. Make the event private and add each guest by name. Each gets their own link with their name on the envelope, and only those links open it." },
    ],
    related: ["pasni", "bratabandha", "memorial"],
  },
  {
    type: "wedding", name: "Weddings",
    title: "Online wedding invitations with RSVP, in English and Nepali | in2min2",
    description: "Make a wedding invitation and wedding page on your phone, free. Mehndi, ceremony and reception on one link, replies with food needs, and every guest’s photos.",
    kicker: "Weddings and receptions", h1: "Wedding invitations and wedding pages",
    intro: "Make a wedding invitation as special as your day, then share one link for everything: the mehndi, sangeet, ceremony and reception, directions and replies. In two languages if you like.",
    points: [
      ["Every part in one place", "Mehndi, haldi, sangeet, janti or baraat, ceremony, reception: each with its own time and place, in order."],
      ["Rich, traditional designs", "Sindoor red and gold, ornate borders, painted roses, and your photos in a stack, heart or arch."],
      ["Replies the caterer can use", "Numbered replies with totals in people and food needs. Copy the list in one tap."],
      ["Photos from every guest", "Guests’ photos turn on the photo wheel and on the TV at the reception. Your photographer’s photos show their name."],
    ],
    questions: [
      { q: "Can the mehndi and the reception be on different days?", a: "Yes. Each part of the day plan has its own date, time and place, and guests see them in order." },
      { q: "Can each guest get their own invitation?", a: "Yes. Add guests by name and each gets a personal link with their name on the envelope. Their reply is linked to them, so you know exactly who has answered." },
      { q: "Can guests see the menu?", a: "Yes. Add a menu to any meal: starters, mains, desserts and drinks. Guests see it with the time of the meal." },
    ],
    related: ["engagement", "anniversary", "ceremony"],
  },
  {
    type: "engagement", name: "Engagements",
    title: "Engagement party invitations online | in2min2",
    description: "Make an engagement invitation on your phone in two minutes, free. Tika, ring ceremony and dinner on one link, with replies, directions and photos.",
    kicker: "Engagements", h1: "Engagement invitations",
    intro: "Share the good news in style. Make an engagement invitation with both names, the plan for the day and a place for everyone’s photos.",
    points: [
      ["Both names, beautifully", "Your names together on the card, with a photo in a heart, stack or arch."],
      ["The plan", "Guests arrive, tika, ring ceremony, dinner: ready to use, with times."],
      ["A moving touch", "Gentle ripples around your photo, in the event’s colours."],
      ["Every reply counted", "Numbered replies with who’s coming, how many people and any food needs."],
    ],
    questions: [
      { q: "Can both families reply on the same page?", a: "Yes. Send the same link to both families, or give each guest a personal link. Every reply comes back to you, numbered." },
      { q: "What happens to the page after the party?", a: "The day after, it becomes a thank-you page with everyone’s photos, by itself." },
    ],
    related: ["wedding", "anniversary", "party"],
  },
  {
    type: "anniversary", name: "Anniversaries",
    title: "Wedding anniversary invitations online: 25th, 50th or any year | in2min2",
    description: "Make an anniversary invitation for a 25th, 50th or any year, free. Replies, the plan for the evening, directions and everyone’s photos on one link.",
    kicker: "Wedding anniversaries", h1: "Anniversary invitations, for 25, 50 or any year",
    intro: "Celebrate the years together. Make an invitation with the couple’s photo, the plan for the party, and a place where everyone’s photos and good wishes come together.",
    points: [
      ["Silver, ruby, golden", "Tap 25th, 40th, 50th or any year. Choose roses, gold or a calm classic look."],
      ["A heart for the photo", "The couple’s photo in a heart, with a soft glow around it."],
      ["The evening plan", "Welcome, cake, dinner and dancing, with times, ready to change."],
      ["Good wishes", "Guests send a message with their reply, and comments on the photos on the day."],
    ],
    questions: [
      { q: "Can the children plan it as a surprise?", a: "Yes. Only people you send the link to can see it." },
      { q: "Can guests send wishes if they can’t come?", a: "Yes. When they reply “Can’t come”, they can add a message, and you see it with the replies." },
    ],
    related: ["wedding", "birthday", "party"],
  },
  {
    type: "reunion", name: "Reunions",
    title: "Reunion and regimental day invitations | in2min2",
    description: "Make a page for a school reunion, a 25th year reunion or a regimental day, free. Replies, the programme, directions, photos and updates on the day.",
    kicker: "Reunions and regimental days", h1: "Reunions and regimental days",
    intro: "Bring old friends back together. Make one page for the reunion with the programme, the place, replies and a photo wall, and share it in every group chat.",
    points: [
      ["Regimental looks", "Royal blue and gold, crossed khukuris and classic borders, or your own colours."],
      ["The programme", "Welcome speech, lunch, cultural programme, raffle: ready to use, with times."],
      ["Then and now", "Everyone adds photos from their phone, old and new, on one photo wall."],
      ["Know the numbers", "Numbered replies, how many people, food needs and places left at the venue."],
    ],
    questions: [
      { q: "Can I limit the number of places?", a: "Yes. Add the venue’s safe capacity. When it’s full, new replies join a waiting list, and people move up by themselves when someone can’t come." },
      { q: "Can I post updates on the day?", a: "Yes. Post updates such as “Lunch is served” or “Car park full”, and guests see them on the page straight away." },
    ],
    related: ["community", "charity", "corporate"],
  },
  {
    type: "corporate", name: "Work parties",
    title: "Office party and work event invitations | in2min2",
    description: "Invitations for office Christmas parties, team dinners and awards nights, free to make. Replies with food needs, the plan, directions and photos on one link.",
    kicker: "Work parties", h1: "Work parties and company events",
    intro: "Office Christmas party, team dinner or awards night: make a smart invitation in two minutes, collect replies and food needs, and share the photos afterwards.",
    points: [
      ["Food needs sorted", "Staff tick vegetarian, vegan, halal, gluten-free, nut allergy or dairy-free. Copy the totals for the venue."],
      ["The evening plan", "Arrival drinks, welcome, dinner, awards: with times, ready to change."],
      ["Smart, modern looks", "Clean designs in your own colours."],
      ["No app for staff", "Everyone opens the link on their phone or computer. Only the organiser signs in."],
    ],
    questions: [
      { q: "Can I use it for a big company?", a: "Yes. If you need more people than your plan allows, add them at £3 for each 100." },
      { q: "Can colleagues reply from a work computer?", a: "Yes. The link works in any web browser." },
    ],
    related: ["christmas", "party", "community"],
  },
  {
    type: "mela", name: "Melas",
    title: "Mela and festival event pages | in2min2",
    description: "Make a page for a mela or festival, free: the programme, updates on the day, parking information and a photo wall. Tickets and stalls arrive in February.",
    kicker: "Melas and festivals", h1: "Melas and festivals",
    intro: "A Diwali, Vaisakhi, Eid or Dashain mela, a Teej or Holi festival, or a summer food festival: give it one page with everything visitors need, from the programme and parking to live updates on the day.",
    points: [
      ["The programme", "Opening, cultural show, food stalls, raffle draw: in time order, showing what’s on now on the day."],
      ["Updates on the day", "Post “Car park full” or “Dance show starts in 10 minutes”, and visitors see it straight away."],
      ["Who organises it", "Your page shows who runs the event and whether it’s for profit or not."],
      ["Coming in February", "Online tickets, parking passes, business stalls and sponsors’ logos."],
    ],
    questions: [
      { q: "Can I sell tickets?", a: TICKETS },
      { q: "Can visitors share photos?", a: "Yes. Visitors add photos from their phones. For community events you check each one before it shows on the page and the big screen." },
    ],
    related: ["lhosar", "community", "sport"],
  },
  {
    type: "sport", name: "Tournaments",
    title: "Sports tournament event pages | in2min2",
    description: "Make a page for a football, volleyball or cricket tournament, free: the programme, updates, directions and photos. Team entries and live scores arrive in March.",
    kicker: "Sports tournaments", h1: "Sports tournaments",
    intro: "One page for your tournament: the day’s programme, the ground, parking and updates for players and supporters, with supporters’ photos from the touchline.",
    points: [
      ["The day’s programme", "Opening ceremony, group games, lunch, semi-finals, final, prize-giving."],
      ["Live updates", "“Final kicks off at 4pm”, “Pitch 2 moved”: everyone sees it straight away."],
      ["Supporters’ photos", "Photos from the touchline turn on the big screen, with a QR code so more people join in."],
      ["Coming in March", "Team entries, the draw, fixtures and live scores."],
    ],
    questions: [
      { q: "Can teams enter online?", a: "Not yet. Team entries, the draw and live scores arrive in March 2027. You can make the page and share the programme now." },
      { q: "Which sports can I use it for?", a: "Any: football, volleyball, cricket, badminton or a sports day. Give it your own name and change the programme to match." },
    ],
    related: ["mela", "community", "charity"],
  },
  {
    type: "charity", name: "Charity days",
    title: "Charity day and fundraiser event pages | in2min2",
    description: "Make a page for a charity day, walk or fundraiser, free: the plan, directions, replies, updates and photos. Your charity number shows on the page.",
    kicker: "Charity days and fundraisers", h1: "Charity days and fundraisers",
    intro: "Tell people what you’re raising money for, when and where, and collect replies. On the day, post updates and gather everyone’s photos for your thank-you.",
    points: [
      ["Your charity, shown clearly", "The page shows who organises it, with your charity number if you have one."],
      ["The plan for the day", "Registration, start, lunch, prize-giving: with times."],
      ["Updates and photos", "Post updates on the day, and everyone’s photos come together on one wall."],
      ["Half price on request", "Registered charities and armed forces welfare events can ask for half price on paid plans, with evidence."],
    ],
    questions: [
      { q: "Can I take money on the page?", a: "Not yet. Payments for tickets arrive in February 2027. Making the page and sharing it is free now." },
      { q: "Is it cheaper for charities?", a: "Making the page is free. Paid plans are half price for registered charities and armed forces welfare events, on request with evidence." },
    ],
    related: ["community", "mela", "reunion"],
  },
  {
    type: "community", name: "Community events",
    title: "Community event pages: programme, replies and photos | in2min2",
    description: "Make a page for a community event, society meeting or cultural show, free. The programme, updates on the day, replies, directions and a photo wall.",
    kicker: "Community events", h1: "Community events and cultural shows",
    intro: "For societies, temples, gurdwaras, mosques, churches, clubs and community groups: one page with the programme, the place and updates, shared in every group chat. Members reply and add their photos.",
    points: [
      ["The programme", "Welcome, programme, food, close: with times, showing what’s on now on the day."],
      ["Updates on the day", "Post news as it happens, and everyone sees it on the page straight away."],
      ["Places and a waiting list", "Set the venue’s safe capacity. When it’s full, new replies join a waiting list."],
      ["Photos, checked first", "Members add photos; you check each one before it shows on the page and the big screen."],
    ],
    questions: [
      { q: "Can the page be in our language?", a: LANGS },
      { q: "Can I sell tickets?", a: TICKETS },
    ],
    related: ["lhosar", "mela", "charity"],
  },
  {
    type: "lhosar", name: "Lhosar",
    title: "Lhosar event pages for Tamu, Sonam and Gyalpo Lhosar | in2min2",
    description: "Make a page for your Lhosar celebration, free: the programme, updates on the day, parking, a photo wall and the big screen. In English and Nepali.",
    kicker: "Lhosar", h1: "Lhosar celebrations: Tamu, Sonam and Gyalpo",
    intro: "Bring the whole community together for the new year. Make one page for your Lhosar celebration with the programme, the place, parking and updates on the day, in English and Nepali.",
    points: [
      ["The programme", "Welcome, prayers and blessings, cultural programme and dances, lunch, then tika and close."],
      ["Your community’s photo", "Your group’s photo across the top, in rich colours."],
      ["The big screen", "Everyone’s photos turn on the TV at the venue, with a QR code so more people join in."],
      ["Who organises it", "The page shows your community group and that it isn’t for profit."],
    ],
    questions: [
      { q: "When is each Lhosar?", a: "Tamu Lhosar (Gurung) is usually at the end of December, Sonam Lhosar (Tamang) in January or February, and Gyalpo Lhosar (Sherpa) in February or March. The dates follow the lunar calendar." },
      { q: "Can I sell tickets for the programme?", a: TICKETS },
      { q: "Can the page be in Nepali?", a: NEPALI },
    ],
    related: ["mela", "community", "reunion"],
  },
  {
    type: "memorial", name: "Memorials",
    title: "Memorial and funeral pages online, free | in2min2",
    description: "Share funeral, prayer and remembrance details with family and friends on one gentle page. Free. Messages of support, and photos checked by the family.",
    kicker: "Memorials and funerals", h1: "Memorial and funeral pages",
    intro: "When you lose someone, there is so much to tell people. Share the funeral, prayers and remembrance details on one calm page, in English, Nepali or both. It’s free.",
    points: [
      ["Gentle and respectful", "Calm colours and quiet designs, with no confetti and no music."],
      ["All the details", "The funeral, prayers and other rites, each with its own date, time, place and directions."],
      ["Messages of support", "Family and friends can send a message with their reply."],
      ["Photos, with care", "Friends can share photos; the family checks each one before it shows."],
    ],
    questions: [
      { q: "Is it really free?", a: "Yes. Memorial and funeral pages are free, with no need to ask, and stay online until 90 days after the day." },
      { q: "Can we close the page sooner?", a: "Yes, whenever you wish, without asking anyone. Open your event, tap Settings, then Close the page now. Family and friends then see that the page is closed. You can open it again within 30 days." },
      { q: "Can I add the 13th-day rites as well?", a: "Yes. Add each rite or gathering with its own date, time and place, and family see them in order." },
      { q: "Can the page be in Nepali?", a: NEPALI },
    ],
    related: ["ceremony", "community"],
    noFree: true,
  },
  {
    type: "christmas", name: "Christmas",
    title: "Christmas party and family lunch invitations | in2min2",
    description: "Make a Christmas party or family lunch invitation in two minutes, free. Festive designs, music, the menu, replies with food needs and everyone’s photos.",
    kicker: "Christmas", h1: "Christmas party invitations",
    intro: "A family Christmas lunch, a party with friends or the office do: make a festive invitation with music, the plan and the menu, and send one link.",
    points: [
      ["Festive looks", "Christmas greenery, falling snow and red and gold, with your own photo."],
      ["Christmas music", "Guests open the envelope and “We Wish You a Merry Christmas” plays."],
      ["The Christmas menu", "Roast turkey, pigs in blankets, Christmas pudding, mince pies: add dishes with a tap."],
      ["Secret Santa and games", "Add them to the plan with times, so everyone knows what’s happening."],
    ],
    questions: [
      { q: "Can guests tell me if they’re vegetarian?", a: "Yes. When they reply, guests can tick vegetarian, vegan, halal, gluten-free, nut allergy or dairy-free, and you see the totals." },
    ],
    related: ["new-year", "corporate", "party"],
  },
  {
    type: "new-year", name: "New Year’s Eve",
    title: "New Year’s Eve party invitations | in2min2",
    description: "Make a New Year’s Eve party invitation in two minutes, free. The plan to midnight, replies, directions, fireworks on the page and everyone’s photos.",
    kicker: "New Year’s Eve", h1: "New Year’s Eve party invitations",
    intro: "Count down together. Make a New Year’s Eve invitation with the plan for the night, the countdown to midnight, and a photo wall that fills up as the clock strikes twelve.",
    points: [
      ["Fireworks on the page", "Midnight blue and gold, with fireworks on the invitation."],
      ["The plan to midnight", "Dinner, dancing, the countdown at 11:55pm and fireworks at midnight, ready to use."],
      ["Photos at midnight", "Everyone’s photos turn on the wheel and the TV as the new year starts."],
      ["Who’s coming", "Numbered replies with how many people, so you know how much food and drink to buy."],
    ],
    questions: [
      { q: "Does the plan go past midnight?", a: "Yes. Anything after midnight shows on the next day, in the right order." },
    ],
    related: ["christmas", "party", "birthday"],
  },
  {
    type: "party", name: "Parties",
    title: "Party invitations online: house-warming, graduation and more | in2min2",
    description: "Make a party invitation in two minutes, free: house-warming, graduation, baby shower or just because. Replies, directions and photos on one link.",
    kicker: "Parties", h1: "Party invitations for any reason",
    intro: "House-warming, graduation, baby shower, a Diwali or Eid get-together, a Lunar New Year dinner, or just because: make a party invitation on your phone and send one link.",
    points: [
      ["Name it anything", "Tap a quick name or type your own."],
      ["Bright looks", "Confetti, balloons or calm and classic, with your own photo."],
      ["Directions in one tap", "Guests tap to open the map and find their way, with parking information."],
      ["Photos on the night", "Everyone’s photos turn on the photo wheel, and stay on the thank-you page afterwards."],
    ],
    questions: [
      { q: "Can I make a baby shower invitation?", a: "Yes. Choose Party, give it your own name, and change the words and the plan to match." },
    ],
    related: ["birthday", "new-year", "christmas"],
  },
];

export const kindPage = (type: string) => KIND_PAGES.find((k) => k.type === type);
