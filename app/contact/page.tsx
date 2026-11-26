// in2min2.com/contact: anyone can send the owner a message (26 Nov 2026,
// docs/PLAN-admin-enquiries.md). The messages arrive in in2min2.com/admin.

import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { CONTACT } from "@/components/legal/legal-page";
import { ContactForm } from "./form";
import "../site.css";

export const metadata: Metadata = {
  title: "Contact us · in2min2",
  description: "Send in2min2 a question or a message. We read every one.",
  alternates: { canonical: "https://in2min2.com/contact" },
};

export default function Contact() {
  return (
    <div className="s-site">
      <SiteHeader />
      <main>
        <section className="s-section">
          <div className="s-wrap" style={{ maxWidth: 680 }}>
            <p className="s-kicker">Contact us</p>
            <h1 className="s-h1">Ask us anything</h1>
            <p className="s-lead">A question about a page, a price, or something that isn&apos;t working? Send us a message and we&apos;ll reply by email.</p>
            <ContactForm />
            <p className="mt-6 text-[15px] text-muted">
              Prefer email? Write to <a href={`mailto:${CONTACT}`} className="font-semibold underline underline-offset-4">{CONTACT}</a>.
              See how we look after what you send in our <Link href="/privacy" className="font-semibold underline underline-offset-4">privacy notice</Link>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
