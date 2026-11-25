// Borders and decorations for the invitation card and the top of the event
// page, drawn in code: in2min2 owns them outright, they stay sharp at any
// size, and they take the event's colours (CSS variables set by EventView:
// --ev-main, --ev-accent, --ev-leaf, --ev-c1 … --ev-c6).
//
// Every piece is positioned inside .ev-art (see event-view.css), which is a
// size container, so "cqi" here means 1% of the decorated area's width.
// Pure and deterministic: "random" confetti comes from a fixed seed, so the
// server and the phone draw exactly the same picture.

import type { ReactNode } from "react";
import type { BorderKey } from "@/lib/catalog";

// ─────────────── geometry helpers ───────────────

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function starPath(cx: number, cy: number, r: number, points = 5, inner = 0.45): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${r1(cx + rad * Math.cos(a))} ${r1(cy + rad * Math.sin(a))}`);
  }
  return `M${pts.join(" L")}Z`;
}

function sparklePath(cx: number, cy: number, r: number): string {
  const q = r * 0.16;
  return `M${cx} ${cy - r} Q${cx + q} ${cy - q} ${cx + r} ${cy} Q${cx + q} ${cy + q} ${cx} ${cy + r} Q${cx - q} ${cy + q} ${cx - r} ${cy} Q${cx - q} ${cy - q} ${cx} ${cy - r}Z`;
}

// A leaf lying along +x from the origin.
function leafPath(len: number, wid: number): string {
  return `M0 0 C${r1(len * 0.3)} ${r1(-wid)} ${r1(len * 0.72)} ${r1(-wid)} ${len} 0 C${r1(len * 0.72)} ${r1(wid)} ${r1(len * 0.3)} ${r1(wid)} 0 0Z`;
}

type Pt = { x: number; y: number };
function quad(p0: Pt, c: Pt, p2: Pt, t: number) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p2.y,
    a: (Math.atan2(2 * u * (c.y - p0.y) + 2 * t * (p2.y - c.y), 2 * u * (c.x - p0.x) + 2 * t * (p2.x - c.x)) * 180) / Math.PI,
  };
}

const C = (i: number) => `ev-f${(i % 6) + 1}`; // one of the six party colours

// ─────────────── positioning wrappers ───────────────

function Svg({ vb, className, children }: { vb: string; className: string; children: ReactNode }) {
  return <svg viewBox={vb} className={`ev-svg ${className}`} aria-hidden="true" focusable="false">{children}</svg>;
}

// The same corner drawing in all four corners (mirrored), or just two.
function Corners({ vb, width, children, only }: { vb: string; width: string; children: ReactNode; only?: ("tl" | "tr" | "bl" | "br")[] }) {
  return (
    <>
      {(only ?? ["tl", "tr", "bl", "br"]).map((c) => (
        <span key={c} className={`ev-corner ev-${c}`} style={{ width }}>
          <svg viewBox={vb} className="ev-svg" aria-hidden="true" focusable="false">{children}</svg>
        </span>
      ))}
    </>
  );
}

// ─────────────── the borders ───────────────

function FineLine() {
  return (
    <>
      <span className="ev-lines" />
      <Corners vb="0 0 40 40" width="9cqi">
        <path d="M14 8 L20 14 L14 20 L8 14Z" className="ev-fa" />
      </Corners>
      <Svg vb="0 0 160 16" className="ev-topCentre ev-w30">
        <path d="M0 8 H66 M94 8 H160" className="ev-sa" strokeWidth="1" />
        <path d="M80 2 L86 8 L80 14 L74 8Z" className="ev-fa" />
        <circle cx="70" cy="8" r="1.6" className="ev-fa" />
        <circle cx="90" cy="8" r="1.6" className="ev-fa" />
      </Svg>
    </>
  );
}

const ORNATE_CORNER = (
  <g className="ev-sa" strokeLinecap="round" fill="none">
    <path d="M6 66 V14 Q6 6 14 6 H66" strokeWidth="1.8" />
    <path d="M12 52 V20 Q12 12 20 12 H52" strokeWidth="0.8" />
    <path d="M20 20 C20 34 30 41 40 35 C47 31 45 22 38 23 C33 24 34 30 38 29" strokeWidth="1.4" />
    <path d="M20 20 C34 20 41 30 35 40 C31 47 22 45 23 38 C24 33 30 34 29 38" strokeWidth="1.4" />
    <path d="M66 6 C73 6 77 11 74 15 C72 18 67 16 68 13" strokeWidth="1.2" />
    <path d="M6 66 C6 73 11 77 15 74 C18 72 16 67 13 68" strokeWidth="1.2" />
  </g>
);

function Ornate() {
  const flourish = (
    <>
      <path d="M80 18 C70 18 66 8 56 8 C48 8 46 15 51 16 C55 17 56 12 53 11" className="ev-sa" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M80 18 C90 18 94 8 104 8 C112 8 114 15 109 16 C105 17 104 12 107 11" className="ev-sa" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M80 12 L85 18 L80 24 L75 18Z" className="ev-fa" />
      <path d="M14 18 H44 M116 18 H146" className="ev-sa" strokeWidth="0.8" />
    </>
  );
  return (
    <>
      <span className="ev-lines ev-linesSingle" />
      <Corners vb="0 0 80 80" width="24cqi">
        {ORNATE_CORNER}
        <circle cx="20" cy="20" r="2.8" className="ev-fa" />
        <g transform="translate(44 14) rotate(-12)"><path d={leafPath(11, 3.2)} className="ev-fa" /></g>
        <g transform="translate(14 44) rotate(102)"><path d={leafPath(11, 3.2)} className="ev-fa" /></g>
      </Corners>
      <Svg vb="0 0 160 30" className="ev-topCentre ev-w34">{flourish}</Svg>
      <Svg vb="0 0 160 30" className="ev-bottomCentre ev-w34">{flourish}</Svg>
    </>
  );
}

// Royal frame (owner, 16 Nov 2026, from the community's favourite printed
// wedding cards): a double gold frame, filigree scrolls curling into each
// corner, and a lotus crest with scrolling arms at the top and bottom. Our
// own drawing, in the event's accent colour, so it suits any palette.
const ROYAL_CORNER = (
  <g className="ev-sa" strokeLinecap="round" fill="none">
    <path d="M8 96 V24 Q8 8 24 8 H96" strokeWidth="1.6" />
    <path d="M24 24 C24 48 42 58 56 48 C66 40 60 28 50 32 C43 35 46 44 52 42" strokeWidth="1.5" />
    <path d="M24 24 C48 24 58 42 48 56 C40 66 28 60 32 50 C35 43 44 46 42 52" strokeWidth="1.5" />
    <path d="M62 15 C70 9 80 11 84 17 C87 22 82 26 78 23" strokeWidth="1.1" />
    <path d="M15 62 C9 70 11 80 17 84 C22 87 26 82 23 78" strokeWidth="1.1" />
  </g>
);
function Lotus({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-58, -30, 30, 58].map((a) => (
        <path key={a} d="M0 0 C-4 -6 -4 -13 0 -18 C4 -13 4 -6 0 0Z" transform={`rotate(${a}) scale(0.8)`} className="ev-fa" opacity="0.75" />
      ))}
      <path d="M0 0 C-5 -7 -5 -16 0 -22 C5 -16 5 -7 0 0Z" className="ev-fa" />
      <path d="M-9 2 H9" className="ev-sa" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="0" cy="5.5" r="1.6" className="ev-fa" />
    </g>
  );
}
function Royal() {
  const crest = (
    <>
      <path d="M100 30 C86 30 80 18 66 18 C56 18 54 27 60 28 C65 29 66 23 62 22" className="ev-sa" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M100 30 C114 30 120 18 134 18 C144 18 146 27 140 28 C135 29 134 23 138 22" className="ev-sa" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14 30 H52 M148 30 H186" className="ev-sa" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="10" cy="30" r="1.8" className="ev-fa" />
      <circle cx="190" cy="30" r="1.8" className="ev-fa" />
      <Lotus x={100} y={27} s={0.9} />
    </>
  );
  return (
    <>
      <span className="ev-lines" />
      <Corners vb="0 0 100 100" width="26cqi">
        {ROYAL_CORNER}
        <path d="M24 18 L30 24 L24 30 L18 24Z" className="ev-fa" />
        <g transform="translate(47 15) rotate(-10)"><path d={leafPath(10, 3)} className="ev-fa" /></g>
        <g transform="translate(15 47) rotate(100)"><path d={leafPath(10, 3)} className="ev-fa" /></g>
        <circle cx="88" cy="8" r="1.5" className="ev-fa" />
        <circle cx="8" cy="88" r="1.5" className="ev-fa" />
      </Corners>
      <Svg vb="0 0 200 40" className="ev-topCentre ev-w46">{crest}</Svg>
      <Svg vb="0 0 200 40" className="ev-bottomCentre ev-w46">{crest}</Svg>
    </>
  );
}

// Crossed khukuris (owner, 16 Nov 2026: "keep the exact shape … the lines
// adaptive to the border colours"): the traditional emblem in its classic
// shape, from the picture the owner supplied (public/art/crossed-khukuris.png,
// made into a transparent mask), so its lines take the event's main colour at
// any size. Fine rules either side.
function Khukuri() {
  return (
    <>
      <span className="ev-lines ev-linesSingle" />
      <Svg vb="0 0 240 40" className="ev-topCentre ev-w46 ev-khukuriRules">
        <path d="M30 20 H82 M158 20 H210" className="ev-sm" strokeWidth="1" strokeLinecap="round" />
        <path d="M26 20 L29 17 L32 20 L29 23Z M214 20 L211 17 L208 20 L211 23Z" className="ev-fa" />
      </Svg>
      <span className="ev-topCentre ev-khukuriMark" />
      <Svg vb="0 0 240 20" className="ev-bottomCentre ev-w52">
        <path d="M30 10 H104 M136 10 H210" className="ev-sm" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M120 3 L127 10 L120 17 L113 10Z" className="ev-fa" />
      </Svg>
    </>
  );
}

// Picture borders (owner, 16 Nov 2026: "include these modern design border
// lines using their own names or numbers"): his four frames, cut into
// corner pieces in public/art/borders (b01…b04). The roses keep their own
// colours; the gold crown and golden leaves are masks in the event's accent
// colour, with a soft metallic shine.
type Corner = "tl" | "tr" | "bl" | "br";
function Pic({ id, corners, mirror = false }: { id: string; corners: Corner[]; mirror?: boolean }) {
  return (
    <>
      {corners.map((c) => <span key={c} className={`ev-pic ${mirror ? `ev-corner ev-${c}` : `ev-pic-${c}`} ev-${id}${mirror ? "" : `-${c}`}`} />)}
    </>
  );
}
function RedRoses() {
  return <><span className="ev-picFrame ev-b01-frame" /><Pic id="b01" corners={["tl", "tr", "bl", "br"]} /></>;
}
function WatercolourRoses() {
  return <Pic id="b02" corners={["tl", "tr", "bl", "br"]} />;
}
function GoldCrown() {
  return (
    <>
      <span className="ev-picFrame ev-b03-frame" />
      <Pic id="b03" corners={["tl", "tr", "bl", "br"]} mirror />
      <span className="ev-pic ev-b03-crown ev-b03-crownTop" />
      <span className="ev-pic ev-b03-crown ev-b03-crownBottom" />
    </>
  );
}
function GoldenLeaves() {
  return <><span className="ev-picFrame ev-b04-frame" /><Pic id="b04" corners={["tl", "br"]} /></>;
}

// Whole frames (B5–B8, owner's designs traced to single-colour SVG): the top
// half of the frame is pinned to the top of the card and the bottom half to
// the bottom, so corners never stretch, however tall the card. In the accent
// colour, with a soft shine.
function Frame({ file }: { file: string }) {
  const style = { ["--frame" as string]: `url(/art/frames/${file})` };
  return (
    <>
      <span className="ev-frame2 ev-frame2Top" style={style} />
      <span className="ev-frame2 ev-frame2Bottom" style={style} />
    </>
  );
}

// B9 Imperial gold (owner's art, 25 Nov 2026): real raised gold with pearls,
// shown as it is (not tinted). The picture is cut in two, so the top half
// hangs from the top of the card and the bottom half from the bottom; a
// plain double rail joins them when the card is tall.
function ImperialGold() {
  return (
    <>
      <span className="ev-gold2 ev-gold2Rail" />
      <span className="ev-gold2 ev-gold2Top" />
      <span className="ev-gold2 ev-gold2Bottom" />
    </>
  );
}

function ArtDeco() {
  const rays = Array.from({ length: 9 }, (_, i) => {
    const a = (i * 90) / 8 * (Math.PI / 180);
    return `M${r1(10 + 9 * Math.cos(a))} ${r1(10 + 9 * Math.sin(a))} L${r1(10 + 30 * Math.cos(a))} ${r1(10 + 30 * Math.sin(a))}`;
  }).join(" ");
  return (
    <>
      <span className="ev-lines ev-linesBold" />
      <Corners vb="0 0 100 100" width="26cqi">
        <path d="M4 76 V4 H76" className="ev-sa" strokeWidth="2.2" />
        <path d="M10 64 V10 H64" className="ev-sa" strokeWidth="0.9" />
        <path d={rays} className="ev-sa" strokeWidth="1.3" />
        <path d="M40 10 A30 30 0 0 1 10 40" className="ev-sa" strokeWidth="1.3" />
        <path d="M48 10 A38 38 0 0 1 10 48" className="ev-sa" strokeWidth="0.7" />
        <path d="M10 10 L19 10 A9 9 0 0 1 10 19Z" className="ev-fa" />
        <path d="M56 56 L60 52 L64 56 L60 60Z" className="ev-fa" />
      </Corners>
      <Svg vb="0 0 160 28" className="ev-topCentre ev-w34">
        <path d="M0 24 H58 M102 24 H160 M20 18 H60 M100 18 H140" className="ev-sa" strokeWidth="1" />
        <path d="M66 24 A14 14 0 0 1 94 24Z" className="ev-fa" />
        {Array.from({ length: 7 }, (_, i) => {
          const a = Math.PI + (i * Math.PI) / 6;
          return <path key={i} d={`M${r1(80 + 16 * Math.cos(a))} ${r1(24 + 16 * Math.sin(a))} L${r1(80 + 22 * Math.cos(a))} ${r1(24 + 22 * Math.sin(a))}`} className="ev-sa" strokeWidth="1.2" />;
        })}
      </Svg>
    </>
  );
}

function laurelBranch(p0: Pt, c: Pt, p2: Pt, n: number, size: number) {
  const leaves: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const t = 0.06 + (i / (n - 1)) * 0.9;
    const q = quad(p0, c, p2, t);
    const s = size * (1 - t * 0.4);
    leaves.push(<g key={`a${i}`} transform={`translate(${r1(q.x)} ${r1(q.y)}) rotate(${r1(q.a - 42)})`}><path d={leafPath(s, s * 0.32)} className="ev-fa" /></g>);
    leaves.push(<g key={`b${i}`} transform={`translate(${r1(q.x)} ${r1(q.y)}) rotate(${r1(q.a + 42)})`}><path d={leafPath(s, s * 0.32)} className="ev-fa" /></g>);
  }
  return (
    <>
      <path d={`M${p0.x} ${p0.y} Q${c.x} ${c.y} ${p2.x} ${p2.y}`} className="ev-sa" strokeWidth="1.6" />
      {leaves}
    </>
  );
}

function Laurel() {
  const branch = laurelBranch({ x: 194, y: 84 }, { x: 120, y: 92 }, { x: 70, y: 22 }, 11, 17);
  return (
    <>
      <span className="ev-lines ev-linesSingle" />
      <Svg vb="0 0 400 96" className="ev-bottom ev-raise">
        {branch}
        <g transform="translate(400 0) scale(-1 1)">{branch}</g>
        <path d="M200 84 L188 92 L190 80Z M200 84 L212 92 L210 80Z" className="ev-fm" />
        <circle cx="200" cy="84" r="4" className="ev-fm" />
      </Svg>
      <Svg vb="0 0 120 20" className="ev-topCentre ev-w26">
        <path d={starPath(40, 11, 5)} className="ev-fa" />
        <path d={starPath(60, 10, 7.5)} className="ev-fa" />
        <path d={starPath(80, 11, 5)} className="ev-fa" />
      </Svg>
    </>
  );
}

function Flower({ x, y, r, petal, centre }: { x: number; y: number; r: number; petal: string; centre: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 5 }, (_, i) => (
        <ellipse key={i} cx="0" cy={r1(-r * 0.52)} rx={r1(r * 0.36)} ry={r1(r * 0.5)} transform={`rotate(${i * 72})`} className={petal} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <ellipse key={`i${i}`} cx="0" cy={r1(-r * 0.3)} rx={r1(r * 0.16)} ry={r1(r * 0.26)} transform={`rotate(${i * 72 + 36})`} className="ev-fb" opacity="0.35" />
      ))}
      <circle r={r1(r * 0.22)} className={centre} />
    </g>
  );
}

function Floral() {
  const stem = { p0: { x: 2, y: 96 }, c: { x: 14, y: 14 }, p2: { x: 96, y: 2 } };
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const t = 0.1 + i * 0.1;
    const q = quad(stem.p0, stem.c, stem.p2, t);
    const side = i % 2 ? -50 : 50;
    return <g key={i} transform={`translate(${r1(q.x)} ${r1(q.y)}) rotate(${r1(q.a + side)})`}><path d={leafPath(12, 4)} className="ev-fl" /></g>;
  });
  return (
    <Corners vb="0 0 120 120" width="34cqi" only={["tl", "br"]}>
      <path d={`M2 96 Q14 14 96 2`} className="ev-sl" strokeWidth="1.6" />
      <path d="M24 30 Q40 44 56 40" className="ev-sl" strokeWidth="1.1" />
      {leaves}
      <Flower x={26} y={26} r={16} petal="ev-fm" centre="ev-fa" />
      <Flower x={58} y={10} r={10} petal="ev-fa" centre="ev-fm" />
      <Flower x={10} y={58} r={10} petal="ev-fa" centre="ev-fm" />
      <Flower x={56} y={40} r={7} petal="ev-fm" centre="ev-fa" />
      <ellipse cx="90" cy="5" rx="3" ry="4.5" transform="rotate(70 90 5)" className="ev-fm" />
      <ellipse cx="5" cy="90" rx="3" ry="4.5" transform="rotate(20 5 90)" className="ev-fm" />
      {[[40, 6], [6, 40], [44, 24], [24, 46]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" className="ev-fa" />)}
    </Corners>
  );
}

function vine(phase: number) {
  const y = (x: number) => 34 + 15 * Math.sin((2 * Math.PI * x) / 200 + phase);
  const dy = (x: number) => 15 * ((2 * Math.PI) / 200) * Math.cos((2 * Math.PI * x) / 200 + phase);
  const pts = Array.from({ length: 41 }, (_, i) => `${i * 10} ${r1(y(i * 10))}`).join(" L");
  const leaves = Array.from({ length: 18 }, (_, i) => {
    const x = 11 + i * 22;
    const a = (Math.atan(dy(x)) * 180) / Math.PI;
    const side = i % 2 ? -58 : 58;
    return <g key={i} transform={`translate(${x} ${r1(y(x))}) rotate(${r1(a + side)})`}><path d={leafPath(15, 5.5)} className={C(i)} /></g>;
  });
  return (
    <>
      <path d={`M${pts}`} className="ev-sl" strokeWidth="1.8" />
      {leaves}
    </>
  );
}

function Vines() {
  return (
    <>
      <Svg vb="0 0 400 68" className="ev-top">{vine(0)}</Svg>
      <Svg vb="0 0 400 68" className="ev-bottom ev-flipY">{vine(Math.PI / 2)}</Svg>
    </>
  );
}

function Marigold({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) scale(${s})`}>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i * 2 * Math.PI) / 9;
        return <circle key={i} cx={r1(4.4 * Math.cos(a))} cy={r1(4.4 * Math.sin(a))} r="3.3" fill="#E8890C" />;
      })}
      <circle r="4.8" fill="#F5A524" />
      <circle r="2.2" fill="#FFD15C" />
    </g>
  );
}

