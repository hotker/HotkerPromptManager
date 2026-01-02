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

const response = (data: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
};

// 使用 Web Crypto API 进行密码哈希 (PBKDF2)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedKey = combined.slice(16);

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    const derivedKey = new Uint8Array(derivedBits);

    // 常量时间比较
    if (derivedKey.length !== storedKey.length) return false;
    let result = 0;
    for (let i = 0; i < derivedKey.length; i++) {
      result |= derivedKey[i] ^ storedKey[i];
    }
    return result === 0;
  } catch {
    return false;
  }
}

// 检测是否为新格式哈希 (PBKDF2)
function isPBKDF2Hash(str: string): boolean {
  try {
    const decoded = atob(str);
    return decoded.length === 48; // 16 bytes salt + 32 bytes hash
  } catch {
    return false;
  }
}

// 安全转义 JSON 用于嵌入 HTML script 标签
function escapeJsonForHtml(obj: Record<string, unknown>): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};

export const onRequest = async (context: PagesContext) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // 1. Environment Check (Support D1 or KV)
    if (!env.NANO_DB && !env.DB) {
      return response({ error: 'System Error: No Database (KV or D1) bound.' }, 503);
    }

    // 2. Handle GET Actions (Google OAuth)
    if (request.method === 'GET') {
      if (action === 'google-login') {
        return handleGoogleLogin(env, url);
      }
      if (action === 'google-callback') {
        return await handleGoogleCallback(env, request, url);
      }
      return response({ error: 'Invalid GET action' }, 400);
    }

    // 3. Handle POST Actions
    if (request.method === 'POST') {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return response({ error: 'Invalid JSON body' }, 400);
      }

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
    }

    return response({ error: 'Method not allowed' }, 405);

  } catch (e: any) {
    return response({ error: e.message || 'Internal Server Error' }, 500);
  }
}

// --- Action Handlers ---

// SQL Schema for D1:
// CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, provider TEXT, created_at INTEGER, avatar_url TEXT);

interface UserRecord {
  id: string;
  username: string;
  password: string;
  provider: string;
  createdAt: number;
  avatarUrl: string;
  avatar_url?: string;
  created_at?: number;
}

interface CloudflareEnv {
  DB?: D1Database;
  NANO_DB?: KVNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Result {
  success: boolean;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

async function handleRegister(env: CloudflareEnv, body: { username?: string; password?: string }) {
  const { username, password } = body;

  if (!username || !password || username.length < 3) {
    return response({ error: 'Validation Error: Username and password are required.' }, 400);
  }

  // 使用 PBKDF2 哈希密码
  const hashedPassword = await hashPassword(password);

  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    username,
    password: hashedPassword,
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

      // 不返回密码
      const { password: _, ...userWithoutPassword } = newUser;
      return response(userWithoutPassword as Record<string, unknown>, 201);
    } catch (e) {
      const error = e as Error;
      console.error("D1 Error", error);
      return response({ error: 'Database Error: ' + error.message }, 500);
    }
  }

  // KV Path
  const userKey = `USER:${username}`;
  const existing = await env.NANO_DB?.get(userKey);

  if (existing) {
    return response({ error: '该用户名已被注册' }, 409);
  }

  await env.NANO_DB?.put(userKey, JSON.stringify(newUser));
  const { password: _, ...userWithoutPassword } = newUser;
  return response(userWithoutPassword as Record<string, unknown>, 201);
}

async function handleLogin(env: CloudflareEnv, body: { username?: string; password?: string }) {
  const { username, password } = body;

  if (!username || !password) {
    return response({ error: 'Missing credentials' }, 400);
  }

  let user: UserRecord | null = null;

  // D1 Path
  if (env.DB) {
     try {
       user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<UserRecord>();
       if (user) {
         if (user.avatar_url) { user.avatarUrl = user.avatar_url; delete user.avatar_url; }
         if (user.created_at) { user.createdAt = user.created_at; delete user.created_at; }
       }
     } catch (e) {
       console.error("D1 Login Error", e);
     }
  } else {
    // KV Path
    const userStr = await env.NANO_DB?.get(`USER:${username}`);
    if (userStr) user = JSON.parse(userStr) as UserRecord;
  }

  if (!user) {
    return response({ error: '用户不存在' }, 404);
  }

  // 验证密码
  let isPasswordValid = false;

  if (isPBKDF2Hash(user.password)) {
    // 新格式：PBKDF2 验证
    isPasswordValid = await verifyPassword(password, user.password);
  } else {
    // 旧格式：明文比较，然后自动迁移到 PBKDF2
    if (user.password === password) {
      isPasswordValid = true;
      // 迁移到 PBKDF2
      const hashedPassword = await hashPassword(password);
      if (env.DB) {
        await env.DB.prepare('UPDATE users SET password = ? WHERE username = ?').bind(hashedPassword, username).run();
      } else if (env.NANO_DB) {
        user.password = hashedPassword;
        await env.NANO_DB.put(`USER:${username}`, JSON.stringify(user));
      }
      console.log(`Password migrated to PBKDF2 for user: ${user.username}`);
    }
  }

  if (!isPasswordValid) {
    return response({ error: '密码错误' }, 401);
  }

  // 不返回密码
  const { password: _, ...userWithoutPassword } = user;
  return response(userWithoutPassword as Record<string, unknown>, 200);
}

