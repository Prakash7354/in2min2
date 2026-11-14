"use client";

// The event builder. One question per screen, a live preview that is the real
// event page (components/event/event-view.tsx), and every change saved at once.
// Loaded only in the browser (see loader.tsx), because the draft lives on the
// host's own phone until sign-in is connected.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import EventView from "@/components/event/event-view";
import { eventType } from "@/lib/catalog";
import { applyType, clearDraft, loadDraft, newDraft, saveDraft, toViewData, type Draft } from "@/lib/draft";
import type { EventStageView } from "@/lib/event-view";
import { SignInDialog, useSession } from "./account";
import { RepliesDialog, useReplies } from "./replies";
import { StepLook, StepPublish, StepSwitches, StepType, StepWhen, StepWho, StepWords } from "./steps";
import { eventLink, TopBar } from "./topbar";
import { Button } from "./ui";

const STEPS = [
  { title: "What are you celebrating?", short: "Event", view: "card" },
  { title: "Who is it for?", short: "Who", view: "card" },
  { title: "When, where and how many", short: "When", view: "page" },
  { title: "The words", short: "Words", view: "card" },
  { title: "The look", short: "Look", view: "card" },
  { title: "Switches", short: "Switches", view: "page" },
  { title: "Check and publish", short: "Publish", view: "page" },
] as const satisfies readonly { title: string; short: string; view: EventStageView }[];

const VIEWS: { key: EventStageView; label: string }[] = [
  { key: "card", label: "Invitation" },
  { key: "page", label: "Event page" },
  { key: "live", label: "On the day" },
  { key: "after", label: "After" },
];

