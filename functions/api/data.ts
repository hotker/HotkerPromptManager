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
  
  if (!env.NANO_DB) {
     return response({ error: 'System Error: KV not bound' }, 503);
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return response({ error: 'Missing userId parameter' }, 400);
  }
  
  try {
    const dataStr = await env.NANO_DB.get(`DATA:${userId}`);
    // Return empty shell if no data exists yet (First time load)
    const data = dataStr ? JSON.parse(dataStr) : { modules: [], templates: [], logs: [], apiKey: '' };
    return response(data);
  } catch (e: any) {
    return response({ error: 'Failed to read from KV' }, 500);
  }
}

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;

  if (!env.NANO_DB) {
     return response({ error: 'System Error: KV not bound' }, 503);
  }

  try {
    const body: any = await request.json();
    const { userId, data } = body;
    
    if (!userId || !data) {
      return response({ error: 'Invalid payload: userId and data required' }, 400);
    }
    
    // KV 'put' is eventually consistent, but fast enough for this use case
    await env.NANO_DB.put(`DATA:${userId}`, JSON.stringify(data));
    
    return response({ success: true, timestamp: Date.now() });
  } catch (e: any) {
    return response({ error: 'Failed to save to KV' }, 500);
  }
}