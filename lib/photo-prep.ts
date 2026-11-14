"use client";

// Gets a guest's photo ready on their own phone, before it is sent:
// - shrunk to 1600 px on its longest side (about 300–400 KB), so it sends
//   quickly on venue Wi-Fi or 4G and costs little to keep;
// - turned the right way up (the browser applies the camera's rotation);
// - redrawn, which drops ALL the hidden details phone photos carry,
//   including the GPS location (important for children's safety, CONCEPT 22);
// - plus a small thumbnail (640 px) for the gallery grid.
// iPhones hand over HEIC photos as JPEG when picked from the page.

const MAX_EDGE = 1600;
const THUMB_EDGE = 640;

export type Prepared = { photo: Blob; thumb: Blob; w: number; h: number };

function decode(file: Blob): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { ok(img); setTimeout(() => URL.revokeObjectURL(url), 0); };
    img.onerror = () => { URL.revokeObjectURL(url); fail(new Error("decode")); };
    img.src = url;
  });
}

function draw(src: CanvasImageSource, sw: number, sh: number, edge: number, quality: number): Promise<{ blob: Blob; canvas: HTMLCanvasElement; w: number; h: number }> {
  const s = Math.min(1, edge / Math.max(sw, sh));
  const w = Math.max(16, Math.round(sw * s)), h = Math.max(16, Math.round(sh * s));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas"));
  ctx.fillStyle = "#ffffff";          // transparent PNGs get a white background
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok({ blob: b, canvas, w, h }) : fail(new Error("encode"))), "image/jpeg", quality));
}

export async function preparePhoto(file: File): Promise<Prepared> {
  const img = await decode(file);
  const big = await draw(img, img.naturalWidth, img.naturalHeight, MAX_EDGE, 0.82);
  const small = await draw(big.canvas, big.w, big.h, THUMB_EDGE, 0.74);
  big.canvas.width = big.canvas.height = 0;   // frees the memory at once on phones
  return { photo: big.blob, thumb: small.blob, w: big.w, h: big.h };
}
