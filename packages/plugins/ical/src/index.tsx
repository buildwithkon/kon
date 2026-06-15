/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks'
import type { KonPluginComponent } from '@konxyz/runtime-core'
import { TAG_COLORS, parseEventTag } from './tags'

export interface IcalEvent {
  /** Stable id for save/unsave + React key. */
  id: string
  title: string
  description?: string
  location?: string
  /** ISO 8601. */
  start: string
  /** ISO 8601 (optional). */
  end?: string
  allDay?: boolean
}

export interface IcalPluginProps {
  events: IcalEvent[]
  /** Threshold below which search + save UI is hidden. Default 5. */
  toolsThreshold?: number
  /** Storage key for saved-event ids. Default 'kon.ical.savedIds'. */
  saveStorageKey?: string
  /** IANA timezone for formatting + grouping (e.g. 'Asia/Tokyo'). Default: viewer locale. */
  tz?: string
}

const containerStyle: import('preact').JSX.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
}

const toolbarStyle: import('preact').JSX.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  padding: '0.5rem 0'
}

const inputStyle: import('preact').JSX.CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  border: '1px solid #ddd',
  borderRadius: '8px',
  font: 'inherit'
}

const toggleStyle = (active: boolean): import('preact').JSX.CSSProperties => ({
  padding: '0.5rem 0.75rem',
  border: `1px solid ${active ? '#1a73e8' : '#ddd'}`,
  borderRadius: '8px',
  background: active ? '#e8f0fe' : 'white',
  color: active ? '#1a73e8' : 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '0.9rem'
})

const dateHeaderStyle: import('preact').JSX.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#666',
  padding: '0.5rem 0',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  position: 'sticky',
  top: 0,
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(6px)',
  borderBottom: '1px solid #eee'
}

const cardStyle: import('preact').JSX.CSSProperties = {
  position: 'relative',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  border: '1px solid #eee',
  background: 'white',
  marginBottom: '0.5rem'
}

const titleStyle: import('preact').JSX.CSSProperties = {
  fontWeight: 600,
  paddingRight: '2rem'
}

const descStyle: import('preact').JSX.CSSProperties = {
  marginTop: '0.25rem',
  color: '#666',
  fontSize: '0.85rem',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
}

const metaStyle: import('preact').JSX.CSSProperties = {
  marginTop: '0.4rem',
  fontSize: '0.75rem',
  color: '#888',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem'
}

const saveButtonStyle = (saved: boolean): import('preact').JSX.CSSProperties => ({
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  width: '2rem',
  height: '2rem',
  borderRadius: '999px',
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '1.1rem',
  color: saved ? '#1a73e8' : '#bbb'
})

function stripHtml(input?: string): string {
  if (!input) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = input
  return tmp.textContent ?? tmp.innerText ?? ''
}

function fmtTime(start: string, end: string | undefined, allDay: boolean | undefined, tz?: string): string {
  if (allDay) return 'All day'
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: tz }
  const startDate = new Date(start)
  if (Number.isNaN(startDate.getTime())) return ''
  const startStr = startDate.toLocaleTimeString('en-GB', opts)
  if (!end) return startStr
  const endDate = new Date(end)
  if (Number.isNaN(endDate.getTime())) return startStr
  return `${startStr} – ${endDate.toLocaleTimeString('en-GB', opts)}`
}

function fmtDateHeader(d: Date, tz?: string): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: tz
  })
}

function fmtDayPill(d: Date, tz?: string): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: tz })
}

function dateKey(d: Date, tz?: string): string {
  // en-CA yields YYYY-MM-DD; with timeZone it is the tz-local calendar day.
  return d.toLocaleDateString('en-CA', { timeZone: tz })
}

function readSaved(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === 'string')
  } catch {
    return []
  }
}

function writeSaved(key: string, ids: string[]): void {
  localStorage.setItem(key, JSON.stringify(ids))
}

