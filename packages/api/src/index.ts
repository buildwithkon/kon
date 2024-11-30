import { Hono } from 'hono'
import ens from './ens'

const app = new Hono()
app.route('/ens', ens)

export default app
