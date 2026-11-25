// Makes the web-sized gold pictures from the owner's two originals
// (images/ornate_gold_page_border_transparent.tiff and
// images/ornamental_gold_dividers_transparent.tiff, 25 Nov 2026).
// Run: node scripts/art/gold-assets.mjs   (needs sharp, already in node_modules)
import sharp from "sharp";
const IN = "images/", OUT = "public/art/gold/";
const FRAME = IN + "ornate_gold_page_border_transparent.tiff";
const DIVS = IN + "ornamental_gold_dividers_transparent.tiff";
const webp = { quality: 74, alphaQuality: 85, effort: 6 };

// The frame: top half and bottom half, so corners never stretch on a tall page.
const W = 700; // narrower than the original: it is shown at phone width
// (sharp extracts before it resizes, so resize into a buffer first)
const resized = await sharp(FRAME).resize({ width: W }).png().toBuffer({ resolveWithObject: true });
const frame = sharp(resized.data);
const height = resized.info.height;
const half = Math.floor(height / 2);
await frame.clone().extract({ left: 0, top: 0, width: W, height: half }).webp(webp).toFile(OUT + "frame-top.webp");
await frame.clone().extract({ left: 0, top: height - half, width: W, height: half }).webp(webp).toFile(OUT + "frame-bottom.webp");

// The six dividers, found by their gaps (rows with no gold), each trimmed.
const { data, info } = await sharp(DIVS).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const rows = []; // does each row hold gold?
for (let y = 0; y < info.height; y++) {
  let n = 0;
  for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 60) n++;
  rows.push(n > 3);
}
const bands = []; let start = -1, gap = 0;
for (let y = 0; y < rows.length; y++) {
  if (rows[y]) { if (start < 0) start = y; gap = 0; }
  else if (start >= 0 && ++gap > 25) { bands.push([start, y - gap]); start = -1; gap = 0; }
}
if (start >= 0) bands.push([start, rows.length - 1]);
console.log("dividers found:", bands.length, bands);
let i = 1;
for (const [a, b] of bands) {
  const top = Math.max(0, a - 6);
  const piece = await sharp(DIVS).extract({ left: 0, top, width: info.width, height: Math.min(info.height - top, b - a + 12) }).png().toBuffer();
  await sharp(piece).trim({ threshold: 1 }).resize({ width: 640, withoutEnlargement: true }).webp(webp).toFile(`${OUT}divider-${i}.webp`);
  i++;
}
