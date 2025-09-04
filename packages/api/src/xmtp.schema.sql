-- D1 schema for XMTP invite links
CREATE TABLE IF NOT EXISTS xmtp_invites (
  slug TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Example:
-- INSERT INTO xmtp_invites (slug, url, title) VALUES ('ethtokyo', 'xmtp://invite?group=abc123', 'ETH Tokyo Group');
