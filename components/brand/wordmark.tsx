// The in2min2 logo (owner's design, 21 Nov 2026): the ticket with the
// teal-to-orange dial and "Create • Invite • Celebrate". It replaces the
// earlier lettered wordmark everywhere it's used (the not-found and ended
// pages, the photos page, the legal pages, the classic builder). Its height
// follows the font size where it sits, so `text-2xl` gives a 2xl-sized logo.
// The file is public/brand/logo.png, made from the owner's image with
// scripts/art/white-to-alpha.swift so it sits on any light colour.

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block align-middle ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the logo, already sized */}
      <img src="/brand/logo.png" alt="in2min2" width={640} height={330} style={{ display: "block", height: "2.4em", width: "auto" }} />
    </span>
  );
}
