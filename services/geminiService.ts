import { GoogleGenAI } from "@google/genai";
import { FixedConfig } from "../types";

// Safely access process.env to prevent "process is not defined" errors in some environments
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    console.warn("Could not access process.env");
    return '';
  }
};

const API_KEY = getApiKey();

export const generateResponse = async (prompt: string, config: FixedConfig): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key 缺失。请设置 process.env.API_KEY。");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    // Handling for Image Generation Model (Nano Banana context)
    if (config.model.includes('image')) {
       // Nano Banana Image Logic
       const imageConfig: any = {};
       if (config.aspectRatio && config.aspectRatio !== 'auto') {
           imageConfig.aspectRatio = config.aspectRatio;
       }

       const response = await ai.models.generateContent({
         model: config.model,
         contents: prompt,
         config: {
             imageConfig: Object.keys(imageConfig).length > 0 ? imageConfig : undefined
         }
       });
       
       // Handle image response (extract image parts)
       const parts = response.candidates?.[0]?.content?.parts;
       if (parts) {
            // Priority: Check for image first
            // The model may return text parts (like "Here is the image") before the actual image data.
            // We must find the part with inlineData, iterating through all parts.
            const imagePart = parts.find(p => p.inlineData);
            
            if (imagePart && imagePart.inlineData) {
                 return `[IMAGE GENERATED] data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }

            // Fallback: Check for text if no image is found
            const textContent = parts
                .filter(p => p.text)
                .map(p => p.text)
                .join('\n');
            
            if (textContent) {
                return textContent;
            }
       }
       return "未生成内容。";

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

      return response.text || "模型未返回文本。";
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "生成过程中发生未知错误");
  }
};