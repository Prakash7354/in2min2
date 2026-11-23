// /new: Design 2.0 (owner's decision, 15 Nov 2026; CONCEPT 7e). Builder 2.0,
// the real builder in the new look, and the style page. Since 20 Nov 2026 it
// is the builder the home page opens (search engines may list it; the style
// page stays hidden). It uses the same draft, sign-in and database as the
// classic /builder, which stays reachable but isn't linked from the site.
//
// It draws real event pages, so it carries every event font (each is
// downloaded only when a letter style uses it); without them, Handwritten,
// Calligraphy and Elegant fell back to the phone's plain letters.
//
// Dark by default with a light option. The choice sits on #b2 as
// data-theme, set by a tiny script before the first paint so there's no
// flash; theme.tsx changes it.

import type { Metadata, Viewport } from "next";
import { eventFontVariables } from "@/components/event/fonts";
import "./new.css";

export const metadata: Metadata = {
  title: "in2min2 · Make your invitation in two minutes",
  description: "Beautiful invitations and event pages in two minutes, free to start: replies, photos and comments on the day, and a thank-you page after.",
};

export const viewport: Viewport = { themeColor: "#0e0c1c" };

const setTheme = `try{var t=localStorage.getItem("in2min2.theme");document.currentScript.parentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){}`;

export default function NewLayout({ children }: LayoutProps<"/new">) {
  return (
    <div id="b2" className={`b2 ${eventFontVariables}`} data-theme="dark" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: setTheme }} />
      {children}
    </div>
  );
}
