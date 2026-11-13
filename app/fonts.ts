// Every font In2Min2 uses, self-hosted by next/font (no requests to Google
// from guests' phones). Each one becomes a CSS variable on <html>.
//
// Brand (website, builder, dashboard): Bricolage Grotesque for headings,
// Mukta for text (Latin and Devanagari in one family).
// Event pages: the five text styles in lib/catalog.ts (TEXT_STYLES). They are
// not preloaded; a phone downloads only the ones an event actually uses.

import {
  Bebas_Neue,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  Great_Vibes,
  Inter,
  Kalam,
  Mukta,
  Noto_Sans_Devanagari,
  Noto_Serif_Devanagari,
  Playfair_Display,
} from "next/font/google";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-bricolage", display: "swap" });
const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["400", "500", "700"], variable: "--f-mukta", display: "swap" });

const inter = Inter({ subsets: ["latin"], variable: "--f-inter", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--f-playfair", display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant", display: "swap", preload: false });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-great-vibes", display: "swap", preload: false });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--f-bebas", display: "swap", preload: false });
const notoSansDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--f-noto-sans-deva", display: "swap", preload: false });
const notoSerifDeva = Noto_Serif_Devanagari({ subsets: ["devanagari"], variable: "--f-noto-serif-deva", display: "swap", preload: false });
const kalam = Kalam({ subsets: ["devanagari", "latin"], weight: ["400", "700"], variable: "--f-kalam", display: "swap", preload: false });

export const fontVariables = [
  bricolage, mukta, inter, playfair, cormorant, greatVibes, bebas, notoSansDeva, notoSerifDeva, kalam,
].map((f) => f.variable).join(" ");
