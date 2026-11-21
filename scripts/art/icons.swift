// Makes the website's icons from the owner's icon picture (21 Nov 2026):
// trims the empty see-through border so the ticket fills the icon (it shows
// bigger in a browser tab), then writes
//   app/icon.png        512 x 512, see-through, the browser tab icon
//   app/apple-icon.png  180 x 180, on cream, for iPhone home screens (they
//                       can't show see-through, and round the corners)
//   swift scripts/art/icons.swift "images/in2min2-favicon-281126- Background Removed.png" app
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3, let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("usage: in.png outDir"); exit(1) }
let cs = CGColorSpaceCreateDeviceRGB()

// Where the picture is (alpha above a little), ignoring faint haze.
let w = img.width, h = img.height
var px = [UInt8](repeating: 0, count: w * h * 4)
let probe = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
probe.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
var minX = w, minY = h, maxX = 0, maxY = 0
for y in 0..<h { for x in 0..<w where px[(y * w + x) * 4 + 3] > 40 {
  minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
}}
let crop = img.cropping(to: CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1))!

func write(_ size: Int, fill: CGColor?, fit: Double, to path: String) {
  let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                      bitmapInfo: (fill == nil ? CGImageAlphaInfo.premultipliedLast : CGImageAlphaInfo.noneSkipLast).rawValue)!
  ctx.interpolationQuality = .high
  if let fill { ctx.setFillColor(fill); ctx.fill(CGRect(x: 0, y: 0, width: size, height: size)) }
  // Fit the trimmed picture inside `fit` of the square, centred.
  let box = Double(size) * fit
  let scale = min(box / Double(crop.width), box / Double(crop.height))
  let dw = Double(crop.width) * scale, dh = Double(crop.height) * scale
  ctx.draw(crop, in: CGRect(x: (Double(size) - dw) / 2, y: (Double(size) - dh) / 2, width: dw, height: dh))
  let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, ctx.makeImage()!, nil); CGImageDestinationFinalize(dest)
  print("\(path): \(size)x\(size)")
}

let out = args[2]
write(512, fill: nil, fit: 0.98, to: "\(out)/icon.png")
write(180, fill: CGColor(red: 1, green: 249 / 255, blue: 239 / 255, alpha: 1), fit: 0.84, to: "\(out)/apple-icon.png")
