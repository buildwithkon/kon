/** @jsxImportSource preact */
import { useEffect } from 'preact/hooks'
import type { KonPageV1 } from '@konxyz/runtime-core'
import { manifest as loadedManifest } from '../state'
import { draft, initDraft, isDirty, updateDraft, validation } from './state'

const sectionStyle: import('preact').JSX.CSSProperties = {
  padding: '1.25rem',
  border: '1px solid #eee',
  borderRadius: '12px',
  marginBottom: '1rem'
}

const sectionTitleStyle: import('preact').JSX.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: '0 0 0.75rem'
}

const fieldStyle: import('preact').JSX.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  marginBottom: '0.85rem'
}

const labelStyle: import('preact').JSX.CSSProperties = {
  fontSize: '0.85rem',
  color: '#444'
}

const inputStyle: import('preact').JSX.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid #ddd',
  borderRadius: '8px',
  font: 'inherit'
}

const issueStyle: import('preact').JSX.CSSProperties = {
  marginTop: '0.75rem',
  padding: '0.6rem 0.85rem',
  background: '#fef0f0',
  border: '1px solid #fbd5d5',
  borderRadius: '8px',
  fontSize: '0.85rem',
  color: '#c0392b'
}

const dirtyBadgeStyle: import('preact').JSX.CSSProperties = {
  display: 'inline-block',
  marginLeft: '0.5rem',
  padding: '0.15rem 0.5rem',
  fontSize: '0.7rem',
  fontWeight: 700,
  background: '#fff7e0',
  border: '1px solid #f5c542',
  borderRadius: '999px',
  color: '#735000'
}

export function ManifestEditor() {
  useEffect(() => {
    if (draft.value === null) initDraft()
  }, [loadedManifest.value])

  const d = draft.value
  const v = validation.value
  const dirty = isDirty.value

  if (!d) {
    return <div style={{ color: '#888', padding: '1rem' }}>Loading manifest…</div>
  }

  return (
    <div>
      <header style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
          Edit {d.app.name}
          {dirty && <span style={dirtyBadgeStyle}>unsaved</span>}
        </h1>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {d.app.id} · v{d.app.version}
        </div>
      </header>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>App</h2>
        <div style={fieldStyle}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={d.app.name}
            style={inputStyle}
            onInput={(e) => {
              const next = (e.currentTarget as HTMLInputElement).value
              updateDraft((m) => {
                m.app.name = next
              })
            }}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={d.app.description ?? ''}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            onInput={(e) => {
              const next = (e.currentTarget as HTMLTextAreaElement).value
              updateDraft((m) => {
                m.app.description = next || undefined
              })
            }}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Version (bump on publish)</label>
          <input
            type="number"
            value={d.app.version}
            min={0}
            style={inputStyle}
            onInput={(e) => {
              const next = Number((e.currentTarget as HTMLInputElement).value)
              updateDraft((m) => {
                m.app.version = Number.isFinite(next) ? next : m.app.version
              })
            }}
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Pages ({d.pages.length})</h2>
        {d.pages.map((page, i) => (
          <PageRow key={page.id} page={page} index={i} />
        ))}
        <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Page reordering, add/remove, and per-page plugin config land in the next iteration.
        </div>
      </section>

      {!v.ok && (
        <div style={issueStyle}>
          <strong>
            {v.issues.length} validation issue{v.issues.length === 1 ? '' : 's'}
          </strong>
          <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem' }}>
            {v.issues.slice(0, 5).map((iss, idx) => (
              <li key={`${iss.path}-${idx}`}>
                <code>{iss.path}</code>: {iss.message}
              </li>
            ))}
            {v.issues.length > 5 && <li>… {v.issues.length - 5} more</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

const pageRowStyle: import('preact').JSX.CSSProperties = {
  padding: '0.75rem',
  border: '1px solid #eee',
  borderRadius: '8px',
  marginBottom: '0.5rem',
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.75rem'
}

function PageRow({ page, index }: { page: KonPageV1; index: number }) {
  return (
    <div style={pageRowStyle}>
      <input
        type="text"
        value={page.title}
        style={{ ...inputStyle, flex: 1 }}
        onInput={(e) => {
          const next = (e.currentTarget as HTMLInputElement).value
          updateDraft((m) => {
            const p = m.pages[index]
            if (p) p.title = next
          })
        }}
      />
      <span style={{ fontSize: '0.8rem', color: '#888' }}>
        id: <code>{page.id}</code> · {page.plugins?.length ?? 0} plugin
        {(page.plugins?.length ?? 0) === 1 ? '' : 's'}
      </span>
    </div>
  )
}
