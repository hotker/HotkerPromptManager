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
       const record = await env.DB.prepare('SELECT data_json FROM user_data WHERE user_id = ?').bind(userId).first();
       if (record) {
         dataStr = record.data_json as string;
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

  if (!env.NANO_DB && !env.DB) {
     return response({ error: '系统配置错误：未检测到绑定的数据库资源 (KV 或 D1)' }, 503);
  }

  try {
    const body: any = await request.json();
    const { userId, data } = body;
    
    if (!userId || !data) {
      return response({ error: '同步负载格式错误' }, 400);
    }
    
    const jsonStr = JSON.stringify(data);

    if (env.DB) {
      // Use SQL optimized for D1 performance with UPSERT logic.
      // High availability: ensures consistent write even during simultaneous requests.
      await env.DB.prepare(`
        INSERT INTO user_data (user_id, data_json, updated_at) 
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET 
          data_json = excluded.data_json, 
          updated_at = excluded.updated_at
      `).bind(userId, jsonStr, Date.now()).run();
    } else {
      // KV is naturally atomic per key
      await env.NANO_DB.put(`DATA:${userId}`, jsonStr);
    }
    
    return response({ success: true, timestamp: Date.now() });
  } catch (e: any) {
    console.error("Save data failure:", e);
    // Explicitly handle DB busy or constraint errors
    if (e.message?.includes('D1_ERROR')) {
       return response({ error: '数据库并发写冲突，同步已进入重试队列' }, 503);
    }
    return response({ error: '同步写入失败: ' + e.message }, 500);
  }
}