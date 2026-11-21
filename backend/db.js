import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../database');
const dbPath = path.join(dbDir, 'chronolock.db');
const schemaPath = path.join(dbDir, 'schema.sql');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true, mode: 0o700 });
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA busy_timeout = 5000;');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

const MAX_RECORDS = 5000;

const insertStmt = db.prepare(`
  INSERT INTO lockscreens (
    slug, edit_token_hash, title, mantra, target_iso, device_type, theme_id, milestones_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const getBySlugStmt = db.prepare(`
  SELECT slug, edit_token_hash, title, mantra, target_iso, device_type, theme_id, milestones_json, created_at, updated_at
  FROM lockscreens
  WHERE slug = ?
`);

const updateMilestonesStmt = db.prepare(`
  UPDATE lockscreens
  SET milestones_json = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE slug = ?
`);

const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM lockscreens`);

const pruneOldestStmt = db.prepare(`
  DELETE FROM lockscreens
  WHERE id IN (
    SELECT id FROM lockscreens ORDER BY created_at ASC LIMIT ?
  )
`);

export function createLockscreen(record) {
  const row = countStmt.get();
  const total = Number(row?.total || 0);
  if (total >= MAX_RECORDS) {
    pruneOldestStmt.run(Math.max(1, total - MAX_RECORDS + 50));
  }
  insertStmt.run(
    record.slug,
    record.edit_token_hash,
    record.title,
    record.mantra,
    record.target_iso,
    record.device_type,
    record.theme_id,
    JSON.stringify(record.milestones)
  );
}

export function findLockscreenBySlug(slug) {
  const row = getBySlugStmt.get(slug);
  if (!row) return null;
  return {
    slug: row.slug,
    editTokenHash: row.edit_token_hash,
    title: row.title,
    mantra: row.mantra,
    targetIso: row.target_iso,
    deviceType: row.device_type,
    themeId: row.theme_id,
    milestones: JSON.parse(row.milestones_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function updateLockscreenMilestones(slug, milestones) {
  const result = updateMilestonesStmt.run(JSON.stringify(milestones), slug);
  return Number(result.changes) > 0;
}