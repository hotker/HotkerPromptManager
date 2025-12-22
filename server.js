
import express from 'express';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'hotker.db');
const UPLOAD_LIMIT = '10mb';

// --- Ensure Data Directory Exists ---
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// --- Database Setup ---
const db = new Database(DB_PATH);
// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, provider TEXT, created_at INTEGER, avatar_url TEXT);
  CREATE TABLE IF NOT EXISTS user_data (user_id TEXT PRIMARY KEY, data_json TEXT, updated_at INTEGER);
`);

// --- Express App ---
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: UPLOAD_LIMIT }));
app.use(express.text({ limit: UPLOAD_LIMIT }));

// --- Logic Helpers (Copied from Cloudflare Functions) ---
function xorDecodeBinary(buffer) {
  try {
    const key = "HotkerSync2025_Secret";
    const keyBytes = Buffer.from(key);
    const output = Buffer.alloc(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      output[i] = buffer[i] ^ keyBytes[i % keyBytes.length];
    }
    return output.toString('utf-8');
  } catch (e) {
    throw new Error("Binary Decryption Failed");
  }
}

function xorHexDecode(hexStr) {
  const key = "HotkerSync2025_Secret";
  if (hexStr.length % 2 !== 0) return "";
  const buffer = Buffer.from(hexStr, 'hex');
  const keyBytes = Buffer.from(key);
  const output = Buffer.alloc(buffer.length);
  
  for (let i = 0; i < buffer.length; i++) {
    output[i] = buffer[i] ^ keyBytes[i % keyBytes.length];
  }
  return output.toString('utf-8');
}

// --- API Routes ---

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      database: 'connected',
      type: 'SQLite (Docker)'
    },
    timestamp: Date.now(),
    env: 'production-docker'
  });
});

// 2. Auth Routes (Local username/password + Google OAuth)

// 2.1 Google OAuth (GET)
app.get('/api/auth', async (req, res) => {
  const action = req.query.action;

  try {
    // Start Google OAuth flow
    if (action === 'google-login') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res
          .status(500)
          .send('Error: GOOGLE_CLIENT_ID not configured on server.');
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth?action=google-callback`;
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=email%20profile`;

      return res.redirect(302, googleAuthUrl);
    }

    // Google OAuth callback
    if (action === 'google-callback') {
      const code = req.query.code;
      const error = req.query.error;

      if (error) {
        return res
          .status(400)
          .send(`Google Login Error: ${error}`);
      }
      if (!code) {
        return res.status(400).send('Missing auth code');
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res
          .status(500)
          .send('Error: Server missing Google Credentials');
      }

      try {
        const redirectUri = `${req.protocol}://${req.get('host')}/api/auth?action=google-callback`;

        // 1. Exchange code for token
        const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData = await tokenResp.json();
        if (tokenData.error) {
          throw new Error(
            tokenData.error_description || tokenData.error
          );
        }

        // 2. Get User Info
        const userResp = await fetch(
          'https://www.googleapis.com/oauth2/v1/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          }
        );
        const googleUser = await userResp.json();

        const email = googleUser.email;
        const avatar = googleUser.picture;

        if (!email) {
          throw new Error('Google user missing email');
        }

        // 3. Upsert User in SQLite
        let user = db
          .prepare('SELECT * FROM users WHERE username = ?')
          .get(email);

        if (!user) {
          const now = Date.now();
          const id = crypto.randomUUID();

          db.prepare(
            'INSERT INTO users (id, username, password, provider, created_at, avatar_url) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            id,
            email,
            'google-oauth-login-only',
            'google',
            now,
            avatar
          );

          user = {
            id,
            username: email,
            password: 'google-oauth-login-only',
            provider: 'google',
            created_at: now,
            avatar_url: avatar,
          };
        }

        // Normalize fields to match frontend expectation (camelCase)
        const appUser = {
          id: user.id,
          username: user.username,
          provider: user.provider,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
        };

        // 4. Return HTML to save session and redirect (bridge server → client)
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authenticating...</title>
            <meta charset="utf-8" />
            <style>
              body {
                background: #020617;
                color: #facc15;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
                display: flex;
                height: 100vh;
                justify-content: center;
                align-items: center;
                margin: 0;
              }
            </style>
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

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      } catch (e) {
        console.error('Google OAuth Error:', e);
        return res
          .status(500)
          .send(`OAuth Error: ${e.message || 'Unknown error'}`);
      }
    }

    return res.status(400).send('Invalid GET action');
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message || 'Internal Server Error');
  }
});