function MarigoldGarland() {
  const anchors = [0, 133.3, 266.7, 400];
  const flowers: ReactNode[] = [];
  const strings: string[] = [];
  for (let s = 0; s < 3; s++) {
    const p0 = { x: anchors[s], y: 6 }, p2 = { x: anchors[s + 1], y: 6 }, c = { x: (p0.x + p2.x) / 2, y: 74 };
    strings.push(`M${p0.x} ${p0.y} Q${c.x} ${c.y} ${p2.x} ${p2.y}`);
    for (let i = 0; i <= 10; i++) {
      const q = quad(p0, c, p2, 0.04 + i * 0.092);
      flowers.push(<Marigold key={`${s}-${i}`} x={q.x} y={q.y} />);
    }
  }
  const tassel = (x: number) => (
    <g key={`t${x}`}>
      <path d={`M${x} 6 V66`} stroke="#5E8C31" strokeWidth="1.2" />
      {[16, 27, 38, 49].map((y) => <Marigold key={y} x={x} y={y} s={0.8} />)}
      <g transform={`translate(${x} 58) rotate(90)`}><path d={leafPath(22, 6)} fill="#4F7D2E" /></g>
    </g>
  );
  return (
    <Svg vb="0 0 400 92" className="ev-top">
      {strings.map((d, i) => <path key={i} d={d} stroke="#5E8C31" strokeWidth="1.2" fill="none" />)}
      {tassel(133.3)}
      {tassel(266.7)}
      {flowers}
    </Svg>
  );
}

