
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

// 2. Auth Routes
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
