import { GoogleGenAI } from "@google/genai";
import { FixedConfig } from "../types";

const API_KEY = process.env.API_KEY || '';

export const generateResponse = async (prompt: string, config: FixedConfig): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key 缺失。请设置 process.env.API_KEY。");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    // Handling for Image Generation Model (Nano Banana context)
    if (config.model.includes('image')) {
       // Note: In a real scenario, this would return an image.
       // For this prompt manager text interface, we will output the base64 or a success message.
       // Since the request asks for a text-based prompt manager template primarily, 
       // but mentions Nano Banana, we handle text generation by default, 
       // but if they select an image model, we generate an image.
       
       const response = await ai.models.generateContent({
         model: config.model,
         contents: prompt,
       });
       
       // Handle image response (simple extraction for the demo)
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    // It's an image
                    return `[IMAGE GENERATED] data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                } else if (part.text) {
                    return part.text;
                }
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