function dhakaBand() {
  return (
    <>
      <rect x="0" y="0" width="400" height="36" className="ev-fm" />
      <rect x="0" y="3" width="400" height="1.6" className="ev-fb" />
      <rect x="0" y="31.4" width="400" height="1.6" className="ev-fb" />
      {Array.from({ length: 10 }, (_, i) => {
        const x = i * 40;
        return (
          <g key={i} transform={`translate(${x} 0)`}>
            <path d="M20 8 L30 18 L20 28 L10 18Z" className="ev-fa" />
            <path d="M20 13 L25 18 L20 23 L15 18Z" className="ev-fb" />
            <circle cx="20" cy="18" r="1.5" className="ev-fm" />
            <path d="M0 9 L7 18 L0 27Z M40 9 L33 18 L40 27Z" className="ev-fi" />
            <path d="M3 6.5 L8 9.5 L13 6.5 M27 6.5 L32 9.5 L37 6.5 M3 29.5 L8 26.5 L13 29.5 M27 29.5 L32 26.5 L37 29.5" className="ev-sb" strokeWidth="0.9" />
          </g>
        );
      })}
    </>
  );
}

function Dhaka() {
  return (
    <>
      <Svg vb="0 0 400 36" className="ev-top">{dhakaBand()}</Svg>
      <Svg vb="0 0 400 36" className="ev-bottom">{dhakaBand()}</Svg>
    </>
  );
}

