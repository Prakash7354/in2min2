// The running order's quick-add ideas for each kind of event, shared by the
// builder and Builder 2.0. Anything that sounds like a meal starts as a meal,
// ready for its menu.

import type { Draft } from "@/lib/draft";

export const RUN_SUGGESTIONS: Record<string, string[]> = {
  wedding: ["Mehndi", "Haldi", "Janti arrives", "Ceremony", "Photos", "Reception", "Dinner", "First dance"],
  engagement: ["Guests arrive", "Tika", "Ring ceremony", "Dinner"],
  anniversary: ["Guests arrive", "Welcome", "Cake", "Dinner", "Dancing"],
  birthday: ["Guests arrive", "Games", "Cake", "Food", "Party ends"],
  party: ["Guests arrive", "Food", "Cake", "Dancing"],
  pasni: ["Guests arrive", "Puja", "Rice feeding", "Lunch", "Tika and blessings"],
  ceremony: ["Guests arrive", "Puja", "Lunch", "Tika and blessings"],
  bratabandha: ["Puja", "Bratabandha ceremony", "Lunch", "Tika and blessings"],
  reunion: ["Guests arrive", "Welcome speech", "Lunch", "Cultural programme", "Raffle", "Close"],
  memorial: ["Funeral", "Prayers", "13th-day rites", "Remembrance meal"],
  sport: ["Opening ceremony", "Group games", "Lunch", "Semi-finals", "Final", "Prize-giving"],
  mela: ["Opening", "Cultural show", "Food stalls open", "Raffle draw", "Close"],
  charity: ["Registration", "Start", "Lunch", "Prize-giving"],
  community: ["Welcome", "Programme", "Food", "Close"],
  corporate: ["Arrival drinks", "Welcome", "Dinner", "Awards", "Close"],
  christmas: ["Guests arrive", "Christmas dinner", "Secret Santa", "Games", "Carols"],
  "new-year": ["Guests arrive", "Dinner", "Dancing", "Countdown to midnight", "Fireworks"],
  lhosar: ["Welcome", "Prayers and blessings", "Cultural programme", "Cultural dances", "Lunch", "Tika and close"],
};
export const DEFAULT_RUN = ["Guests arrive", "Welcome", "Lunch", "Dinner"];
export const MEAL_WORDS = /\b(lunch|dinner|breakfast|brunch|meal|food|tea|buffet|bhoj|canap|supper|feast)/i;
export const COURSES = ["Starter", "Main", "Side", "Dessert", "Drinks", "Snacks", "Sweets"];

// The next item's time: an hour after the latest one, or the start time.
export function nextTime(d: Draft): string {
  const times = d.functions.map((f) => f.time).filter(Boolean).sort();
  const last = times[times.length - 1] ?? d.startTime;
  if (!last) return "";
  const [h, m] = last.split(":").map(Number);
  const t = Math.min(h * 60 + m + (times.length ? 60 : 0), 23 * 60 + 59);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
