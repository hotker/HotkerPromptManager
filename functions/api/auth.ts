import { PagesContext } from './types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  'Content-Type': 'application/json'
};

// Helper to return standardized JSON responses
const response = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
};

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};

export const onRequestPost = async (context: PagesContext) => {
  try {
    const { request, env } = context;

    // 1. Environment Check
    if (!env.NANO_DB) {
      return response({ error: 'System Error: Database (KV) not bound.' }, 503);
    }

    // 2. Parse Request
    let body: any;
    try {
      body = await request.json();
    } catch {
      return response({ error: 'Invalid JSON body' }, 400);
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // 3. Handle Actions
    if (action === 'register') {
      return await handleRegister(env, body);
    } 
    
    if (action === 'login') {
      return await handleLogin(env, body);
    }

    return response({ error: 'Invalid action parameter' }, 400);

  } catch (e: any) {
    return response({ error: e.message || 'Internal Server Error' }, 500);
  }
}

// --- Action Handlers ---

async function handleRegister(env: any, body: any) {
  const { username, password } = body;
  
  if (!username || !password || username.length < 3) {
    return response({ error: 'Validation Error: Username and password are required.' }, 400);
  }

  const userKey = `USER:${username}`;
  const existing = await env.NANO_DB.get(userKey);
  
  if (existing) {
    return response({ error: '该用户名已被注册' }, 409);
  }

  const newUser = {
    id: crypto.randomUUID(),
    username,
    password, // Note: In a real production app, use WebCrypto to hash this before storing!
    provider: 'local',
    createdAt: Date.now(),
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  };

  await env.NANO_DB.put(userKey, JSON.stringify(newUser));
  
  return response(newUser, 201);
}

async function handleLogin(env: any, body: any) {
  const { username, password } = body;
  
  if (!username || !password) {
    return response({ error: 'Missing credentials' }, 400);
  }

  const userStr = await env.NANO_DB.get(`USER:${username}`);
  
  if (!userStr) {
    return response({ error: '用户不存在' }, 404);
  }
  
  const user = JSON.parse(userStr);
  
  // Simple comparison. 
  if (user.password !== password) {
    return response({ error: '密码错误' }, 401);
  }
  
  return response(user, 200);
}