function Mandala() {
  const petal = (from: number, to: number, w: number) => `M${from} 0 C${r1(from + (to - from) * 0.35)} ${-w} ${r1(from + (to - from) * 0.8)} ${r1(-w * 0.8)} ${to} 0 C${r1(from + (to - from) * 0.8)} ${r1(w * 0.8)} ${r1(from + (to - from) * 0.35)} ${w} ${from} 0Z`;
  return (
    <>
      <Corners vb="0 0 100 100" width="28cqi">
        <circle cx="0" cy="0" r="12" className="ev-fa" />
        {[7.5, 22.5, 37.5, 52.5, 67.5, 82.5].map((a) => <path key={a} d={petal(13, 30, 6)} transform={`rotate(${a})`} className="ev-fa" />)}
        <path d="M34 0 A34 34 0 0 1 0 34" className="ev-sa" strokeWidth="1" />
        {[5, 15, 25, 35, 45, 55, 65, 75, 85].map((a) => <path key={a} d={petal(36, 54, 5)} transform={`rotate(${a})`} className="ev-fm" />)}
        {Array.from({ length: 13 }, (_, i) => {
          const a = ((i * 7.5) * Math.PI) / 180;
          return <circle key={i} cx={r1(60 * Math.cos(a))} cy={r1(60 * Math.sin(a))} r="1.5" className="ev-fa" />;
        })}
        <path d="M66 0 A66 66 0 0 1 0 66" className="ev-sm" strokeWidth="0.8" />
      </Corners>
      <Svg vb="0 0 120 46" className="ev-topCentre ev-w22">
        <path d="M60 4 C69 14 69 30 60 42 C51 30 51 14 60 4Z" className="ev-fm" />
        <g transform="rotate(-32 60 42)"><path d="M60 10 C67 18 67 31 60 42 C53 31 53 18 60 10Z" className="ev-fa" /></g>
        <g transform="rotate(32 60 42)"><path d="M60 10 C67 18 67 31 60 42 C53 31 53 18 60 10Z" className="ev-fa" /></g>
        <g transform="rotate(-62 60 42)"><path d="M60 18 C65 24 65 33 60 42 C55 33 55 24 60 18Z" className="ev-fm" opacity="0.75" /></g>
        <g transform="rotate(62 60 42)"><path d="M60 18 C65 24 65 33 60 42 C55 33 55 24 60 18Z" className="ev-fm" opacity="0.75" /></g>
        <path d="M26 43 Q60 50 94 43" className="ev-sa" strokeWidth="1.2" />
      </Svg>
    </>
  );
}

