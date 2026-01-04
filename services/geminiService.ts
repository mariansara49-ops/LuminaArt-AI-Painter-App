
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ArtGenerationOptions, ArtModel } from "../types";

/**
 * Checks if the user has selected an API key. 
 * For PRO models, this is a mandatory step.
 */
export const checkAndRequestProKey = async (model: ArtModel): Promise<void> => {
  const aistudio = (window as any).aistudio;
  if (!aistudio) return;

  const hasKey = await aistudio.hasSelectedApiKey();
  
  // Mandatory for PRO models per instructions
  if (model === ArtModel.PRO && !hasKey) {
    await aistudio.openSelectKey();
    // Per instructions: Race condition handling - assume success after trigger
  }
};

/**
 * Generates art using the Gemini Image models.
 */
export const generateArt = async (options: ArtGenerationOptions): Promise<{ imageUrl: string; text?: string }> => {
  const { prompt, model, aspectRatio, imageSize, sourceImageBase64, mimeType } = options;

  // Create a new instance right before the call to ensure the latest API key is used
  const apiKey = process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [{ text: prompt }];
  
  if (sourceImageBase64 && mimeType) {
    parts.unshift({
      inlineData: {
        data: sourceImageBase64,
        mimeType: mimeType
      }
    });
  }

  try {
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio,
      }
    };

    if (model === ArtModel.PRO && imageSize) {
      config.imageConfig.imageSize = imageSize;
      // Pro models support Google Search grounding
      config.tools = [{ googleSearch: {} }];
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: config
    });

    let imageUrl = '';
    let responseText = '';

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          responseText += part.text;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("The model did not return an image. It might be blocked due to safety filters or a prompt restriction.");
    }

    return { imageUrl, text: responseText };
  } catch (error: any) {
    console.error("Art Generation Error Details:", error);
    
    // Per instructions: If the request fails with 404 or 403, 
    // prompt the user to select a key again via openSelectKey().
    const errorMessage = error.message?.toLowerCase() || "";
    if (errorMessage.includes("not found") || errorMessage.includes("permission") || errorMessage.includes("403") || errorMessage.includes("404")) {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        await aistudio.openSelectKey();
      }
    }
    
    throw error;
  }
};
