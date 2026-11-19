"use client";

// Builder 2.0 (in2min2.com/new; CONCEPT 7e): the real builder in the new
// look. A short Quick start whose screens and quick choices adapt to each
// kind of event, then the event Home, where everything else lives in big
// tiles. Share, the bell (updates and reminders) and the account (sign in
// and out) sit in the top bar, apart from the steps.
//
// It works on the same draft as the classic builder (/builder), so an event
// can be opened in either. Loaded only in the browser (see loader.tsx).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { COPY_KEYS, type Adjustment, type CopyKey } from "@/lib/ai/copy";
import { eventType } from "@/lib/catalog";
import { applyType, clearDraft, fingerprint, loadDraft, markBoxes, newDraft, saveDraft, type Draft } from "@/lib/draft";
import { saveMedia } from "@/lib/media-upload";
import { publishDraft } from "@/lib/publish";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "../builder/account";
import { usePhotos } from "../builder/photos";
import { useReplies } from "../builder/replies";
import { aiWrite } from "./ai";
import { B2Context, type AiState, type B2, type PubState } from "./context";
import { Home } from "./home";
import { suggestedSlug, suggestedWords, titleFor } from "./kinds";
import { useNav, type Nav, type Screen } from "./nav";
import { PanelView } from "./panels";
import { QuickScreen, quickSteps } from "./quick";
import { Sheets } from "./sheets";
import { hintDone, spring, useToast } from "./ui";
import { WELCOMED } from "./welcome";

// Screens slide in from the side you're going towards. The old screen
// leaves quickly, so the next one is there in a moment.
const slide = {
  enter: (d: number) => ({ x: d * 48, opacity: 0 }),
  centre: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -32, opacity: 0, transition: { duration: 0.14, ease: "easeIn" as const } }),
};

// A link like /new?type=christmas (the home page's festive designs) starts a
// new event of that kind; an event already being built is kept.
function firstDraft(): Draft {
  const d = loadDraft();
  const asked = new URLSearchParams(window.location.search).get("type");
  return !d.eventType && asked && eventType(asked) ? { ...applyType(d, asked), quickAt: "who" } : d;
}

function startPlace(d: Draft): Omit<Nav, "n"> {
  const base = { panel: null, sheet: null };
  if (d.quickDone || d.eventId || (d.eventType && d.title.trim() && d.date)) return { ...base, screen: "home" };
  if (!d.eventType) return { ...base, screen: hintDone(WELCOMED) ? "what" : "welcome" };
  const at = d.quickAt as Screen | undefined;
  return { ...base, screen: at && (quickSteps(d).includes(at) || at === "ready") ? at : "who" };
}

// Things that follow other things until the host takes over: the event's
// name follows the names, and ready-made words follow the facts.
function derive(prev: Draft, next: Draft): Draft {
  let d = next;
  if (d.stars.names !== prev.stars.names || d.milestone !== prev.milestone || d.eventType !== prev.eventType) {
    if (!prev.title.trim() || prev.title === titleFor(prev)) d = { ...d, title: titleFor(d) };
  }
  if (d.wordsBy === "suggested") {
    const w = suggestedWords(d);
    if (COPY_KEYS.some((k) => w[k] !== d.copy[k])) d = { ...d, copy: w };
  }
  return d;
}

