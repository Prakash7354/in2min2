import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Pages made at build time (the website: home, the 18 event-kind pages,
// prices, privacy, terms) are served as they were made, from the Worker's
// static files, instead of being rendered again on every visit (owner's phone,
// 23 Nov 2026: "Error 1102: Worker exceeded resource limits" once the home page
// grew). Nothing on the site revalidates, so a read-only cache is all it needs;
// guests' event pages stay dynamic. Cache interception answers those visits
// before Next's server even starts.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
