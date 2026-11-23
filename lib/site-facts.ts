// What in2min2 is, said once and used everywhere a reader or a machine looks
// (owner, 23 Nov 2026: "AI referral"): the home page's questions, the
// structured facts (JSON-LD) in the home page for Google, Bing and AI
// assistants, and /llms.txt, a plain summary for AI assistants. Prices come
// from PLANS, so they can't drift from the prices page. Only say what's built.

import { DRAFT } from "@/components/legal/legal-page";
import { FESTIVE_UNTIL, PLANS, formatPence, plan } from "@/lib/catalog";
import { KIND_PAGES } from "@/lib/kind-pages";

export const SITE = "https://in2min2.com";
const CONTACT = "hello@in2min2.com";

// One sentence that says what in2min2 is, the way an AI assistant would quote it.
// The short line for search results, sharing and the top of the page (owner, 23 Nov 2026).
export const TAGLINE = "in2min2 makes organising your event simple: a beautiful invitation in two minutes, replies counted for you, and everyone’s photos on one link. Free to start.";
export const WHAT_IT_IS = "in2min2 makes organising your event simple, quick and affordable. "
  + "Make a beautiful invitation on your phone in about two minutes and share one link on WhatsApp, Viber or anywhere. "
  + "Guests reply in a tap, find the plan and directions, and share their photos, and you see every reply counted in one place.";

// The home page's "Good to know" (also in the structured facts, as a FAQ).
export const QUESTIONS = [
  { q: "What is in2min2?", a: `${WHAT_IT_IS} Nothing to download, free to start, and you can stop whenever you like. Made in the UK, for families and communities of every culture.` },
  { q: "Is it really free?", a: "Yes. Every page is free and stays online until 90 days after your event. Until 31 January 2027 a free page takes up to 300 people and 300 photos; after that, up to 200 people and 50 photos. Paid plans, from £9, add more people and photos, or keep your page for 6 or 12 months. Memorials are always free." },
  { q: "Do my guests need an app or an account?", a: "No. They open your link on any phone, tablet or computer. Only you, the host, sign in, with a code we email you." },
  { q: "Which cultures and celebrations is it made for?", a: "Every culture. Weddings with mehndi, sangeet and haldi, Pasni (Annaprashan), Bratabandha, naming ceremonies, Lhosar, birthdays, Christmas, reunions and regimental days each come with their own questions, designs and ready-made words. For Diwali, Eid, Vaisakhi, Holi or Lunar New Year, choose a party or community event and name it your way." },
  { q: "Which languages can I use?", a: "English and Nepali are ready, in Nepali script or in English letters. Hindi, Punjabi, Gujarati, Bengali, Tamil, Tagalog and Polish are in beta. You can put two languages on one invitation." },
  { q: "Can guests tell me about food needs?", a: "Yes. When they reply, guests can tick vegetarian, vegan, halal, gluten-free, nut allergy or dairy-free. You see the totals for the caterer and can copy the numbered list. You can switch the question off." },
  { q: "How is it different from a WhatsApp group or a paper card?", a: "A paper card can’t collect replies, and in a WhatsApp group the replies get lost in the chat. With in2min2 each guest replies on the page, and you see who is coming, how many people and their messages in one numbered list. The same link then shows the day plan, directions and everyone’s photos." },
  { q: "Can I still use WhatsApp, Viber or text messages?", a: "Yes, that’s how most people share it. Send your link in a WhatsApp, Viber or text message, or in a group chat, and guests tap it to open the invitation. in2min2 even gives you ready-made messages for each step, from the invitation to the reminder and the thank-you. For a personal touch, send each guest their own link." },
  { q: "Can I change things after I’ve sent the link?", a: "Yes, any time. Change the time, the place or the words and press Update. The link stays the same." },
  { q: "How long does my page stay online, and can I close it sooner?", a: "Your page is live from the moment you publish until 90 days after your event, free. Paid plans can keep it for 6 or 12 months. You can close it at any time, without asking: open your event, tap Settings, then Close the page now. You can open it again within 30 days." },
  { q: "Who can see my event?", a: "Only people you send the link to. For a private event, each guest gets their own link with their name on the envelope." },
  { q: "Can I use it for a big community event?", a: "Yes. Make the event page, share the programme, post updates on the day and collect photos. Ticketing, stalls and sponsors are coming soon." },
  { q: "How do I get help?", a: `Email ${CONTACT} and a real person will reply.` },
];

const FAMILY_PLANS = PLANS.filter((p) => ["popup", "season", "half_year", "keepsake"].includes(p.key));
const limits = (p: (typeof PLANS)[number]) =>
  `online for ${p.duration} after the event, up to ${p.guestLimit} people and ${p.photoLimit} photos`;

