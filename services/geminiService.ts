import { GoogleGenAI } from "@google/genai";
import { FixedConfig } from "../types";

// Standard Vite environment variable access
const getEnvApiKey = () => {
  return (import.meta as any).env.VITE_API_KEY || '';
};

interface ApiKeyOptions {
  apiKey?: string;
  allowSystemKey: boolean;
}

export const generateResponse = async (prompt: string, config: FixedConfig, options: ApiKeyOptions): Promise<string> => {
  let finalApiKey = options.apiKey;

  if (!finalApiKey && options.allowSystemKey) {
    finalApiKey = getEnvApiKey();
  }

  if (!finalApiKey) {
    if (!options.apiKey && !options.allowSystemKey) {
       throw new Error("ERR_PERMISSION_DENIED");
    }
    throw new Error("ERR_API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  try {
    // Handling for Image Generation Model
    if (config.model.includes('image')) {
       const imageConfig: any = {};
       if (config.aspectRatio && config.aspectRatio !== 'auto') {
           imageConfig.aspectRatio = config.aspectRatio;
       }
       if (config.imageSize) {
           imageConfig.imageSize = config.imageSize;
       }

       const response = await ai.models.generateContent({
         model: config.model,
         contents: prompt,
         config: {
             imageConfig: Object.keys(imageConfig).length > 0 ? imageConfig : undefined
         }
       });
       
       const parts = response.candidates?.[0]?.content?.parts;
       if (parts) {
            const imagePart = parts.find(p => p.inlineData);
            
            if (imagePart && imagePart.inlineData) {
                 return `[IMAGE GENERATED] data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }

            const textContent = parts
                .filter(p => p.text)
                .map(p => p.text)
                .join('\n');
            
            if (textContent) {
                return textContent;
            }
       }
       return "ERR_MODEL_IMAGE_FAILED";

    } else {
      // Standard Text Generation
      const response = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          temperature: config.temperature,
          topK: config.topK,
          responseMimeType: config.outputFormat === 'json' ? 'application/json' : 'text/plain',
        },
      });

      if (!response.text) {
          if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason) {
              return `ERR_FINISH_REASON${response.candidates[0].finishReason}`;
          }
          return "ERR_MODEL_EMPTY";
      }

      return response.text;
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('403')) throw new Error("ERR_403");
    if (error.message?.includes('429')) throw new Error("ERR_429");
    if (error.message?.includes('503')) throw new Error("ERR_503");
    throw new Error(error.message || "ERR_UNKNOWN");
  }
};