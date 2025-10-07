
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateRoofImage(
  base64ImageData: string,
  mimeType: string,
  userPrompt: string
): Promise<string | null> {
  // FIX: This method of getting a model is deprecated and the variable is unused.
  // The model identifier string is passed directly to the `generateContent` call.

  const fullPrompt = `Photorealistically replace the roof on this house with ${userPrompt}. The resulting image must look like a high-quality photograph, not a digital rendering or collage. Accurately replicate the texture, pattern, and color of the requested material. Preserve the existing lighting, shadows, and perspective of the original house and environment. The edit must be seamless and affect only the roofing surface. Do not alter any other part of the house, surrounding landscape, or sky.`;

  const contents = {
    parts: [
      {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
        },
      },
      {
        text: fullPrompt,
      },
    ],
  };

  const config = {
    responseModalities: [Modality.IMAGE, Modality.TEXT],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
      config: config
    });
    
    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    // If no image part is found
    return null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate image from Gemini API.");
  }
}
