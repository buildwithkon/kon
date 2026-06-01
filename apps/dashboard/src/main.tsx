/** @jsxImportSource preact */
import { render } from 'preact'
import { App } from './app'

const root = document.getElementById('kon-dashboard-root')
if (!root) throw new Error('#kon-dashboard-root missing from index.html')
render(<App />, root)
