"use client";

// "Share this page" under the event, so guests can pass the invitation on.

import { useState } from "react";
import { shareLink } from "@/lib/share";

export function ShareButton({ title, colour, textColour }: { title: string; colour: string; textColour: string }) {
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="grid justify-items-center gap-2 px-4 py-6">
      <button type="button"
        onClick={async () => {
          const r = await shareLink(window.location.href.split("?")[0], title);
          setNote(r === "copied" ? "Link copied" : r === "failed" ? "Couldn't share from this browser" : null);
        }}
        className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 font-bold shadow-sm"
        style={{ background: colour, color: textColour }}>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" /><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H16" />
        </svg>
        Share this page
      </button>
      <p role="status" className="min-h-5 text-sm font-semibold">{note}</p>
    </div>
  );
}
