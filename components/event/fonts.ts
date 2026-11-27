// Every font an event page can use: the ten text styles in lib/catalog.ts
// (TEXT_STYLES), each with a matching font for Nepali and Hindi (Devanagari),
// Punjabi (Gurmukhi), Gujarati, Bengali and Tamil. All free Google Fonts,
// self-hosted by next/font. None is preloaded: a guest's phone downloads only
// the fonts, and only the letters, that the event actually shows.
//
// Put `eventFontVariables` on an element that wraps event pages (the builder
// and, in phase 2, the public event page).

import {
  Amita, Baloo_2, Baloo_Bhai_2, Baloo_Da_2, Baloo_Paaji_2, Baloo_Thambi_2, Bebas_Neue, Caveat, Cinzel,
  Cormorant_Garamond, Fraunces, Great_Vibes, Hind_Siliguri, Inter, Kalam, Lora, Mukta_Mahee, Mukta_Malar,
  Mukta_Vaani, Noto_Sans_Bengali, Noto_Sans_Devanagari, Noto_Sans_Gujarati, Noto_Sans_Gurmukhi, Noto_Sans_Tamil,
  Noto_Serif_Bengali, Noto_Serif_Devanagari, Noto_Serif_Gujarati, Noto_Serif_Gurmukhi, Noto_Serif_Tamil,
  Playfair_Display, Rozha_One, Tiro_Bangla, Tiro_Devanagari_Hindi, Tiro_Gurmukhi, Tiro_Tamil,
} from "next/font/google";

// next/font needs each option written out in full (no shared object).

