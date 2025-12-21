
import { PagesContext } from './types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  'Content-Type': 'application/json'
};

const response = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
};

// --- Binary XOR 解密算法 ---
function xorDecodeBinary(dataBytes: Uint8Array): string {
  try {
    const key = "HotkerSync2025_Secret";
    const keyBytes = new TextEncoder().encode(key);
    
    const output = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      output[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(output);
  } catch (e) {
    throw new Error("Binary Decryption Failed");
  }
}

// Fallback: Hex 解密 (兼容旧客户端)
function xorHexDecode(hexStr: string): string {
    const key = "HotkerSync2025_Secret";
    if (hexStr.length % 2 !== 0) return "";
    const dataBytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < hexStr.length; i += 2) {
      dataBytes[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
    }
    const keyBytes = new TextEncoder().encode(key);
    const output = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      output[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(output);
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};

export const onRequestGet = async (context: PagesContext) => {
  const { request, env } = context;
  
  if (!env.NANO_DB && !env.DB) {
     return response({ error: '系统配置错误：未检测到绑定的数据库资源 (KV 或 D1)' }, 503);
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return response({ error: 'Missing userId parameter' }, 400);
  }
  
  try {
    let dataStr: string | null = null;

    if (env.DB) {
       try {
         const record = await env.DB.prepare('SELECT data_json FROM user_data WHERE user_id = ?').bind(userId).first();
         if (record && record.data_json) {
           dataStr = record.data_json as string;
         }
       } catch (dbErr: any) {
         if (dbErr.message?.includes('no such table')) {
            console.warn("D1 table user_data not found, using default data");
         } else {
            throw dbErr;
         }
       }
    } else {
       dataStr = await env.NANO_DB.get(`DATA:${userId}`);
    }

    const data = dataStr ? JSON.parse(dataStr) : { modules: [], templates: [], logs: [], apiKey: '' };
    return response(data);
  } catch (e: any) {
    console.error("Fetch data error:", e);
    return response({ error: '无法读取同步数据: ' + e.message }, 500);
  }
}

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.NANO_DB && !env.DB) {
     return response({ error: '系统配置错误：未检测到绑定的数据库资源 (KV 或 D1)' }, 503);
  }

  try {
    const userId = url.searchParams.get('userId');
    const contentType = request.headers.get('content-type') || '';
    
    let data;

    // --- 策略 1: Multipart/Form-Data (Binary Upload) ---
    // 这是最稳健的方案，用于绕过 WAF 文本内容检查
    if (contentType.includes('multipart/form-data')) {
       try {
         const formData = await request.formData();
         const file = formData.get('file'); // 前端 append 的 name 为 'file'

         if (file && typeof file !== 'string') {
            // 获取二进制内容
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // 解密
            const jsonStr = xorDecodeBinary(uint8Array);
            data = JSON.parse(jsonStr);
         }
       } catch (e) {
          console.error("Binary upload parse failed:", e);
       }
    }

    // --- 策略 2: 降级回退处理 (Hex/Plain/JSON) ---
    // 如果二进制解析失败，或者客户端未更新，尝试读取文本 Body
    if (!data) {
       try {
         const rawText = await request.text();
         const cleanText = rawText ? rawText.trim() : "";

         if (cleanText) {
            // A. 尝试 Hex-XOR (v4)
            if (/^[0-9a-fA-F]+$/.test(cleanText)) {
                try {
                  data = JSON.parse(xorHexDecode(cleanText));
                } catch {}
            }
            // B. 尝试标准 JSON (v1/v2)
            if (!data) {
               const body = JSON.parse(rawText);
               data = body.data || body;
            }
         }
       } catch (e) {
         // ignore
       }
    }

    if (!data) {
        return response({ error: '数据格式无法识别 (File/Hex/JSON)' }, 400);
    }

    if (!userId) {
      return response({ error: '缺少 userId 参数' }, 400);
    }
    
    // 保存逻辑
    const jsonStr = JSON.stringify(data);

    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO user_data (user_id, data_json, updated_at) 
          VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET 
            data_json = excluded.data_json, 
            updated_at = excluded.updated_at
        `).bind(userId, jsonStr, Date.now()).run();
      } catch (dbErr: any) {
        if (dbErr.message?.includes('no such table')) {
          return response({ error: 'D1 数据库表未初始化' }, 500);
        }
        throw dbErr;
      }
    } else {
      await env.NANO_DB.put(`DATA:${userId}`, jsonStr);
    }
    
    return response({ success: true, timestamp: Date.now() });
  } catch (e: any) {
    console.error("Save data failure:", e);
    return response({ error: '同步写入失败: ' + e.message }, 500);
  }
}
