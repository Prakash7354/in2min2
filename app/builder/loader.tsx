"use client";

// The builder reads the host's saved draft from the phone, so it is drawn in
// the browser only. This shows a calm placeholder for the moment it loads.

import dynamic from "next/dynamic";

const Builder = dynamic(() => import("./builder"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-dvh place-items-center px-4">
      <p className="font-display text-2xl font-bold text-brand">Opening your event…</p>
    </div>
  ),
});

export default function BuilderLoader() {
  return <Builder />;
}
