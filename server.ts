import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// ─── ESM-safe __dirname ───────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Env Validation ───────────────────────────────────────────────────────────
const JWT_SECRET     = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TURSO_URL      = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN    = process.env.TURSO_AUTH_TOKEN;

if (!JWT_SECRET || !ADMIN_PASSWORD) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET and ADMIN_PASSWORD must be set in production.');
    process.exit(1);
  } else {
    console.warn('WARNING: Using default dev secrets. Set JWT_SECRET and ADMIN_PASSWORD in .env');
  }
}

if (!TURSO_URL || !TURSO_TOKEN) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.');
    process.exit(1);
  } else {
    console.warn('WARNING: Turso not configured — using local SQLite file (dev only).');
  }
}

const JWT_SECRET_FINAL     = JWT_SECRET     || 'dev-secret-do-not-use-in-prod';
const ADMIN_PASSWORD_FINAL = ADMIN_PASSWORD || 'admin123';

// ─── Database Client ──────────────────────────────────────────────────────────
// Production  → Turso cloud DB (free 500MB, data lives forever)
// Development → local SQLite file, no setup needed
const db = createClient(
  TURSO_URL && TURSO_TOKEN
    ? { url: TURSO_URL, authToken: TURSO_TOKEN }
    : { url: 'file:prompts.db' }
);

// ─── Database Init ────────────────────────────────────────────────────────────
async function initDB() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS categories (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT,
      content     TEXT NOT NULL,
      category_id INTEGER,
      tags        TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      views       INTEGER DEFAULT 0,
      copies      INTEGER DEFAULT 0,
      is_public   INTEGER DEFAULT 1,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      label         TEXT NOT NULL,
      provider      TEXT NOT NULL,
      api_key       TEXT NOT NULL,
      default_model TEXT,
      is_active     INTEGER DEFAULT 1,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id   INTEGER,
      api_key_id  INTEGER,
      model_used  TEXT,
      response    TEXT,
      tokens_used INTEGER,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prompt_id)  REFERENCES prompts(id),
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER UNIQUE NOT NULL,
      display_name TEXT NOT NULL DEFAULT 'Admin',
      email        TEXT NOT NULL DEFAULT '',
      theme        TEXT NOT NULL DEFAULT 'dark',
      language     TEXT NOT NULL DEFAULT 'en',
      notif_copy   INTEGER DEFAULT 1,
      notif_new    INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed only if db is empty
  const { rows } = await db.execute('SELECT COUNT(*) as count FROM categories');
  if (Number((rows[0] as any).count) === 0) {
    const categories = [
      ['Coding', 'coding'],
      ['Design', 'design'],
      ['Frameworks', 'frameworks'],
      ['Website', 'website'],
      ['Content Creation', 'content-creation'],
      ['Data Science', 'data-science'],
    ];
    for (const [name, slug] of categories) {
      await db.execute({ sql: 'INSERT INTO categories (name, slug) VALUES (?, ?)', args: [name, slug] });
    }

    const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD_FINAL, 10);
    await db.execute({ sql: 'INSERT INTO users (username, password) VALUES (?, ?)', args: ['admin', hashedPassword] });

    await db.execute({
      sql:  'INSERT INTO prompts (title, description, content, category_id, tags) VALUES (?, ?, ?, ?, ?)',
      args: ['React Glassmorphism', 'Generate glassmorphism React components.',
             'Act as a React expert. Create components using Tailwind CSS with a modern glassmorphism design. Include a Card, Button, and Navbar.',
             1, 'React,UI,Tailwind'],
    });
    await db.execute({
      sql:  'INSERT INTO prompts (title, description, content, category_id, tags) VALUES (?, ?, ?, ?, ?)',
      args: ['Python Debugger Master', 'Locate logic errors in complex Python projects.',
             'You are an expert Python developer. I will provide Python files and a bug description. Analyze the code, identify the root cause, and provide a fix.',
             1, 'Python,Debugging'],
    });
    console.log('Database seeded with default data.');
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function firstRow(rows: any[]): any | null {
  return rows.length > 0 ? rows[0] : null;
}

// ─── Rate Limiter (login brute-force protection) ──────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function loginRateLimiter(req: any, res: any, next: any) {
  const ip  = req.ip || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 10)
      return res.status(429).json({ message: 'Too many attempts. Try again in 15 minutes.' });
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  }
  next();
}

