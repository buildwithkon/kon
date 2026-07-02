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

const MUTED = 'var(--kon-muted, #6b6975)'
const ACCENT = 'var(--kon-accent, #1a73e8)'

const containerStyle: import('preact').JSX.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem'
}

const dayRowStyle: import('preact').JSX.CSSProperties = {
  display: 'flex',
  gap: '0.4rem',
  overflowX: 'auto',
  padding: '0.1rem 0 0.35rem',
  scrollbarWidth: 'none'
}

const toolbarStyle: import('preact').JSX.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  padding: '0.1rem 0 0.35rem'
}

const inputStyle: import('preact').JSX.CSSProperties = {
  flex: 1,
  padding: '0.6rem 0.95rem',
  border: '1px solid rgba(20,18,30,0.10)',
  borderRadius: '999px',
  background: '#fff',
  font: 'inherit',
  fontSize: '0.9rem'
}

const toggleStyle = (active: boolean): import('preact').JSX.CSSProperties => ({
  flexShrink: 0,
  padding: '0.45rem 0.95rem',
  border: '1px solid transparent',
  borderRadius: '999px',
  background: active ? ACCENT : '#fff',
  color: active ? '#fff' : 'inherit',
  boxShadow: active ? 'none' : '0 1px 2px rgba(20,18,30,0.06)',
  cursor: 'pointer',
  font: 'inherit',
  fontWeight: 600,
  fontSize: '0.85rem',
  transition: 'background-color .15s ease, color .15s ease'
})

const dateHeaderStyle: import('preact').JSX.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: MUTED,
  padding: '0.7rem 0.25rem 0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em'
}

const cardStyle: import('preact').JSX.CSSProperties = {
  position: 'relative',
  padding: '1rem 1.1rem',
  borderRadius: '18px',
  background: '#fff',
  boxShadow: '0 1px 2px rgba(20,18,30,0.05), 0 6px 18px -12px rgba(20,18,30,0.18)',
  marginBottom: '0.6rem'
}

const titleStyle: import('preact').JSX.CSSProperties = {
  fontWeight: 700,
  fontSize: '1.02rem',
  lineHeight: 1.25,
  letterSpacing: '-0.01em',
  paddingRight: '2rem'
}

const descStyle: import('preact').JSX.CSSProperties = {
  marginTop: '0.3rem',
  color: MUTED,
  fontSize: '0.85rem',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
}

const metaStyle: import('preact').JSX.CSSProperties = {
  marginTop: '0.55rem',
  fontSize: '0.8rem',
  color: MUTED,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.1rem 0.5rem'
}

const metaDot: import('preact').JSX.CSSProperties = { opacity: 0.4 }

const saveButtonStyle = (saved: boolean): import('preact').JSX.CSSProperties => ({
  position: 'absolute',
  top: '0.85rem',
  right: '0.85rem',
  width: '2rem',
  height: '2rem',
  borderRadius: '999px',
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '1.15rem',
  lineHeight: 1,
  color: saved ? ACCENT : 'rgba(20,18,30,0.28)'
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

/** Return tz only if it is a valid IANA zone Intl accepts, else undefined. A bad
 * zone (e.g. a legacy alias) would otherwise throw RangeError and blank the page. */
function safeTz(tz: string | undefined): string | undefined {
  if (!tz) return undefined
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return tz
  } catch {
    return undefined
  }
}

const Ical: KonPluginComponent<IcalPluginProps> = ({ props }) => {
  const events = Array.isArray(props?.events) ? props.events : []
  const toolsThreshold = props?.toolsThreshold ?? 5
  const saveKey = props?.saveStorageKey ?? 'kon.ical.savedIds'
  const tz = safeTz(props?.tz)

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
        <div style={dayRowStyle}>
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
      {visibleGroups.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: MUTED }}>
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
                  {parsed.tag && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginBottom: '0.5rem',
                        padding: '0.18rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        color: '#fff',
                        background: TAG_COLORS[parsed.tag] ?? '#888'
                      }}
                    >
                      {parsed.tag}
                    </span>
                  )}
                  <div style={titleStyle}>{parsed.title}</div>
                  {e.description && <div style={descStyle}>{stripHtml(e.description)}</div>}
                  <div style={metaStyle}>
                    <span>🗓 {fmtDayPill(new Date(e.start), tz)}</span>
                    <span style={metaDot}>·</span>
                    <span>🕒 {fmtTime(e.start, e.end, e.allDay, tz)}</span>
                    {e.location && <span style={metaDot}>·</span>}
                    {e.location && <span>📍 {e.location}</span>}
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
