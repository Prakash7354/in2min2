"use client";

// The prototype reads its answers from this phone, so it's drawn in the
// browser only (like app/builder/loader.tsx).

import dynamic from "next/dynamic";

const shell = () => <div className="b2-shell" aria-busy="true" />;
export const QuickStart = dynamic(() => import("./quick-start"), { ssr: false, loading: shell });
export const EventHome = dynamic(() => import("./home/event-home"), { ssr: false, loading: shell });
export const StyleGuide = dynamic(() => import("./style/style-guide"), { ssr: false, loading: shell });
