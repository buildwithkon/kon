/** @jsxImportSource preact */
import { signal } from '@preact/signals'
import { useEffect, useState } from 'preact/hooks'
import type { KonPageV1, KonPluginComponent, KonPluginV1 } from '@konxyz/runtime-core'
import { deployment, entry, errorMessage, manifest, stage, stageDetail } from './state'
import { resolvePlugin } from './plugin-registry'
import { ensureWallet } from './wallet-singleton'
import { AdminApp } from './admin/admin-app'
import { themeVars } from './ui/use-theme'
import { TabBar } from './ui/tab-bar'

function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname
  return p === '/admin' || p.startsWith('/admin/')
}

const activePageId = signal<string | null>(null)

function fmtIpfs(uri: string | undefined): string {
  if (!uri) return '(none)'
  return uri.length > 36 ? `${uri.slice(0, 24)}…${uri.slice(-8)}` : uri
}

function unknownPluginCard(plugin: KonPluginV1, reason: string) {
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
      <div>
        <strong>{plugin.id}</strong> @ {plugin.version} — {reason}
      </div>
      <div style={{ color: '#888' }}>source: {fmtIpfs(plugin.source)}</div>
    </div>
  )
}

function loadingPluginCard(plugin: KonPluginV1) {
  return (
    <div style={{ padding: '0.75rem 1rem', color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>
      loading plugin <code>{plugin.id}</code>…
    </div>
  )
}

function PluginRenderer({ plugin }: { plugin: KonPluginV1 }) {
  const m = manifest.value
  const d = deployment.value
  const [dynamicComponent, setDynamicComponent] = useState<KonPluginComponent | null>(null)
  const [dynamicError, setDynamicError] = useState<string | null>(null)

  const resolution = m && d ? resolvePlugin(plugin, d) : null

  useEffect(() => {
    if (resolution?.kind !== 'dynamic') return
    let cancelled = false
    resolution.promise.then(
      (component) => {
        if (!cancelled) setDynamicComponent(() => component)
      },
      (e) => {
        if (!cancelled) setDynamicError(e instanceof Error ? e.message : String(e))
      }
    )
    return () => {
      cancelled = true
    }
  }, [resolution?.kind === 'dynamic' ? resolution.source : null])

  if (!m || !d || !resolution) return null

  if (resolution.kind === 'unknown') {
    return unknownPluginCard(plugin, resolution.reason)
  }

  let Component: KonPluginComponent | null = null
  if (resolution.kind === 'builtin') {
    Component = resolution.component
  } else if (resolution.kind === 'dynamic') {
    if (dynamicError) return unknownPluginCard(plugin, `load failed: ${dynamicError}`)
    if (!dynamicComponent) return loadingPluginCard(plugin)
    Component = dynamicComponent
  }
  if (!Component) return null

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

  // /admin route: dashboard UI. Same runtime, same loaded manifest;
  // the dashboard mutates a local draft and publishes a release.
  if (isAdminPath()) {
    return <AdminApp />
  }

  const pages = m.pages
  const currentId = activePageId.value ?? pages[0]?.id
  const currentPage = pages.find((p) => p.id === currentId) ?? pages[0]
  // Single-page apps get no nav (and so no nav-offset padding).
  const showNav = pages.length > 1

  return (
    <div
      style={Object.assign(themeVars(m.app.theme), { minHeight: '100vh' })}
      class={showNav ? 'kon-shell kon-has-nav' : 'kon-shell'}
    >
      <style>{`
        .kon-shell-main { max-width: 720px; margin: 0 auto; padding: 1.5rem 1rem; }
        .kon-header { background: var(--kon-main); color: #fff; padding: 1.25rem 1rem; }
        .kon-header h1 { font-size: 1.4rem; margin: 0; }
        .kon-has-nav { padding-bottom: 4.5rem; }
        @media (min-width: 768px) {
          .kon-has-nav { padding-bottom: 0; padding-left: 200px; }
        }
      `}</style>

      <header class="kon-header">
        <h1>{m.app.name}</h1>
        {import.meta.env.DEV && (
          <a
            href="/admin"
            style={{ color: '#fff', opacity: 0.7, fontSize: '0.8rem', textDecoration: 'none' }}
          >
            ⚙ Admin
          </a>
        )}
      </header>

      <main class="kon-shell-main">{currentPage && <PageView page={currentPage} />}</main>

      {showNav && (
        <TabBar
          pages={pages}
          activeId={currentPage?.id ?? ''}
          onSelect={(id) => {
            activePageId.value = id
          }}
        />
      )}

      {import.meta.env.DEV && (
        <details style={{ margin: '2rem 1rem', color: '#888', fontSize: '0.85rem' }}>
          <summary>runtime diagnostics</summary>
          <dl style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
            <dt>wallet_origin</dt>
            <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.wallet_origin}</dd>
            <dt>gun_peers</dt>
            <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.gun_peers.join(', ')}</dd>
            <dt>ipfs_gateways</dt>
            <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.ipfs_gateways.join(', ')}</dd>
            <dt>entry.runtime</dt>
            <dd style={{ margin: '0 0 0.5rem 1rem' }}>{fmtIpfs(e.runtime)}</dd>
            <dt>entry.manifest</dt>
            <dd style={{ margin: '0 0 0.5rem 1rem' }}>{fmtIpfs(e.manifest)}</dd>
          </dl>
        </details>
      )}
    </div>
  )
}
