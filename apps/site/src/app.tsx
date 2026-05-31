/** @jsxImportSource preact */
import { Home } from './routes/home'
import { Stack } from './routes/stack'
import { NotFound } from './routes/not-found'

/**
 * Minimal routing. SSG pre-renders each route by URL; in-browser
 * navigation falls back to full page loads (we accept this for a
 * small marketing site — no client-side router needed). Adding
 * client-side nav later is one file (preact-iso or wouter).
 */
export function App({ url }: { url?: string } = {}) {
  const path = url ?? (typeof window !== 'undefined' ? window.location.pathname : '/')

  if (path === '/' || path === '') return <Home />
  if (path === '/stack' || path === '/stack/') return <Stack />
  return <NotFound />
}
