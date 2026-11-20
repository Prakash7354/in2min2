// A pointing hand: on the envelope guests tap (components/event/opening.tsx)
// and on the builder's hints showing where to tap or swipe (app/new/ui.tsx).
// White with a dark outline on the envelope; gold in the builder, where the
// words are white (owner, 20 Nov 2026), so it never looks like more text.

export function TapHand({ fill = "#FFFFFF" }: { fill?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M19 7a3.5 3.5 0 0 1 7 0v14.5l1.2-.1V18a3.2 3.2 0 0 1 6.4 0v3.8l.5-.05a3.2 3.2 0 0 1 6.2 1.3v1.6a3.1 3.1 0 0 1 4.7 2.7V34c0 6.4-4.8 11-11 11h-5.2c-3.6 0-6.7-1.7-8.8-4.7L11.9 30.2a3.3 3.3 0 0 1 5-4.3L19 28.3V7z"
        fill={fill} stroke="#1C1A2E" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M26 21.5V29M33.6 21.8V29M40 25v4" fill="none" stroke="#1C1A2E" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
