/** @jsxImportSource preact */
const footStyle = {
  textAlign: 'center' as const,
  padding: '4rem 1.5rem 2rem',
  fontSize: '0.85rem',
  color: '#888',
  fontFamily: 'ui-monospace, "JetBrains Mono", monospace'
}

export function BuildWith() {
  return (
    <footer style={footStyle}>
      <div>Built on KON v2 — Vite + Preact + IPFS + ENS + GUN.js</div>
      <div style={{ marginTop: '0.5rem' }}>
        <a href="https://github.com/buildwithkon/kon" rel="noreferrer" style={{ color: 'inherit' }}>
          github.com/buildwithkon/kon
        </a>
      </div>
    </footer>
  )
}
