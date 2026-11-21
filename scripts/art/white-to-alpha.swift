// Takes the white background off an image (GIMP-style "colour to alpha"), so
// soft edges stay smooth on any light colour, and trims the empty border.
//   swift scripts/art/white-to-alpha.swift in.(png|jpg|webp) out.png [maxWidth]
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3, let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("usage: in out [maxWidth]"); exit(1) }
let w = img.width, h = img.height
var px = [UInt8](repeating: 0, count: w * h * 4)
let cs = CGColorSpaceCreateDeviceRGB()
let ctx = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
var minX = w, minY = h, maxX = 0, maxY = 0
for y in 0..<h { for x in 0..<w {
  let i = (y * w + x) * 4
  let r = Double(px[i]), g = Double(px[i + 1]), b = Double(px[i + 2])
  var a = max(255 - r, 255 - g, 255 - b) / 255
  if a < 0.035 { a = 0 }
  if a == 0 { px[i] = 0; px[i + 1] = 0; px[i + 2] = 0; px[i + 3] = 0; continue }
  // un-mix from white, then store premultiplied
  func c(_ v: Double) -> UInt8 { let u = (v - 255 * (1 - a)) / a; return UInt8(max(0, min(255, (u * a).rounded()))) }
  px[i] = c(r); px[i + 1] = c(g); px[i + 2] = c(b); px[i + 3] = UInt8((a * 255).rounded())
  if a > 0.08 { minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y) }
}}
let out = ctx.makeImage()!
let pad = 6
let crop = CGRect(x: max(0, minX - pad), y: max(0, minY - pad), width: min(w, maxX + pad) - max(0, minX - pad), height: min(h, maxY + pad) - max(0, minY - pad))
var res = out.cropping(to: crop)!
if args.count > 3, let maxW = Int(args[3]), res.width > maxW {
  let nh = Int(Double(res.height) * Double(maxW) / Double(res.width))
  let c2 = CGContext(data: nil, width: maxW, height: nh, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  c2.interpolationQuality = .high; c2.draw(res, in: CGRect(x: 0, y: 0, width: maxW, height: nh)); res = c2.makeImage()!
}
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, res, nil); CGImageDestinationFinalize(dest)
print("\(args[2]): \(res.width)x\(res.height)")
