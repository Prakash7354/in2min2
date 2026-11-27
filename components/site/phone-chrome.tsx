// The little things that make a phone or tablet screen look real: the clock,
// signal, Wi-Fi and battery at the top, and the home bar at the bottom.
// Put it as a child of `.s-phone` (or `.s-tablet` with `tablet`), after the
// screen. Pure drawing, no state, so it works in server pages too.

function isLight(bg?: string): boolean {
  const m = bg?.match(/#([0-9a-f]{6})/i);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.55;
}

export function PhoneChrome({ bg, dark, battery = 80, tablet = false, time = "9:41", day }: {
  bg?: string; dark?: boolean; battery?: number; tablet?: boolean; time?: string; day?: string;
}) {
  const ink = (dark ?? !isLight(bg)) ? "#fff" : "#14122e";
  const low = battery <= 20;
  return (
    <div className={tablet ? "s-chrome s-chrome-tab" : "s-chrome"} style={{ color: ink }} aria-hidden="true">
      <span className="s-chrome-time">{time}{day && <small>{day}</small>}</span>
      <span className="s-chrome-right">
        <svg viewBox="0 0 18 12" className="s-ic-sig" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg viewBox="0 0 17 12" className="s-ic-wifi" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M1.2 4.2a10 10 0 0 1 14.6 0" /><path d="M3.9 7a6.2 6.2 0 0 1 9.2 0" /><circle cx="8.5" cy="10" r="1.2" fill="currentColor" stroke="none" /></svg>
        <span className="s-ic-bat">
          <svg viewBox="0 0 27 13" fill="none"><rect x="0.6" y="0.6" width="22.8" height="11.8" rx="3.6" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" /><rect x="2.2" y="2.2" width={Math.max(2, 19.6 * battery / 100)} height="8.6" rx="2.2" fill={low ? "#ff453a" : "currentColor"} /><path d="M25 4.4v4.2c.9-.3 1.6-1.2 1.6-2.1s-.7-1.8-1.6-2.1Z" fill="currentColor" fillOpacity="0.5" /></svg>
          <em>{battery}</em>
        </span>
      </span>
      <span className="s-homebar" style={{ background: ink }} />
    </div>
  );
}