const BALLOONS: [number, number, number, number, number][] = [
  [34, 42, 17, 21, 0], [66, 30, 15, 19, 1], [54, 70, 16, 20, 2], [20, 84, 13, 16, 3],
];

function balloonBunch(shift: number) {
  return (
    <>
      {BALLOONS.map(([cx, cy, , ry, k]) => (
        <path key={`s${k}`} d={`M${cx} ${cy + ry + 3} C${cx + 8} ${cy + ry + 30} 64 140 70 176`} className="ev-si" strokeWidth="0.9" opacity="0.45" fill="none" />
      ))}
      {BALLOONS.map(([cx, cy, rx, ry, k]) => (
        <g key={k}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className={C(k + shift)} />
          <path d={`M${cx - 3} ${cy + ry + 4} L${cx} ${cy + ry - 1} L${cx + 3} ${cy + ry + 4}Z`} className={C(k + shift)} />
          <ellipse cx={r1(cx - rx * 0.38)} cy={r1(cy - ry * 0.42)} rx={r1(rx * 0.2)} ry={r1(ry * 0.3)} fill="#FFFFFF" opacity="0.45" transform={`rotate(-20 ${r1(cx - rx * 0.38)} ${r1(cy - ry * 0.42)})`} />
        </g>
      ))}
    </>
  );
}

