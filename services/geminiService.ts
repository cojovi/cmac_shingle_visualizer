import type { GenerationRequest } from "../types";

function readError(status: number, body: string) {
  try {
    const data = body ? JSON.parse(body) : {};
    if (typeof data.error === "string" && data.error) return data.error;
    if (typeof data.image === "string") return "";
  } catch {
    /* non-JSON body from a crashed or unmatched server */
  }
  if (status === 413)
    return "The images are too large. Please choose smaller photos.";
  if (!status)
    return "Can’t reach the image studio. Start it with npm run dev, then try again.";
  return "The image service is unavailable. Save GEMINI_API_KEY in .env or .env.local, restart the studio, and try again.";
}

export async function generateRoofImage(
  payload: GenerationRequest,
  signal: AbortSignal,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new Error(readError(0, ""));
  }
  const body = await response.text();
  let data: { error?: string; image?: string } = {};
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(readError(response.status, body));
  }
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
