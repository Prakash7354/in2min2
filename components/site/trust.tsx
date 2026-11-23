// "No strings" and "Your data, protected" (owner, 23 Nov 2026: reduce the
// fear of a long tie, and give UK GDPR big emphasis). On the home page and
// every event page. Only what's true now: nothing to download, no
// subscription, close any time (0015), data in the UK and Europe, hosts only,
// never sold, deletion 30 days after a page closes (the privacy notice's
// promise; the Worker's clean-up still has to be switched on).

import Link from "next/link";
import { DRAFT, ICO_NUMBER } from "@/components/legal/legal-page";

const NO_STRINGS: [string, string, string][] = [
  ["📲", "Nothing to download", "Works in any phone’s web browser, for you and for every guest."],
  ["🤝", "No subscription, no contract", "Free until 90 days after your event. Pay once, only if you want more."],
  ["✋", "Stop whenever you like", "Close your page at any time, without asking anyone."],
];

const DATA = [
  "We collect only what your event needs.",
  "Kept in the UK and Europe, protected by UK data protection law (UK GDPR).",
  "Only your event’s hosts see replies, messages and food needs.",
  "Never sold. No adverts. No tracking cookies.",
  "Guests’ details and photos are deleted 30 days after your page closes.",
  "See, correct or delete your data at any time: just email hello@in2min2.com.",
];

export function TrustBand({ tint = false }: { tint?: boolean }) {
  return (
    <section id="trust" className={`s-section${tint ? " s-tint" : ""}`}>
      <div className="s-wrap">
        <p className="s-kicker">No strings</p>
        <h2 className="s-h2">Use it when you need it. Stop when you like.</h2>
        <ul className="s-nostrings">
          {NO_STRINGS.map(([icon, title, line]) => <li key={title}><span aria-hidden="true">{icon}</span><b>{title}</b><span>{line}</span></li>)}
        </ul>
        <div className="s-gdpr">
          <div className="s-gdpr-head">
            <span className="s-gdpr-shield" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /><path d="M8.5 12.2l2.4 2.4 4.6-4.8" />
              </svg>
            </span>
            <div>
              <p className="s-kicker">UK GDPR</p>
              <h3 className="s-gdpr-h">Your data, protected</h3>
            </div>
          </div>
          <ul className="s-gdpr-list">
            {DATA.map((x) => <li key={x}>{x}</li>)}
          </ul>
          {(!DRAFT || ICO_NUMBER) && (
            <p className="s-gdpr-foot">
              {!DRAFT && <Link href="/privacy">Read our privacy notice</Link>}
              {ICO_NUMBER && <span>Registered with the ICO: {ICO_NUMBER}</span>}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
