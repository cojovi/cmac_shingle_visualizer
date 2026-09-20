import type { Photo } from "../types";
export const MAX_FILE_BYTES = 12 * 1024 * 1024;
export async function preparePhoto(file: File): Promise<Photo> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error(
      "Please choose a JPG, PNG, or WebP photo. Export HEIC photos as JPG first.",
    );
  if (file.size > MAX_FILE_BYTES)
    throw new Error(
      "This photo is too large. Choose an image smaller than 12 MB.",
    );
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(
      "This image could not be opened. Please choose a different photo.",
    );
  });
  try {
    if (bitmap.width < 200 || bitmap.height < 200)
      throw new Error(
        "Choose a photo at least 200 × 200 pixels so we can see your roof clearly.",
      );
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error(
        "Your browser could not process this photo. Try another browser.",
      );
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return {
      data: canvas.toDataURL("image/jpeg", 0.92).split(",")[1],
      mimeType: "image/jpeg",
      width: canvas.width,
      height: canvas.height,
      name: file.name,
    };
  } finally {
    bitmap.close();
  }
}
export const photoUrl = (photo: Photo) =>
  `data:${photo.mimeType};base64,${photo.data}`;
export function fileToBase64(file: File): Promise<string> {
  return preparePhoto(file).then((p) => p.data);
}
export function downloadImage(image: string, name: string) {
  const a = document.createElement("a");
  a.href = image;
  const ext = image.startsWith("data:image/jpeg")
    ? "jpg"
    : image.startsWith("data:image/webp")
      ? "webp"
      : "png";
  a.download = `${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${ext}`;
  a.click();
}
