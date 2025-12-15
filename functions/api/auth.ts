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
      console.error("D1 Error", e);
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
       if (user) {
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

// --- Google OAuth Handlers ---

function handleGoogleLogin(env: any, url: URL) {
  if (!env.GOOGLE_CLIENT_ID) {
    return new Response("Error: GOOGLE_CLIENT_ID not configured on server.", { status: 500 });
  }

  const redirectUri = `${url.origin}/api/auth?action=google-callback`;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;

  return Response.redirect(googleAuthUrl, 302);
}

async function handleGoogleCallback(env: any, request: Request, url: URL) {
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

    const tokenData: any = await tokenResp.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    // 2. Get User Info
    const userResp = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const googleUser: any = await userResp.json();
    
    // 3. Upsert User in DB
    const email = googleUser.email;
    const avatar = googleUser.picture;
    
    let appUser = null;

    if (env.DB) {
       // Check existing
       const existing = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(email).first();
       if (existing) {
         appUser = existing;
         // Map fields back
         if (appUser.avatar_url) { appUser.avatarUrl = appUser.avatar_url; delete appUser.avatar_url; }
         if (appUser.created_at) { appUser.createdAt = appUser.created_at; delete appUser.created_at; }
       } else {
         // Create new
         appUser = {
           id: crypto.randomUUID(),
           username: email,
           password: 'google-oauth-login-only',
           provider: 'google',
           createdAt: Date.now(),
           avatarUrl: avatar
         };
         await env.DB.prepare(
            'INSERT INTO users (id, username, password, provider, created_at, avatar_url) VALUES (?, ?, ?, ?, ?, ?)'
         ).bind(appUser.id, appUser.username, appUser.password, appUser.provider, appUser.createdAt, appUser.avatarUrl).run();
       }
    } else {
       // KV
       const userKey = `USER:${email}`;
       const userStr = await env.NANO_DB.get(userKey);
       if (userStr) {
         appUser = JSON.parse(userStr);
       } else {
         appUser = {
           id: crypto.randomUUID(),
           username: email,
           password: 'google-oauth-login-only',
           provider: 'google',
           createdAt: Date.now(),
           avatarUrl: avatar
         };
         await env.NANO_DB.put(userKey, JSON.stringify(appUser));
       }
    }

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
            const user = ${JSON.stringify(appUser)};
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

  } catch (e: any) {
    return new Response(`OAuth Error: ${e.message}`, { status: 500 });
  }
}