// robots.txt (owner, 22–23 Nov 2026). Search engines may read the whole site
// except the app's background addresses, and are pointed at the sitemap.
// Guests' event pages stay readable to Google and Bing so they can see each
// page's own "noindex" (never listed).
//
// AI (23 Nov, "AI referral"): the assistants that search the web to answer
// people (ChatGPT search, Perplexity, Claude, DuckDuckGo's assistant) are
// welcome on the website, so they can find and recommend in2min2. No AI robot,
// searching or training, may read guests' pages (/{type}/…, /e/, /m/,
// /photographer/): they carry names, replies and photos.
// AI_MAY_LEARN is **Recommended**, not yet the owner's decision: true lets AI
// companies learn from the website (not guests' pages), so future AI models
// know in2min2 by name; false shuts their training robots out completely.
// Cloudflare adds its content-signal notes above this.

import type { MetadataRoute } from "next";
import { EVENT_TYPES } from "@/lib/catalog";

const AI_MAY_LEARN = true;

const AI_SEARCH = ["OAI-SearchBot", "PerplexityBot", "Claude-SearchBot", "DuckAssistBot"];
const AI_TRAINING = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "meta-externalagent", "Bytespider", "Amazonbot"];
const GUEST_PAGES = [...EVENT_TYPES.map((t) => `/${t.key}/`), "/e/", "/m/", "/photographer/"];

export default function robots(): MetadataRoute.Robots {
  const notGuests = { allow: "/", disallow: ["/api/", ...GUEST_PAGES] };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      { userAgent: AI_SEARCH, ...notGuests },
      { userAgent: AI_TRAINING, ...(AI_MAY_LEARN ? notGuests : { disallow: "/" }) },
    ],
    sitemap: `https://in2min2.com/sitemap.xml`,
    host: "https://in2min2.com",
  };
}
