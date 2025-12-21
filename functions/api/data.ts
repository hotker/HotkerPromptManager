
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

// Helper to decode Base64 to string (UTF-8 safe)
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
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
       // SQL for D1
       try {
         const record = await env.DB.prepare('SELECT data_json FROM user_data WHERE user_id = ?').bind(userId).first();
         if (record && record.data_json) {
           dataStr = record.data_json as string;
         }
       } catch (dbErr: any) {
         // 如果表不存在，返回默认值而不是报错，防止应用崩溃
         if (dbErr.message?.includes('no such table')) {
            console.warn("D1 table user_data not found, using default data");
         } else {
            throw dbErr;
         }
       }
    } else {
       // KV for NANO_DB
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
    // 1. Try to get userId from URL first (Preferred new method)
    let userId = url.searchParams.get('userId');
    const rawText = await request.text();

    if (!rawText) {
       return response({ error: 'Empty request body' }, 400);
    }
    
    let data;

    // 2. Hybrid Parsing: Check if it's the old JSON wrapper or the new Raw Base64
    // If it starts with '{', it's likely JSON (Legacy/Fallback)
    if (rawText.trim().startsWith('{')) {
        try {
            const body = JSON.parse(rawText);
            if (!userId) userId = body.userId; // Fallback to body userId
            
            if (body.payload) {
                // Base64 inside JSON
                const decodedStr = decodeBase64(body.payload);
                data = JSON.parse(decodedStr);
            } else if (body.data) {
                // Plain JSON (Oldest format)
                data = body.data;
            } else {
                return response({ error: 'Invalid legacy payload format' }, 400);
            }
        } catch (e) {
            return response({ error: 'Invalid JSON body' }, 400);
        }
    } else {
        // 3. New Method: Treat entire body as Raw Base64
        // This bypasses WAF because there is no JSON structure to inspect
        try {
            const decodedStr = decodeBase64(rawText);
            data = JSON.parse(decodedStr);
        } catch (e) {
            return response({ error: 'Invalid Raw Base64 payload' }, 400);
        }
    }
    
    if (!userId) {
      return response({ error: '同步负载格式错误: 缺少 userId (请在 URL 参数中提供)' }, 400);
    }

    if (!data) {
        return response({ error: '数据解析为空' }, 400);
    }
    
    // Store as plain JSON string in DB
    const jsonStr = JSON.stringify(data);

    if (env.DB) {
      try {
        // 使用更兼容的 UPSERT 语法
        await env.DB.prepare(`
          INSERT INTO user_data (user_id, data_json, updated_at) 
          VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET 
            data_json = excluded.data_json, 
            updated_at = excluded.updated_at
        `).bind(userId, jsonStr, Date.now()).run();
      } catch (dbErr: any) {
        if (dbErr.message?.includes('no such table')) {
          return response({ error: 'D1 数据库表未初始化，请参考 DEPLOY.md 执行建表 SQL。' }, 500);
        }
        throw dbErr;
      }
    } else {
      await env.NANO_DB.put(`DATA:${userId}`, jsonStr);
    }
    
    return response({ success: true, timestamp: Date.now() });
  } catch (e: any) {
    console.error("Save data failure:", e);
    if (e.message?.includes('D1_ERROR') || e.message?.includes('busy')) {
       return response({ error: '数据库并发冲突或繁忙，请稍后重试' }, 503);
    }
    return response({ error: '同步写入失败: ' + e.message }, 500);
  }
}
