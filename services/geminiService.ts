import { GoogleGenAI } from "@google/genai";
import { FixedConfig } from "../types";

// Standard Vite environment variable access
// Note: In Cloudflare Pages, set the environment variable as VITE_API_KEY in the dashboard to expose it to the client bundle if needed.
const getEnvApiKey = () => {
  return import.meta.env.VITE_API_KEY || '';
};

interface ApiKeyOptions {
  apiKey?: string;
  allowSystemKey: boolean;
}

export const generateResponse = async (prompt: string, config: FixedConfig, options: ApiKeyOptions): Promise<string> => {
  // Logic: 
  // 1. If user provides a custom key, use it.
  // 2. If no custom key, check if system key fallback is allowed.
  // 3. If allowed, use env key.
  
  let finalApiKey = options.apiKey;

  if (!finalApiKey && options.allowSystemKey) {
    finalApiKey = getEnvApiKey();
  }

  if (!finalApiKey) {
    if (!options.apiKey && !options.allowSystemKey) {
       throw new Error("权限受限：当前账户无权使用系统默认 Key。请在侧边栏设置您自己的 Google AI Studio API Key。");
    }
    throw new Error("API Key 缺失。请在侧边栏配置您的 API Key。");
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });

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