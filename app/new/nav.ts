"use client";

// Where the host is in Builder 2.0, kept in the browser's history so the
// phone's own Back button (or a swipe back) steps back a screen or closes the
// open panel, instead of leaving the builder. A reload keeps the place too.
//
// Next.js 16 supports the native history API: it copies its own state into
// each entry we push, and a Back to one of our entries keeps this page.

import { useCallback, useEffect, useRef, useState } from "react";

export type Screen = "what" | "who" | "organiser" | "profit" | "when" | "where" | "parking" | "look" | "photo" | "ready" | "home";
export type Panel = "words" | "details" | "people" | "plan" | "look" | "settings" | "publish" | "preview" | "replies" | "photos" | "announce" | "guests";
export type SheetKey = "share" | "bell" | "account" | "signin" | "preview";
export type Nav = { n: number; screen: Screen; panel: Panel | null; sheet: SheetKey | null };
type Place = Omit<Nav, "n">;

const read = (): Nav | null => {
  const s = (typeof window !== "undefined" ? window.history.state : null) as { b2?: Nav } | null;
  return s?.b2 && typeof s.b2.screen === "string" ? s.b2 : null;
};

export function useNav(start: () => Place) {
  const [nav, setNavState] = useState<Nav>(() => read() ?? { n: 0, ...start() });
  const ref = useRef(nav);
  // Which way the screens slide: forwards (1) or back (-1).
  const [dir, setDir] = useState(1);
  const setNav = useCallback((next: Nav) => {
    setDir(next.n < ref.current.n ? -1 : 1);
    ref.current = next;
    setNavState(next);
  }, []);

  // Mark the first entry as ours, and follow Back and Forward.
  useEffect(() => {
    if (!read()) window.history.replaceState({ ...(window.history.state ?? {}), b2: ref.current }, "");
    const onPop = (e: PopStateEvent) => {
      const b2 = (e.state as { b2?: Nav } | null)?.b2;
      if (b2) setNav(b2);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setNav]);

  // Forward: a new history entry.
  const go = useCallback((patch: Partial<Place>) => {
    const next = { ...ref.current, ...patch, n: ref.current.n + 1 };
    window.history.pushState({ b2: next }, "");
    setNav(next);
  }, [setNav]);

  // Change the current place without adding to history (e.g. after "Start again").
  const replace = useCallback((patch: Partial<Place>, slide = 1) => {
    const next = { ...ref.current, ...patch };
    window.history.replaceState({ ...(window.history.state ?? {}), b2: next }, "");
    setNav(next);
    setDir(slide);
  }, [setNav]);

  // Back: the browser's own Back when there's an entry of ours behind this
  // one; otherwise `parent` says where Back leads. Resolves once it's done,
  // so a next step (opening something else) starts from the right place.
  const back = useCallback((parent: (cur: Nav) => Partial<Place>) => new Promise<void>((resolve) => {
    if (ref.current.n > 0) {
      const done = () => { window.removeEventListener("popstate", done); resolve(); };
      window.addEventListener("popstate", done);
      window.history.back();
      window.setTimeout(done, 700);
    } else {
      replace(parent(ref.current), -1);
      resolve();
    }
  }), [replace]);

  return { nav, dir, go, back, replace };
}
