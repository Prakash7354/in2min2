// QR codes, made here with no library: the table cards, the TV slideshow and
// (later) posters and printed invitations. Pure TypeScript, so it runs on the
// server and in the browser alike.
//
// Byte mode, error correction level M (about 15% of the code can be covered
// or smudged and it still scans), versions 1 to 10: up to 213 characters,
// plenty for an event link. Of the eight standard masks, the one with the
// lowest penalty is chosen, as the QR standard (ISO/IEC 18004) describes.
// The method follows Project Nayuki's QR Code generator (MIT licence).

// Level M, versions 1–10: error-correction codewords per block, and blocks.
const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const MAX_VERSION = 10;

export type QrMatrix = { size: number; dark: (x: number, y: number) => boolean };

function rawModules(ver: number): number {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2;
    n -= (25 * align - 10) * align - 55;
    if (ver >= 7) n -= 36;
  }
  return n;
}
const dataCodewords = (ver: number) => Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * BLOCKS[ver];

// Reed–Solomon over GF(2^8), polynomial 0x11D.
function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}
function rsDivisor(degree: number): number[] {
  const out = new Array<number>(degree).fill(0);
  out[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < out.length; j++) {
      out[j] = gfMul(out[j], root);
      if (j + 1 < out.length) out[j] ^= out[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return out;
}
function rsRemainder(data: number[], divisor: number[]): number[] {
  const out = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (out.shift() as number);
    out.push(0);
    divisor.forEach((c, i) => { out[i] ^= gfMul(c, factor); });
  }
  return out;
}

export function makeQr(text: string): QrMatrix {
  const bytes = Array.from(new TextEncoder().encode(text));

  // 1. The smallest version that holds the text.
  let ver = 1;
  for (; ver <= MAX_VERSION; ver++) {
    const countBits = ver <= 9 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= dataCodewords(ver) * 8) break;
  }
  if (ver > MAX_VERSION) throw new Error("Text too long for a QR code");
  const size = ver * 4 + 17;
  const capacity = dataCodewords(ver) * 8;

  // 2. The bits: byte mode, the length, the text, then padding.
  const bits: number[] = [];
  const put = (val: number, len: number) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4);
  put(bytes.length, ver <= 9 ? 8 : 16);
  bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, capacity - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));

  // 3. Split into blocks, add error correction, interleave.
  const nBlocks = BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver];
  const raw = Math.floor(rawModules(ver) / 8);
  const nShort = nBlocks - (raw % nBlocks);
  const shortLen = Math.floor(raw / nBlocks);
  const divisor = rsDivisor(eccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < nBlocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, divisor);
    if (i < nShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const codewords: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) codewords.push(b[i]); });
  }

  // 4. The fixed patterns.
  const mod: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, dark: boolean) => { mod[y][x] = dark; fixed[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const pos = [6];
    for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
    pos.forEach((px, i) => pos.forEach((py, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
  }
  const format = (mask: number) => {
    const d = (0b00 << 3) | mask; // level M = 00
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const b = ((d << 10) | rem) ^ 0x5412;
    const bit = (i: number) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  format(0);
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const b = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((b >>> i) & 1) === 1, a = size - 11 + (i % 3), c = Math.floor(i / 3);
      set(a, c, dark); set(c, a, dark);
    }
  }

  // 5. The data, in two-column zigzags from the bottom right.
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v;
      if (!fixed[y][x] && i < codewords.length * 8) { mod[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
    }
  }

  // 6. The mask with the lowest penalty.
  const flip = (m: number) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (fixed[y][x]) continue;
      const inv = m === 0 ? (x + y) % 2 === 0 : m === 1 ? y % 2 === 0 : m === 2 ? x % 3 === 0 : m === 3 ? (x + y) % 3 === 0
        : m === 4 ? (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0 : m === 5 ? ((x * y) % 2) + ((x * y) % 3) === 0
        : m === 6 ? (((x * y) % 2) + ((x * y) % 3)) % 2 === 0 : (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
      if (inv) mod[y][x] = !mod[y][x];
    }
  };
  let best = 0, bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    flip(m); format(m);
    const score = penalty(mod, size);
    if (score < bestScore) { bestScore = score; best = m; }
    flip(m);
  }
  flip(best); format(best);
  return { size, dark: (x, y) => x >= 0 && y >= 0 && x < size && y < size && mod[y][x] };
}

function penalty(mod: boolean[][], size: number): number {
  let score = 0;
  const addHistory = (run: number, h: number[]) => { if (h[0] === 0) run += size; h.pop(); h.unshift(run); };
  const finderLike = (h: number[]) => {
    const n = h[1];
    const core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
    return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
  };
  const line = (get: (a: number) => boolean) => {
    let colour = false, run = 0;
    const h = [0, 0, 0, 0, 0, 0, 0];
    for (let a = 0; a < size; a++) {
      if (get(a) === colour) {
        run++;
        if (run === 5) score += 3; else if (run > 5) score++;
      } else {
        addHistory(run, h);
        if (!colour) score += finderLike(h) * 40;
        colour = get(a);
        run = 1;
      }
    }
    if (colour) { addHistory(run, h); run = 0; }
    run += size;
    addHistory(run, h);
    score += finderLike(h) * 40;
  };
  for (let y = 0; y < size; y++) line((x) => mod[y][x]);
  for (let x = 0; x < size; x++) line((y) => mod[y][x]);
  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (mod[y][x]) dark++;
    if (x < size - 1 && y < size - 1) {
      const c = mod[y][x];
      if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) score += 3;
    }
  }
  const total = size * size;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

// One SVG path for all the dark squares, with the 4-square quiet margin
// scanners need. Scales to any size without blurring.
export function qrPath(q: QrMatrix, margin = 4): { d: string; viewBox: string } {
  let d = "";
  for (let y = 0; y < q.size; y++) {
    for (let x = 0; x < q.size; x++) {
      if (!q.dark(x, y)) continue;
      let run = 1;
      while (q.dark(x + run, y)) run++;
      d += `M${x + margin} ${y + margin}h${run}v1h-${run}z`;
      x += run - 1;
    }
  }
  const s = q.size + margin * 2;
  return { d, viewBox: `0 0 ${s} ${s}` };
}
