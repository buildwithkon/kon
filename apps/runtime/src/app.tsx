/** @jsxImportSource preact */
import { signal } from '@preact/signals'
import type { KonPageV1, KonPluginV1 } from '@konxyz/runtime-core'
import { deployment, entry, errorMessage, manifest, stage, stageDetail } from './state'
import { resolvePlugin } from './plugin-registry'
import { ensureWallet } from './wallet-singleton'

const activePageId = signal<string | null>(null)

function fmtIpfs(uri: string | undefined): string {
  if (!uri) return '(none)'
  return uri.length > 36 ? `${uri.slice(0, 24)}…${uri.slice(-8)}` : uri
}

function PluginRenderer({ plugin }: { plugin: KonPluginV1 }) {
  const m = manifest.value
  const d = deployment.value
  if (!m || !d) return null

  const Component = resolvePlugin(plugin.id)
  if (!Component) {
    return (
      <div
        style={{
          padding: '1rem',
          border: '1px dashed #c0392b',
          borderRadius: '8px',
          background: '#fef0f0',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.85rem',
          margin: '1rem 0'
        }}
      >
        unknown plugin: <strong>{plugin.id}</strong> @ {plugin.version} ({fmtIpfs(plugin.source)})
      </div>
    )
  }

  const wallet = ensureWallet(d.wallet_origin)
  // biome-ignore lint/suspicious/noExplicitAny: plugin contract erases prop shape
  const rendered = Component({
    props: (plugin.props ?? {}) as any,
    context: { deployment: d, appId: m.app.id, wallet }
  })
  // biome-ignore lint/suspicious/noExplicitAny: Preact h returns any-shaped vnode
  return rendered as any
}

function PageView({ page }: { page: KonPageV1 }) {
  const plugins = page.plugins ?? []
  return (
    <section style={{ padding: '1.5rem 0' }}>
      <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0' }}>{page.title}</h2>
      {plugins.length === 0 ? (
        <div style={{ color: '#888', fontStyle: 'italic' }}>(no plugins on this page)</div>
      ) : (
        plugins.map((p) => <PluginRenderer key={`${p.id}-${p.version}`} plugin={p} />)
      )}
    </section>
  )
}

function Nav({ pages, activeId }: { pages: KonPageV1[]; activeId: string }) {
  return (
    <nav
      style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #ddd',
        marginBottom: '1rem',
        paddingBottom: '0.5rem'
      }}
    >
      {pages.map((p) => {
        const active = p.id === activeId
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              activePageId.value = p.id
            }}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: active ? '1px solid #1a73e8' : '1px solid transparent',
              background: active ? '#e8f0fe' : 'transparent',
              color: active ? '#1a73e8' : 'inherit',
              cursor: 'pointer',
              font: 'inherit'
            }}
          >
            {p.title}
          </button>
        )
      })}
    </nav>
  )
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

  const pages = m.pages
  const currentId = activePageId.value ?? pages[0]?.id
  const currentPage = pages.find((p) => p.id === currentId) ?? pages[0]

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{m.app.name}</h1>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {m.app.id} · v{m.app.version}
        </div>
      </header>

      {pages.length > 1 && <Nav pages={pages} activeId={currentPage?.id ?? ''} />}

      {currentPage && <PageView page={currentPage} />}

      <details style={{ marginTop: '3rem', color: '#888', fontSize: '0.85rem' }}>
        <summary>runtime diagnostics</summary>
        <dl style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
          <dt style={{ color: '#888' }}>wallet_origin</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.wallet_origin}</dd>
          <dt style={{ color: '#888' }}>gun_peers</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.gun_peers.join(', ')}</dd>
          <dt style={{ color: '#888' }}>ipfs_gateways</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.ipfs_gateways.join(', ')}</dd>
          <dt style={{ color: '#888' }}>entry.runtime</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{fmtIpfs(e.runtime)}</dd>
          <dt style={{ color: '#888' }}>entry.manifest</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{fmtIpfs(e.manifest)}</dd>
        </dl>
      </details>
    </div>
  )
}
