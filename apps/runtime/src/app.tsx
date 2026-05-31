import { deployment, entry, errorMessage, manifest, stage, stageDetail } from './state'

function fmtIpfs(uri: string | undefined): string {
  if (!uri) return '(none)'
  return uri.length > 36 ? `${uri.slice(0, 24)}…${uri.slice(-8)}` : uri
}

export function App() {
  const s = stage.value

  if (s === 'error') {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ color: '#c0392b', fontSize: '1.25rem' }}>KON runtime failed to boot</h1>
        <pre
          style={{
            background: '#fef0f0',
            padding: '1rem',
            borderRadius: '8px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {errorMessage.value}
        </pre>
        <p style={{ color: '#666' }}>
          Override the entry CID in development with <code>?entry=ipfs://CID</code> in the URL.
        </p>
      </div>
    )
  }

  if (s !== 'ready') {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ color: '#666' }}>KON runtime: {s}</div>
        {stageDetail.value && <div style={{ color: '#999', fontSize: '0.85rem' }}>{stageDetail.value}</div>}
      </div>
    )
  }

  const m = manifest.value
  const e = entry.value
  const d = deployment.value
  if (!m || !e || !d) return null

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '720px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{m.app.name}</h1>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {m.app.id} · v{m.app.version}
        </div>
        {m.app.description && <p style={{ color: '#444' }}>{m.app.description}</p>}
      </header>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#444' }}>Pages</h2>
        <ul style={{ paddingLeft: '1rem' }}>
          {m.pages.map((p) => (
            <li key={p.id}>
              <strong>{p.title}</strong>
              <span style={{ color: '#888' }}>
                {' '}
                · {p.plugins?.length ?? 0} plugin{(p.plugins?.length ?? 0) === 1 ? '' : 's'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#444' }}>Resolved deployment</h2>
        <dl style={{ fontSize: '0.85rem', fontFamily: 'ui-monospace, monospace' }}>
          <dt style={{ color: '#888' }}>wallet_origin</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.wallet_origin}</dd>
          <dt style={{ color: '#888' }}>ens_domain</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.ens_domain}</dd>
          <dt style={{ color: '#888' }}>gun_peers</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.gun_peers.join(', ')}</dd>
          <dt style={{ color: '#888' }}>ipfs_gateways</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.ipfs_gateways.join(', ')}</dd>
        </dl>
      </section>

      <section>
        <h2 style={{ fontSize: '1rem', color: '#444' }}>Entry</h2>
        <dl style={{ fontSize: '0.85rem', fontFamily: 'ui-monospace, monospace' }}>
          <dt style={{ color: '#888' }}>runtime</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{fmtIpfs(e.runtime)}</dd>
          <dt style={{ color: '#888' }}>manifest</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{fmtIpfs(e.manifest)}</dd>
        </dl>
      </section>

      <footer style={{ marginTop: '2rem', color: '#999', fontSize: '0.85rem' }}>
        Phase 1 runtime — page rendering and plugin loading land in Phase 2 (#9). For now this shows that
        ENS → entry → manifest resolution works end-to-end.
      </footer>
    </div>
  )
}