// 2.2 Local username/password (POST)
app.post('/api/auth', async (req, res) => {
  const action = req.query.action;
  const body = req.body;

  try {
    if (action === 'register') {
      const { username, password } = body;
      if (!username || !password || username.length < 3) {
        return res.status(400).json({ error: 'Username and password required.' });
      }

      const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (existing) return res.status(409).json({ error: '该用户名已被注册' });

      const newUser = {
        id: crypto.randomUUID(),
        username,
        password,
        provider: 'local',
        createdAt: Date.now(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      };

      db.prepare(
        'INSERT INTO users (id, username, password, provider, created_at, avatar_url) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(newUser.id, newUser.username, newUser.password, newUser.provider, newUser.createdAt, newUser.avatarUrl);

      return res.status(201).json(newUser);

    } else if (action === 'login') {
      const { username, password } = body;
      if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      
      if (!user) return res.status(404).json({ error: '用户不存在' });
      if (user.password !== password) return res.status(401).json({ error: '密码错误' });

      // Normalize fields to match frontend expectation (camelCase)
      const safeUser = {
        id: user.id,
        username: user.username,
        provider: user.provider,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      };
      
      return res.json(safeUser);

    } else if (action === 'change-password') {
      const { username, currentPassword, newPassword } = body;
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      
      if (!user) return res.status(404).json({ error: '用户不存在' });
      if (user.password !== currentPassword) return res.status(401).json({ error: '当前密码错误' });

      db.prepare('UPDATE users SET password = ? WHERE username = ?').run(newPassword, username);
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// 3. Data Sync Routes
app.get('/api/data', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const record = db.prepare('SELECT data_json FROM user_data WHERE user_id = ?').get(userId);
    const data = record && record.data_json ? JSON.parse(record.data_json) : { modules: [], templates: [], logs: [], apiKey: '' };
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/data', upload.single('file'), (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  let data = null;

  try {
    // Strategy 1: Multipart File (Binary)
    if (req.file) {
      const jsonStr = xorDecodeBinary(req.file.buffer);
      data = JSON.parse(jsonStr);
    } 
    // Strategy 2: Body parsing (Hex or JSON)
    else if (req.body) {
      // Check if body is a string (Hex/Text) or object (JSON)
      if (typeof req.body === 'string') {
        const cleanText = req.body.trim();
         if (/^[0-9a-fA-F]+$/.test(cleanText)) {
            try {
              data = JSON.parse(xorHexDecode(cleanText));
            } catch {}
         }
      } else if (typeof req.body === 'object') {
        // Standard JSON object via express.json()
        data = req.body.data || req.body;
      }
    }

    if (!data) return res.status(400).json({ error: 'Unrecognized data format' });

    const jsonStr = JSON.stringify(data);
    
    db.prepare(`
      INSERT INTO user_data (user_id, data_json, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET 
        data_json = excluded.data_json, 
        updated_at = excluded.updated_at
    `).run(userId, jsonStr, Date.now());

    res.json({ success: true, timestamp: Date.now() });

  } catch (e) {
    console.error("Save Data Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --- Serve Static Frontend (Vite Build) ---
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA Routing (Redirect all non-API requests to index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Hotker Prompt Studio running on port ${PORT}`);
  console.log(`📂 Database: ${DB_PATH}`);
});