function Balloons() {
  return (
    <>
      <span className="ev-corner ev-tl" style={{ width: "30cqi" }}><svg viewBox="0 0 140 180" className="ev-svg" aria-hidden="true">{balloonBunch(0)}</svg></span>
      <span className="ev-corner ev-tr" style={{ width: "30cqi" }}><svg viewBox="0 0 140 180" className="ev-svg" aria-hidden="true">{balloonBunch(3)}</svg></span>
    </>
  );
}

type Bit = { x: number; y: number; kind: number; rot: number; size: number; colour: number };
function scatter(seed: number, n: number, h: number): Bit[] {
  const rand = rng(seed);
  const out: Bit[] = [];
  while (out.length < n) {
    const x = rand() * 400, y = rand() ** 1.7 * h;
    const kind = Math.floor(rand() * 4), rot = rand() * 180, size = 0.7 + rand() * 0.6, colour = Math.floor(rand() * 6);
    if (y > h * 0.32 && x > 64 && x < 336) continue; // keep the middle clear for the words
    out.push({ x: r1(x), y: r1(y), kind, rot: Math.round(rot), size: r1(size), colour });
  }
  return out;
}
const CONFETTI_TOP = scatter(7, 64, 130);
const CONFETTI_BOTTOM = scatter(23, 44, 110);

function confettiBits(bits: Bit[]) {
  return bits.map((b, i) => {
    const t = `translate(${b.x} ${b.y}) rotate(${b.rot}) scale(${b.size})`;
    if (b.kind === 0) return <rect key={i} x="-4" y="-2" width="8" height="4" rx="0.8" transform={t} className={C(b.colour)} />;
    if (b.kind === 1) return <circle key={i} r="2.8" transform={t} className={C(b.colour)} />;
    if (b.kind === 2) return <path key={i} d="M-4 3 L0 -4 L4 3Z" transform={t} className={C(b.colour)} />;
    return <path key={i} d="M-7 0 q2.5 -4 5 0 t5 0 t5 0" transform={t} strokeWidth="2" strokeLinecap="round" fill="none" style={{ stroke: `var(--ev-c${(b.colour % 6) + 1})` }} />;
  });
}

function Confetti() {
  return (
    <>
      <Svg vb="0 0 400 130" className="ev-top">{confettiBits(CONFETTI_TOP)}</Svg>
      <Svg vb="0 0 400 110" className="ev-bottom ev-flipY">{confettiBits(CONFETTI_BOTTOM)}</Svg>
    </>
  );
}