// ─── Server ───────────────────────────────────────────────────────────────────
async function startServer() {
  await initDB();

  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET_FINAL, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required.' });
    try {
      const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
      const user = firstRow(rows);
      if (!user || !bcrypt.compareSync(password, user.password as string))
        return res.status(401).json({ message: 'Invalid credentials.' });
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET_FINAL, { expiresIn: '8h' });
      res.json({ token });
    } catch (err: any) {
      res.status(500).json({ message: 'Login error.', error: err.message });
    }
  });

  app.get('/api/prompts', async (req, res) => {
    const { category, search } = req.query;
    let sql = `SELECT p.*, c.name as category_name FROM prompts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_public = 1`;
    const args: any[] = [];
    if (category) { sql += ' AND c.slug = ?'; args.push(category); }
    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const t = `%${search}%`;
      args.push(t, t, t);
    }
    sql += ' ORDER BY p.created_at DESC';
    try {
      const { rows } = await db.execute({ sql, args });
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.get('/api/prompts/:id', async (req, res) => {
    try {
      const { rows } = await db.execute({
        sql:  'SELECT p.*, c.name as category_name FROM prompts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
        args: [req.params.id],
      });
      const prompt = firstRow(rows);
      if (!prompt) return res.status(404).json({ message: 'Prompt not found.' });
      await db.execute({ sql: 'UPDATE prompts SET views = views + 1 WHERE id = ?', args: [req.params.id] });
      res.json(prompt);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.post('/api/prompts/:id/copy', async (req, res) => {
    try {
      await db.execute({ sql: 'UPDATE prompts SET copies = copies + 1 WHERE id = ?', args: [req.params.id] });
      res.sendStatus(200);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.get('/api/categories', async (_req, res) => {
    try {
      const { rows } = await db.execute('SELECT * FROM categories ORDER BY name ASC');
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: PROMPTS
  // ═══════════════════════════════════════════════════════════════════════════

  app.get('/api/admin/prompts', authenticateToken, async (_req, res) => {
    try {
      const { rows } = await db.execute(`SELECT p.*, c.name as category_name FROM prompts p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC`);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.post('/api/admin/prompts', authenticateToken, async (req, res) => {
    const { title, description, content, category_id, tags, is_public } = req.body;
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({ message: 'title and content are required.' });
    try {
      const result = await db.execute({
        sql:  'INSERT INTO prompts (title, description, content, category_id, tags, is_public) VALUES (?, ?, ?, ?, ?, ?)',
        args: [title, description ?? null, content, category_id ?? null, tags ?? null, is_public ? 1 : 0],
      });
      res.json({ id: Number(result.lastInsertRowid) });
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.put('/api/admin/prompts/:id', authenticateToken, async (req, res) => {
    const { title, description, content, category_id, tags, is_public } = req.body;
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({ message: 'title and content are required.' });
    try {
      await db.execute({
        sql:  'UPDATE prompts SET title=?, description=?, content=?, category_id=?, tags=?, is_public=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        args: [title, description ?? null, content, category_id ?? null, tags ?? null, is_public ? 1 : 0, req.params.id],
      });
      res.sendStatus(200);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.delete('/api/admin/prompts/:id', authenticateToken, async (req, res) => {
    try {
      await db.execute({ sql: 'DELETE FROM prompts WHERE id = ?', args: [req.params.id] });
      res.sendStatus(200);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.get('/api/admin/stats', authenticateToken, async (_req, res) => {
    try {
      const [a, b, c, d] = await Promise.all([
        db.execute('SELECT COUNT(*) as count FROM prompts'),
        db.execute('SELECT SUM(views) as count FROM prompts'),
        db.execute('SELECT SUM(copies) as count FROM prompts'),
        db.execute(`SELECT p.*, c.name as category_name FROM prompts p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC LIMIT 5`),
      ]);
      res.json({
        totalPrompts:  Number((a.rows[0] as any).count),
        totalViews:    Number((b.rows[0] as any).count) || 0,
        totalCopies:   Number((c.rows[0] as any).count) || 0,
        recentPrompts: d.rows,
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: CATEGORIES
  // ═══════════════════════════════════════════════════════════════════════════

  app.post('/api/admin/categories', authenticateToken, async (req, res) => {
    const { name, slug } = req.body;
    if (!name?.trim() || !slug?.trim())
      return res.status(400).json({ message: 'name and slug are required.' });
    try {
      const result = await db.execute({ sql: 'INSERT INTO categories (name, slug) VALUES (?, ?)', args: [name, slug] });
      res.json({ id: Number(result.lastInsertRowid) });
    } catch {
      res.status(409).json({ message: 'Category already exists.' });
    }
  });

  app.delete('/api/admin/categories/:id', authenticateToken, async (req, res) => {
    try {
      await db.execute({ sql: 'UPDATE prompts SET category_id = NULL WHERE category_id = ?', args: [req.params.id] });
      await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [req.params.id] });
      res.sendStatus(200);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: API KEYS
  // ═══════════════════════════════════════════════════════════════════════════

  const VALID_PROVIDERS = ['openai', 'anthropic', 'gemini', 'groq', 'cohere', 'mistral'];

  app.get('/api/admin/api-keys', authenticateToken, async (_req, res) => {
    try {
      const { rows } = await db.execute(`
        SELECT id, label, provider, default_model, is_active, created_at,
               SUBSTR(api_key, 1, 6) || '••••••••' || SUBSTR(api_key, -4) as masked_key
        FROM api_keys ORDER BY created_at DESC
      `);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.post('/api/admin/api-keys', authenticateToken, async (req, res) => {
    const { label, provider, api_key, default_model } = req.body;
    if (!label?.trim() || !provider || !api_key?.trim())
      return res.status(400).json({ message: 'label, provider, and api_key are required.' });
    if (!VALID_PROVIDERS.includes(provider))
      return res.status(400).json({ message: `provider must be one of: ${VALID_PROVIDERS.join(', ')}` });
    try {
      const result = await db.execute({
        sql:  'INSERT INTO api_keys (label, provider, api_key, default_model) VALUES (?, ?, ?, ?)',
        args: [label, provider, api_key, default_model ?? null],
      });
      res.json({ id: Number(result.lastInsertRowid) });
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.put('/api/admin/api-keys/:id', authenticateToken, async (req, res) => {
    const { label, default_model, is_active } = req.body;
    try {
      await db.execute({
        sql:  'UPDATE api_keys SET label=?, default_model=?, is_active=? WHERE id=?',
        args: [label, default_model ?? null, is_active ? 1 : 0, req.params.id],
      });
      res.sendStatus(200);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  app.delete('/api/admin/api-keys/:id', authenticateToken, async (req, res) => {
    try {
      await db.execute({ sql: 'DELETE FROM api_keys WHERE id = ?', args: [req.params.id] });
      res.sendStatus(200);
    } catch (err: any) {
      res.status(500).json({ message: 'Error.', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: TEST PROMPT AGAINST AI
  // ═══════════════════════════════════════════════════════════════════════════

  app.post('/api/admin/test-prompt', authenticateToken, async (req, res) => {
    const { prompt_id, api_key_id, model } = req.body;
    if (!prompt_id || !api_key_id)
      return res.status(400).json({ message: 'prompt_id and api_key_id are required.' });

    try {
      const { rows: pr } = await db.execute({ sql: 'SELECT * FROM prompts WHERE id = ?', args: [prompt_id] });
      const prompt = firstRow(pr);
      if (!prompt) return res.status(404).json({ message: 'Prompt not found.' });

      const { rows: kr } = await db.execute({ sql: 'SELECT * FROM api_keys WHERE id = ?', args: [api_key_id] });
      const keyRow = firstRow(kr);
      if (!keyRow) return res.status(404).json({ message: 'API key not found.' });

      const provider   = keyRow.provider as string;
      const modelToUse = model || keyRow.default_model;
      let responseText = '';
      let tokensUsed   = 0;

      if (provider === 'anthropic') {
        const chosenModel = modelToUse || 'claude-3-5-haiku-20241022';
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': keyRow.api_key as string, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: chosenModel, max_tokens: 1024, messages: [{ role: 'user', content: prompt.content }] }),
        });
        const data = await r.json() as any;
        if (!r.ok) return res.status(502).json({ message: data.error?.message || 'Anthropic error.' });
        responseText = data.content?.[0]?.text || '';
        tokensUsed   = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      } else if (provider === 'gemini') {
        const chosenModel = modelToUse || 'gemini-1.5-flash';
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${keyRow.api_key}`,
          { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt.content }] }] }) }
        );
        const data = await r.json() as any;
        if (!r.ok) return res.status(502).json({ message: data.error?.message || 'Gemini error.' });
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        tokensUsed   = data.usageMetadata?.totalTokenCount || 0;

      } else {
        const baseUrls:     Record<string, string> = { openai: 'https://api.openai.com/v1', groq: 'https://api.groq.com/openai/v1', mistral: 'https://api.mistral.ai/v1', cohere: 'https://api.cohere.com/compatibility/v1' };
        const defaultModels:Record<string, string> = { openai: 'gpt-4o-mini', groq: 'llama-3.1-8b-instant', mistral: 'mistral-small-latest', cohere: 'command-r-plus-08-2024' };
        const chosenModel = modelToUse || defaultModels[provider] || 'gpt-4o-mini';
        const r = await fetch(`${baseUrls[provider] || 'https://api.openai.com/v1'}/chat/completions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${keyRow.api_key}`, 'content-type': 'application/json' },
          body: JSON.stringify({ model:
