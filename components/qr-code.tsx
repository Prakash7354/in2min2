// A QR code as a crisp SVG (lib/qr.ts). Works on the server and in the
// browser; prints sharply at any size. Dark on light always scans best.

import { makeQr, qrPath } from "@/lib/qr";

export function QrCode({ text, className, colour = "#000000", background = "#FFFFFF", label }: {
  text: string; className?: string; colour?: string; background?: string; label?: string;
}) {
  const { d, viewBox } = qrPath(makeQr(text));
  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={label ?? "QR code"} shapeRendering="crispEdges">
      <rect width="100%" height="100%" fill={background} />
      <path d={d} fill={colour} />
    </svg>
  );
}
