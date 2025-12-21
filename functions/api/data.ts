
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

// --- XOR 解密算法 ---
function xorDecode(base64Str: string): string {
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
    throw new Error("Payload Decryption Failed");
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
    
    if (!rawText) return response({ error: 'Empty Body' }, 400);

    let data;

    // 智能解析逻辑
    // 1. 如果不是以 '{' 开头，假设是 XOR 混淆数据 (新的 WAF 绕过方案)
    if (!rawText.trim().startsWith('{')) {
        try {
            const jsonStr = xorDecode(rawText);
            data = JSON.parse(jsonStr);
        } catch (e) {
            // 解密失败，可能不是混淆数据
        }
    }
    
    // 2. 如果解密失败或看起来像普通 JSON，尝试标准解析 (兼容旧版)
    if (!data) {
        try {
            const body = JSON.parse(rawText);
            // 兼容旧的包装格式 { userId, data }
            data = body.data || body;
            // 如果 URL 没带 userId，尝试从 body 拿
            if (!userId && body.userId) {
                 return response({ error: '请更新客户端: userId 必须通过 URL 传递' }, 400);
            }
        } catch (e) {
            return response({ error: '数据格式无法识别 (Crypto/JSON Parse Error)' }, 400);
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
