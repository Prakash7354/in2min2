// Shrink a photo on the host's own phone before it goes anywhere. Redrawing it
// on a canvas also throws away everything hidden in the file, including the GPS
// location the camera stored (docs/CONCEPT.md, 12a).

export async function resizePhoto(file: File, maxSide = 1280, quality = 0.8): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't a photo.");
  // createImageBitmap turns the picture the right way up from the camera's
  // orientation tag before the tag is thrown away.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This phone couldn't prepare the photo.");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}
