import { Hono } from 'hono'
import { logger } from 'hono/logger'
import ens from './ens'
import ical from './ical'

const app = new Hono<{ Bindings: Env }>()
app.use(logger())
app.route('/ens', ens)
app.route('/ical', ical)

app.get('/', (c) => {
  return c.text('  ┌───────────────┐\n ＜  kon.xyz API  ｜\n  └───────────────┘')
})

export type ApiType = typeof app
export default app
