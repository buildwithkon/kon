import { Hono } from 'hono'

const xmtp = new Hono<{ Bindings: Env }>()

const ensureSchema = async (db: D1Database) => {
  await db
    .exec(
      `CREATE TABLE IF NOT EXISTS xmtp_invites (
        slug TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );`
    )
    .catch(() => {})
}

// Redirect helper: /xmtp/invite/:slug -> original invite URL
xmtp.get('/invite/:slug', async (c) => {
  const slug = c.req.param('slug')
  const db = c.env.APP_DB
  await ensureSchema(db)
  const row = await db.prepare('SELECT * FROM xmtp_invites WHERE slug = ?').bind(slug).first()
  if (!row) return c.text('Invite not found', 404)
  return c.redirect(row.url as string, 302)
})

// Fetch invite details as JSON
xmtp.get('/invites/:slug', async (c) => {
  const slug = c.req.param('slug')
  const db = c.env.APP_DB
  await ensureSchema(db)
  const row = await db.prepare('SELECT * FROM xmtp_invites WHERE slug = ?').bind(slug).first()
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json(row)
})

// Create an invite record
xmtp.post('/invites', async (c) => {
  const db = c.env.APP_DB
  await ensureSchema(db)
  const body = await c.req.json<{ url?: string; slug?: string; title?: string }>().catch(() => ({}))
  const url = (body.url || '').trim()
  if (!url) return c.json({ error: 'url_required' }, 400)
  // Allow xmtp: scheme or HTTPS links to hosted invites
  const ok = /^xmtp:/i.test(url) || /^https?:\/\//i.test(url)
  if (!ok) return c.json({ error: 'invalid_url' }, 400)
  const slug = (body.slug || crypto.randomUUID().slice(0, 8)).toLowerCase()
  const title = body.title || null
  try {
    await db
      .prepare('INSERT INTO xmtp_invites (slug, url, title) VALUES (?, ?, ?)')
      .bind(slug, url, title)
      .run()
  } catch (e) {
    return c.json({ error: 'conflict_or_db_error' }, 409)
  }
  return c.json({ slug, url, title, link: `/xmtp/invite/${slug}` }, 201)
})

export default xmtp