function Bunting() {
  const flags: ReactNode[] = [];
  const strings: string[] = [];
  [[0, 200], [200, 400]].forEach(([a, b], s) => {
    const p0 = { x: a, y: 5 }, p2 = { x: b, y: 5 }, c = { x: (a + b) / 2, y: 46 };
    strings.push(`M${p0.x} ${p0.y} Q${c.x} ${c.y} ${p2.x} ${p2.y}`);
    for (let i = 0; i < 9; i++) {
      const q = quad(p0, c, p2, 0.07 + i * 0.108);
      flags.push(<path key={`${s}-${i}`} d="M-9 0 L9 0 L0 22Z" transform={`translate(${r1(q.x)} ${r1(q.y)}) rotate(${r1(q.a)})`} className={C(i + s * 3)} />);
    }
  });
  return (
    <Svg vb="0 0 400 56" className="ev-top">
      {strings.map((d, i) => <path key={i} d={d} className="ev-si" strokeWidth="1.1" opacity="0.6" fill="none" />)}
      {flags}
    </Svg>
  );
}

const STARS_TOP = scatter(41, 34, 110);
const STARS_BOTTOM = scatter(77, 26, 100);
function starBits(bits: Bit[]) {
  return bits.map((b, i) => {
    if (b.kind === 0 || b.kind === 1) return <path key={i} d={starPath(b.x, b.y, 3 + b.size * 4)} className={b.colour % 2 ? "ev-fa" : "ev-fm"} />;
    if (b.kind === 2) return <path key={i} d={sparklePath(b.x, b.y, 4 + b.size * 4)} className="ev-fa" />;
    return <circle key={i} cx={b.x} cy={b.y} r="1.3" className="ev-fa" />;
  });
}

function Stars() {
  return (
    <>
      <Svg vb="0 0 400 110" className="ev-top">{starBits(STARS_TOP)}</Svg>
      <Svg vb="0 0 400 100" className="ev-bottom ev-flipY">{starBits(STARS_BOTTOM)}</Svg>
    </>
  );
}

const RAYS = Array.from({ length: 24 }, (_, i) => {
  const a0 = (i * 2 * Math.PI) / 24, a1 = a0 + Math.PI / 24;
  return `M200 150 L${r1(200 + 460 * Math.cos(a0))} ${r1(150 + 460 * Math.sin(a0))} L${r1(200 + 460 * Math.cos(a1))} ${r1(150 + 460 * Math.sin(a1))}Z`;
}).join(" ");

function Sunburst() {
  return (
    <Svg vb="0 0 400 340" className="ev-top ev-fade">
      <path d={RAYS} className="ev-fm" opacity="0.13" />
      <circle cx="200" cy="150" r="104" className="ev-sm" strokeWidth="1.5" opacity="0.25" fill="none" />
    </Svg>
  );
}

function Rainbow() {
  return (
    <>
      <span className="ev-rainbow" />
      <span className="ev-rainbowLine" />
    </>
  );
}

function Stripes() {
  return (
    <>
      <span className="ev-stripes ev-stripesTop" />
      <span className="ev-stripes ev-stripesBottom" />
    </>
  );
}

function pitchEnd() {
  return (
    <>
      <path d="M100 -2 V60 H300 V-2 M155 -2 V24 H245 V-2" className="ev-sm" strokeWidth="2" fill="none" />
      <path d="M168 60 A36 36 0 0 0 232 60" className="ev-sm" strokeWidth="2" fill="none" />
      <circle cx="200" cy="44" r="2.4" className="ev-fm" />
      <path d="M0 14 A14 14 0 0 0 14 0 M386 0 A14 14 0 0 0 400 14" className="ev-sm" strokeWidth="2" fill="none" />
    </>
  );
}

function Pitch() {
  return (
    <>
      <span className="ev-lines ev-linesPitch" />
      <Svg vb="0 0 400 70" className="ev-top ev-pitchArt">{pitchEnd()}</Svg>
      <Svg vb="0 0 400 70" className="ev-bottom ev-flipY ev-pitchArt">{pitchEnd()}</Svg>
    </>
  );
}

// ─────────────── festive (14 Nov 2026) ───────────────

function snowflakePath(cx: number, cy: number, r: number): string {
  let d = "";
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    d += `M${r1(cx)} ${r1(cy)} L${r1(cx + r * Math.cos(a))} ${r1(cy + r * Math.sin(a))} `;
    const bx = cx + r * 0.58 * Math.cos(a), by = cy + r * 0.58 * Math.sin(a);
    for (const side of [-1, 1]) {
      const b = a + (side * Math.PI) / 4;
      d += `M${r1(bx)} ${r1(by)} L${r1(bx + r * 0.3 * Math.cos(b))} ${r1(by + r * 0.3 * Math.sin(b))} `;
    }
  }
  return d.trim();
}
const SNOW_TOP = scatter(91, 26, 120);
const SNOW_BOTTOM = scatter(57, 18, 100);
function snowBits(bits: Bit[]) {
  return bits.map((b, i) => b.kind === 3
    ? <circle key={i} cx={b.x} cy={b.y} r={r1(1.2 + b.size)} className={b.colour % 2 ? "ev-fa" : "ev-fm"} opacity="0.6" />
    : <path key={i} d={snowflakePath(b.x, b.y, 4 + b.size * 6)} className={b.colour % 2 ? "ev-sa" : "ev-sm"} strokeWidth="1.3" strokeLinecap="round" />);
}

