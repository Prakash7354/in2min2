// In2Min2's own line icons, drawn here (no icon library): one simple style,
// 24 × 24, rounded ends, in the colour of the text around them. Used beside
// headings in the builder and on event pages, so words come with a picture.

import type { ReactNode } from "react";

const PATHS = {
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  people: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9.5" r="2.4" /><path d="M15.5 14.2A4.6 4.6 0 0 1 21 18.5" /></>,
  heart: <path d="M12 19.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z" />,
  star: <path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z" />,
  flag: <><path d="M5 21V4" /><path d="M5 4.5h11l-2 3.5 2 3.5H5" /></>,
  camera: <><path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.6" /></>,
  images: <><rect x="7" y="3.5" width="13.5" height="12.5" rx="2" /><path d="M3.5 8v10.5a2 2 0 0 0 2 2H16" /><path d="M7 13l3.5-3.5L14 13l2-2 4.5 4.5" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="9.5" r="1.8" /><path d="M3.5 17l5-5 4 4 2.5-2.5 5.5 5.5" /></>,
  envelope: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 7l8.5 6.5L20.5 7" /></>,
  gift: <><rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5S10.5 4 8 4.5 7 8.5 12 8.5zM12 8.5s1.5-4.5 4-4 1 4-4 4z" /></>,
  pen: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />,
  palette: <><path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7h2.2A3.7 3.7 0 0 0 20.5 11 8 8 0 0 0 12 3.5z" /><circle cx="7.8" cy="11" r="1.1" /><circle cx="10.5" cy="7.3" r="1.1" /><circle cx="15" cy="7.8" r="1.1" /></>,
  frame: <><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><rect x="7.5" y="7.5" width="9" height="9" rx="1" /></>,
  type: <><path d="M4 18L8.5 6 13 18M5.7 13.5h5.6" /><path d="M20 18v-4.2a2.6 2.6 0 0 0-5 0M20 15.5c-3 0-5 .3-5 1.6 0 .9.8 1.4 2 1.4 1.6 0 3-1 3-3" /></>,
  layout: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M10 9.5V20" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.5 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.5-3.6-8.5s1.1-5.9 3.6-8.5z" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" /></>,
  tag: <><path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-6.2 6.2a1.5 1.5 0 0 1-2.1 0z" /><circle cx="8" cy="8" r="1.5" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8 12.3l2.7 2.7L16 9.5" /></>,
  list: <><path d="M9 6.5h11M9 12h11M9 17.5h11" /><circle cx="4.8" cy="6.5" r="1.2" /><circle cx="4.8" cy="12" r="1.2" /><circle cx="4.8" cy="17.5" r="1.2" /></>,
  coins: <><ellipse cx="9" cy="7" rx="5.5" ry="2.5" /><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7" /><path d="M9.5 16.2c.8.2 1.7.3 2.5.3 3 0 5.5-1.1 5.5-2.5" /><path d="M14.5 10.6c2.6.3 4.5 1.2 4.5 2.4v4c0 1.4-2.5 2.5-5.5 2.5-2 0-3.8-.5-4.8-1.3" /></>,
  hourglass: <path d="M6.5 3.5h11M6.5 20.5h11M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5" />,
  shield: <><path d="M12 3.5l7 2.8v5.2c0 4.6-3 7.9-7 9-4-1.1-7-4.4-7-9V6.3z" /><path d="M8.8 12l2.2 2.2 4.2-4.4" /></>,
  switches: <><rect x="3" y="5" width="18" height="6" rx="3" /><circle cx="15" cy="8" r="1.8" /><rect x="3" y="13" width="18" height="6" rx="3" /><circle cx="9" cy="16" r="1.8" /></>,
  book: <><path d="M4 5.5A2 2 0 0 1 6 3.5h13.5v15H6a2 2 0 0 0-2 2z" /><path d="M4 20.5a2 2 0 0 1 2-2h13.5v2H6" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
