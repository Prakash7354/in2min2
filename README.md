# In2Min2

Your event online in two minutes: invitation and RSVP before the day, live schedule and photo wall on the day, memory book after. A GoChuchuro product.

- **What and why:** [docs/CONCEPT.md](docs/CONCEPT.md) (concept, pricing, domain, build plan)
- **Rules for Claude Code:** [CLAUDE.md](CLAUDE.md)
- **Preview:** https://in2min2.pksgrg.workers.dev

## Run it on this Mac

```
npm install
cp .env.example .env.local    # then paste your Gemini key into .env.local
npm run dev                   # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run typecheck` / `npm run lint` | Checks |
| `npm run test:db` | Runs every migration on a real Postgres (PGlite) and checks each role's access; checks the builder's catalogue matches the database |
| `npm run preview` | Builds for Cloudflare and runs it locally in the Workers runtime |
| `npm run deploy` | Builds and deploys to Cloudflare from this Mac |

## Layout

```
app/                      Next.js pages and API routes
  api/generate-copy/      AI writer (Gemini, strict JSON, one or two languages)
  builder/                The event builder: seven steps and a live preview
  fonts.ts                Every font, self-hosted (brand and event text styles)
components/event/         The event page itself (card, page, on the day, after),
                          shared by the builder preview and the public page
lib/catalog.ts            Event types, plans, prices, palettes, styles, languages
                          (mirrors the database; checked by npm run test:db)
lib/draft.ts              The host's event while building it
lib/publish.ts            Publishing a draft as the signed-in host
lib/public-event.ts       The public page's data (public_event() → the same view)
lib/supabase/             Public project values, browser client, server calls
app/[type]/[slug]/        The page guests open; app/e/[code] is the short link
lib/ai/copy.ts            The five AI text boxes and their limits
supabase/migrations/      Database, in order (run in Supabase › SQL Editor)
supabase/tests/           Database checks (npm run test:db)
docs/CONCEPT.md           The plan
docs/ACTION-PLAN.md       The owner's step-by-step list
wrangler.jsonc            Cloudflare Worker settings (public values only)
```

## Secrets

Never in the code or on GitHub. Locally in `.env.local`; on Cloudflare with `npx wrangler secret put NAME`. See docs/CONCEPT.md section 17a for the list.
