PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lockscreens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 12 AND 32),
    edit_token_hash TEXT NOT NULL CHECK (length(edit_token_hash) = 64),
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 60),
    mantra TEXT NOT NULL CHECK (length(mantra) <= 80),
    target_iso TEXT NOT NULL CHECK (length(target_iso) BETWEEN 10 AND 40),
    device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop')),
    theme_id TEXT NOT NULL CHECK (
        theme_id IN (
            'obsidian-gold',
            'nordic-paper',
            'cyber-emerald',
            'sunset-terracotta',
            'deep-cobalt'
        )
    ),
    milestones_json TEXT NOT NULL CHECK (length(milestones_json) <= 2048),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_lockscreens_slug ON lockscreens(slug);
CREATE INDEX IF NOT EXISTS idx_lockscreens_created_at ON lockscreens(created_at);
