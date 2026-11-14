// Dates in the event's own time zone. The host types "14 March, 1pm" in
// London time; the database stores the exact moment (UTC); guests see London
// time again, wherever they are.

function offsetMinutes(utcMs: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(utcMs).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUtc - utcMs) / 60_000;
}

// "2027-03-14" + "13:00" in Europe/London → "2027-03-14T13:00:00.000Z"
export function zonedToUtcIso(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = (time || "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  let utc = guess - offsetMinutes(guess, timeZone) * 60_000;
  utc = guess - offsetMinutes(utc, timeZone) * 60_000; // second pass settles clock-change days
  return new Date(utc).toISOString();
}

// The other way: an exact moment → the date and time on the event's clock.
export function utcToZoned(iso: string | null | undefined, timeZone: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
