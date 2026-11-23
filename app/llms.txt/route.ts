// /llms.txt (owner, 23 Nov 2026): what in2min2 is, in plain words for AI
// assistants (the llms.txt convention). Made from lib/site-facts.ts at each
// deploy, so the prices match the prices page.

import { llmsText } from "@/lib/site-facts";

export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText(Date.now()), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
