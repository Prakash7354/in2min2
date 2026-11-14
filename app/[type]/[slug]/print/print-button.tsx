"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 font-bold text-white">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M7 14h10v7H7z" />
      </svg>
      Print or save as PDF
    </button>
  );
}
