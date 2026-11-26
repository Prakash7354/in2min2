// The "Connected services" list in /admin (owner's request, 26 Nov 2026: "so
// that I remember the apps and accounts"). Facts only: what each service
// does for in2min2, where to sign in, and what it costs. NEVER a password,
// key or secret here: this file is in the code on GitHub. Keep it in step with
// docs/CONCEPT.md 17a and CLAUDE.md when a service is added.

export type ServiceState = "live" | "check" | "planned" | "waiting";

export type Service = {
  name: string;
  does: string;
  login: string;          // where to sign in
  url?: string;
  cost: string;
  state: ServiceState;
  note?: string;
};

export const STATE_WORDS: Record<ServiceState, string> = {
  live: "In use", check: "Check it works", planned: "Planned, not built", waiting: "Waiting for a reply",
};

export const SERVICES: Service[] = [
  { name: "Cloudflare", does: "Runs the website (the Worker), keeps guests' photos (R2 bucket in2min2-photos) and nightly backups (R2 bucket in2min2-backups), the domain's DNS, the alert emails (Email Routing) and the \"are you a person?\" check (Turnstile).",
    login: "dash.cloudflare.com", url: "https://dash.cloudflare.com", cost: "Free now. Workers Paid (about $5 a month) is expected at launch (Recommended).", state: "live",
    note: "Pushing to GitHub main builds and deploys here (Workers › in2min2 › Settings › Build)." },
  { name: "Supabase", does: "The database and the email-code sign-in (London region, project txwpptuijtfeomzmakdx). Stores events, replies and enquiries.",
    login: "supabase.com › your project", url: "https://supabase.com/dashboard", cost: "Free until income covers it (Recommended). Free projects pause after a week unused; the hourly check keeps it awake.", state: "live",
    note: "Migrations 0001–0018 are run here (SQL Editor)." },
  { name: "GitHub", does: "Keeps the code (Prakash7354/in2min2). A push to main deploys the site.",
    login: "github.com", url: "https://github.com/Prakash7354/in2min2", cost: "Free", state: "live" },
  { name: "Resend", does: "Sends email from in2min2.com: the sign-in codes, and your replies to enquiries from /admin (from hello@in2min2.com).",
    login: "resend.com", url: "https://resend.com/emails", cost: "Free: 3,000 emails a month, 100 a day (check their pricing page for today's limit).", state: "check",
    note: "Replies need the Worker secret RESEND_API_KEY. Sign-in codes already use it through Supabase." },
  { name: "Google Gemini", does: "The AI writer that suggests the words of an invitation.",
    login: "aistudio.google.com", url: "https://aistudio.google.com", cost: "Free quota for now. Turn billing on only after sign-in protects the writer.", state: "live",
    note: "Worker secret GEMINI_API_KEY." },
  { name: "Stripe", does: "Will take payment for plans. Card details never touch in2min2.",
    login: "dashboard.stripe.com", url: "https://dashboard.stripe.com", cost: "No monthly fee; UK cards about 1.5% + 20p each.", state: "planned",
    note: "Payments start from February 2027. Money totals will appear on the admin home once built." },
  { name: "Google Search Console", does: "Shows how Google sees in2min2.com and takes the sitemap. Proved by a DNS record.",
    login: "search.google.com/search-console", url: "https://search.google.com/search-console", cost: "Free", state: "live" },
  { name: "Bing Webmaster Tools", does: "The same for Bing. Proved by a tag in the site's code (never remove it).",
    login: "bing.com/webmasters", url: "https://www.bing.com/webmasters", cost: "Free", state: "live" },
  { name: "Recraft", does: "Makes the artwork for borders and website pictures.",
    login: "recraft.ai", url: "https://www.recraft.ai", cost: "Paid plan needed for commercial rights (free-plan images belong to Recraft).", state: "waiting",
    note: "Waiting for Recraft to confirm the licence for API units and credit packs." },
  { name: "Pixabay", does: "Where the invitation music came from (Pixabay licence). Sources are in docs/reference/music.md.",
    login: "pixabay.com", url: "https://pixabay.com", cost: "Free", state: "live" },
  { name: "Domain: in2min2.com", does: "The website's address. Attached to the Worker in Cloudflare.",
    login: "Where you bought it (add it here)", cost: "Yearly renewal", state: "live" },
  { name: "ICO registration", does: "The UK data-protection fee for the business. Its number goes in components/legal/legal-page.tsx when issued.",
    login: "ico.org.uk", url: "https://ico.org.uk", cost: "Yearly fee", state: "waiting", note: "Pending." },
  { name: "Gochuchuro hub, Golf Society Home", does: "The parent company's central admin, to gather enquiries from in2min2 and Golf Society Home. Each keeps its own database; messages would be pushed to the hub.",
    login: "Later", cost: "—", state: "planned", note: "Enquiries already carry a source ('in2min2') ready for this." },
];

// Names only, never values. Set with: npx wrangler secret put NAME
export const SECRET_NAMES: { name: string; for: string }[] = [
  { name: "SUPABASE_SECRET_KEY", for: "Nightly backup and the new-enquiry alert" },
  { name: "ALERT_EMAIL", for: "Where the safety job's alert emails go" },
  { name: "GEMINI_API_KEY", for: "The AI writer" },
  { name: "RESEND_API_KEY", for: "Sending your replies from /admin" },
];