// Latin headline and text faces (latin-ext: Polish, and other diacritics such as Tagalog ñ)
const inter = Inter({ display: "swap", preload: false, subsets: ["latin", "latin-ext"], variable: "--f-inter" });
const playfair = Playfair_Display({ display: "swap", preload: false, subsets: ["latin", "latin-ext"], variable: "--f-playfair" });
const cormorant = Cormorant_Garamond({ display: "swap", preload: false, subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-cormorant" });
const greatVibes = Great_Vibes({ display: "swap", preload: false, subsets: ["latin", "latin-ext"], weight: "400", variable: "--f-great-vibes" });
const bebas = Bebas_Neue({ display: "swap", preload: false, subsets: ["latin", "latin-ext"], weight: "400", variable: "--f-bebas" });
const cinzel = Cinzel({ display: "swap", preload: false, subsets: ["latin", "latin-ext"], variable: "--f-cinzel" });
const fraunces = Fraunces({ display: "swap", preload: false, subsets: ["latin", "latin-ext"], variable: "--f-fraunces" });
const lora = Lora({ display: "swap", preload: false, subsets: ["latin", "latin-ext"], variable: "--f-lora" });
const caveat = Caveat({ display: "swap", preload: false, subsets: ["latin", "latin-ext"], variable: "--f-caveat" });

// Faces that cover Latin and Devanagari together
const rozha = Rozha_One({ display: "swap", preload: false, subsets: ["latin", "latin-ext", "devanagari"], weight: "400", variable: "--f-rozha" });
const amita = Amita({ display: "swap", preload: false, subsets: ["devanagari"], weight: ["400", "700"], variable: "--f-amita" });
const kalam = Kalam({ display: "swap", preload: false, subsets: ["devanagari"], weight: ["400", "700"], variable: "--f-kalam" });
const baloo = Baloo_2({ display: "swap", preload: false, subsets: ["latin", "latin-ext", "devanagari"], variable: "--f-baloo" });

// Plain sans, per script
const nsDeva = Noto_Sans_Devanagari({ display: "swap", preload: false, subsets: ["devanagari"], variable: "--f-noto-sans-deva" });
const nsGuru = Noto_Sans_Gurmukhi({ display: "swap", preload: false, subsets: ["gurmukhi"], variable: "--f-noto-sans-guru" });
const nsGujr = Noto_Sans_Gujarati({ display: "swap", preload: false, subsets: ["gujarati"], variable: "--f-noto-sans-gujr" });
const nsBeng = Noto_Sans_Bengali({ display: "swap", preload: false, subsets: ["bengali"], variable: "--f-noto-sans-beng" });
const nsTaml = Noto_Sans_Tamil({ display: "swap", preload: false, subsets: ["tamil"], variable: "--f-noto-sans-taml" });

// Plain serif, per script
const nfDeva = Noto_Serif_Devanagari({ display: "swap", preload: false, subsets: ["devanagari"], variable: "--f-noto-serif-deva" });
const nfGuru = Noto_Serif_Gurmukhi({ display: "swap", preload: false, subsets: ["gurmukhi"], variable: "--f-noto-serif-guru" });
const nfGujr = Noto_Serif_Gujarati({ display: "swap", preload: false, subsets: ["gujarati"], variable: "--f-noto-serif-gujr" });
const nfBeng = Noto_Serif_Bengali({ display: "swap", preload: false, subsets: ["bengali"], variable: "--f-noto-serif-beng" });
const nfTaml = Noto_Serif_Tamil({ display: "swap", preload: false, subsets: ["tamil"], variable: "--f-noto-serif-taml" });

// Display serif with real character, per script (Gujarati uses Noto Serif)
const tiroDeva = Tiro_Devanagari_Hindi({ display: "swap", preload: false, subsets: ["devanagari"], weight: "400", variable: "--f-tiro-deva" });
const tiroGuru = Tiro_Gurmukhi({ display: "swap", preload: false, subsets: ["gurmukhi"], weight: "400", variable: "--f-tiro-guru" });
const tiroBeng = Tiro_Bangla({ display: "swap", preload: false, subsets: ["bengali"], weight: "400", variable: "--f-tiro-beng" });
const tiroTaml = Tiro_Tamil({ display: "swap", preload: false, subsets: ["tamil"], weight: "400", variable: "--f-tiro-taml" });

// Poster and friendly faces, per script (Mukta for Devanagari is the brand font)
const muktaGuru = Mukta_Mahee({ display: "swap", preload: false, subsets: ["gurmukhi"], weight: ["400", "700"], variable: "--f-mukta-guru" });
const muktaGujr = Mukta_Vaani({ display: "swap", preload: false, subsets: ["gujarati"], weight: ["400", "700"], variable: "--f-mukta-gujr" });
const muktaTaml = Mukta_Malar({ display: "swap", preload: false, subsets: ["tamil"], weight: ["400", "700"], variable: "--f-mukta-taml" });
const hindBeng = Hind_Siliguri({ display: "swap", preload: false, subsets: ["bengali"], weight: ["400", "700"], variable: "--f-hind-beng" });
const balooGuru = Baloo_Paaji_2({ display: "swap", preload: false, subsets: ["gurmukhi"], variable: "--f-baloo-guru" });
const balooGujr = Baloo_Bhai_2({ display: "swap", preload: false, subsets: ["gujarati"], variable: "--f-baloo-gujr" });
const balooBeng = Baloo_Da_2({ display: "swap", preload: false, subsets: ["bengali"], variable: "--f-baloo-beng" });
const balooTaml = Baloo_Thambi_2({ display: "swap", preload: false, subsets: ["tamil"], variable: "--f-baloo-taml" });

export const eventFontVariables = [
  inter, playfair, cormorant, greatVibes, bebas, cinzel, fraunces, lora, caveat,
  rozha, amita, kalam, baloo,
  nsDeva, nsGuru, nsGujr, nsBeng, nsTaml,
  nfDeva, nfGuru, nfGujr, nfBeng, nfTaml,
  tiroDeva, tiroGuru, tiroBeng, tiroTaml,
  muktaGuru, muktaGujr, muktaTaml, hindBeng, balooGuru, balooGujr, balooBeng, balooTaml,
].map((f) => f.variable).join(" ");
