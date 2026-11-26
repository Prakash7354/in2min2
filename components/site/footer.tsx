// The website's footer, on the home page and every event page (owner, 23 Nov
// 2026): links to every kind of event's page, so people and search engines
// can reach them all.

import Link from "next/link";
import { LegalLinks } from "@/components/legal/legal-page";
import { KIND_PAGES } from "@/lib/kind-pages";

export function SiteFooter() {
  return (
    <footer className="s-footer">
      <div className="s-wrap s-footgrid">
        <div className="s-footbrand">
          {/* eslint-disable-next-line @next/next/no-img-element -- the logo */}
          <img src="/brand/logo.png" alt="in2min2: Create, Invite, Celebrate" width={640} height={330} />
          <p>Beautiful invitations and event pages, from the invitation to the thank-you.</p>
        </div>
        <nav aria-label="Make an event">
          <p className="s-foothead">Make an event</p>
          <Link href="/new">Start free</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#prices">Prices</Link>
          <Link href="/#questions">Questions</Link>
          <Link href="/new/guide">Step-by-step guide</Link>
          <Link href="/contact">Contact us</Link>
          <a href="mailto:hello@in2min2.com">hello@in2min2.com</a>
        </nav>
        <nav aria-label="Events" className="s-footkinds">
          <p className="s-foothead">Events</p>
          {KIND_PAGES.map((k) => <Link key={k.type} href={`/${k.type}`}>{k.name}</Link>)}
        </nav>
      </div>
      <div className="s-wrap s-footlow">
        <p>© 2026 in2min2 · A GoChuchuro product · Made in the UK</p>
        <LegalLinks className="s-legal" />
      </div>
    </footer>
  );
}
