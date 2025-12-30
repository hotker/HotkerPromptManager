
import express from 'express';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

// --- Security Configuration ---
const BCRYPT_ROUNDS = 10;

// XSS 防护：输入清理函数
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 检查是否为 bcrypt 格式的密码
function isBcryptHash(str) {
  return str && str.startsWith('$2');
}

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
  
  -- Module版本历史
  CREATE TABLE IF NOT EXISTS module_versions (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    tags TEXT NOT NULL,
    image_url TEXT,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    change_summary TEXT,
    is_tagged INTEGER DEFAULT 0,
    tag_name TEXT
  );
  
  -- Template版本历史
  CREATE TABLE IF NOT EXISTS template_versions (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    module_ids TEXT NOT NULL,
    config TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    change_summary TEXT,
    is_tagged INTEGER DEFAULT 0,
    tag_name TEXT
  );
  
  CREATE INDEX IF NOT EXISTS idx_module_versions_module_id ON module_versions(module_id, version_number DESC);
  CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id, version_number DESC);
  CREATE INDEX IF NOT EXISTS idx_module_versions_user_id ON module_versions(user_id);
  CREATE INDEX IF NOT EXISTS idx_template_versions_user_id ON template_versions(user_id);
  
  -- 分享记录表
  CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    share_key TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    share_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    data_json TEXT NOT NULL,
    password_hash TEXT,
    expire_at INTEGER,
    view_count INTEGER DEFAULT 0,
    import_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_accessed_at INTEGER
  );
  
  CREATE INDEX IF NOT EXISTS idx_shares_share_key ON shares(share_key);
  CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
  CREATE INDEX IF NOT EXISTS idx_shares_created_at ON shares(created_at DESC);
`);

// --- Express App ---
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: UPLOAD_LIMIT }));
app.use(express.text({ limit: UPLOAD_LIMIT }));

// --- Security Middleware ---
// CSP 头部
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://generativelanguage.googleapis.com https://api.qrserver.com"
  );
  next();
});

// 频率限制器
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次请求
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

const shareLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

const optimizeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'AI 请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

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

      const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
      const redirectUri = `${baseUrl}/api/auth?action=google-callback`;

      console.log('------------------------------------------------');
      console.log('🔵 Google Auth Debug Info');
      console.log('   Redirect URI:', redirectUri);
      console.log('   PLEASE ENSURE THIS EXACT URL IS ADDED TO GOOGLE CLOUD CONSOLE');
      console.log('------------------------------------------------');

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
        const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
        const redirectUri = `${baseUrl}/api/auth?action=google-callback`;

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
app.post('/api/auth', authLimiter, async (req, res) => {
  const action = req.query.action;
  const body = req.body;

  try {
    if (action === 'register') {
      const { username, password } = body;
      if (!username || !password || username.length < 3) {
        return res.status(400).json({ error: 'Username and password required.' });
      }

      // 清理输入防止 XSS
      const safeUsername = sanitizeInput(username);

      const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(safeUsername);
      if (existing) return res.status(409).json({ error: '该用户名已被注册' });

      // 使用 bcrypt 加密密码
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const newUser = {
        id: crypto.randomUUID(),
        username: safeUsername,
        password: hashedPassword,
        provider: 'local',
        createdAt: Date.now(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${safeUsername}`
      };

      db.prepare(
        'INSERT INTO users (id, username, password, provider, created_at, avatar_url) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(newUser.id, newUser.username, newUser.password, newUser.provider, newUser.createdAt, newUser.avatarUrl);

      // 不返回密码字段
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);

    } else if (action === 'login') {
      const { username, password } = body;
      if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

      if (!user) return res.status(404).json({ error: '用户不存在' });

      // 检查密码格式并验证
      let isPasswordValid = false;

      if (isBcryptHash(user.password)) {
        // 新格式：bcrypt 验证
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        // 旧格式：明文比较，然后自动迁移到 bcrypt
        if (user.password === password) {
          isPasswordValid = true;
          // 迁移到 bcrypt
          const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
          db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
          console.log(`🔐 Password migrated to bcrypt for user: ${user.username}`);
        }
      }

      if (!isPasswordValid) return res.status(401).json({ error: '密码错误' });

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

      // 验证当前密码
      let isCurrentPasswordValid = false;

      if (isBcryptHash(user.password)) {
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      } else {
        isCurrentPasswordValid = (user.password === currentPassword);
      }

      if (!isCurrentPasswordValid) return res.status(401).json({ error: '当前密码错误' });

      // 新密码使用 bcrypt 加密
      const hashedNewPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedNewPassword, username);
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
          } catch { }
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

