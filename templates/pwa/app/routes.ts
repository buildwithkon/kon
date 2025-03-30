import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', './routes/_index.tsx'),
  route('/start', './routes/start.tsx'),
  route('*', './routes/page.tsx')
] satisfies RouteConfig
