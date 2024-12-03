import { Hono } from 'hono'
import ens from './ens'

const app = new Hono<{ Bindings: Env }>()
app.route('/ens', ens)

export type ApiType = typeof app
export default app
