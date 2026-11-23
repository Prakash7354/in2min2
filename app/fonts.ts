// in2min2's own fonts (website, builder, dashboard), self-hosted by next/font
// so no request goes to Google from anyone's phone:
//   Bricolage Grotesque for headings and the in2min2 wordmark,
//   Mukta for text (Latin and Devanagari in one family).
// The event pages' fonts are in components/event/fonts.ts.

import { Bricolage_Grotesque, Mukta } from "next/font/google";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-bricolage", display: "swap" });
const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["400", "500", "700"], variable: "--f-mukta", display: "swap" });

export const fontVariables = `${bricolage.variable} ${mukta.variable}`;