const Ical: KonPluginComponent<IcalPluginProps> = ({ props }) => {
  const events = Array.isArray(props?.events) ? props.events : []
  const toolsThreshold = props?.toolsThreshold ?? 5
  const saveKey = props?.saveStorageKey ?? 'kon.ical.savedIds'
  const tz = props?.tz

  const [search, setSearch] = useState('')
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>(() => readSaved(saveKey))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const showTools = events.length >= toolsThreshold

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let out = events
    if (q.length >= 2) {
      out = out.filter((e) => {
        const t = e.title.toLowerCase()
        const d = stripHtml(e.description).toLowerCase()
        const l = (e.location ?? '').toLowerCase()
        return t.includes(q) || d.includes(q) || l.includes(q)
      })
    }
    if (showSavedOnly) {
      out = out.filter((e) => savedIds.includes(e.id))
    }
    return out
  }, [events, search, showSavedOnly, savedIds])

  const grouped = useMemo(() => {
    const sorted = filtered.toSorted((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    const groups: Array<{ key: string; label: string; events: IcalEvent[] }> = []
    for (const e of sorted) {
      const start = new Date(e.start)
      if (Number.isNaN(start.getTime())) continue
      const k = dateKey(start, tz)
      let group = groups.at(-1)
      if (!group || group.key !== k) {
        group = { key: k, label: fmtDateHeader(start, tz), events: [] }
        groups.push(group)
      }
      group.events.push(e)
    }
    return groups
  }, [filtered, tz])

  const dayPills = useMemo(
    () => grouped.map((g) => ({ key: g.key, label: fmtDayPill(new Date(g.events[0].start), tz) })),
    [grouped, tz]
  )
  const visibleGroups = selectedDay ? grouped.filter((g) => g.key === selectedDay) : grouped

  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      writeSaved(saveKey, next)
      return next
    })
  }

  return (
    <div style={containerStyle}>
      {dayPills.length > 1 && (
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', padding: '0.25rem 0' }}>
          <button
            type="button"
            style={toggleStyle(selectedDay === null)}
            onClick={() => setSelectedDay(null)}
          >
            All
          </button>
          {dayPills.map((p) => (
            <button
              key={p.key}
              type="button"
              style={toggleStyle(selectedDay === p.key)}
              onClick={() => setSelectedDay(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {showTools && (
        <div style={toolbarStyle}>
          <input
            type="search"
            placeholder="Search events"
            value={search}
            style={inputStyle}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
          <button
            type="button"
            style={toggleStyle(showSavedOnly)}
            onClick={() => setShowSavedOnly((v) => !v)}
            aria-pressed={showSavedOnly}
          >
            {showSavedOnly ? '★ Saved only' : '☆ Show saved'}
          </button>
        </div>
      )}
      {grouped.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
          {showSavedOnly ? 'No saved events yet' : 'No events found'}
        </div>
      ) : (
        visibleGroups.map((g) => (
          <section key={g.key}>
            <div style={dateHeaderStyle}>{g.label}</div>
            {g.events.map((e) => {
              const saved = savedIds.includes(e.id)
              const parsed = parseEventTag(e.title)
              return (
                <article key={e.id} style={cardStyle}>
                  <div style={titleStyle}>
                    {parsed.tag && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginRight: '0.4rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#fff',
                          background: TAG_COLORS[parsed.tag] ?? '#888'
                        }}
                      >
                        {parsed.tag}
                      </span>
                    )}
                    {parsed.title}
                  </div>
                  {e.description && <div style={descStyle}>{stripHtml(e.description)}</div>}
                  <div style={metaStyle}>
                    {e.location && <span>📍 {e.location}</span>}
                    <span>🕒 {fmtTime(e.start, e.end, e.allDay, tz)}</span>
                  </div>
                  {showTools && (
                    <button
                      type="button"
                      style={saveButtonStyle(saved)}
                      onClick={() => toggleSave(e.id)}
                      aria-label={saved ? 'Remove from saved' : 'Save event'}
                      aria-pressed={saved}
                    >
                      {saved ? '★' : '☆'}
                    </button>
                  )}
                </article>
              )
            })}
          </section>
        ))
      )}
    </div>
  )
}

export default Ical
