/** @jsxImportSource preact */
import { render } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import type { ComponentType } from 'preact'
import { sanitizeSvg } from '../ui/sanitize-svg'

// react-icons libraries offered in the picker. Each is dynamically imported on
// demand (one chunk per library) so none of this — nor react-icons itself —
// ships in the public runtime bundle; it loads only when an organizer opens the
// picker in /admin. All of these expose solid/filled variants.
const LIBRARIES: Array<{ key: string; label: string; load: () => Promise<Record<string, unknown>> }> = [
  { key: 'hi2', label: 'Heroicons', load: () => import('react-icons/hi2') },
  { key: 'fa6', label: 'Font Awesome', load: () => import('react-icons/fa6') },
  { key: 'md', label: 'Material', load: () => import('react-icons/md') },
  { key: 'bs', label: 'Bootstrap', load: () => import('react-icons/bs') }
  // Phosphor (pi) intentionally omitted: react-icons bundles every weight (~5MB),
  // far too large to fetch for a picker. The four above all expose solid variants.
]

const MAX_RESULTS = 120

type IconComp = ComponentType<{ size?: number }>

/** Render a react-icons component to a sanitized inline SVG string. */
export function iconToSvg(Comp: IconComp): string {
  const tmp = document.createElement('div')
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- react-icons component under preact/compat
  render((<Comp />) as any, tmp)
  const svg = tmp.querySelector('svg')?.outerHTML ?? ''
  render(null, tmp)
  return sanitizeSvg(svg)
}

const overlay: import('preact').JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: 'rgba(20,18,30,0.45)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center'
}

const sheet: import('preact').JSX.CSSProperties = {
  background: '#fff',
  width: '100%',
  maxWidth: '560px',
  maxHeight: '80vh',
  borderRadius: '20px 20px 0 0',
  padding: '1.1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
}

const controlRow: import('preact').JSX.CSSProperties = { display: 'flex', gap: '0.5rem' }

const control: import('preact').JSX.CSSProperties = {
  padding: '0.55rem 0.8rem',
  border: '1px solid rgba(20,18,30,0.14)',
  borderRadius: '10px',
  font: 'inherit',
  background: '#fff'
}

const controlClickable: import('preact').JSX.CSSProperties = Object.assign({}, control, { cursor: 'pointer' })
const controlSearch: import('preact').JSX.CSSProperties = Object.assign({}, control, { flex: 1 })

const grid: import('preact').JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
  gap: '0.35rem',
  overflowY: 'auto',
  padding: '0.25rem',
  flex: 1
}

const iconButton: import('preact').JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  aspectRatio: '1',
  fontSize: '22px',
  border: '1px solid transparent',
  borderRadius: '12px',
  background: '#f4f3f0',
  cursor: 'pointer',
  color: '#16151a'
}

export function IconPicker({
  onPick,
  onReset,
  onClose
}: {
  onPick: (svg: string) => void
  onReset: () => void
  onClose: () => void
}) {
  const [libKey, setLibKey] = useState('hi2')
  const [ns, setNs] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNs(null)
    const lib = LIBRARIES.find((l) => l.key === libKey)
    void lib?.load().then((mod) => {
      if (!cancelled) {
        setNs(mod)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [libKey])

  const names = useMemo(() => {
    if (!ns) return []
    const q = query.trim().toLowerCase()
    const all = Object.keys(ns).filter((n) => typeof ns[n] === 'function')
    const matched = q ? all.filter((n) => n.toLowerCase().includes(q)) : all
    return matched.slice(0, MAX_RESULTS)
  }, [ns, query])

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Choose an icon</strong>
          <button type="button" style={controlClickable} onClick={onReset}>
            Reset to default
          </button>
        </div>
        <div style={controlRow}>
          <select
            style={controlClickable}
            value={libKey}
            onChange={(e) => {
              setQuery('')
              setLibKey(e.currentTarget.value)
            }}
          >
            {LIBRARIES.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search icons…"
            value={query}
            style={controlSearch}
            onInput={(e) => setQuery(e.currentTarget.value)}
          />
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Loading icons…</div>
        ) : (
          <div style={grid}>
            {names.map((name) => {
              const Comp = ns?.[name] as IconComp
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  style={iconButton}
                  onClick={() => {
                    const svg = iconToSvg(Comp)
                    if (svg) onPick(svg)
                  }}
                >
                  <Comp />
                </button>
              )
            })}
            {names.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '1.5rem', textAlign: 'center', color: '#888' }}>
                No icons match “{query}”.
              </div>
            )}
          </div>
        )}
        <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>
          Showing up to {MAX_RESULTS} · type to search the full set
        </div>
      </div>
    </div>
  )
}
