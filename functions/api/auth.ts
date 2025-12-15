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

const response = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
};

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};

export const onRequestPost = async (context: PagesContext) => {
  try {
    const { request, env } = context;

    // 1. Environment Check (Support D1 or KV)
    if (!env.NANO_DB && !env.DB) {
      return response({ error: 'System Error: No Database (KV or D1) bound.' }, 503);
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

    if (action === 'change-password') {
      return await handleChangePassword(env, body);
    }

    return response({ error: 'Invalid action parameter' }, 400);

  } catch (e: any) {
    return response({ error: e.message || 'Internal Server Error' }, 500);
  }
}

// --- Action Handlers ---

// SQL Schema for D1:
// CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, provider TEXT, created_at INTEGER, avatar_url TEXT);

async function handleRegister(env: any, body: any) {
  const { username, password } = body;
  
  if (!username || !password || username.length < 3) {
    return response({ error: 'Validation Error: Username and password are required.' }, 400);
  }

  const newUser = {
    id: crypto.randomUUID(),
    username,
    password, 
    provider: 'local',
    createdAt: Date.now(),
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  };

  // D1 Path
  if (env.DB) {
    try {
      const existing = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
      if (existing) return response({ error: '该用户名已被注册' }, 409);

      await env.DB.prepare(
        'INSERT INTO users (id, username, password, provider, created_at, avatar_url) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(newUser.id, newUser.username, newUser.password, newUser.provider, newUser.createdAt, newUser.avatarUrl).run();
      
      return response(newUser, 201);
    } catch (e: any) {
      // If table doesn't exist, this might fail. In a real app, handle migrations.
      console.error("D1 Error", e);
      // Fallthrough to KV if D1 fails? No, stick to one source of truth per env usually.
      return response({ error: 'Database Error: ' + e.message }, 500);
    }
  }

  // KV Path
  const userKey = `USER:${username}`;
  const existing = await env.NANO_DB.get(userKey);
  
  if (existing) {
    return response({ error: '该用户名已被注册' }, 409);
  }

  await env.NANO_DB.put(userKey, JSON.stringify(newUser));
  return response(newUser, 201);
}

async function handleLogin(env: any, body: any) {
  const { username, password } = body;
  
  if (!username || !password) {
    return response({ error: 'Missing credentials' }, 400);
  }

  let user: any = null;

  // D1 Path
  if (env.DB) {
     try {
       user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
       // Convert keys if necessary (SQL uses snake_case usually, but we inserted whatever we wanted or need to map)
       // With the insert above, columns matched object props if standard SQL.
       // Let's assume the select returns the columns as defined in schema.
       if (user) {
         // Map back snake_case to camelCase if you used snake_case in D1 schema, 
         // but our insert query above used explicit columns. 
         // For simplicity here, assuming columns match object keys or using generic handling.
         // If we created table with snake_case:
         if (user.avatar_url) { user.avatarUrl = user.avatar_url; delete user.avatar_url; }
         if (user.created_at) { user.createdAt = user.created_at; delete user.created_at; }
       }
     } catch (e) {
       console.error("D1 Login Error", e);
     }
  } else {
    // KV Path
    const userStr = await env.NANO_DB.get(`USER:${username}`);
    if (userStr) user = JSON.parse(userStr);
  }
  
  if (!user) {
    return response({ error: '用户不存在' }, 404);
  }
  
  if (user.password !== password) {
    return response({ error: '密码错误' }, 401);
  }
  
  return response(user, 200);
}

async function handleChangePassword(env: any, body: any) {
  const { username, currentPassword, newPassword } = body;

  if (!username || !currentPassword || !newPassword) {
    return response({ error: 'Missing information' }, 400);
  }

  // D1 Path
  if (env.DB) {
    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!user) return response({ error: '用户不存在' }, 404);
    if (user.password !== currentPassword) return response({ error: '当前密码错误' }, 401);

    await env.DB.prepare('UPDATE users SET password = ? WHERE username = ?').bind(newPassword, username).run();
    return response({ success: true });
  }

  // KV Path
  const userKey = `USER:${username}`;
  const userStr = await env.NANO_DB.get(userKey);
  if (!userStr) return response({ error: '用户不存在' }, 404);

  const user = JSON.parse(userStr);
  if (user.password !== currentPassword) {
    return response({ error: '当前密码错误' }, 401);
  }

  user.password = newPassword;
  await env.NANO_DB.put(userKey, JSON.stringify(user));

  return response({ success: true });
}