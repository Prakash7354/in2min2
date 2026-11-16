"use client";

// Builder 2.0 reads the host's event from this phone, so it's drawn in the
// browser only (like app/builder/loader.tsx).

import dynamic from "next/dynamic";

const shell = () => <div className="b2-shell" aria-busy="true" />;
export const Builder2 = dynamic(() => import("./app"), { ssr: false, loading: shell });
export const StyleGuide = dynamic(() => import("./style/style-guide"), { ssr: false, loading: shell });
