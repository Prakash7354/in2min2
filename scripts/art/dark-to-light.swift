// Makes the light version of the logo for dark backgrounds (owner, 21 Nov
// 2026: a dark top bar): the navy lettering and outline turn cream, while the
// teal-to-orange dial, the coloured 2s and the gold stars stay as they are.
// Works on a logo whose background is already transparent.
//   swift scripts/art/dark-to-light.swift public/brand/logo.png public/brand/logo-light.png
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
// Cream, #FFF9EF, the website's page colour.
let light: (Double, Double, Double) = (255, 249, 239)
for i in stride(from: 0, to: px.count, by: 4) {
  let a = Double(px[i + 3]) / 255
  if a == 0 { continue }
  let r = Double(px[i]) / a, g = Double(px[i + 1]) / a, b = Double(px[i + 2]) / a
  // Dark blues (the navy) become cream; bright colours (teal, orange, gold)
  // and the green middle of the dial stay. Between the two, a smooth blend,
  // so the edges stay soft.
  let top = max(r, g, b)
  if b <= g || b < r { continue }  // navy is blue above all; the dial's middle is green
  let t = max(0, min(1, (140 - top) / 35))
  if t == 0 { continue }
  func mix(_ v: Double, _ l: Double) -> UInt8 { UInt8(max(0, min(255, ((v + (l - v) * t) * a).rounded()))) }
  px[i] = mix(r, light.0); px[i + 1] = mix(g, light.1); px[i + 2] = mix(b, light.2)
}
let out = ctx.makeImage()!
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, out, nil); CGImageDestinationFinalize(dest)
print("\(args[2]): \(w)x\(h)")
