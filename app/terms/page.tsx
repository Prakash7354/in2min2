// in2min2.com/terms: the terms for hosts, organisers and guests, including the
// data agreement for guests' details (section 5). Draft until the owner
// approves it (components/legal/legal-page.tsx). Not legal advice: a
// solicitor's one-off check is planned before the first paid community event.

import type { Metadata } from "next";
import Link from "next/link";
import { ADDRESS, CONTACT, LegalPage, OWNER, legalMetadata } from "@/components/legal/legal-page";

export const metadata: Metadata = legalMetadata("Terms", "The rules for using in2min2: accounts, event pages, payments, refunds and public events.");

const mail = <a href={`mailto:${CONTACT}`}>{CONTACT}</a>;

export default function Terms() {
  return (
    <LegalPage
      current="/terms"
      title="Terms"
      intro={<p>The agreement between you and in2min2. Guests only need section 6, the rules for everyone.</p>}
      short={[
        <>in2min2 makes event pages: the invitation, the day itself and the memory book, on one link.</>,
        <>You need to be 18 or over to make an account. Guests don&apos;t need one.</>,
        <>Your words and photos stay yours. You&apos;re responsible for what you publish, and for having permission for photos of other people, especially children.</>,
        <>The AI writes suggestions. Check every word before you publish.</>,
        <>The free plan stays free. Paid plans are one-off payments, never subscriptions. <Link href="/pricing">See prices and fair fees</Link>.</>,
        <>Organisers of public events sell their own tickets and are responsible for their event, its safety and its refunds.</>,
        <>Be kind and stay within the law. We can take down a page that breaks these rules.</>,
      ]}
    >
      <h2 id="us">1. Who we are</h2>
      <p>
        in2min2 (in2min2.com) is a service of GoChuchuro, run by {OWNER}, a sole trader in England.
        Address: {ADDRESS}. Email: {mail}.
      </p>
      <p>
        By making an account or publishing a page you agree to these terms. Our <Link href="/privacy">privacy notice</Link> explains how we
        handle personal data.
      </p>

      <h2 id="account">2. Your account</h2>
      <ul>
        <li>You must be 18 or over.</li>
        <li>You sign in with a code we email you. Keep your email account secure, and tell us straight away if you think someone else has got in.</li>
        <li>One person per account. You can add helpers to an event when that arrives; don&apos;t share your sign-in.</li>
      </ul>

      <h2 id="content">3. Your event page and what you put on it</h2>
      <ul>
        <li>Your words, photos and details stay yours.</li>
        <li>
          You allow us to store, copy, resize and show them to the people you share your page with, and to make the preview picture that
          appears when the link is shared. We use them only to run your event. This ends when you delete them, apart from backups, which
          clear within 30 days.
        </li>
        <li>We never use your page in our own advertising unless you&apos;ve said yes.</li>
        <li>You confirm you have the right to publish what you add, and permission from the people in your photos. For children, that means their parent or guardian.</li>
      </ul>

      <h2 id="ai">4. Words written by AI</h2>
      <ul>
        <li>The AI writer suggests words. They can be wrong, especially names, dates, places and languages other than English.</li>
        <li>You check and approve every word before publishing. Nothing goes live until you press Publish.</li>
        <li>Please don&apos;t type private information into it that the page doesn&apos;t need.</li>
        <li>There&apos;s a daily limit, to keep it fair and affordable.</li>
      </ul>

      <h2 id="guests">5. Guests&apos; details: our data agreement with you</h2>
      <p>
        When your page collects replies, guest details, photos or messages, you decide what&apos;s collected and why. We handle them for you.
        In data protection law you&apos;re the &ldquo;controller&rdquo; and we&apos;re your &ldquo;processor&rdquo;. This section is our agreement
        for that.
      </p>
      <h3>We will</h3>
      <ul>
        <li>use guests&apos; details only to run your event, as you set it up, and never for anything of our own;</li>
        <li>keep them confidential, and make sure anyone working on in2min2 does too;</li>
        <li>keep them secure, as our <Link href="/privacy#safety">privacy notice</Link> describes;</li>
        <li>use only the companies listed in our <Link href="/privacy#helpers">privacy notice</Link>, and tell you before adding a new one, so you can object;</li>
        <li>help you answer guests who ask to see, correct or delete their details;</li>
        <li>tell you without delay if something goes wrong that affects your guests&apos; details;</li>
        <li>delete them 30 days after your page closes, or straight away when you press &ldquo;Delete everything&rdquo;, and let you download what you need first;</li>
        <li>give you the information you need to show you&apos;ve looked after your guests&apos; details properly.</li>
      </ul>
      <h3>You will</h3>
      <ul>
        <li>invite people and ask them only for what your event needs;</li>
        <li>have a good reason for any guest details you add yourself (for example, a guest list you type in);</li>
        <li>have permission for the photos you add.</li>
      </ul>

      <h2 id="rules">6. Rules for everyone</h2>
      <p>Hosts, organisers and guests must not use in2min2 to:</p>
      <ul>
        <li>break the law, or help anyone else to;</li>
        <li>post anything hateful, threatening, harassing or sexual, or anything that puts a child at risk;</li>
        <li>run a scam, a fake event or a fake fundraiser, or sell tickets for an event that won&apos;t go ahead as described;</li>
        <li>pretend to be someone else;</li>
        <li>claim a free or reduced fee you aren&apos;t entitled to, for example by calling an event a memorial when it isn&apos;t;</li>
        <li>post other people&apos;s photos, music or writing without permission;</li>
        <li>send spam, or try to break, overload or get round the security of in2min2.</li>
      </ul>
      <p>
        If you see a page that breaks these rules, tell us at {mail}. We can remove anything that breaks them, charge the normal price where
        a fee was avoided, and report crimes where the law requires it.
      </p>

      <h2 id="prices">7. Prices and paying</h2>
      <ul>
        <li>The free plan (Pop-Up) stays free.</li>
        <li>Paid plans and &ldquo;+100 people&rdquo; packs are one-off payments for one event. Your page stays online for the time you bought. There&apos;s nothing to renew or cancel.</li>
        <li>You see the price before you pay. We&apos;re not registered for VAT, so no VAT is added.</li>
        <li>Payments are taken by Stripe. Paying opens in February 2027; until then, every page is free.</li>
        <li>We may change prices for new purchases. What you&apos;ve already bought never changes.</li>
        <li>Launch offers and reduced fees: see <Link href="/pricing">prices and fair fees</Link>.</li>
      </ul>

      <h2 id="refunds">8. Changing your mind</h2>
      <ul>
        <li>Ask within 14 days of paying, and we refund you in full.</li>
        <li>If your event has already happened by then, we refund the part of your plan you haven&apos;t used yet.</li>
        <li>If in2min2 lets you down on the day (for example, your page doesn&apos;t work), we refund what you paid for that event.</li>
        <li>None of this affects your legal rights as a consumer.</li>
      </ul>

      <h2 id="public-events">9. Public events, tickets and sales (from February 2027)</h2>
      <ul>
        <li>
          <strong>The organiser is the seller.</strong> A ticket, parking pass, stall or team entry is an agreement between the buyer and the
          organiser named on the page. The organiser&apos;s own Stripe account receives the money, after Stripe checks who they are.
        </li>
        <li>
          <strong>Our booking fee</strong> is 4% + 30p per online order, shown before paying. It&apos;s added to the buyer&apos;s total unless the
          organiser chooses to pay it. There&apos;s no fee on cash sales or free tickets.
        </li>
        <li><strong>Refunds to buyers</strong> follow the organiser&apos;s refund policy, shown on the page.</li>
        <li><strong>If the organiser cancels the event,</strong> buyers must get all their money back, including our booking fee, which we return.</li>
        <li>
          <strong>Safety is the organiser&apos;s responsibility,</strong> with the venue: licences, insurance, safe numbers, food hygiene, first aid
          and permissions. in2min2 keeps accurate records and checklists, but it doesn&apos;t certify that any event is safe.
        </li>
        <li>
          <strong>Honest details.</strong> The organiser&apos;s name, kind, profit answer and contact are shown on the page. A false answer breaks
          these terms: we can change the event&apos;s fee level or take the page down.
        </li>
      </ul>

      <h2 id="service">10. Our service</h2>
      <ul>
        <li>We work hard to keep in2min2 running and your data safe, but we can&apos;t promise it will never be interrupted.</li>
        <li>We improve in2min2 all the time. We&apos;ll tell you before we take away anything you&apos;ve paid for.</li>
        <li>If we ever close in2min2, we&apos;ll give at least 60 days&apos; notice, time to download your photos, and a refund for paid time not used.</li>
      </ul>

      <h2 id="liability">11. If something goes wrong</h2>
      <ul>
        <li>
          <strong>If you use in2min2 for yourself or your family:</strong> we&apos;re responsible for loss you suffer that was foreseeable and
          caused by us breaking these terms or not taking reasonable care. We&apos;re not responsible for business losses.
        </li>
        <li>
          <strong>If you use in2min2 for a business, club, charity or other organisation:</strong> our total responsibility is limited to the
          fees you paid us in the 12 months before the problem, or £100, whichever is more. We&apos;re not responsible for lost profits or
          indirect losses.
        </li>
        <li>Nothing here limits our responsibility for death or injury caused by our negligence, for fraud, or for anything else the law doesn&apos;t allow us to limit.</li>
      </ul>

      <h2 id="ending">12. Ending</h2>
      <ul>
        <li>You can delete your event, or your account, at any time.</li>
        <li>
          We can suspend or remove a page or account that breaks these terms. For serious cases we act straight away; otherwise we&apos;ll warn
          you first and give you a chance to put it right.
        </li>
      </ul>

      <h2 id="changes">13. Changes to these terms</h2>
      <p>We&apos;ll email account holders at least 14 days before an important change. The latest version is always on this page.</p>

      <h2 id="law">14. The law</h2>
      <p>
        These terms are under the law of England and Wales. If you live in Scotland or Northern Ireland, you can also bring a claim in your local
        courts. Questions or complaints: {mail}.
      </p>
    </LegalPage>
  );
}
