
import { GoogleGenAI } from "@google/genai";
import { FixedConfig } from "../types";

/**
 * Validates a Gemini API Key by making a lightweight API call.
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use a lightweight generation request to validate the key
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'test',
    });
    return true;
  } catch (e) {
    console.warn("API Key Validation Failed:", e);
    return false;
  }
};

/**
 * Generates a response from Gemini models based on the provided prompt and configuration.
 * Adheres to strict guidelines for model naming, API key handling, and response processing.
 */
export const generateResponse = async (prompt: string, config: FixedConfig, userApiKey?: string): Promise<string> => {
  // Guidelines: Priority: User Provided Key > process.env.API_KEY.
  const apiKey = userApiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("ERR_API_KEY_MISSING");
  }

  // Guidelines: For high-quality image models like gemini-3-pro-image-preview,
  // ensure the user has selected their own API key via the system dialog (if in compatible env like IDX).
  if (config.model === 'gemini-3-pro-image-preview') {
    if (typeof window !== 'undefined' && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Proceeding after triggering openSelectKey to mitigate race conditions as per guidelines.
      }
    }
  }

  // Guidelines: Create a new instance right before making the API call.
  const ai = new GoogleGenAI({ apiKey });

  try {
    if (config.model.includes('image')) {
       const imageConfig: any = {};
       if (config.aspectRatio && config.aspectRatio !== 'auto') imageConfig.aspectRatio = config.aspectRatio;
       // imageSize is only supported for gemini-3-pro-image-preview
       if (config.imageSize && config.model === 'gemini-3-pro-image-preview') imageConfig.imageSize = config.imageSize;

       const response = await ai.models.generateContent({
         model: config.model,
         contents: { parts: [{ text: prompt }] },
         config: { 
           imageConfig: Object.keys(imageConfig).length > 0 ? imageConfig : undefined,
           // Google search grounding is only available for gemini-3-pro-image-preview
           tools: config.model === 'gemini-3-pro-image-preview' ? [{ googleSearch: {} }] : undefined
         }
       });
       
       const candidates = response.candidates;
       if (candidates && candidates.length > 0) {
            const parts = candidates[0].content.parts;
            // Iterate through parts to find the image part
            const imagePart = parts.find(p => p.inlineData);
            if (imagePart?.inlineData) {
              return `[IMAGE GENERATED] data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }
            
            const textContent = parts.filter(p => p.text).map(p => p.text).join('\n');
            if (textContent) return textContent;
       }
       return "ERR_MODEL_IMAGE_FAILED";

    } else {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          temperature: config.temperature,
          topK: config.topK,
          // Guidelines: responseMimeType is permitted for text-based tasks
          responseMimeType: config.outputFormat === 'json' ? 'application/json' : 'text/plain',
        },
      });

      // Guidelines: Directly access the .text property
      const outputText = response.text;
      if (outputText === undefined) {
          const reason = response.candidates?.[0]?.finishReason;
          return reason ? `ERR_FINISH_REASON: ${reason}` : "ERR_MODEL_EMPTY";
      }

      return outputText;
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const msg = error.message?.toLowerCase() || "";
    
    // Guidelines: Handle specific 4xx/5xx errors
    if (msg.includes('requested entity was not found')) {
      // Re-prompt user for key selection if this specific error occurs
      if (typeof window !== 'undefined' && window.aistudio) {
        await window.aistudio.openSelectKey();
      }
      throw new Error("ERR_PERMISSION_DENIED");
    }
    
    if (msg.includes('403')) throw new Error("ERR_403");
    if (msg.includes('429')) throw new Error("ERR_429");
    if (msg.includes('503')) throw new Error("ERR_503");
    throw new Error(error.message || "ERR_UNKNOWN");
  }
};