// Structured facts for the home page (schema.org JSON-LD). They repeat what
// the page itself says; search engines ignore facts that aren't on the page.
export function siteJsonLd(now: number) {
  const org = { "@id": `${SITE}/#org` };
  const festive = plan("festive");
  const offers = [
    ...(now < FESTIVE_UNTIL ? [{ "@type": "Offer", name: "Festive launch", price: "0.00", priceCurrency: "GBP", validThrough: "2027-01-31",
      description: `Every family event made before 31 January 2027, ${limits(festive)}.` }] : []),
    ...FAMILY_PLANS.map((p) => ({ "@type": "Offer", name: p.name, price: (p.pricePence / 100).toFixed(2), priceCurrency: "GBP", description: `${limits(p)}.` })),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", ...org, name: "in2min2", alternateName: ["In2Min2", "in 2 min 2"], url: `${SITE}/`,
        logo: `${SITE}/brand/logo.png`, email: CONTACT, slogan: "Create, invite, celebrate", description: TAGLINE, areaServed: "GB" },
      { "@type": "WebSite", "@id": `${SITE}/#website`, name: "in2min2", url: `${SITE}/`, inLanguage: "en-GB", publisher: org },
      { "@type": "WebApplication", "@id": `${SITE}/#app`, name: "in2min2", url: `${SITE}/new`, description: WHAT_IT_IS,
        applicationCategory: "LifestyleApplication", operatingSystem: "Any (works in a web browser)", inLanguage: ["en-GB", "ne"],
        publisher: org, offers,
        featureList: ["Online invitations and event pages", "Replies (RSVP) with numbers, food needs and places left", "Personal invitation links with each guest's name",
          "AI writer in English and Nepali", "Day plan, menu, map and directions", "Guests' photo wall and live comments", "TV slideshow with a QR code", "Thank-you page after the event"] },
      { "@type": "FAQPage", "@id": `${SITE}/#questions`, mainEntity: QUESTIONS.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) },
    ],
  };
}

// /llms.txt: a plain summary for AI assistants (the llms.txt convention).
export function llmsText(now: number): string {
  const festive = plan("festive");
  const prices = [
    ...(now < FESTIVE_UNTIL ? [`- **Festive launch:** every family event made before 31 January 2027 is free, ${limits(festive)}.`] : []),
    ...FAMILY_PLANS.map((p) => `- **${p.name}:** ${p.pricePence ? formatPence(p.pricePence) : "free"}, ${limits(p)}.`),
    "- More people: £3 for each extra 100.",
    "- Memorials and funerals are free.",
  ];
  const links = [
    `- [Home page](${SITE}/): what in2min2 does, with real example invitations`,
    `- [Make an event](${SITE}/new): the builder; free to try, and no sign-in is needed until you use the AI writer or publish`,
    `- [How it works](${SITE}/new/guide): a two-minute guide`,
    ...(DRAFT ? [] : [`- [Prices](${SITE}/pricing)`, `- [Privacy](${SITE}/privacy)`, `- [Terms](${SITE}/terms)`]),
  ];
  return `# in2min2

> ${TAGLINE}

${WHAT_IT_IS} Made in the UK for families and communities of every culture: English and Nepali are ready, and Hindi, Punjabi, Gujarati, Bengali, Tamil and more are in beta.

## What hosts and guests get

- The host answers a few questions (mostly taps), picks a look, and the AI writer drafts the words in English, Nepali or both. The host checks every word before publishing.
- Guests open one link on any phone. No app and no account. With a personal link, they open an envelope with their own name on it.
- Guests reply yes, maybe or no, with how many people, a message and any food needs (vegetarian, vegan, halal, gluten-free, nut allergy, dairy-free).
- The host sees every reply, numbered, with totals in people, food needs, days to go and places left at the venue, and can copy the list for the caterer.
- On the day: the running order, the menu, a map with directions, a photo wall guests add to, live comments, and a TV slideshow with a QR code.
- Afterwards: a thank-you page and everyone's photos.

## Events it's made for

Birthdays, weddings and receptions, engagements, wedding anniversaries, Pasni (rice feeding), Bratabandha, family ceremonies, Christmas and New Year's Eve parties, reunions and regimental days, memorials and funerals, Lhosar (Tamu, Sonam and Gyalpo), melas and festivals, charity and community events, and work parties. For Diwali, Eid, Vaisakhi, Holi or Lunar New Year, hosts choose a party or community event and name it. Ticketing, stalls, sponsors and tournament scores for big community events are coming in early 2027.

## Languages

English and Nepali (Nepali script or English letters). Hindi, Punjabi, Gujarati, Bengali, Tamil, Tagalog and Polish are in beta. One invitation can show two languages.

## Prices (UK pounds)

${prices.join("\n")}

## Privacy

Event pages are never listed by search engines. Replies and food needs are seen only by the hosts. Replies and photos are stored in the UK and Europe. No adverts and no tracking cookies.

## A page for each kind of event

${KIND_PAGES.map((k) => `- [${k.h1}](${SITE}/${k.type}): ${k.description}`).join("\n")}

## Links

${links.join("\n")}
- Contact: ${CONTACT} (a real person replies)
`;
}
