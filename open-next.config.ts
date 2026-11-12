import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default OpenNext set-up for Cloudflare Workers. When pages start using
// Next's cache (ISR), add an R2 incremental cache here and its bucket binding
// in wrangler.jsonc. Photos will use a separate R2 bucket.
export default defineCloudflareConfig({});
