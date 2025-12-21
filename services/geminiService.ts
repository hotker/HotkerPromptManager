
import { GoogleGenAI } from "@google/genai";
import { FixedConfig } from "../types";

// Standard environment variable access as per @google/genai guidelines
const getEnvApiKey = () => {
  // Always use process.env.API_KEY directly as specified in the guidelines
  return process.env.API_KEY || '';
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

  // Use named parameter to initialize GoogleGenAI as required
  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  try {
    // Handling for Image Generation Model
    if (config.model.includes('image')) {
       const imageConfig: any = {};
       
       if (config.aspectRatio && config.aspectRatio !== 'auto') {
           imageConfig.aspectRatio = config.aspectRatio;
       }
       
       // CRITICAL: imageSize is ONLY supported by gemini-3-pro-image-preview
       if (config.imageSize && config.model === 'gemini-3-pro-image-preview') {
           imageConfig.imageSize = config.imageSize;
       }

       // Use generateContent for nano banana series models
       const response = await ai.models.generateContent({
         model: config.model,
         contents: { parts: [{ text: prompt }] },
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
      // Use ai.models.generateContent directly with model and prompt as per guidelines
      const response = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          temperature: config.temperature,
          topK: config.topK,
          responseMimeType: config.outputFormat === 'json' ? 'application/json' : 'text/plain',
        },
      });

      // Directly access .text property, not as a method, as specified in instructions
      if (response.text === undefined) {
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
    
    if (error.status === 400 || error.message?.includes('INVALID_ARGUMENT')) {
        return `API Error (400): Request contained invalid arguments for this model. (Likely imageSize on unsupported model)`;
    }

    throw new Error(error.message || "ERR_UNKNOWN");
  }
};
