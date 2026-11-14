// The In2Min2 logo is the name itself (owner's choice, 14 Nov 2026: idea C,
// "Timer 2s"): each 2 sits in a small marigold stopwatch face, so the logo
// says "two minutes" without words. Styles: .in2-wm in app/globals.css.

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`in2-wm ${className}`}>
      <span className="sr-only">In2Min2</span>
      <span aria-hidden="true">
        In<Timer />Min<Timer />
      </span>
    </span>
  );
}

function Timer() {
  return (
    <span className="in2-timer">
      <span>2</span>
    </span>
  );
}
