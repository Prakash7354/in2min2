// "Why not just a WhatsApp message?" (owner, 23 Nov 2026). Most invitations in
// the community go by WhatsApp, Viber or text, so this says what in2min2 adds,
// feature by feature: culture, language, a personal touch, a page worthy of
// the day, replies counted, privacy, everyone together on the day, a fair
// price. Only what's built. On the home page and the event pages (not the
// memorial page, which keeps its own gentle words).

import { ShareStrip } from "@/components/site/share-strip";

const WHY: [string, string, string][] = [
  ["🪔", "Made for your culture", "Pasni, Bratabandha, Lhosar, weddings and regimental days come with the right questions, day plans, dishes and designs, from sindoor red and gold to crossed khukuris."],
  ["🗣️", "In your language", "The AI writer drafts your words in English, Nepali or both, so grandparents and grandchildren read the same invitation."],
  ["💌", "Personal to every guest", "Each guest can have their own link, with their name on the envelope. They open it with a tap, like a real card, with music."],
  ["✨", "Looks as special as your day", "A beautiful invitation and a full event page, not just a line of text lost in a chat. Guests remember it."],
  ["✅", "Every reply in one place", "Who’s coming, how many people, food needs and places left, numbered in one list. No counting messages in a group."],
  ["🔒", "Private and safe", "Guests don’t share their phone numbers with each other. Only you see replies and food needs, kept in the UK and Europe under UK data protection law."],
  ["📸", "Together on the day", "Everyone’s photos on one wall and on the big screen, comments and cheers, and a thank-you page to keep."],
  ["💷", "A fair, simple price", "Free while our launch offer lasts, then a short page is free, or one price for the whole event from £9. No adverts."],
];

export function WhySection({ tint = false }: { tint?: boolean }) {
  return (
    <section id="why" className={`s-section${tint ? " s-tint" : ""}`}>
      <div className="s-wrap">
        <p className="s-kicker">Why in2min2</p>
        <h2 className="s-h2">Why not just a WhatsApp message?</h2>
        <p className="s-lead">Keep using the apps you love. Send your in2min2 link on WhatsApp, Viber, Messenger or Facebook, by text or email, or print its QR code on a card. Then in2min2 does what a chat can’t:</p>
        <ShareStrip />
        <ul className="s-whygrid">
          {WHY.map(([icon, title, line]) => (
            <li key={title}><span aria-hidden="true">{icon}</span><b>{title}</b><span>{line}</span></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
