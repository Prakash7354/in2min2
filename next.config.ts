import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents and partialPrefetching (Next 16 defaults) are OFF: with
  // them on, the OpenNext Cloudflare build hung on every page (tested
  // 12 Nov 2026, Next 16.4.6, @opennextjs/cloudflare 1.20.17). Revisit when
  // OpenNext documents support.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Lets `npm run dev` use Cloudflare bindings (R2, secrets) the same way the
// deployed Worker does.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
