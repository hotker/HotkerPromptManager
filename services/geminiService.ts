import { GoogleGenAI } from "@google/genai";
import { FixedConfig } from "../types";

const getEnvApiKey = () => process.env.API_KEY || '';

interface ApiKeyOptions {
  apiKey?: string;
  allowSystemKey: boolean;
}

export const generateResponse = async (prompt: string, config: FixedConfig, options: ApiKeyOptions): Promise<string> => {
  let finalApiKey = options.apiKey || (options.allowSystemKey ? getEnvApiKey() : '');

  if (!finalApiKey) {
    throw new Error(options.apiKey ? "ERR_API_KEY_MISSING" : "ERR_PERMISSION_DENIED");
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  try {
    if (config.model.includes('image')) {
       const imageConfig: any = {};
       if (config.aspectRatio && config.aspectRatio !== 'auto') imageConfig.aspectRatio = config.aspectRatio;
       if (config.imageSize && config.model === 'gemini-3-pro-image-preview') imageConfig.imageSize = config.imageSize;

       const response = await ai.models.generateContent({
         model: config.model,
         contents: { parts: [{ text: prompt }] },
         config: { imageConfig: Object.keys(imageConfig).length > 0 ? imageConfig : undefined }
       });
       
       const parts = response.candidates?.[0]?.content?.parts;
       if (parts) {
            const imagePart = parts.find(p => p.inlineData);
            if (imagePart?.inlineData) return `[IMAGE GENERATED] data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            
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
          responseMimeType: config.outputFormat === 'json' ? 'application/json' : 'text/plain',
        },
      });

      // 严格遵守指南：直接访问 .text 属性
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
    if (msg.includes('403')) throw new Error("ERR_403");
    if (msg.includes('429')) throw new Error("ERR_429");
    if (msg.includes('503')) throw new Error("ERR_503");
    throw new Error(error.message || "ERR_UNKNOWN");
  }
};