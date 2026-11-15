// /new: Design 2.0, the style page and the clickable prototype (owner's
// decision, 15 Nov 2026; CONCEPT 7e). Hidden: not linked anywhere, and search
// engines are told to ignore it. Nothing here touches the database.
//
// Dark by default with a light option. The choice sits on #b2 as
// data-theme, set by a tiny script before the first paint so there's no
// flash; theme.tsx changes it.

import type { Metadata, Viewport } from "next";
import "./new.css";

export const metadata: Metadata = {
  title: "In2Min2 · New look (prototype)",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0e0c1c" };

const setTheme = `try{var t=localStorage.getItem("in2min2.theme");document.currentScript.parentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){}`;

export default function NewLayout({ children }: LayoutProps<"/new">) {
  return (
    <div id="b2" className="b2" data-theme="dark" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: setTheme }} />
      {children}
    </div>
  );
}
