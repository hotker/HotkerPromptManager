
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

// --- Hex + XOR 解密算法 ---
function xorHexDecode(hexStr: string): string {
  try {
    const key = "HotkerSync2025_Secret";
    
    // Hex to Uint8Array
    if (hexStr.length % 2 !== 0) throw new Error("Invalid Hex Length");
    const dataBytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < hexStr.length; i += 2) {
      dataBytes[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
    }
    
    // XOR Restore
    const keyBytes = new TextEncoder().encode(key);
    const output = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      output[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(output);
  } catch (e) {
    throw new Error("Payload Decryption Failed");
  }
}

// Fallback for previous Base64-XOR (v3)
function xorBase64Decode(base64Str: string): string {
  try {
    const key = "HotkerSync2025_Secret";
    const binary = atob(base64Str);
    const dataBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      dataBytes[i] = binary.charCodeAt(i);
    }
    const keyBytes = new TextEncoder().encode(key);
    const output = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      output[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(output);
  } catch (e) {
    throw new Error("Base64 Decryption Failed");
  }
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
    const rawText = await request.text();
    const cleanText = rawText ? rawText.trim() : "";
    
    if (!cleanText) return response({ error: 'Empty Body' }, 400);

    let data;

    // 智能解析逻辑
    
    // 1. 尝试 Hex-XOR 解密 (v4) - 仅包含 0-9 a-f A-F
    if (/^[0-9a-fA-F]+$/.test(cleanText)) {
      try {
        const jsonStr = xorHexDecode(cleanText);
        data = JSON.parse(jsonStr);
      } catch (e) {
        // Hex decode failed, might be accidental match or old format
      }
    }

    // 2. 尝试 Base64-XOR 解密 (v3) - 如果不是 '{' 开头且不是纯 Hex
    if (!data && !cleanText.startsWith('{')) {
        try {
            const jsonStr = xorBase64Decode(cleanText);
            data = JSON.parse(jsonStr);
        } catch (e) {
            // Decrypt failed
        }
    }
    
    // 3. 尝试标准 JSON (兼容 v1/v2 及开发调试)
    if (!data) {
        try {
            const body = JSON.parse(rawText);
            data = body.data || body;
            if (!userId && body.userId) {
                 return response({ error: '请更新客户端: userId 必须通过 URL 传递' }, 400);
            }
        } catch (e) {
            return response({ error: '数据格式无法识别 (Hex/Crypto/JSON Parse Error)' }, 400);
        }
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
