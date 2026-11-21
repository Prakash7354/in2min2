"use client";

// "See what your guests get" on the website: the real envelope with a guest's
// name, then the real invitation page, with music, exactly as a guest gets it
// from the link. Closing it stops the music.

import { useEffect, useState } from "react";
import Link from "next/link";
import EventView from "@/components/event/event-view";
import { stopMusic } from "@/components/event/music";
import { Opening } from "@/components/event/opening";
import type { EventViewData } from "@/lib/event-view";

export function GuestDemoButton({ data, title, className, children }: { data: EventViewData; title: string; className?: string; children: React.ReactNode }) {
  const [step, setStep] = useState<"closed" | "envelope" | "page">("closed");
  const [now] = useState(() => Date.now());
  useEffect(() => {
    if (step === "closed") return;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { stopMusic(); setStep("closed"); } };
    window.addEventListener("keydown", key);
    return () => { html.style.overflow = before; window.removeEventListener("keydown", key); };
  }, [step]);
  const close = () => { stopMusic(); setStep("closed"); };
  return (
    <>
      <button type="button" className={className} onClick={() => setStep("envelope")}>{children}</button>
      {step !== "closed" && (
        <div className="s-demo" role="dialog" aria-modal="true" aria-label="What your guests get">
          <div className="s-demo-page"><EventView data={data} view="page" now={now} /></div>
          {step === "page" && (
            <div className="s-demo-bar">
              <button type="button" className="s-btn s-btn-ghost-light" onClick={close}>Close</button>
              <Link className="s-btn s-btn-go" href="/new" onClick={() => stopMusic()}>Make mine</Link>
            </div>
          )}
          {step === "envelope" && (
            <Opening data={{ ...data, envelope: true }} title={title} to="Maya & family" id="site-demo" preview={() => setStep("page")} />
          )}
        </div>
      )}
    </>
  );
}
