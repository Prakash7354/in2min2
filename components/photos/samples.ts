// Sample "photos" for showing the photo wheel before there are real ones:
// the style page, and "Try the photo wheel" in Builder 2.0 (owner, 16 Nov
// 2026: let people try the wheel before the day). Drawn as small SVG scenes
// (a sunset, lights, a garden, flowers, a city, waves, mountains, lanterns),
// landscape and portrait, so no real person's picture is ever used.

import type { WallPhoto } from "@/lib/photos";

function svg(w: number, h: number, body: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`)}`;
}
const grad = (id: string, stops: string[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join("")}</linearGradient>`;
export const SAMPLE_SCENES: { w: number; h: number; src: string }[] = [
  { w: 1600, h: 900, src: svg(160, 90, `<defs>${grad("a", ["#2b1055", "#d4418e", "#ff9966"])}</defs><rect width="160" height="90" fill="url(#a)"/><circle cx="110" cy="52" r="14" fill="#ffd56b"/><path d="M0 90 L0 62 L30 40 L52 58 L80 30 L110 60 L135 44 L160 58 L160 90Z" fill="#1d0f3a"/>`) },
  { w: 900, h: 1600, src: svg(90, 160, `<rect width="90" height="160" fill="#140c2c"/>${Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 37) % 90}" cy="${(i * 61) % 160}" r="${6 + (i % 5) * 3}" fill="${["#ffb627", "#ff4f8b", "#8b7cff", "#4fe3a6", "#6fb6ff"][i % 5]}" opacity="${0.25 + (i % 4) * 0.15}"/>`).join("")}`) },
  { w: 1600, h: 900, src: svg(160, 90, `<defs>${grad("b", ["#6fb6ff", "#cfe9fc"])}${grad("c", ["#2e9d5b", "#145c36"])}</defs><rect width="160" height="90" fill="url(#b)"/><path d="M0 60 Q40 35 80 55 T160 50 L160 90 L0 90Z" fill="url(#c)"/><rect y="70" width="160" height="20" fill="#3c8dd9" opacity=".6"/>`) },
  { w: 900, h: 1600, src: svg(90, 160, `<defs>${grad("d", ["#ffe0ec", "#ff8fb1"])}</defs><rect width="90" height="160" fill="url(#d)"/>${[0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="45" cy="62" rx="10" ry="24" fill="#e8336a" opacity=".8" transform="rotate(${r} 45 80)"/>`).join("")}<circle cx="45" cy="80" r="9" fill="#ffd56b"/><rect x="43" y="88" width="4" height="60" fill="#2e9d5b"/>`) },
  { w: 1600, h: 900, src: svg(160, 90, `<defs>${grad("e", ["#05051a", "#1d1450"])}</defs><rect width="160" height="90" fill="url(#e)"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${(i * 11) % 150}" y="${45 + ((i * 7) % 35)}" width="6" height="${10 + (i % 4) * 6}" fill="${["#ffb627", "#ffd56b", "#6fb6ff"][i % 3]}" opacity=".7"/>`).join("")}`) },
  { w: 900, h: 1600, src: svg(90, 160, `<defs>${grad("f", ["#5e35b1", "#22b8cf"])}</defs><rect width="90" height="160" fill="url(#f)"/>${[40, 70, 100, 130].map((y, i) => `<path d="M0 ${y} Q22 ${y - 14} 45 ${y} T90 ${y} L90 160 L0 160Z" fill="#ffffff" opacity="${0.08 + i * 0.05}"/>`).join("")}`) },
  { w: 1600, h: 900, src: svg(160, 90, `<defs>${grad("g", ["#9fd3ff", "#e8f4ff"])}</defs><rect width="160" height="90" fill="url(#g)"/><path d="M0 90 L20 50 L40 70 L70 20 L100 65 L125 35 L160 75 L160 90Z" fill="#5c6f8a"/><path d="M62 32 L70 20 L78 32 L72 30 L70 34 L67 30Z" fill="#fff"/>`) },
  { w: 900, h: 1600, src: svg(90, 160, `<rect width="90" height="160" fill="#0d1b3e"/>${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${15 + (i * 29) % 70}" cy="${20 + i * 15}" rx="8" ry="11" fill="#ff9f43" opacity=".85"/><ellipse cx="${15 + (i * 29) % 70}" cy="${20 + i * 15}" rx="16" ry="20" fill="#ffb627" opacity=".15"/>`).join("")}`) },
];
export const SAMPLE_PHOTOS: WallPhoto[] = SAMPLE_SCENES.map((s, i) => ({
  id: `sample-${i}`, w: s.w, h: s.h, by: ["Sita", "Hari", "Ram Studio", "Gita", "Asha", "Maya", "Bikash", "Kamala"][i], at: "", loves: [12, 3, 0, 7, 1, 0, 5, 2][i], fav: i === 3,
}));

// The picture for a sample photo's id ("sample-3").
export const sampleSrc = (id: string) => SAMPLE_SCENES[Number(id.split("-")[1])]?.src ?? "";
