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

// SQL Schema for D1:
// CREATE TABLE IF NOT EXISTS user_data (user_id TEXT PRIMARY KEY, data_json TEXT, updated_at INTEGER);

export const onRequestGet = async (context: PagesContext) => {
  const { request, env } = context;
  
  if (!env.NANO_DB && !env.DB) {
     return response({ error: 'System Error: No DB bound' }, 503);
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return response({ error: 'Missing userId parameter' }, 400);
  }
  
  try {
    let dataStr: string | null = null;

    if (env.DB) {
       // D1
       const record = await env.DB.prepare('SELECT data_json FROM user_data WHERE user_id = ?').bind(userId).first();
       if (record) {
         dataStr = record.data_json as string;
       }
    } else {
       // KV
       dataStr = await env.NANO_DB.get(`DATA:${userId}`);
    }

    // Return empty shell if no data exists yet (First time load)
    const data = dataStr ? JSON.parse(dataStr) : { modules: [], templates: [], logs: [], apiKey: '' };
    return response(data);
  } catch (e: any) {
    return response({ error: 'Failed to read from DB: ' + e.message }, 500);
  }
}

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;

  if (!env.NANO_DB && !env.DB) {
     return response({ error: 'System Error: No DB bound' }, 503);
  }

  try {
    const body: any = await request.json();
    const { userId, data } = body;
    
    if (!userId || !data) {
      return response({ error: 'Invalid payload: userId and data required' }, 400);
    }
    
    const jsonStr = JSON.stringify(data);

    if (env.DB) {
      // D1: Upsert
      // SQLite syntax for upsert:
      await env.DB.prepare(`
        INSERT INTO user_data (user_id, data_json, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at
      `).bind(userId, jsonStr, Date.now()).run();
    } else {
      // KV
      await env.NANO_DB.put(`DATA:${userId}`, jsonStr);
    }
    
    return response({ success: true, timestamp: Date.now() });
  } catch (e: any) {
    return response({ error: 'Failed to save to DB: ' + e.message }, 500);
  }
}