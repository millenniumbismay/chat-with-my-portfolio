CREATE TABLE IF NOT EXISTS portfolio_state (
  id TEXT PRIMARY KEY,
  draft_json TEXT NOT NULL,
  published_json TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  published_at TEXT
);
