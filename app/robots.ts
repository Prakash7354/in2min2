// robots.txt (owner, 22 Nov 2026): search engines may read the whole site
// except the app's own background addresses, and are pointed at the sitemap.
// Guests' event pages stay readable so engines can see their own "noindex".
// Cloudflare adds its content-signal notes above this.

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://in2min2.com/sitemap.xml",
    host: "https://in2min2.com",
  };
}
