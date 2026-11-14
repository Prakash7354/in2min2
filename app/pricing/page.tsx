// in2min2.com/pricing: prices, launch offers, and the written rules for reduced
// fees (owner's request, 14 Nov 2026: "fair and consistent"; docs/CONCEPT.md
// 5e and 5h). Prices come from lib/catalog.ts, so they always match the builder.
// Draft until the owner approves it (components/legal/legal-page.tsx).

import type { Metadata } from "next";
import Link from "next/link";
import { Ask, CONTACT, LegalPage, legalMetadata } from "@/components/legal/legal-page";
import { PLANS, SAME_AGAIN_PERCENT, WELCOME_BACK_PERCENT, formatPence, plan } from "@/lib/catalog";

export const metadata: Metadata = legalMetadata("Prices and fair fees", "In2Min2's prices, launch offers, and the rules for reduced fees.");

const mail = <a href={`mailto:${CONTACT}`}>{CONTACT}</a>;

export default function Fees() {
  const family = PLANS.filter((p) => p.key !== "community");
  const community = plan("community");
  const pack = formatPence(family[0].packPence ?? 0);
  const bookingFee = `${community.bookingFeeBps / 100}% + ${community.bookingFeePence}p`;
  return (
    <LegalPage
      current="/pricing"
      title="Prices and fair fees"
      intro={<p>What In2Min2 costs, the launch offers, and the written rules we follow when someone asks for a reduced fee.</p>}
      short={[
        <>Everyone pays the same published prices, and the same rules apply to everyone.</>,
        <><strong>Festive launch: In2Min2 is free until 31 January 2027.</strong></>,
        <>Memorials and funerals are free. Registered charities and armed forces welfare events can ask for half price.</>,
        <>Public events are free to set up. There&apos;s a small fee only on online sales, and nothing on cash or free tickets.</>,
        <>Ask about a reduced fee at {mail}.</>,
      ]}
    >
      <h2 id="prices">1. Prices</h2>
      <h3>Family events and celebrations</h3>
      <p>You pay once per event. The plan sets how long your page stays online after the event.</p>
      <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {family.map((p) => (
          <div key={p.key} className="grid content-start gap-1 rounded-2xl border border-line bg-card p-4">
            <span className="font-bold">{p.name}</span>
            <span className="font-display text-3xl font-extrabold text-brand">{p.pricePence ? formatPence(p.pricePence) : "Free"}</span>
            <span className="text-[15px] text-muted">Online {p.duration} after the event</span>
            <span className="text-[15px] text-muted">Up to {p.guestLimit} people</span>
          </div>
        ))}
      </div>
      <ul>
        <li>More people on any plan: {pack} for each extra 100.</li>
        <li>Every switch works on every plan. You pay for time and size, never for features.</li>
        <li>No subscription, nothing to cancel. We&apos;re not registered for VAT, so no VAT is added.</li>
        <li>Paying opens in February 2027.</li>
      </ul>
      <h3>Public events: melas, tournaments, fundraisers</h3>
      <ul>
        <li>Free to set up, with every organiser tool.</li>
        <li>{bookingFee} per online order, not per ticket. It&apos;s shown before paying, and added to the buyer&apos;s total unless the organiser chooses to pay it.</li>
        <li>Nothing on cash or card sales on the day, and nothing at all on free events.</li>
        <li>Stripe&apos;s own card cost is included in the fee.</li>
      </ul>

      <h2 id="offers">2. Launch offers: for everyone, no need to ask</h2>
      <ul>
        <li>
          <strong>Festive launch: free until 31 January 2027.</strong> Every event page made until then is free, with every switch. It stays online
          until 7 days after the event; after that you can keep it longer at the normal price.
        </li>
        <li><strong>LAUNCH50:</strong> the first 50 families get a free Keepsake (12 months). One per account; not for public events. Type the code when you publish.</li>
        <li>
          <strong>Organisers:</strong> no In2Min2 fee on your first event&apos;s online sales, if you sign up by 31 March 2027. Stripe&apos;s card cost
          (about 1.5% + 20p) still applies.
        </li>
      </ul>

      <h2 id="reduced">3. Reduced fees: our rules</h2>
      <p>The system never decides who pays less. These written rules do, and they&apos;re the same for everyone.</p>
      <div className="my-4 grid gap-3">
        <Rule level="Free" who="Memorials and funerals" how="Automatic. A grieving family never has to ask." />
        <Rule level="Half" who="Fundraising events run by a registered charity" how="Give your charity number. We check it on the Charity Commission, OSCR (Scotland) or Northern Ireland register." />
        <Rule level="Half" who="Small charities that don't have to register (income under £5,000), and armed forces welfare or benevolent events"
          how="Show who you are: for example, a bank statement in the group's name, or a letter from the association." />
        <Rule level="Free" who="Showcase events"
          how="A few events each season that show a kind of event we don't have an example of yet, chosen only with the organiser's permission to show them. We list every showcase event on our website." />
        <Rule level="Full" who="Everyone else" how="The normal prices and launch offers." />
      </div>
      <ul>
        <li><strong>Half</strong> means half of In2Min2&apos;s price or fee: for example, Season {formatPence(plan("season").pricePence / 2)}, or {community.bookingFeeBps / 200}% + {community.bookingFeePence / 2}p per online order.</li>
        <li>On Half and Free, Stripe&apos;s card cost (about 1.5% + 20p) still applies to online sales. It&apos;s Stripe&apos;s charge, not ours, and we can&apos;t waive it.</li>
      </ul>
      <Ask>
        Memorials free automatically: the plan said you decide each case, but a written rule applied by the system means no family ever has to ask.
        Recommended yes. The other levels stay your decision, case by case, using these rules.
      </Ask>

      <h2 id="fair">4. How we keep it fair</h2>
      <ul>
        <li>The same rules for everyone. A decision never depends on religion, race, nationality, sex, age, disability, or who you know.</li>
        <li>We record every decision and the reason for it.</li>
        <li>If we say no, we tell you why. You can ask again with more information.</li>
        <li>Discounts don&apos;t stack: the single best one applies.</li>
      </ul>

      <h2 id="ask">5. How to ask</h2>
      <p>Email {mail} with:</p>
      <ol>
        <li>the organiser&apos;s or family&apos;s name;</li>
        <li>the event, and its date;</li>
        <li>which rule above applies, and a charity number if you have one.</li>
      </ol>
      <p>We reply within 5 working days. From February 2027 there&apos;ll also be an &ldquo;Ask about a reduced fee&rdquo; form.</p>

      <h2 id="later">6. Coming later: automatic discounts</h2>
      <ul>
        <li><strong>Same event next year:</strong> {SAME_AGAIN_PERCENT}% off, with last year&apos;s guest list and details ready.</li>
        <li><strong>Welcome back:</strong> {WELCOME_BACK_PERCENT}% off a different event within 12 months of a paid one.</li>
        <li>Both apply by themselves, with no code to type. Memorials are never sent offers.</li>
      </ul>
      <p>See also our <Link href="/terms#prices">terms</Link> on paying and refunds.</p>
    </LegalPage>
  );
}

function Rule({ level, who, how }: { level: "Free" | "Half" | "Full"; who: string; how: string }) {
  const colour = level === "Full" ? "bg-wash text-ink" : level === "Half" ? "bg-marigold text-ink" : "bg-brand text-white";
  return (
    <div className="grid gap-2 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[5rem_1fr] sm:items-start">
      <span className={`justify-self-start rounded-full px-3 py-1 text-sm font-extrabold ${colour}`}>{level}</span>
      <div className="grid gap-1">
        <p className="!m-0 font-bold">{who}</p>
        <p className="!m-0 text-[16px] text-muted">{how}</p>
      </div>
    </div>
  );
}
