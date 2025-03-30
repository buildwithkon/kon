import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', './routes/_index.tsx'),
  route('home', './routes/home.tsx'),
  route('info', './routes/info.tsx'),
  route('qa', './routes/qa.tsx'),
  route('forum', './routes/forum.tsx'),
  route('misc', './routes/misc.tsx')
] satisfies RouteConfig
