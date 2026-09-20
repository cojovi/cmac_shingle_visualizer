import type { GenerationRequest } from "../types";
export async function generateRoofImage(
  payload: GenerationRequest,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  const data = await response.json().catch(() => {
    throw new Error("The image service is unavailable. Please try again.");
  });
  if (!response.ok)
    throw new Error(
      data.error || "We couldn’t finish your preview. Please try again.",
    );
  if (
    typeof data.image !== "string" ||
    !/^data:image\/(png|jpeg|webp);base64,/.test(data.image)
  )
    throw new Error(
      "The image service returned an unreadable preview. Please try again.",
    );
  return data.image;
}