function Snowflakes() {
  return (
    <>
      <Svg vb="0 0 400 120" className="ev-top">{snowBits(SNOW_TOP)}</Svg>
      <Svg vb="0 0 400 100" className="ev-bottom ev-flipY">{snowBits(SNOW_BOTTOM)}</Svg>
    </>
  );
}

// A firework burst: rays from the centre, each ending in a spark.
function burst(cx: number, cy: number, r: number, rays: number, colour: number, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < rays; i++) {
    const a = (2 * Math.PI * i) / rays;
    const c = `var(--ev-c${((colour + (i % 2)) % 6) + 1})`;
    out.push(<path key={`${key}${i}`} d={`M${r1(cx + r * 0.32 * Math.cos(a))} ${r1(cy + r * 0.32 * Math.sin(a))} L${r1(cx + r * Math.cos(a))} ${r1(cy + r * Math.sin(a))}`}
      strokeWidth="1.6" strokeLinecap="round" fill="none" style={{ stroke: c }} />);
    out.push(<circle key={`${key}d${i}`} cx={r1(cx + r * 1.14 * Math.cos(a))} cy={r1(cy + r * 1.14 * Math.sin(a))} r="1.7" style={{ fill: c }} />);
  }
  return out;
}

function Fireworks() {
  return (
    <>
      <Svg vb="0 0 400 130" className="ev-top">
        {burst(50, 50, 34, 14, 0, "a")}{burst(120, 22, 16, 10, 2, "b")}{burst(350, 54, 38, 16, 3, "c")}{burst(284, 20, 15, 10, 4, "d")}
        <path d={sparklePath(200, 16, 6)} className="ev-fa" /><path d={sparklePath(170, 58, 4)} className="ev-fm" /><path d={sparklePath(236, 50, 4)} className="ev-fm" />
      </Svg>
      <Svg vb="0 0 400 80" className="ev-bottom ev-flipY">{burst(30, 30, 20, 12, 1, "e")}{burst(370, 32, 22, 12, 5, "f")}</Svg>
    </>
  );
}

// Lung ta: blue, white, red, green and yellow, always in that order.
const FLAG_COLOURS = ["#1F5FBF", "#F4F1E8", "#C8102E", "#1E8C45", "#F2C230"];
function PrayerFlags() {
  const flags: ReactNode[] = [];
  const strings: string[] = [];
  [[0, 200], [200, 400]].forEach(([a, b], s) => {
    const p0 = { x: a, y: 4 }, p2 = { x: b, y: 4 }, c = { x: (a + b) / 2, y: 40 };
    strings.push(`M${p0.x} ${p0.y} Q${c.x} ${c.y} ${p2.x} ${p2.y}`);
    for (let i = 0; i < 10; i++) {
      const q = quad(p0, c, p2, 0.05 + i * 0.1);
      flags.push(<rect key={`${s}-${i}`} x="-7" y="0" width="14" height="17" rx="1" transform={`translate(${r1(q.x)} ${r1(q.y)}) rotate(${r1(q.a)})`}
        fill={FLAG_COLOURS[i % 5]} stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />);
    }
  });
  return (
    <Svg vb="0 0 400 62" className="ev-top">
      {strings.map((d, i) => <path key={i} d={d} className="ev-si" strokeWidth="1" opacity="0.55" fill="none" />)}
      {flags}
    </Svg>
  );
}

const ART: Record<BorderKey, () => ReactNode> = {
  none: () => null,
  fine_line: FineLine,
  ornate: Ornate,
  art_deco: ArtDeco,
  royal: Royal,
  khukuri: Khukuri,
  red_roses: RedRoses,
  watercolour_roses: WatercolourRoses,
  gold_crown: GoldCrown,
  golden_leaves: GoldenLeaves,
  christmas_greenery: () => <Frame file="christmas-greenery.svg" />,
  golden_roses: () => <Frame file="golden-roses.svg" />,
  ornate_flowers: () => <Frame file="ornate-flowers.svg" />,
  wedding_lines: () => <Frame file="wedding-lines.svg" />,
  imperial_gold: ImperialGold,
  laurel: Laurel,
  floral: Floral,
  vines: Vines,
  marigold: MarigoldGarland,
  dhaka: Dhaka,
  mandala: Mandala,
  balloons: Balloons,
  confetti: Confetti,
  bunting: Bunting,
  stars: Stars,
  sunburst: Sunburst,
  rainbow: Rainbow,
  stripes: Stripes,
  pitch: Pitch,
  snowflakes: Snowflakes,
  fireworks: Fireworks,
  prayer_flags: PrayerFlags,
};

export default function BorderArt({ kind, className = "" }: { kind: string; className?: string }) {
  const draw = ART[kind as BorderKey];
  if (!draw || kind === "none") return null;
  return <span className={`ev-art ${className}`} aria-hidden="true">{draw()}</span>;
}
