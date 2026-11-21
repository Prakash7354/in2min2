// Makes the light version of the logo for dark backgrounds (owner, 21 Nov
// 2026: a dark top bar): the navy lettering and outline turn cream, while the
// teal-to-orange dial, the coloured 2s and the gold stars stay as they are.
// Works on a logo whose white background was taken off by white-to-alpha.swift.
//   swift scripts/art/dark-to-light.swift public/brand/logo.png public/brand/logo-light.png
//
// The dial's pale middle came out half see-through when the white was taken
// off (pale colours look like "a bit of white"), so on navy it faded into the
// background (owner, 21 Nov 2026). Here the coloured parts are made solid
// again with their original colours: each pixel's see-through amount is
// compared with the most solid pixel near it, so the inside of a stroke is
// solid and only its edge stays soft.
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3, let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("usage: in.png out.png"); exit(1) }
let w = img.width, h = img.height
var px = [UInt8](repeating: 0, count: w * h * 4)
let cs = CGColorSpaceCreateDeviceRGB()
let ctx = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))

// Navy is blue above all; the dial (teal, its green middle, orange), the 2s
// and the stars are not.
func isNavy(_ r: Double, _ g: Double, _ b: Double) -> Bool { b > g && b >= r }

// 1. How solid each coloured (not navy) pixel is. Judged by its colour as it
// was on white, which stays steady at the soft edges of the letters (the
// see-through colour there is too faint to judge).
var colourAlpha = [Double](repeating: 0, count: w * h)
for p in 0..<(w * h) {
  let i = p * 4, a = Double(px[i + 3]) / 255
  if a == 0 { continue }
  let onWhite = (0..<3).map { Double(px[i + $0]) + (1 - a) * 255 }
  // A real colour, not a greyish speck at a letter's edge.
  let colourful = (onWhite.max()! - onWhite.min()!) >= 30
  if colourful && !isNavy(onWhite[0], onWhite[1], onWhite[2]) { colourAlpha[p] = a }
}

// 2. Make the coloured parts solid again, with their colours as they were on white.
let radius = 4
var out = px
for y in 0..<h { for x in 0..<w {
  let p = y * w + x, a = colourAlpha[p]
  if a == 0 { continue }
  var most = a
  for dy in -radius...radius { for dx in -radius...radius {
    let yy = y + dy, xx = x + dx
    if yy < 0 || yy >= h || xx < 0 || xx >= w { continue }
    most = max(most, colourAlpha[yy * w + xx])
  }}
  // Only inside or beside a real stroke (the dial, a 2, a star).
  if most < 0.45 { continue }
  let solid = min(1, a / most)
  let i = p * 4
  for c in 0..<3 {
    let onWhite = Double(px[i + c]) + (1 - a) * 255           // the colour as it was on white
    let v = (onWhite - 255 * (1 - solid)) / solid             // un-mixed with the new amount
    out[i + c] = UInt8(max(0, min(255, (v * solid).rounded())))
  }
  out[i + 3] = UInt8((solid * 255).rounded())
}}

// 3. The navy turns cream (#FFF9EF, the website's page colour). Between dark
// and bright, a smooth blend, so the edges stay soft.
let light: (Double, Double, Double) = (255, 249, 239)
for i in stride(from: 0, to: out.count, by: 4) {
  let a = Double(out[i + 3]) / 255
  if a == 0 { continue }
  let r = Double(out[i]) / a, g = Double(out[i + 1]) / a, b = Double(out[i + 2]) / a
  if !isNavy(r, g, b) { continue }
  let t = max(0, min(1, (140 - max(r, g, b)) / 35))
  if t == 0 { continue }
  func mix(_ v: Double, _ l: Double) -> UInt8 { UInt8(max(0, min(255, ((v + (l - v) * t) * a).rounded()))) }
  out[i] = mix(r, light.0); out[i + 1] = mix(g, light.1); out[i + 2] = mix(b, light.2)
}

let octx = CGContext(data: &out, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, octx.makeImage()!, nil); CGImageDestinationFinalize(dest)
print("\(args[2]): \(w)x\(h)")
