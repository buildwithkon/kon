import { Hono } from 'hono'
import ens from './ens'

const app = new Hono<{ Bindings: Env }>()
app.route('/ens', ens)

app.get('/', (c) => {
  return c.text('kon.xyz API')
})

export type ApiType = typeof app
export default app