export default function Builder2() {
  const [draft, setDraft] = useState<Draft>(firstDraft);
  const [now] = useState(() => Date.now());
  const [saved, setSaved] = useState(true);
  const [toast, say] = useToast();
  const { session } = useSession();
  const sensitive = !!eventType(draft.eventType)?.sensitive;
  const replies = useReplies(draft.eventId, session);
  const photos = usePhotos(draft.eventId, session, draft.scale, sensitive);
  const { nav, dir, go, back: navBack, replace } = useNav(() => startPlace(draft));

  const update = useCallback((fn: (d: Draft) => Draft) => setDraft((d) => derive(d, fn(d))), []);

  // Save shortly after each change, and at once if the page is closed,
  // reloaded or put in the background, so the last letters typed are kept.
  const latest = useRef(draft);
  useEffect(() => {
    latest.current = draft;
    const timer = window.setTimeout(() => setSaved(saveDraft(draft)), 250);
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

  // Back: close the sheet, then the panel, then the previous Quick start screen.
  const back = useCallback(() => navBack((cur) => {
    if (cur.sheet) return { sheet: null };
    if (cur.panel) return { panel: null };
    const steps = quickSteps(latest.current);
    if (cur.screen === "ready") return { screen: steps[steps.length - 1] };
    const i = steps.indexOf(cur.screen);
    return i > 0 ? { screen: steps[i - 1] } : {};
  }), [navBack]);

  // Escape closes an open panel (sheets close themselves).
  useEffect(() => {
    if (!nav.panel || nav.sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") void back(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav.panel, nav.sheet, back]);

  // Coming back to the Home tiles puts the page where it was.
  const homeY = useRef(0);
  const open = useCallback((panel: NonNullable<Nav["panel"]>) => {
    if (!latest.current.eventType && panel !== "settings") return;
    homeY.current = window.scrollY;
    go({ panel, sheet: null });
  }, [go]);
  const openSheet = useCallback((sheet: NonNullable<Nav["sheet"]>) => go({ sheet }), [go]);
  const placeKey = nav.panel ? `p:${nav.panel}` : `s:${nav.screen}`;
  const scrollTo = useRef(0);
  useEffect(() => { scrollTo.current = placeKey === "s:home" && dir < 0 ? homeY.current : 0; }, [placeKey, dir]);

  // ── Sign-in, in a sheet, then carry on with what was asked ──
  const [signIn, setSignIn] = useState<{ why: string; then?: () => void }>({ why: "" });
  const askSignIn = useCallback((why: string, then?: () => void) => {
    setSignIn({ why, then });
    go({ sheet: "signin" });
  }, [go]);
  const signedIn = useCallback(async () => {
    const then = signIn.then;
    await back();
    say("You're signed in.");
    then?.();
  }, [signIn, back, say]);

  // ── The AI writer ──
  const [ai, setAi] = useState<AiState>({ busy: null, error: null, trimmed: false, done: false });
  // One AI write at a time (each one counts towards the host's 20 a day), and
  // the background write happens once per visit.
  const aiBusy = useRef(false);
  const autoWrote = useRef(false);
  const writeAllRef = useRef<() => Promise<void>>(async () => {});
  // The words go into the boxes as they're written, so the host sees them
  // appear. If the writing then fails, the words from before come back.
  const live = useCallback((keys: CopyKey[]) => {
    const { copy, translation, wordsBy, copyBy } = latest.current;
    let touched = false;
    const filled = (b?: Partial<Record<CopyKey, string>>) => Object.fromEntries(Object.entries(b ?? {}).filter(([, v]) => v)) as Partial<Record<CopyKey, string>>;
    const onPartial = (c: Partial<Record<CopyKey, string>>, tr?: Partial<Record<CopyKey, string>>) => {
      const got = keys.filter((k) => c[k]);
      if (!got.length) return;
      touched = true;
      update((x) => ({
        ...x, wordsBy: "ai", copy: { ...x.copy, ...filled(c) }, copyBy: markBoxes(x, got, "ai"),
        translation: tr ? { ...x.translation, ...filled(tr) } : x.translation,
      }));
    };
    const undo = () => { if (touched) update((x) => ({ ...x, copy, translation, wordsBy, copyBy })); };
    return { onPartial, undo };
  }, [update]);

  const writeAll = useCallback(async () => {
    if (aiBusy.current) return;
    aiBusy.current = true;
    autoWrote.current = true;
    setAi({ busy: "all", error: null, trimmed: false, done: false });
    const w = live([...COPY_KEYS]);
    const r = await aiWrite(latest.current, undefined, w.onPartial);
    aiBusy.current = false;
    if (!r.ok) {
      w.undo();
      setAi({ busy: null, error: r.signIn ? null : r.message, at: "all", trimmed: false, done: false });
      if (r.signIn) askSignIn("Sign in (free) and the AI writes your words straight away, in up to two languages.", () => void writeAllRef.current());
      return;
    }
    update((x) => ({
      ...x, wordsBy: "ai", copy: { ...x.copy, ...r.copy }, copyBy: markBoxes(x, COPY_KEYS.filter((k) => r.copy[k]), "ai"),
      translation: r.translation ? { ...x.translation, ...r.translation } : x.translation,
    }));
    setAi({ busy: null, error: null, trimmed: r.trimmed, done: true });
  }, [askSignIn, update, live]);
  useEffect(() => { writeAllRef.current = writeAll; }, [writeAll]);

  const writeOne = useCallback(async (key: CopyKey, adjust: Adjustment) => {
    if (aiBusy.current) return;
    aiBusy.current = true;
    setAi((a) => ({ ...a, busy: key, error: null }));
    const w = live([key]);
    const r = await aiWrite(latest.current, { key, adjust }, w.onPartial);
    aiBusy.current = false;
    if (!r.ok) {
      w.undo();
      setAi((a) => ({ ...a, busy: null, error: r.signIn ? null : r.message, at: key }));
      if (r.signIn) askSignIn("Sign in (free) to let the AI change your words.");
      return;
    }
    const text = r.copy[key];
    const tr = r.translation?.[key];
    update((x) => ({
      ...x, wordsBy: "ai", copy: text ? { ...x.copy, [key]: text } : x.copy, copyBy: text ? markBoxes(x, [key], "ai") : x.copyBy,
      translation: tr ? { ...x.translation, [key]: tr } : x.translation,
    }));
    setAi((a) => ({ ...a, busy: null, trimmed: r.trimmed }));
  }, [askSignIn, update, live]);

  // Once the facts are in and the host is signed in, the AI writes the words
  // in the background while they choose a look and a photo (once per visit).
  useEffect(() => {
    if (autoWrote.current || !session || !["look", "photo", "ready"].includes(nav.screen)) return;
    const d = latest.current;
    const blank = COPY_KEYS.every((k) => !d.copy[k].trim());
    if (d.wordsBy !== "suggested" && !(blank && !d.wordsBy)) return;
    const t = window.setTimeout(() => void writeAll(), 0);
    return () => window.clearTimeout(t);
  }, [session, nav.screen, writeAll]);

  // ── Publishing ──
  const [pub, setPub] = useState<PubState>({ busy: false, error: null, note: null, done: false });
  const publishRef = useRef<() => Promise<void>>(async () => {});
  const publish = useCallback(async () => {
    const { data: auth } = await supabase().auth.getSession();
    if (!auth.session) {
      askSignIn("Sign in to publish. It's free, and it keeps your event safe in your account.", () => void publishRef.current());
      return;
    }
    const d0 = latest.current;
    const d = { ...d0, slug: d0.slug || suggestedSlug(d0) };
    setPub({ busy: true, error: null, note: null, done: false });
    const r = await publishDraft(supabase(), d);
    if (!r.ok) {
      setPub({ busy: false, error: r.message, note: null, done: false });
      return;
    }
    // The main photo and the picture WhatsApp shows (0005). If this fails the
    // page is still published; it just shows initials and no picture.
    const m = await saveMedia(supabase(), { ...d, eventId: r.eventId }, r.eventId).catch((e: unknown) => ({ ok: false as const, message: String(e) }));
    update((x) => {
      // Keep the web address, so changing the name later never breaks links already shared.
      const next = {
        ...x, slug: x.slug || r.path.split("/")[2] || d.slug, eventId: r.eventId, publishedPath: r.path, shortPath: r.shortPath,
        offerClaimed: x.offerClaimed || !!r.offer?.ok, quickDone: true,
        ...(m.ok ? { coverKey: m.coverKey, shareKey: m.shareKey, mediaHash: m.mediaHash, heroKeys: m.heroKeys, heroHash: m.heroHash } : {}),
      };
      return { ...next, publishedHash: fingerprint(next) };
    });
    const photoNote = !m.ok
      ? `Your page is published, but the photo and the WhatsApp picture couldn't be saved yet. Press "Update my page" to try again. (Details for Claude Code: ${m.message})`
      : m.heroNote ? `Your page is published, but the extra photos at the top couldn't be saved yet. Press "Update my page" to try again. (Details for Claude Code: ${m.heroNote})` : null;
    setPub({ busy: false, error: null, note: [r.offer?.message, photoNote].filter(Boolean).join(" ") || null, done: true });
    say(d0.eventId ? "Your page is updated." : "Published! Now share it.");
    // The first time: close this panel, land on the event Home, and open Share.
    if (!d0.eventId) {
      await back();
      replace({ screen: "home", panel: null, sheet: null });
      go({ sheet: "share" });
    }
  }, [askSignIn, update, say, back, go, replace]);
  useEffect(() => { publishRef.current = publish; }, [publish]);

  const startAgain = useCallback(() => {
    clearDraft();
    setDraft(newDraft());
    autoWrote.current = false;
    setAi({ busy: null, error: null, trimmed: false, done: false });
    setPub({ busy: false, error: null, note: null, done: false });
    replace({ screen: hintDone(WELCOMED) ? "what" : "welcome", panel: null, sheet: null });
  }, [replace]);

  const ctx = useMemo<B2>(() => ({
    d: draft, update, now, saved, session, say, nav, go, back, open, openSheet, askSignIn,
    ai, writeAll, writeOne, pub, publish, replies, photos, startAgain,
  }), [draft, update, now, saved, session, say, nav, go, back, open, openSheet, askSignIn, ai, writeAll, writeOne, pub, publish, replies, photos, startAgain]);

  return (
    <B2Context.Provider value={ctx}>
      <MotionConfig reducedMotion="user">
        <div className="b2-shell" data-wide={placeKey === "s:home" ? "" : undefined}>
          <AnimatePresence mode="wait" custom={dir} initial={false} onExitComplete={() => window.scrollTo(0, scrollTo.current)}>
            <motion.div key={placeKey} custom={dir} variants={slide} initial="enter" animate="centre" exit="exit" transition={spring}>
              {nav.panel ? <PanelView panel={nav.panel} /> : nav.screen === "home" ? <Home /> : <QuickScreen screen={nav.screen} />}
            </motion.div>
          </AnimatePresence>
          <Sheets signInWhy={signIn.why} onSignedIn={() => void signedIn()} />
          {toast}
        </div>
      </MotionConfig>
    </B2Context.Provider>
  );
}