async function handleChangePassword(env: CloudflareEnv, body: { username?: string; currentPassword?: string; newPassword?: string }) {
  const { username, currentPassword, newPassword } = body;

  if (!username || !currentPassword || !newPassword) {
    return response({ error: 'Missing information' }, 400);
  }

  let user: UserRecord | null = null;

  // D1 Path
  if (env.DB) {
    user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<UserRecord>();
    if (!user) return response({ error: '用户不存在' }, 404);

    // 验证当前密码
    let isCurrentPasswordValid = false;
    if (isPBKDF2Hash(user.password)) {
      isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    } else {
      isCurrentPasswordValid = user.password === currentPassword;
    }

    if (!isCurrentPasswordValid) return response({ error: '当前密码错误' }, 401);

    const hashedNewPassword = await hashPassword(newPassword);
    await env.DB.prepare('UPDATE users SET password = ? WHERE username = ?').bind(hashedNewPassword, username).run();
    return response({ success: true });
  }

  // KV Path
  const userKey = `USER:${username}`;
  const userStr = await env.NANO_DB?.get(userKey);
  if (!userStr) return response({ error: '用户不存在' }, 404);

  user = JSON.parse(userStr) as UserRecord;

  // 验证当前密码
  let isCurrentPasswordValid = false;
  if (isPBKDF2Hash(user.password)) {
    isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
  } else {
    isCurrentPasswordValid = user.password === currentPassword;
  }

  if (!isCurrentPasswordValid) {
    return response({ error: '当前密码错误' }, 401);
  }

  const hashedNewPassword = await hashPassword(newPassword);
  user.password = hashedNewPassword;
  await env.NANO_DB?.put(userKey, JSON.stringify(user));

  return response({ success: true });
}

// --- Google OAuth Handlers ---

function handleGoogleLogin(env: CloudflareEnv, url: URL) {
  if (!env.GOOGLE_CLIENT_ID) {
    return new Response("Error: GOOGLE_CLIENT_ID not configured on server.", { status: 500 });
  }

  const redirectUri = `${url.origin}/api/auth?action=google-callback`;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;

  return Response.redirect(googleAuthUrl, 302);
}

interface TokenData {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUser {
  email?: string;
  picture?: string;
}

async function handleGoogleCallback(env: CloudflareEnv, request: Request, url: URL) {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`Google Login Error: ${error}`, { status: 400 });
  }
  if (!code) {
    return new Response("Missing auth code", { status: 400 });
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response("Error: Server missing Google Credentials", { status: 500 });
  }

  try {
    const redirectUri = `${url.origin}/api/auth?action=google-callback`;

    // 1. Exchange code for token
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResp.json() as TokenData;
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    // 2. Get User Info
    const userResp = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const googleUser = await userResp.json() as GoogleUser;

    // 3. Upsert User in DB
    const email = googleUser.email;
    const avatar = googleUser.picture;

    if (!email) {
      throw new Error('Google user missing email');
    }

    let appUser: Omit<UserRecord, 'avatar_url' | 'created_at'> | null = null;

    if (env.DB) {
       // Check existing
       const existing = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(email).first<UserRecord>();
       if (existing) {
         appUser = {
           id: existing.id,
           username: existing.username,
           password: existing.password,
           provider: existing.provider,
           avatarUrl: existing.avatar_url || existing.avatarUrl || '',
           createdAt: existing.created_at || existing.createdAt
         };
       } else {
         // Create new
         appUser = {
           id: crypto.randomUUID(),
           username: email,
           password: 'google-oauth-login-only',
           provider: 'google',
           createdAt: Date.now(),
           avatarUrl: avatar || ''
         };
         await env.DB.prepare(
            'INSERT INTO users (id, username, password, provider, created_at, avatar_url) VALUES (?, ?, ?, ?, ?, ?)'
         ).bind(appUser.id, appUser.username, appUser.password, appUser.provider, appUser.createdAt, appUser.avatarUrl).run();
       }
    } else if (env.NANO_DB) {
       // KV
       const userKey = `USER:${email}`;
       const userStr = await env.NANO_DB.get(userKey);
       if (userStr) {
         appUser = JSON.parse(userStr) as UserRecord;
       } else {
         appUser = {
           id: crypto.randomUUID(),
           username: email,
           password: 'google-oauth-login-only',
           provider: 'google',
           createdAt: Date.now(),
           avatarUrl: avatar || ''
         };
         await env.NANO_DB.put(userKey, JSON.stringify(appUser));
       }
    }

    if (!appUser) {
      throw new Error('Failed to create or retrieve user');
    }

    // 不返回密码
    const { password: _, ...userWithoutPassword } = appUser;

    // 4. Return HTML to save session and redirect (Bridge server-to-client)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authenticating...</title>
        <style>body { background: #09090b; color: #fbbf24; font-family: sans-serif; display: flex; height: 100vh; justify-content: center; align-items: center; }</style>
      </head>
      <body>
        <div style="text-align: center;">
          <h2>Login Successful</h2>
          <p>Redirecting to studio...</p>
        </div>
        <script>
          try {
            const user = ${escapeJsonForHtml(userWithoutPassword as Record<string, unknown>)};
            localStorage.setItem('hotker_cloud_session', JSON.stringify(user));
            window.location.href = '/';
          } catch (e) {
            document.body.innerHTML = '<h3 style="color:red">Login Error: Failed to save session.</h3>';
          }
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (e) {
    const error = e as Error;
    return new Response(`OAuth Error: ${error.message}`, { status: 500 });
  }
}