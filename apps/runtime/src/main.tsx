import '@fontsource-variable/hanken-grotesk'
import { render } from 'preact'
import { App } from './app'
import { boot } from './boot'

// Global baseline: soft off-white canvas + crisp font rendering. Per-app theme
// (colors, font family) is layered on top by the shell via themeVars().
const base = document.createElement('style')
base.textContent = `
  :root { --kon-canvas: #f4f3f0; --kon-ink: #16151a; --kon-muted: #6b6975; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--kon-canvas);
    color: var(--kon-ink);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
`
document.head.appendChild(base)

render(<App />, document.getElementById('kon-root')!)

void boot()
