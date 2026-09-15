const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'ctrltab.db');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const UPLOADS_DIR = path.join(path.dirname(DB_PATH), 'uploads');
// Map met de statische frontend; in de container /app/public (zie Dockerfile).
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, 'public');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.png', '.svg', '.ico'];
    const allowedMimes = ['image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_TYPE'));
    }
  }
});

const uploadJson = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || path.extname(file.originalname).toLowerCase() === '.json') {
      cb(null, true);
    } else {
      cb(new Error('INVALID_TYPE'));
    }
  }
});

const uploadHtml = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['text/html', 'application/xhtml+xml'].includes(file.mimetype) || ['.html', '.htm'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_TYPE'));
    }
  }
});

const uploadBg = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/bmp', 'image/gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_TYPE'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(UPLOADS_DIR));

// ─── Database Setup ───────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT NULL,
    sort_order INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    favicon TEXT DEFAULT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
  );
`);

// Migration: add user_id column if upgrading from older version
const collectionColumns = db.pragma('table_info(collections)');
if (!collectionColumns.some(col => col.name === 'user_id')) {
  console.log('Migrating database: adding user_id to collections...');
  db.exec('ALTER TABLE collections ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
}

// Migration: add preferences column to users
const userColumns = db.pragma('table_info(users)');
if (!userColumns.some(col => col.name === 'preferences')) {
  console.log('Migrating database: adding preferences to users...');
  db.exec("ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT '{}'");
}

// ─── Admin User Seeding ──────────────────────────────────────────
async function seedAdmin() {
  const existing = db.prepare('SELECT * FROM users WHERE is_admin = 1').get();

  if (!existing) {
    console.log(`Creating admin user: ${ADMIN_USERNAME}`);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const result = db.prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)')
      .run(ADMIN_USERNAME, hash);
    // Assign any orphaned collections to admin
    db.prepare('UPDATE collections SET user_id = ? WHERE user_id IS NULL').run(result.lastInsertRowid);
  } else {
    // Update admin username and password if env vars changed
    if (existing.username !== ADMIN_USERNAME) {
      console.log(`Updating admin username from environment: ${ADMIN_USERNAME}`);
      db.prepare('UPDATE users SET username = ? WHERE id = ?').run(ADMIN_USERNAME, existing.id);
    }
    const match = await bcrypt.compare(ADMIN_PASSWORD, existing.password_hash);
    if (!match) {
      console.log('Updating admin password from environment...');
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existing.id);
    }
  }
}

seedAdmin().catch(console.error);

// ─── Auth Middleware ──────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = payload;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

// Helper: check if user owns a collection
function ownsCollection(collectionId, userId) {
  return db.prepare('SELECT id FROM collections WHERE id = ? AND user_id = ?').get(collectionId, userId);
}

// Helper: check if user owns a section (via collection)
function ownsSection(sectionId, userId) {
  return db.prepare(`
    SELECT s.id FROM sections s
    JOIN collections c ON s.collection_id = c.id
    WHERE s.id = ? AND c.user_id = ?
  `).get(sectionId, userId);
}

// Helper: check if user owns a link (via section → collection)
function ownsLink(linkId, userId) {
  return db.prepare(`
    SELECT l.id FROM links l
    JOIN sections s ON l.section_id = s.id
    JOIN collections c ON s.collection_id = c.id
    WHERE l.id = ? AND c.user_id = ?
  `).get(linkId, userId);
}

// ─── Authentication ──────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, username: user.username, is_admin: Boolean(user.is_admin) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, is_admin: Boolean(user.is_admin) }
  });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ─── OIDC / SSO (optioneel) ───────────────────────────────────────
// Blijft volledig uit tenzij OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET en
// OIDC_REDIRECT_URI alle vier gezet zijn. De lokale login hierboven blijft altijd
// werken: valt de provider uit, dan wil je er nog in kunnen.
require('./oidc').register(app, { db, jwtSecret: JWT_SECRET, bcrypt });

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ success: true });
});

// ─── User Preferences ────────────────────────────────────────────
app.get('/api/auth/preferences', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT preferences FROM users WHERE id = ?').get(req.user.id);
  res.json(JSON.parse(user?.preferences || '{}'));
});

app.put('/api/auth/preferences', authenticateToken, (req, res) => {
  const { accentColor, backgroundImage, backgroundDim } = req.body;
  if (accentColor !== null && accentColor !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
      return res.status(400).json({ error: 'Invalid accent color, expected #rrggbb' });
    }
  }
  const user = db.prepare('SELECT preferences FROM users WHERE id = ?').get(req.user.id);
  const prefs = JSON.parse(user?.preferences || '{}');
  if (accentColor) {
    prefs.accentColor = accentColor;
  } else if (accentColor === null) {
    delete prefs.accentColor;
  }
  if (backgroundImage) {
    prefs.backgroundImage = backgroundImage;
  } else if (backgroundImage === null) {
    delete prefs.backgroundImage;
  }
  if (backgroundDim !== undefined) {
    prefs.backgroundDim = backgroundDim !== false;
  }
  db.prepare('UPDATE users SET preferences = ? WHERE id = ?').run(JSON.stringify(prefs), req.user.id);
  res.json(prefs);
});

// ─── Admin: User Management ─────────────────────────────────────
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, is_admin, created_at FROM users ORDER BY created_at').all();
  res.json(users);
});

app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, is_admin } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username already exists' });

  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)')
    .run(username, hash, is_admin ? 1 : 0);

  const user = db.prepare('SELECT id, username, is_admin, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, is_admin } = req.body;
  const userId = parseInt(req.params.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Prevent removing own admin privileges
  if (userId === req.user.id && is_admin === false) {
    return res.status(400).json({ error: 'Cannot remove your own admin privileges' });
  }

  if (username && username !== user.username) {
    const dup = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
    if (dup) return res.status(409).json({ error: 'Username already exists' });
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, userId);
  }

  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const hash = await bcrypt.hash(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
  }

  if (typeof is_admin === 'boolean') {
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(is_admin ? 1 : 0, userId);
  }

  const updated = db.prepare('SELECT id, username, is_admin, created_at FROM users WHERE id = ?').get(userId);
  res.json(updated);
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);

  if (userId === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });

  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.is_admin) {
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get();
    if (adminCount.count <= 1) return res.status(400).json({ error: 'Cannot delete the last admin' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ deleted: true });
});

// ─── Collections ──────────────────────────────────────────────────
app.get('/api/collections', authenticateToken, (req, res) => {
  const collections = db.prepare('SELECT * FROM collections WHERE user_id = ? ORDER BY sort_order, id').all(req.user.id);
  res.json(collections);
});

app.post('/api/collections', authenticateToken, (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM collections WHERE user_id = ?').get(req.user.id);
  const result = db.prepare('INSERT INTO collections (name, icon, sort_order, user_id) VALUES (?, ?, ?, ?)')
    .run(name, icon || null, maxOrder.next, req.user.id);
  const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(collection);
});

app.put('/api/collections/:id', authenticateToken, (req, res) => {
  if (!ownsCollection(req.params.id, req.user.id)) return res.status(404).json({ error: 'Not found' });

  const { name, icon, sort_order } = req.body;
  db.prepare('UPDATE collections SET name = COALESCE(?, name), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order) WHERE id = ?')
    .run(name, icon, sort_order, req.params.id);
  const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  res.json(collection);
});

app.delete('/api/collections/:id', authenticateToken, (req, res) => {
  const result = db.prepare('DELETE FROM collections WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ─── Sections ─────────────────────────────────────────────────────
app.get('/api/collections/:collectionId/sections', authenticateToken, (req, res) => {
  if (!ownsCollection(req.params.collectionId, req.user.id)) return res.status(404).json({ error: 'Not found' });

  const sections = db.prepare('SELECT * FROM sections WHERE collection_id = ? ORDER BY sort_order, id').all(req.params.collectionId);
  res.json(sections);
});

app.post('/api/collections/:collectionId/sections', authenticateToken, (req, res) => {
  if (!ownsCollection(req.params.collectionId, req.user.id)) return res.status(404).json({ error: 'Not found' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM sections WHERE collection_id = ?').get(req.params.collectionId);
  const result = db.prepare('INSERT INTO sections (collection_id, name, sort_order) VALUES (?, ?, ?)').run(req.params.collectionId, name, maxOrder.next);
  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(section);
});

app.put('/api/sections/:id', authenticateToken, (req, res) => {
  if (!ownsSection(req.params.id, req.user.id)) return res.status(404).json({ error: 'Not found' });

  const { name, sort_order } = req.body;
  db.prepare('UPDATE sections SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?')
    .run(name, sort_order, req.params.id);
  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
  res.json(section);
});

app.delete('/api/sections/:id', authenticateToken, (req, res) => {
  if (!ownsSection(req.params.id, req.user.id)) return res.status(404).json({ error: 'Not found' });

  db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

app.put('/api/collections/:collectionId/sections/reorder', authenticateToken, (req, res) => {
  if (!ownsCollection(req.params.collectionId, req.user.id)) return res.status(404).json({ error: 'Not found' });

  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });

  const update = db.prepare('UPDATE sections SET sort_order = ? WHERE id = ? AND collection_id = ?');
  db.transaction(() => {
    order.forEach((id, index) => update.run(index, id, req.params.collectionId));
  })();
  res.json({ ok: true });
});

// ─── Favicon Helper ──────────────────────────────────────────────
function isPrivateHostname(hostname) {
  if (hostname === 'localhost') return true;
  const m = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [+m[1], +m[2]];
    return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return false;
}

async function fetchFavicon(siteUrl) {
  try {
    const parsed = new URL(siteUrl);
    const { hostname } = parsed;
    const local = isPrivateHostname(hostname);

    // Try to extract the real favicon URL from the page HTML (all sites)
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), local ? 2000 : 5000);
      const res = await fetch(siteUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'CtrlTab/1.0' },
        redirect: 'follow',
      });
      if (res.ok) {
        const html = await res.text();
        const base = res.url || siteUrl;
        // Check icon types in order of preference (apple-touch-icon is highest quality)
        const patterns = [
          /<link[^>]+rel=["'][^"']*apple-touch-icon(?:-precomposed)?[^"']*["'][^>]+href=["']([^"']+)["'][^>]*/i,
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon(?:-precomposed)?[^"']*["'][^>]*/i,
          /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["'][^>]*/i,
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["'][^>]*/i,
          /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["'][^>]*/i,
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["'][^>]*/i,
        ];
        for (const pat of patterns) {
          const m = html.match(pat);
          if (m && m[1]) return new URL(m[1], base).href;
        }
      }
    } catch { /* unreachable host */ }

    // Local apps the server can't reach: browser handles fallback
    if (local) return null;

    // Public sites: fall back to Google's favicon service
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
}

// ─── Background Upload ────────────────────────────────────────────
app.post('/api/upload/background', authenticateToken, (req, res, next) => {
  uploadBg.single('background')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 5 MB)' });
      if (err.message === 'INVALID_TYPE') return res.status(400).json({ error: 'Invalid file type. Use JPG, PNG, BMP, or GIF.' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No valid file uploaded. Use JPG, PNG, BMP, or GIF (max 5 MB).' });
    res.json({ url: `/api/uploads/${req.file.filename}` });
  });
});

// ─── Icon Upload ──────────────────────────────────────────────────
app.post('/api/upload/icon', authenticateToken, (req, res, next) => {
  upload.single('icon')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large (max 2 MB)' });
      }
      if (err.message === 'INVALID_TYPE') {
        return res.status(400).json({ error: 'Invalid file type. Use PNG, SVG, or ICO.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No valid file uploaded. Use PNG, SVG, or ICO (max 2 MB).' });
    const url = `/api/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