export default function Builder() {
  // A link like /builder?type=christmas (the home page's festive designs)
  // starts a new event of that kind; an event already being built is kept.
  const [draft, setDraft] = useState<Draft>(() => {
    const d = loadDraft();
    const asked = new URLSearchParams(window.location.search).get("type");
    return !d.eventType && asked && eventType(asked) ? { ...applyType(d, asked), step: 1 } : d;
  });
  const [now] = useState(() => Date.now());
  const [saveOk, setSaveOk] = useState(true);
  const [view, setView] = useState<EventStageView>(STEPS[draft.step]?.view ?? "card");
  const [full, setFull] = useState(false);
  const [device, setDevice] = useState<"phone" | "computer">("phone");
  const { session } = useSession();
  // The sign-in window: why it's asked for, and what to do once signed in.
  const [signIn, setSignIn] = useState<{ why: string; then?: () => void } | null>(null);
  const askSignIn = useCallback((why: string, then?: () => void) => setSignIn({ why, then }), []);
  // A short message at the bottom ("Link copied").
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const say = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const update = useCallback((fn: (d: Draft) => Draft) => setDraft((d) => fn(d)), []);
  // Guests' replies (0004): loaded once published and signed in, then every minute.
  const replies = useReplies(draft.eventId, session);
  const [showReplies, setShowReplies] = useState(false);
  const openReplies = useCallback(() => setShowReplies(true), []);

  // Save shortly after each change, and at once if the page is closed,
  // reloaded or put in the background, so the last letters typed are kept.
  const latest = useRef(draft);
  useEffect(() => {
    latest.current = draft;
    const timer = window.setTimeout(() => setSaveOk(saveDraft(draft)), 250);
    return () => window.clearTimeout(timer);
  }, [draft]);
  useEffect(() => {
    const flush = () => { saveDraft(latest.current); };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  // Full-screen preview: lock the page behind it and close on Escape.
  useEffect(() => {
    if (!full) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);

  const step = Math.min(Math.max(draft.step, 0), STEPS.length - 1);
  const goTo = (n: number) => {
    const next = Math.min(Math.max(n, 0), STEPS.length - 1);
    setDraft((d) => ({ ...d, step: next }));
    setView(STEPS[next].view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const canNext = step !== 0 || !!draft.eventType;
  const data = toViewData(draft);

  const props = { d: draft, update, now, session, askSignIn, say };
  const startAgain = () => { clearDraft(); setDraft(newDraft()); setView("card"); goTo(0); };
  const body = [
    <StepType key="type" {...props} />,
    <StepWho key="who" {...props} />,
    <StepWhen key="when" {...props} />,
    <StepWords key="words" {...props} />,
    <StepLook key="look" {...props} />,
    <StepSwitches key="switches" {...props} />,
    <StepPublish key="publish" {...props} goTo={goTo} replies={replies} openReplies={openReplies}
      onPreview={(v) => { setView(v); setFull(true); }}
      onStartAgain={startAgain} />,
  ][step];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="text-[22px]" aria-label="In2Min2 home">
            <Wordmark />
          </Link>
          <span className="flex min-w-0 items-center gap-1 sm:gap-3">
            <span className={`text-sm ${saveOk ? "text-muted max-[379px]:sr-only" : "font-semibold text-ink"}`} aria-live="polite">
              {saveOk ? "Saved" : "Not saved"}
            </span>
            <TopBar d={draft} session={session} goTo={goTo} askSignIn={askSignIn} say={say} onStartAgain={startAgain} replies={replies} openReplies={openReplies} />
          </span>
        </div>
        <nav aria-label="Steps" className="mx-auto w-full max-w-6xl px-4 pb-3">
          <ol className="flex items-start">
            {STEPS.map((s, i) => {
              const done = i < step, here = i === step;
              return (
                <li key={s.short} className="flex flex-1 items-center last:flex-none">
                  <button type="button" onClick={() => (i === 0 || draft.eventType ? goTo(i) : undefined)}
                    aria-current={here ? "step" : undefined} aria-label={`Step ${i + 1}: ${s.title}${done ? " (done)" : ""}`}
                    className="grid justify-items-center gap-1">
                    <span className={`grid size-8 place-items-center rounded-full font-display text-[15px] font-extrabold transition ${
                      here ? "bg-marigold text-ink ring-4 ring-marigold/30" : done ? "bg-brand text-white" : "border-2 border-line bg-card text-muted"}`}>
                      {done ? (
                        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
                      ) : i + 1}
                    </span>
                    <span className={`hidden text-xs sm:block ${here ? "font-bold text-ink" : "text-muted"}`}>{s.short}</span>
                  </button>
                  {i < STEPS.length - 1 && <span className={`mx-1 mb-0 h-0.5 flex-1 rounded-full sm:mb-5 ${done ? "bg-brand" : "bg-line"}`} aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 pb-36 pt-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        <section aria-labelledby="step-title" className="grid content-start gap-5">
          {draft.eventType && (
            <button type="button" onClick={() => setFull(true)}
              className="flex items-center gap-4 rounded-2xl border border-line bg-card p-3 text-left lg:hidden">
              <span className="pointer-events-none block h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-line" aria-hidden="true">
                <EventView data={data} view={view} now={now} thumb />
              </span>
              <span className="grid gap-0.5">
                <span className="font-semibold">Live preview</span>
                <span className="text-[15px] text-muted">Tap to see it full-screen, exactly as guests will.</span>
              </span>
            </button>
          )}
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand font-display text-4xl font-extrabold text-white shadow-[0_8px_20px_-10px_rgba(46,42,110,0.7)]" aria-hidden="true">
              {step + 1}
            </span>
            <div className="grid gap-0.5">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted">Step {step + 1} of {STEPS.length}</p>
              <h1 id="step-title" className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{STEPS[step].title}</h1>
            </div>
          </div>
          {body}
        </section>

        <aside className="hidden lg:block" aria-label="Live preview">
          <div className="sticky top-32 grid gap-3">
            <ViewTabs view={view} setView={setView} />
            <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto rounded-3xl border border-line bg-card shadow-[0_20px_40px_-24px_rgba(28,26,58,0.5)]">
              <EventView data={data} view={view} now={now} />
            </div>
            <Button kind="quiet" onClick={() => setFull(true)}>Open full-screen</Button>
          </div>
        </aside>
      </main>

      <nav aria-label="Back and next" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Button kind="quiet" onClick={() => goTo(step - 1)} disabled={step === 0}>Back</Button>
          {step < STEPS.length - 1 ? (
            <Button kind="main" onClick={() => goTo(step + 1)} disabled={!canNext} className="min-w-36">Next</Button>
          ) : (
            <span className="text-sm text-muted">Last step</span>
          )}
        </div>
      </nav>

      {toast && (
        <p role="status" className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-sm rounded-2xl bg-ink px-4 py-3 text-center font-semibold text-white shadow-lg">
          {toast}
        </p>
      )}

      {showReplies && (
        <RepliesDialog d={draft} state={replies} link={eventLink(draft)} onClose={() => setShowReplies(false)} say={say} />
      )}

      {signIn && (
        <SignInDialog why={signIn.why} onClose={() => setSignIn(null)}
          onDone={() => { const then = signIn.then; setSignIn(null); say("You're signed in."); then?.(); }} />
      )}

      {full && (
        <div role="dialog" aria-modal="true" aria-label="Full-screen preview" className="fixed inset-0 z-50 flex flex-col bg-ink/80"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2 bg-cream px-4 py-2">
            <ViewTabs view={view} setView={setView} />
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full bg-wash p-1 sm:flex">
                {(["phone", "computer"] as const).map((dv) => (
                  <button key={dv} type="button" aria-pressed={device === dv} onClick={() => setDevice(dv)}
                    className={`rounded-full px-3 py-1.5 text-sm font-bold ${device === dv ? "bg-card text-ink shadow" : "text-muted"}`}>
                    {dv === "phone" ? "Phone" : "Computer"}
                  </button>
                ))}
              </div>
              <Button kind="brand" onClick={() => setFull(false)}>Close</Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <div className={`mx-auto overflow-hidden rounded-2xl bg-card ${device === "phone" ? "max-w-[420px]" : "max-w-5xl"}`}>
              <EventView data={data} view={view} now={now} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewTabs({ view, setView }: { view: EventStageView; setView: (v: EventStageView) => void }) {
  return (
    <div role="tablist" aria-label="Which page" className="flex flex-wrap gap-1 rounded-full bg-wash p-1">
      {VIEWS.map((v) => (
        <button key={v.key} type="button" role="tab" aria-selected={view === v.key} onClick={() => setView(v.key)}
          className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${view === v.key ? "bg-card text-ink shadow" : "text-muted hover:text-ink"}`}>
          {v.label}
        </button>
      ))}
    </div>
  );
}
