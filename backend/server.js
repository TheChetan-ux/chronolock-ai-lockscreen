import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  createLockscreen,
  findLockscreenBySlug,
  updateLockscreenMilestones
} from './db.js';
import {
  GeneratePlanSchema,
  SaveDesignSchema,
  UpdateMilestonesSchema,
  SlugParamSchema,
  generateCredentials,
  verifyEditToken
} from './security.js';
import { generateLockscreenPlan } from './gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../frontend');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

// 1. Strict HTTP Security Headers & Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'connect-src': ["'self'"],
        'font-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"]
      }
    },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginEmbedderPolicy: false
  })
);

// 2. Origin Lock
const allowedOrigin = process.env.ALLOWED_ORIGIN || `http://localhost:${PORT}`;
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === allowedOrigin) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'X-Edit-Token']
  })
);

// 3. Strict Payload Cap (16 KB prevents memory exhaustion)
app.use(express.json({ limit: '16kb', strict: true }));

// 4. Sliding-Window Rate Limiters
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI generation requests. Please wait a few minutes.' }
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Try again shortly.' }
});

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'paste_your_google_ai_studio_api_key_here'
    )
  });
});

// AI Milestone & Theme Generation Endpoint
app.post('/api/generate', aiLimiter, async (req, res, next) => {
  try {
    const parsed = GeneratePlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input parameters.' });
    }

    const plan = await generateLockscreenPlan(parsed.data);
    return res.json(plan);
  } catch (err) {
    return next(err);
  }
});

// Save & Publish Shareable Lock Screen
app.post('/api/designs', writeLimiter, (req, res, next) => {
  try {
    const parsed = SaveDesignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid lock screen configuration.' });
    }

    const { slug, editToken, editTokenHash } = generateCredentials();
    const milestones = parsed.data.milestones.map((m, idx) => ({
      id: m.id || `m${idx + 1}`,
      label: m.label,
      dueOffsetLabel: m.dueOffsetLabel,
      done: Boolean(m.done)
    }));

    createLockscreen({
      slug,
      edit_token_hash: editTokenHash,
      title: parsed.data.title,
      mantra: parsed.data.mantra,
      target_iso: parsed.data.targetIso,
      device_type: parsed.data.deviceType,
      theme_id: parsed.data.themeId,
      milestones
    });

    return res.status(201).json({
      slug,
      editToken,
      sharePath: `/d/${slug}`
    });
  } catch (err) {
    return next(err);
  }
});

// Fetch Public Read-Only Lock Screen by Slug
app.get('/api/designs/:slug', (req, res) => {
  const slugCheck = SlugParamSchema.safeParse(req.params.slug);
  if (!slugCheck.success) {
    return res.status(400).json({ error: 'Malformed design identifier.' });
  }

  const record = findLockscreenBySlug(slugCheck.data);
  if (!record) {
    return res.status(404).json({ error: 'Lock screen design not found.' });
  }

  // Never return editTokenHash to clients
  return res.json({
    slug: record.slug,
    title: record.title,
    mantra: record.mantra,
    targetIso: record.targetIso,
    deviceType: record.deviceType,
    themeId: record.themeId,
    milestones: record.milestones,
    updatedAt: record.updatedAt
  });
});

// Update Milestone Checkboxes (Requires Cryptographic X-Edit-Token)
app.patch('/api/designs/:slug/milestones', writeLimiter, (req, res) => {
  const slugCheck = SlugParamSchema.safeParse(req.params.slug);
  if (!slugCheck.success) {
    return res.status(400).json({ error: 'Malformed design identifier.' });
  }

  const providedToken = req.get('X-Edit-Token') || '';
  const record = findLockscreenBySlug(slugCheck.data);
  if (!record) {
    return res.status(404).json({ error: 'Lock screen design not found.' });
  }

  if (!verifyEditToken(providedToken, record.editTokenHash)) {
    return res.status(403).json({ error: 'Unauthorized: invalid or missing edit token.' });
  }

  const bodyCheck = UpdateMilestonesSchema.safeParse(req.body);
  if (!bodyCheck.success) {
    return res.status(400).json({ error: 'Invalid milestones payload.' });
  }

  const normalized = bodyCheck.data.milestones.map((m, idx) => ({
    id: m.id || `m${idx + 1}`,
    label: m.label,
    dueOffsetLabel: m.dueOffsetLabel,
    done: Boolean(m.done)
  }));

  updateLockscreenMilestones(record.slug, normalized);
  return res.json({ ok: true, milestones: normalized });
});

// Serve Static Frontend Assets
app.use(express.static(frontendDir, { maxAge: '1h' }));

// SPA Route for Shared Permalinks (/d/:slug)
app.get('/d/:slug', (_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Global Error Handler (Zero Stack-Trace Exposure)
app.use((err, _req, res, _next) => {
  const errorId = crypto.randomBytes(6).toString('hex');
  console.error(`[Error ${errorId}]`, err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload exceeds 16KB limit.' });
  }
  return res.status(500).json({ error: `Internal server error (ref: ${errorId}).` });
});

app.listen(PORT, () => {
  console.log(`ChronoLock hardened server running at http://localhost:${PORT}`);
});
