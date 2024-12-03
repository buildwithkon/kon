import { Hono } from 'hono'
import ens from './ens'

const app = new Hono<{ Bindings: Env }>()
app.route('/ens', ens)

app.get('/', (c) => {
  return c.text('  ┌───────────────┐\n ＜  kon.xyz API  ｜\n  └───────────────┘')
})

export type ApiType = typeof app
export default app
