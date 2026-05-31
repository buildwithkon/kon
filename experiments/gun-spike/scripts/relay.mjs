// Minimal local GUN relay for the spike.
// Run via `pnpm relay`. Listens on http://localhost:8765/gun
// The dev server's app peers list points to this relay first.

import { createServer } from 'node:http'
import Gun from 'gun'

const PORT = 8765
const server = createServer((req, res) => {
  // Health check / index
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('access-control-allow-headers', '*')
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true, gun: '0.2020' }))
    return
  }
  // Fall through to GUN's handler (it attaches to the server via `web` opt)
  res.writeHead(404)
  res.end()
})

server.listen(PORT, () => {
  console.log(`[relay] gun relay listening on http://localhost:${PORT}/gun`)
})

Gun({ web: server, radisk: false, localStorage: false })

let peerCount = 0
process.on('SIGINT', () => {
  console.log('\n[relay] shutdown')
  process.exit(0)
})

setInterval(() => {
  // Heartbeat so we know the relay is alive even when idle
  console.log(`[relay] alive, ${peerCount} known peers`)
}, 30000)
