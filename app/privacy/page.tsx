// in2min2.com/privacy: the privacy notice (UK GDPR), in plain English.
// Draft until the owner approves it (components/legal/legal-page.tsx).
// Facts here must match docs/CONCEPT.md sections 12a, 17a, 21 and 22.

import type { Metadata } from "next";
import Link from "next/link";
import { ADDRESS, CONTACT, Items, LegalPage, OWNER, legalMetadata, ICO_NUMBER } from "@/components/legal/legal-page";

export const metadata: Metadata = legalMetadata("Privacy notice", "What in2min2 collects, why, where it's kept, and for how long.");

const mail = <a href={`mailto:${CONTACT}`}>{CONTACT}</a>;

export default function Privacy() {
  return (
    <LegalPage
      current="/privacy"
      title="Privacy notice"
      intro={<p>This explains what in2min2 collects about hosts, organisers and guests, why, where it&apos;s kept and for how long, and your rights.</p>}
      short={[
        <>We collect as little as we can: your email to sign in, what you type about your event, guests&apos; replies, and the photos guests choose to add.</>,
        <>Your data is stored in London. We never sell it, never show adverts and never track you around the internet.</>,
        <>Event pages are not listed on Google or other search engines, unless the organiser of a public event chooses to show it. Guests’ photos never are. Photos have their hidden location removed.</>,
        <>Everything is deleted on a timetable. Guest details and photos go 30 days after an event page closes.</>,
        <>You can see, correct or delete your data at any time. Email {mail}.</>,
      ]}
    >
      <h2 id="who">1. Who we are</h2>
      <p>
        in2min2 is a service of GoChuchuro, run by {OWNER} as a sole trader in the UK. Under data protection law we
        are the &ldquo;controller&rdquo; of the information in this notice, except where section 4 says the host is responsible.
      </p>
      <ul>
        <li>Email: {mail}</li>
        <li>Post: {ADDRESS}</li>
        <li>ICO registration number: {ICO_NUMBER || "to be provided at launch"}</li>
      </ul>

      <h2 id="what">2. What we collect, and why</h2>
      <p>Each card says what we collect, why, the legal reason we&apos;re allowed to, and how long we keep it.</p>

      <h3>If you make an event (hosts and organisers)</h3>
      <Items items={[
        { what: "Your email address", lines: [
          ["Why", "To send your sign-in code, and to tell you about your event (for example, before your page closes)."],
          ["Legal reason", "To provide the service you asked for (contract)."],
          ["How long", "Until you delete your account. If an account isn't used for 2 years, we email you, then delete it."],
        ] },
        { what: "A message you send us (Contact us)", lines: [
          ["What", "Your name, email, optional phone number and your message."],
          ["Why", "To read your message and reply to you."],
          ["Legal reason", "Our legitimate interest in answering questions (and, if you are a customer, contract)."],
          ["How long", "Until we've answered and for up to 12 months after, then we delete it. You can ask us to delete it sooner."],
        ] },
        { what: "Your event's details", lines: [
          ["What", "Names of the people you celebrate and their family, the date, the place, the words, the running order and menu, your main photo, and the preview picture made from it."],
          ["Why", "To make your page and show it to the people you share it with."],
          ["Legal reason", "Contract."],
          ["How long", "Until your page closes, plus 30 days. Longer only if you choose to keep it for next year (section 6)."],
        ] },
        { what: "What you give the AI writer", lines: [
          ["Why", "When you press “Write it for me”, your event's facts go to Google's Gemini service, which writes suggested words."],
          ["Legal reason", "Contract."],
          ["How long", "We keep only a count of how many times you used it that day. Google keeps the request for a limited time to stop misuse, and doesn't use it to train or improve its products."],
        ] },
        { what: "Payments (from February 2027)", lines: [
          ["Why", "To take payment for a plan. Stripe handles your card: we never see or store the card number."],
          ["Legal reason", "Contract; and keeping tax records (legal obligation)."],
          ["How long", "6 years, as tax law requires: the amount, date and what it was for. No guest details."],
        ] },
        { what: "Organisers of public events", lines: [
          ["What", "The organiser's name and kind, whether anyone makes a profit, a charity number if any, and a contact."],
          ["Why", "Shown on the page, so buyers and guests know who runs the event."],
          ["Legal reason", "Legitimate interests: honesty and safety for the public."],
          ["How long", "As the event's details."],
        ] },
      ]} />

      <h3>If you&apos;re a guest</h3>
      <Items items={[
        { what: "Your reply", lines: [
          ["What", "Your name, whether you're coming, how many of you, and a message for the host if you write one."],
          ["Why", "So the host knows who's coming."],
          ["Legal reason", "We hold it for the host (section 4)."],
          ["How long", "Deleted 30 days after the event page closes."],
        ] },
        { what: "Food needs", lines: [
          ["What", "Only if the host asks, and only if you choose to tick them: vegetarian, vegan, halal, gluten-free, nut allergy or dairy-free. These can say something about your health or beliefs, so they're treated with extra care. (Access needs are coming later, in the same way.)"],
          ["Why", "So the host and caterer can look after you."],
          ["Legal reason", "Your explicit consent. You can withdraw it at any time: change your reply and untick them."],
          ["How long", "Deleted 30 days after the event page closes. Only the host sees them."],
        ] },
        { what: "Photos you add", lines: [
          ["What", "Each photo, made smaller on your phone with its hidden location removed before it is sent, a small copy for the gallery, and your name if you type one."],
          ["Why", "To share them with the other guests on the event page, and on a screen at the event."],
          ["Legal reason", "We hold them for the host (section 4)."],
          ["How long", "Deleted 30 days after the event page closes. Every photo has a “Please remove this photo” button."],
        ] },
      ]} />

      <h3>Everyone</h3>
      <Items items={[
        { what: "Technical records", lines: [
          ["What", "Your internet address, browser type and the pages opened, in our hosting provider's logs."],
          ["Why", "To keep in2min2 working and to stop attacks and misuse."],
          ["Legal reason", "Legitimate interests: keeping the service safe."],
          ["How long", "A few days."],
        ] },
      ]} />

      <h2 id="never">3. What we never do</h2>
      <ul>
        <li>Sell, rent or swap your data.</li>
        <li>Show adverts, or use advertising or tracking cookies.</li>
        <li>Use face recognition.</li>
        <li>List guests’ photos on search engines, or an event page unless its organiser chooses to.</li>
        <li>Use your words or photos to train AI.</li>
        <li>Send you marketing unless you&apos;ve said yes.</li>
      </ul>

      <h2 id="hosts">4. Guests&apos; details: who is responsible</h2>
      <p>
        The host or organiser decides who to invite and what to ask. We look after guests&apos; replies, photos and messages for them, under a written
        agreement (section 5 of our <Link href="/terms#guests">terms</Link>), and use them only to run that event.
      </p>
      <ul>
        <li><strong>Family events:</strong> the host is usually a private person. We still keep your details safe and delete them on time.</li>
        <li><strong>Public events:</strong> the organiser named on the page is responsible for how they use your details.</li>
      </ul>
      <p>To change or remove something, ask the host, or write to us at {mail} and we&apos;ll help.</p>

      <h2 id="helpers">5. Who helps us</h2>
      <p>These companies run parts of in2min2 for us. Each may use your data only to do that job, under a contract.</p>
      <Items items={[
        { what: "Supabase", lines: [["Does", "Our database, sign-in, and each event's main photo and preview picture"], ["Where", "London, UK"]] },
        { what: "Cloudflare", lines: [["Does", "Hosting, security, and guests' photos"], ["Where", "Worldwide network; stored files in Europe"]] },
        { what: "Google (Gemini)", lines: [["Does", "The AI writer"], ["Where", "Google's data centres, including the USA"]] },
        { what: "Resend", lines: [["Does", "Sends sign-in codes and event emails"], ["Where", "Sent from Ireland; a US company"]] },
        { what: "Stripe (from February 2027)", lines: [["Does", "Takes payments"], ["Where", "UK, Europe and the USA"]] },
      ]} />
      <p>
        When data goes outside the UK, it&apos;s protected by the safeguards UK law approves: UK &ldquo;adequacy&rdquo; decisions, the UK Extension to the
        EU-US Data Privacy Framework, or the UK&apos;s International Data Transfer Addendum.
      </p>

      <h2 id="how-long">6. How long we keep things</h2>
      <ul>
        <li><strong>An event page</strong> is online until its plan ends: 90 days to 12 months after the event.</li>
        <li><strong>Guest details, photos and messages</strong> are deleted 30 days after the page closes. The host gets a warning email first, and can download the photos. A host can press &ldquo;Delete everything&rdquo; at any time.</li>
        <li><strong>Kept for next year</strong>, only if the host chooses: the guest list and the page details, offline, for up to 13 months after the event. Any guest can ask to be taken off.</li>
        <li><strong>Your account:</strong> until you delete it, or after 2 years without use. We email you first.</li>
        <li><strong>Payment records:</strong> 6 years, for tax.</li>
        <li><strong>Backups:</strong> 30 days.</li>
        <li><strong>A draft on your phone</strong> stays in your browser until you start a new event or clear your browser.</li>
      </ul>

      <h2 id="children">7. Children</h2>
      <p>
        Accounts are for adults (18 and over). Children can be guests, and can appear in photos with their family&apos;s permission. Event pages are
        open only to people with the link, not listed on search engines unless the organiser of a public event chooses to, with no adverts, tracking or location. Organisers of public events must
        have parents&apos; permission before showing under-18s in team photos.
      </p>

      <h2 id="cookies">8. Cookies and storage on your device</h2>
      <p>
        We use no advertising or tracking cookies, so there&apos;s no cookie banner. Your browser stores only what in2min2 needs to work: that
        you&apos;re signed in, the event you&apos;re building, and, if you reply to an invitation, your reply, so you can change it later. If you add
        photos, it also keeps a random number that counts how many your phone has added, and any photos still waiting to send.
      </p>

      <h2 id="rights">9. Your rights</h2>
      <p>You can ask us to:</p>
      <ul>
        <li>give you a copy of your data;</li>
        <li>correct it;</li>
        <li>delete it;</li>
        <li>stop or limit using it, or object to how we use it;</li>
        <li>give it to you in a form you can take elsewhere.</li>
      </ul>
      <p>
        Email {mail}. It&apos;s free, and we reply within one month. If you&apos;re unhappy with our answer, you can complain to the Information
        Commissioner&apos;s Office (ICO) at <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">ico.org.uk</a> or on
        0303 123 1113. Please tell us first, so we can put it right.
      </p>

      <h2 id="safety">10. How we keep it safe</h2>
      <ul>
        <li>Everything is encrypted on its way to us and where it&apos;s stored.</li>
        <li>Each host sees only their own events. These rules are tested automatically before every change to in2min2.</li>
        <li>Guests&apos; personal links can&apos;t be guessed.</li>
        <li>We never hold card numbers.</li>
      </ul>
      <p>
        If something ever goes wrong that puts you at risk, we&apos;ll tell you, and tell the ICO within 72 hours.
      </p>

      <h2 id="changes">11. Changes to this notice</h2>
      <p>
        When something changes, we update this page and its date. If the change matters to you, we&apos;ll email account holders first.
      </p>
    </LegalPage>
  );
}
