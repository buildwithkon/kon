/** @jsxImportSource preact */
import { hydrate, render } from 'preact'
import { App } from './app'

const root = document.getElementById('kon-site-root')!

// If the page was pre-rendered (production), hydrate. Otherwise (dev),
// render from scratch.
if (root.firstElementChild) {
  hydrate(<App url={window.location.pathname} />, root)
} else {
  render(<App url={window.location.pathname} />, root)
}
