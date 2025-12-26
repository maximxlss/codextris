CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('score', 'time')),
  metric_value INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  time_ms INTEGER NOT NULL DEFAULT 0,
  lines INTEGER NOT NULL DEFAULT 0,
  pieces INTEGER NOT NULL DEFAULT 0,
  pps REAL NOT NULL DEFAULT 0,
  player_name TEXT NOT NULL,
  seed INTEGER,
  client_version TEXT,
  nonce TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS session_nonces (
  nonce TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS scores_mode_metric_value_idx
  ON scores (mode, metric, metric_value);
CREATE INDEX IF NOT EXISTS scores_player_mode_idx
  ON scores (player_name, mode);
CREATE INDEX IF NOT EXISTS session_nonces_ip_idx
  ON session_nonces (ip_hash);
CREATE INDEX IF NOT EXISTS session_nonces_expires_idx
  ON session_nonces (expires_at);
