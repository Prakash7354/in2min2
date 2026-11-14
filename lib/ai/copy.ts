// The five text boxes the AI fills in, shared by the API route and the builder.
// Change a limit here and both the AI schema and the on-screen counters follow.
// The same limits are enforced by the database (supabase/migrations/0001_init.sql).

export const COPY_FIELDS = {
  card_headline: {
    label: "Card headline",
    max: 45,
    hint: "The big line on the digital card, e.g. 'Subha Pasni', 'Kickoff 2026', 'James & Angeeta'.",
  },
  card_invite_body: {
    label: "Invitation text",
    max: 180,
    hint: "The warm invitation text on the digital card.",
  },
  landing_page_story: {
    label: "Event page welcome",
    max: 450,
    hint: "A welcoming overview for the event web page, in exactly two short paragraphs separated by a blank line.",
  },
  guest_note_box: {
    label: "Note for guests",
    max: 140,
    hint: "One practical note: dress code, parking, or gifts.",
  },
  post_event_thank_you: {
    label: "Thank-you message",
    max: 220,
    hint: "Shown automatically after the event ends, thanking guests for coming.",
  },
} as const;

// The Gemini model, unless the Worker's GEMINI_MODEL setting names another.
export const DEFAULT_MODEL = "gemini-3.5-flash-lite";

export type CopyKey = keyof typeof COPY_FIELDS;
export type EventCopy = Record<CopyKey, string>;

export const COPY_KEYS = Object.keys(COPY_FIELDS) as CopyKey[];

// What the host types in before pressing Generate.
export type CopyRequest = {
  eventType: string;
  hostNames: string;
  dateAndVenue: string;
  languageMix: string;
  tone: string;
  // Optional: a second language to write the same five boxes in (the page
  // shows both), and extra facts such as the family to honour or parking.
  secondLanguage?: string;
  details?: string;
};

// The reply: the five boxes, plus the same five in the second language if one was asked for.
export type CopyResponse = EventCopy & { translation?: EventCopy };

// Character count as people (and Postgres char_length) see it, so an emoji or
// a Devanagari letter counts once rather than as two UTF-16 units.
export function charCount(s: string): number {
  return Array.from(s).length;
}

// Keep a string within `max` characters. Prefer ending on a full sentence,
// then on a whole word, and only cut mid-word as a last resort.
export function clampText(s: string, max: number): string {
  const chars = Array.from(s.trim());
  if (chars.length <= max) return chars.join("");
  const cut = chars.slice(0, max).join("");
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("\n"));
  if (sentenceEnd >= max * 0.6) return cut.slice(0, sentenceEnd + 1).trim();
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace >= max * 0.6) return cut.slice(0, lastSpace).replace(/[,;:\-–—]+$/, "").trim();
  return cut.trim();
}