// ─── Links ────────────────────────────────────────────────────────
app.get('/api/sections/:sectionId/links', authenticateToken, (req, res) => {
  if (!ownsSection(req.params.sectionId, req.user.id)) return res.status(404).json({ error: 'Not found' });

  const links = db.prepare('SELECT * FROM links WHERE section_id = ? ORDER BY sort_order, id').all(req.params.sectionId);
  res.json(links);
});

app.post('/api/sections/:sectionId/links', authenticateToken, async (req, res) => {
  if (!ownsSection(req.params.sectionId, req.user.id)) return res.status(404).json({ error: 'Not found' });

  const { title, url, favicon } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title and url are required' });

  const faviconUrl = favicon || await fetchFavicon(url);
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM links WHERE section_id = ?').get(req.params.sectionId);
  const result = db.prepare('INSERT INTO links (section_id, title, url, favicon, sort_order) VALUES (?, ?, ?, ?, ?)').run(req.params.sectionId, title, url, faviconUrl, maxOrder.next);
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(link);
});

app.put('/api/links/:id', authenticateToken, async (req, res) => {
  if (!ownsLink(req.params.id, req.user.id)) return res.status(404).json({ error: 'Not found' });

  const { title, url, favicon, sort_order, section_id } = req.body;

  if (section_id && !ownsSection(section_id, req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Non-empty favicon string → custom uploaded icon, keep as-is
  // Empty string or missing → re-fetch for the (new) URL
  let newFavicon;
  if (favicon) {
    newFavicon = favicon;
  } else {
    const existing = db.prepare('SELECT url FROM links WHERE id = ?').get(req.params.id);
    newFavicon = await fetchFavicon(url || existing?.url);
  }

  db.prepare('UPDATE links SET title = COALESCE(?, title), url = COALESCE(?, url), favicon = COALESCE(?, favicon), sort_order = COALESCE(?, sort_order), section_id = COALESCE(?, section_id) WHERE id = ?')
    .run(title, url, newFavicon, sort_order, section_id ?? null, req.params.id);
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  res.json(link);
});

app.delete('/api/links/:id', authenticateToken, (req, res) => {
  if (!ownsLink(req.params.id, req.user.id)) return res.status(404).json({ error: 'Not found' });

  db.prepare('DELETE FROM links WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

app.put('/api/sections/:sectionId/links/reorder', authenticateToken, (req, res) => {
  if (!ownsSection(req.params.sectionId, req.user.id)) return res.status(404).json({ error: 'Not found' });

  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });

  const update = db.prepare('UPDATE links SET sort_order = ? WHERE id = ? AND section_id = ?');
  db.transaction(() => {
    order.forEach((id, index) => update.run(index, id, req.params.sectionId));
  })();
  res.json({ ok: true });
});

// ─── Full dashboard endpoint ─────────────────────────────────────
app.get('/api/dashboard/:collectionId', authenticateToken, (req, res) => {
  const collection = db.prepare('SELECT * FROM collections WHERE id = ? AND user_id = ?').get(req.params.collectionId, req.user.id);
  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  const sections = db.prepare('SELECT * FROM sections WHERE collection_id = ? ORDER BY sort_order, id').all(req.params.collectionId);

  const sectionsWithLinks = sections.map(section => ({
    ...section,
    links: db.prepare('SELECT * FROM links WHERE section_id = ? ORDER BY sort_order, id').all(section.id)
  }));

  res.json({
    ...collection,
    sections: sectionsWithLinks
  });
});

// ─── Search ───────────────────────────────────────────────────────
app.get('/api/search', authenticateToken, (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);

  const pattern = `%${q}%`;
  const results = db.prepare(`
    SELECT
      l.id, l.title, l.url, l.favicon, l.section_id,
      s.name  AS section_name,
      c.id    AS collection_id,
      c.name  AS collection_name
    FROM links l
    JOIN sections s ON l.section_id = s.id
    JOIN collections c ON s.collection_id = c.id
    WHERE c.user_id = ?
      AND (l.title LIKE ? COLLATE NOCASE OR l.url LIKE ? COLLATE NOCASE)
    ORDER BY c.sort_order, c.id, s.sort_order, s.id, l.sort_order, l.id
    LIMIT 200
  `).all(req.user.id, pattern, pattern);

  res.json(results);
});

// ─── Linkwarden Import ────────────────────────────────────────────
app.post('/api/import/linkwarden', authenticateToken, (req, res, next) => {
  uploadJson.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 10 MB)' });
      if (err.message === 'INVALID_TYPE') return res.status(400).json({ error: 'Only JSON files are supported.' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    let data;
    try {
      data = JSON.parse(req.file.buffer.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Invalid JSON file.' });
    }

    if (!Array.isArray(data?.collections)) {
      return res.status(400).json({ error: 'Invalid Linkwarden export format.' });
    }

    const importAll = db.transaction(() => {
      const counts = { collections: 0, sections: 0, links: 0 };
      const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM collections WHERE user_id = ?');

      for (const col of data.collections) {
        if (!col.name || !Array.isArray(col.links)) continue;

        const sortOrder = maxSort.get(req.user.id).m + 1;
        const newCol = db.prepare(
          'INSERT INTO collections (name, sort_order, user_id) VALUES (?, ?, ?)'
        ).run(col.name.slice(0, 255), sortOrder, req.user.id);
        counts.collections++;

        const newSec = db.prepare(
          'INSERT INTO sections (collection_id, name, sort_order) VALUES (?, ?, ?)'
        ).run(newCol.lastInsertRowid, 'Links', 0);
        counts.sections++;

        for (let i = 0; i < col.links.length; i++) {
          const link = col.links[i];
          if (!link.url) continue;
          db.prepare(
            'INSERT INTO links (section_id, title, url, favicon, sort_order) VALUES (?, ?, ?, ?, ?)'
          ).run(newSec.lastInsertRowid, (link.name || link.url).slice(0, 2048), link.url.slice(0, 2048), null, i);
          counts.links++;
        }
      }
      return counts;
    });

    try {
      const result = importAll();
      res.json({ imported: result });
    } catch (err) {
      console.error('Import error:', err);
      res.status(500).json({ error: 'Import failed: ' + err.message });
    }
  });
});

// ─── Export ───────────────────────────────────────────────────────
app.get('/api/export', authenticateToken, (req, res) => {
  const collections = db.prepare(
    'SELECT id, name, icon FROM collections WHERE user_id = ? ORDER BY sort_order'
  ).all(req.user.id);

  const result = collections.map(col => {
    const sections = db.prepare(
      'SELECT id, name FROM sections WHERE collection_id = ? ORDER BY sort_order'
    ).all(col.id);
    return {
      name: col.name,
      icon: col.icon,
      sections: sections.map(sec => {
        const links = db.prepare(
          'SELECT title, url, favicon FROM links WHERE section_id = ? ORDER BY sort_order'
        ).all(sec.id);
        return {
          name: sec.name,
          links: links.map(l => ({
            title: l.title,
            url: l.url,
            favicon: l.favicon && !l.favicon.startsWith('/api/uploads/') ? l.favicon : null
          }))
        };
      })
    };
  });

  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Disposition', `attachment; filename="ctrltab-backup-${date}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.json({ version: '1.0', exported_at: new Date().toISOString(), collections: result });
});

// ─── ctrlTAB backup import ────────────────────────────────────────
app.post('/api/import/ctrltab', authenticateToken, (req, res) => {
  uploadJson.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 10 MB)' });
      if (err.message === 'INVALID_TYPE') return res.status(400).json({ error: 'Only JSON files are supported.' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    let data;
    try {
      data = JSON.parse(req.file.buffer.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Invalid JSON file.' });
    }

    if (data?.version !== '1.0' || !Array.isArray(data?.collections)) {
      return res.status(400).json({ error: 'Invalid ctrlTAB backup format.' });
    }

    const importAll = db.transaction(() => {
      const counts = { collections: 0, links: 0 };
      const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM collections WHERE user_id = ?');
      const insertCol  = db.prepare('INSERT INTO collections (name, icon, sort_order, user_id) VALUES (?, ?, ?, ?)');
      const insertSec  = db.prepare('INSERT INTO sections (collection_id, name, sort_order) VALUES (?, ?, ?)');
      const insertLink = db.prepare('INSERT INTO links (section_id, title, url, favicon, sort_order) VALUES (?, ?, ?, ?, ?)');

      for (const col of data.collections) {
        if (!col.name || !Array.isArray(col.sections)) continue;
        const sortOrder = maxSort.get(req.user.id).m + 1;
        const newCol = insertCol.run(String(col.name).slice(0, 255), col.icon ? String(col.icon).slice(0, 255) : null, sortOrder, req.user.id);
        counts.collections++;

        for (let si = 0; si < col.sections.length; si++) {
          const sec = col.sections[si];
          if (!sec.name || !Array.isArray(sec.links)) continue;
          const newSec = insertSec.run(newCol.lastInsertRowid, String(sec.name).slice(0, 255), si);

          for (let li = 0; li < sec.links.length; li++) {
            const link = sec.links[li];
            if (!link.url) continue;
            const favicon = link.favicon && !String(link.favicon).startsWith('/api/uploads/') ? String(link.favicon).slice(0, 2048) : null;
            insertLink.run(newSec.lastInsertRowid, (link.title || link.url).slice(0, 2048), link.url.slice(0, 2048), favicon, li);
            counts.links++;
          }
        }
      }
      return counts;
    });

    try {
      res.json({ imported: importAll() });
    } catch (err) {
      console.error('ctrlTAB import error:', err);
      res.status(500).json({ error: 'Import failed: ' + err.message });
    }
  });
});

// ─── Browser bookmarks import ─────────────────────────────────────
function parseNetscapeBookmarks(html) {
  const collections = [];
  let dlDepth = 0;
  let col = null;
  let sec = null;

  function unescape(str) {
    return str
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
  }

  for (const rawLine of html.split('\n')) {
    const l = rawLine.trim();
    if (/<DL/i.test(l))  { dlDepth++; continue; }
    if (/<\/DL/i.test(l)) {
      dlDepth--;
      if (dlDepth === 1) sec = null;
      if (dlDepth === 0) { col = null; sec = null; }
      continue;
    }

    const h3 = l.match(/<H3[^>]*>([^<]+)<\/H3>/i);
    if (h3) {
      const name = unescape(h3[1].trim());
      if (dlDepth === 1) {
        col = { name, sections: [] };
        collections.push(col);
        sec = null;
      } else if (dlDepth === 2 && col) {
        sec = { name, links: [] };
        col.sections.push(sec);
      }
      continue;
    }

    const a = l.match(/<A\s[^>]*HREF="([^"]*)"[^>]*>([^<]*)<\/A>/i);
    if (a && col) {
      if (!sec) {
        sec = { name: 'Links', links: [] };
        col.sections.push(sec);
      }
      sec.links.push({ title: unescape(a[2].trim()) || a[1], url: a[1] });
    }
  }
  return collections;
}

app.post('/api/import/bookmarks', authenticateToken, (req, res) => {
  uploadHtml.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 10 MB)' });
      if (err.message === 'INVALID_TYPE') return res.status(400).json({ error: 'Only HTML files are supported.' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const html = req.file.buffer.toString('utf8');
    if (!html.includes('NETSCAPE-Bookmark-file')) {
      return res.status(400).json({ error: 'Invalid bookmark file. Export your bookmarks as HTML from your browser.' });
    }

    let parsed;
    try { parsed = parseNetscapeBookmarks(html); }
    catch { return res.status(400).json({ error: 'Failed to parse bookmark file.' }); }

    if (!parsed.length) {
      return res.status(400).json({ error: 'No bookmarks found in file.' });
    }

    const importAll = db.transaction(() => {
      const counts = { collections: 0, links: 0 };
      const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM collections WHERE user_id = ?');
      const insertCol  = db.prepare('INSERT INTO collections (name, sort_order, user_id) VALUES (?, ?, ?)');
      const insertSec  = db.prepare('INSERT INTO sections (collection_id, name, sort_order) VALUES (?, ?, ?)');
      const insertLink = db.prepare('INSERT INTO links (section_id, title, url, sort_order) VALUES (?, ?, ?, ?)');

      for (const col of parsed) {
        const validSections = col.sections.filter(s => s.links.some(l => l.url.startsWith('http')));
        if (!validSections.length) continue;

        const sortOrder = maxSort.get(req.user.id).m + 1;
        const newCol = insertCol.run(col.name.slice(0, 255), sortOrder, req.user.id);
        counts.collections++;

        for (let si = 0; si < validSections.length; si++) {
          const sec = validSections[si];
          const newSec = insertSec.run(newCol.lastInsertRowid, sec.name.slice(0, 255), si);
          let li = 0;
          for (const link of sec.links) {
            if (!link.url.startsWith('http')) continue;
            insertLink.run(newSec.lastInsertRowid, link.title.slice(0, 2048), link.url.slice(0, 2048), li++);
            counts.links++;
          }
        }
      }
      return counts;
    });

    try {
      res.json({ imported: importAll() });
    } catch (err) {
      console.error('Bookmarks import error:', err);
      res.status(500).json({ error: 'Import failed: ' + err.message });
    }
  });
});

// ─── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// ─── Frontend ─────────────────────────────────────────────────────
// De statische frontend wordt door deze server zelf geserveerd. Upstream zette er
// een aparte nginx-container voor, wat twee images en twee Deployments betekende;
// nu is het er één. nginx deed hier niets wat Express niet kan: statische files,
// een SPA-fallback en no-cache-headers op html/css/js (met ETag, dus een 304 zodra
// er niets veranderd is).
//
// Let op: de `client_max_body_size 3m` van nginx is hiermee vervallen. De grens ligt
// nu bij de multer-limieten per route hierboven (2 t/m 10 MB) en, in het homelab,
// bij MAX_CLIENT_SIZE van BunkerWeb ervoor.
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, {
    setHeaders: (res, filePath) => {
      if (/\.(html|css|js)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      }
    }
  }));

  // SPA-fallback voor alles wat niet onder /api/ valt. De lookahead is essentieel:
  // zonder die uitzondering zou een onbekende API-route index.html met status 200
  // teruggeven in plaats van een nette 404.
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
} else {
  console.warn(`Geen frontend gevonden in ${PUBLIC_DIR}; alleen de API is bereikbaar.`);
}

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ctrltab running on port ${PORT} (API + frontend)`);
});
