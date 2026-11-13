# Instructions for Claude Code: In2Min2

Read `docs/CONCEPT.md` first. It holds what In2Min2 is, the pricing, the build plan (section 19) and the open decisions (section 21). Statements marked **Recommended** there are not yet confirmed by the owner. Build them so they are easy to change.

@AGENTS.md

## The owner

Prakash is not a developer. Explain anything he must do step by step, naming exact buttons and menus. Keep messages short, in plain British English. When reporting, say exactly what was tested and how (real phone, browser at phone width, local Worker, PGlite), and what was not tested. He has been told "all working" before when it wasn't.

## Standing rules

- **Never write a secret into a file that could be committed.** Locally: `.env.local` and `.dev.vars` (both git-ignored). On Cloudflare: `npx wrangler secret put NAME`. If a secret appears in chat, tell him to replace it.
- **Every event-owned table** has `event_id`, Row Level Security, and a check in `supabase/tests/schema.test.mjs` for each role (owner, co-host, helper, another host, the public).
- **The public never reads a table directly.** Public pages use security-definer functions (`public_event()`) that return only what a guest may see. Never open `guest_crm` to anonymous inserts; RSVPs go through a function.
- **Plan, hosting, custom domain, AI usage and money are written only by the server** (service key, after payment). The column grants at the end of `0001_init.sql` enforce this; keep them when adding columns.
- **IDs, never names** for people, events and photos. Money in whole pence.
- **Text limits** for the five AI boxes live in `lib/ai/copy.ts` and in the database. Change both together.
- **Migrations:** new numbered files in `supabase/migrations/`, never edit one that has been run. Give him the file with exact steps (Supabase › SQL Editor › New query › paste › Run) and remind him until he confirms it ran.
- **Next.js 16** differs from older versions. Read the guide in `node_modules/next/dist/docs/` before using an API. `cacheComponents` stays off (it hung the Cloudflare build). No `export const runtime = "edge"`.
- **Ask before adding a library, a paid service or a screen not in the concept.**
- Golf Society Home (`~/Desktop/GoChuchuro Folder/Golf Society Home Folder/golfsocietyhome/`) is a reference for patterns and SQL (`docs/CONCEPT.md` section 17). Read it; never change it from here.

## Before every commit

```
npm run typecheck && npm run lint && npm run test:db && npx opennextjs-cloudflare build
```

## Deploying

- **Preview address:** https://in2min2.pksgrg.workers.dev (until in2min2.com is bought).
- `npm run deploy` builds and deploys from this Mac.
- Pushing to `main` on GitHub deploys through Cloudflare's own build (Workers › in2min2 › Settings › Build), so it uses no GitHub Actions minutes. Build command `npx opennextjs-cloudflare build`, deploy command `npx opennextjs-cloudflare deploy` (set and working, 13 Nov 2026). Branch builds are not switched on; if they ever are, the non-production command is `npx opennextjs-cloudflare upload`.
- The Worker name `in2min2` in `wrangler.jsonc` must match the dashboard, or the Git build fails.
