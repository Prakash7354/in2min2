// The list of pages search engines may show (owner, 22 Nov 2026), sent to
// Google Search Console and Bing Webmaster Tools as https://in2min2.com/sitemap.xml.
// Guests' event pages are never listed (they are noindex). The Privacy, Terms
// and Prices pages join the list when the drafts are approved (DRAFT false).

import type { MetadataRoute } from "next";
import { DRAFT } from "@/components/legal/legal-page";
import { KIND_PAGES } from "@/lib/kind-pages";

const SITE = "https://in2min2.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/new`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/new/guide`, changeFrequency: "monthly", priority: 0.6 },
    // The page for each kind of event (in2min2.com/pasni…), never the guests' pages under them.
    ...KIND_PAGES.map((k) => ({ url: `${SITE}/${k.type}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
  if (!DRAFT) {
    pages.push(
      { url: `${SITE}/pricing`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    );
  }
  return pages;
}