// 4. Version History Routes

// 4.1 获取模块版本历史
app.get('/api/versions/module/:moduleId', (req, res) => {
  const { moduleId } = req.params;
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const versions = db.prepare(`
      SELECT * FROM module_versions 
      WHERE module_id = ? AND user_id = ?
      ORDER BY version_number DESC
    `).all(moduleId, userId);

    res.json(versions.map(v => ({
      id: v.id,
      moduleId: v.module_id,
      userId: v.user_id,
      versionNumber: v.version_number,
      title: v.title,
      description: v.description,
      content: v.content,
      type: v.type,
      tags: JSON.parse(v.tags),
      imageUrl: v.image_url,
      createdAt: v.created_at,
      createdBy: v.created_by,
      changeSummary: v.change_summary,
      isTagged: Boolean(v.is_tagged),
      tagName: v.tag_name
    })));
  } catch (e) {
    console.error('Fetch module versions error:', e);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// 4.2 获取模板版本历史
app.get('/api/versions/template/:templateId', (req, res) => {
  const { templateId } = req.params;
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const versions = db.prepare(`
      SELECT * FROM template_versions 
      WHERE template_id = ? AND user_id = ?
      ORDER BY version_number DESC
    `).all(templateId, userId);

    res.json(versions.map(v => ({
      id: v.id,
      templateId: v.template_id,
      userId: v.user_id,
      versionNumber: v.version_number,
      name: v.name,
      description: v.description,
      moduleIds: JSON.parse(v.module_ids),
      config: JSON.parse(v.config),
      createdAt: v.created_at,
      createdBy: v.created_by,
      changeSummary: v.change_summary,
      isTagged: Boolean(v.is_tagged),
      tagName: v.tag_name
    })));
  } catch (e) {
    console.error('Fetch template versions error:', e);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// 4.3 创建模块版本
app.post('/api/versions/module', (req, res) => {
  const { moduleId, userId, module, changeSummary } = req.body;

  if (!moduleId || !userId || !module) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const maxVersion = db.prepare(`
      SELECT MAX(version_number) as max FROM module_versions 
      WHERE module_id = ? AND user_id = ?
    `).get(moduleId, userId);

    const versionNumber = (maxVersion?.max || 0) + 1;
    const versionId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO module_versions 
      (id, module_id, user_id, version_number, title, description, content, type, tags, image_url, created_at, created_by, change_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      moduleId,
      userId,
      versionNumber,
      module.title,
      module.description || null,
      module.content,
      module.type,
      JSON.stringify(module.tags || []),
      module.imageUrl || null,
      Date.now(),
      userId,
      changeSummary || null
    );

    res.json({ success: true, versionNumber, versionId });
  } catch (e) {
    console.error('Create module version error:', e);
    res.status(500).json({ error: 'Failed to create version' });
  }
});

// 4.4 创建模板版本
app.post('/api/versions/template', (req, res) => {
  const { templateId, userId, template, changeSummary } = req.body;

  if (!templateId || !userId || !template) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const maxVersion = db.prepare(`
      SELECT MAX(version_number) as max FROM template_versions 
      WHERE template_id = ? AND user_id = ?
    `).get(templateId, userId);

    const versionNumber = (maxVersion?.max || 0) + 1;
    const versionId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO template_versions 
      (id, template_id, user_id, version_number, name, description, module_ids, config, created_at, created_by, change_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      templateId,
      userId,
      versionNumber,
      template.name,
      template.description,
      JSON.stringify(template.moduleIds || []),
      JSON.stringify(template.config),
      Date.now(),
      userId,
      changeSummary || null
    );

    res.json({ success: true, versionNumber, versionId });
  } catch (e) {
    console.error('Create template version error:', e);
    res.status(500).json({ error: 'Failed to create version' });
  }
});

// 4.5 标记版本
app.post('/api/versions/tag', (req, res) => {
  const { versionId, tagName, type } = req.body;

  if (!versionId || !tagName || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const table = type === 'module' ? 'module_versions' : 'template_versions';
    db.prepare(`UPDATE ${table} SET is_tagged = 1, tag_name = ? WHERE id = ?`)
      .run(tagName, versionId);
    res.json({ success: true });
  } catch (e) {
    console.error('Tag version error:', e);
    res.status(500).json({ error: 'Failed to tag version' });
  }
});

// 4.6 取消标记版本
app.post('/api/versions/untag', (req, res) => {
  const { versionId, type } = req.body;

  if (!versionId || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const table = type === 'module' ? 'module_versions' : 'template_versions';
    db.prepare(`UPDATE ${table} SET is_tagged = 0, tag_name = NULL WHERE id = ?`)
      .run(versionId);
    res.json({ success: true });
  } catch (e) {
    console.error('Untag version error:', e);
    res.status(500).json({ error: 'Failed to untag version' });
  }
});

// 4.7 恢复到指定版本
app.post('/api/versions/restore', (req, res) => {
  const { versionId, type } = req.body;

  if (!versionId || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const table = type === 'module' ? 'module_versions' : 'template_versions';
    const version = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(versionId);

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const restoredData = type === 'module' ? {
      id: version.module_id,
      title: version.title,
      description: version.description,
      content: version.content,
      type: version.type,
      tags: JSON.parse(version.tags),
      imageUrl: version.image_url,
      createdAt: version.created_at
    } : {
      id: version.template_id,
      name: version.name,
      description: version.description,
      moduleIds: JSON.parse(version.module_ids),
      config: JSON.parse(version.config),
      createdAt: version.created_at,
      updatedAt: Date.now()
    };

    res.json({ success: true, version: restoredData });
  } catch (e) {
    console.error('Restore version error:', e);
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

// 5. Sharing Routes

// 5.1 创建分享
app.post('/api/shares/create', shareLimiter, async (req, res) => {
  const { userId, shareType, title, description, data, password, expiresInDays } = req.body;

  if (!userId || !shareType || !title || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const shareId = crypto.randomUUID();
    const shareKey = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const now = Date.now();

    let expireAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expireAt = now + (expiresInDays * 24 * 60 * 60 * 1000);
    }

    // 使用 bcrypt 加密分享密码
    let passwordHash = null;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    // XSS 防护：清理标题和描述
    const safeTitle = sanitizeInput(title);
    const safeDescription = description ? sanitizeInput(description) : null;

    db.prepare(`
      INSERT INTO shares 
      (id, share_key, user_id, share_type, title, description, data_json, password_hash, expire_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      shareId,
      shareKey,
      userId,
      shareType,
      safeTitle,
      safeDescription,
      JSON.stringify(data),
      passwordHash,
      expireAt,
      now
    );

    const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${baseUrl}/share/${shareKey}`;

    res.json({
      success: true,
      shareId,
      shareKey,
      shareUrl,
      hasPassword: !!passwordHash,
      expiresAt: expireAt
    });
  } catch (e) {
    console.error('Create share error:', e);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

// 5.2 访问分享
app.post('/api/shares/access', shareLimiter, async (req, res) => {
  const { shareKey, password } = req.body;

  if (!shareKey) {
    return res.status(400).json({ error: 'Missing share key' });
  }

  try {
    const share = db.prepare('SELECT * FROM shares WHERE share_key = ?').get(shareKey);

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.expire_at && share.expire_at < Date.now()) {
      return res.status(410).json({ error: 'Share expired' });
    }

    // 验证分享密码
    if (share.password_hash) {
      if (!password) {
        return res.status(401).json({ error: 'Password required' });
      }

      let isPasswordValid = false;

      if (isBcryptHash(share.password_hash)) {
        // 新格式：bcrypt 验证
        isPasswordValid = await bcrypt.compare(password, share.password_hash);
      } else {
        // 旧格式：Base64 比较，然后自动迁移到 bcrypt
        const providedHash = Buffer.from(password).toString('base64');
        if (providedHash === share.password_hash) {
          isPasswordValid = true;
          // 迁移到 bcrypt
          const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
          db.prepare('UPDATE shares SET password_hash = ? WHERE id = ?').run(newHash, share.id);
          console.log(`🔐 Share password migrated to bcrypt for share: ${share.share_key}`);
        }
      }

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    db.prepare(`
      UPDATE shares 
      SET view_count = view_count + 1, last_accessed_at = ?
      WHERE share_key = ?
    `).run(Date.now(), shareKey);

    res.json({
      success: true,
      share: {
        id: share.id,
        shareType: share.share_type,
        title: share.title,
        description: share.description,
        data: JSON.parse(share.data_json),
        createdAt: share.created_at,
        viewCount: share.view_count + 1,
        importCount: share.import_count
      }
    });
  } catch (e) {
    console.error('Access share error:', e);
    res.status(500).json({ error: 'Failed to access share' });
  }
});

// 5.3 记录导入
app.post('/api/shares/import', (req, res) => {
  const { shareKey } = req.body;

  if (!shareKey) {
    return res.status(400).json({ error: 'Missing share key' });
  }

  try {
    db.prepare('UPDATE shares SET import_count = import_count + 1 WHERE share_key = ?')
      .run(shareKey);
    res.json({ success: true });
  } catch (e) {
    console.error('Import tracking error:', e);
    res.status(500).json({ error: 'Failed to track import' });
  }
});

// 5.4 获取我的分享列表
app.get('/api/shares/my-shares', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const shares = db.prepare(`
      SELECT id, share_key, share_type, title, description, 
             view_count, import_count, created_at, expire_at, password_hash
      FROM shares 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    res.json(shares.map(s => ({
      id: s.id,
      shareKey: s.share_key,
      shareType: s.share_type,
      title: s.title,
      description: s.description,
      viewCount: s.view_count,
      importCount: s.import_count,
      createdAt: s.created_at,
      expireAt: s.expire_at,
      hasPassword: !!s.password_hash,
      isExpired: s.expire_at ? s.expire_at < Date.now() : false
    })));
  } catch (e) {
    console.error('Get shares error:', e);
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

// 5.5 删除分享
app.delete('/api/shares/:shareId', (req, res) => {
  const { shareId } = req.params;
  const { userId } = req.query;

  if (!shareId || !userId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    db.prepare('DELETE FROM shares WHERE id = ? AND user_id = ?')
      .run(shareId, userId);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete share error:', e);
    res.status(500).json({ error: 'Failed to delete share' });
  }
});

// ============================================
// 智能优化助手 API
// ============================================

// Gemini API 调用辅助函数
async function callGeminiAPI(prompt, apiKey, model = 'gemini-2.0-flash-exp') {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini API');
    }

    return text;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

// 提示词质量分析
app.post('/api/optimize/analyze', optimizeLimiter, async (req, res) => {
  const { prompt, apiKey } = req.body;

  if (!prompt || !apiKey) {
    return res.status(400).json({ error: 'Missing prompt or API key' });
  }

  const analyzePrompt = `你是一个专业的提示词工程师。请分析以下提示词的质量，并提供改进建议。

提示词：
"""
${prompt}
"""

请从以下维度进行分析：
1. 清晰性（Clarity）：指令是否清晰明确，用户能否理解期望的输出
2. 具体性（Specificity）：是否提供了足够的细节和约束，避免模糊性
3. 结构化（Structure）：是否有良好的组织结构，逻辑是否清晰
4. 完整性（Completeness）：是否包含必要的上下文信息和要求

请严格按照以下 JSON 格式输出（只返回 JSON，不要包含其他文字）：
{
  "overallScore": 85,
  "dimensions": {
    "clarity": 90,
    "specificity": 80,
    "structure": 85,
    "completeness": 85
  },
  "issues": [
    "问题描述1",
    "问题描述2"
  ],
  "suggestions": [
    "改进建议1",
    "改进建议2"
  ]
}`;

  try {
    const result = await callGeminiAPI(analyzePrompt, apiKey);

    // 尝试解析 JSON 响应
    let analysis;
    try {
      // 移除可能的 markdown 代码块标记
      const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('Failed to parse analysis result:', result);
      return res.status(500).json({
        error: 'Failed to parse AI response',
        rawResponse: result.substring(0, 500)
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
});

// 提示词优化
app.post('/api/optimize/improve', optimizeLimiter, async (req, res) => {
  const { prompt, apiKey } = req.body;

  if (!prompt || !apiKey) {
    return res.status(400).json({ error: 'Missing prompt or API key' });
  }

  const improvePrompt = `你是一个专业的提示词工程师。请优化以下提示词，使其更清晰、具体、结构化。

原始提示词：
"""
${prompt}
"""

优化要求：
1. 确保角色定义清晰（如果缺少，添加适当的角色定义）
2. 任务描述具体明确（避免模糊表达）
3. 添加必要的约束条件（如输出长度、格式等）
4. 明确输出格式（JSON、Markdown、纯文本等）
5. 保持原意不变，只改进表达和结构
6. 如果原提示词已经很好，可以保持不变或小幅优化

请直接返回优化后的提示词，不要包含其他解释或格式标记。`;

  try {
    const optimized = await callGeminiAPI(improvePrompt, apiKey);

    res.json({
      original: prompt,
      optimized: optimized.trim()
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ error: 'Optimization failed: ' + error.message });
  }
});


// Static file serving (this should be at the end)
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`🚀 Hotker Prompt Studio running on port ${PORT}\n📂 Database: ${DB_PATH}`));
