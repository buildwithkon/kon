/** Color per known tag. Unknown tags fall back to a neutral gray at render time. */
export const TAG_COLORS: Record<string, string> = {
  Conf: '#562266',
  Hack: '#FF5545',
  Workshop: '#0f8a8a',
  Side: '#888888'
}

const TAG_RE = /^\s*\[([^\]]+)\]\s*(.*)$/

/** Split a leading `[Tag]` off an event title. Returns `{ tag: null, title }` if absent. */
export function parseEventTag(raw: string): { tag: string | null; title: string } {
  const m = TAG_RE.exec(raw)
  if (!m) return { tag: null, title: raw }
  return { tag: m[1], title: m[2] }
}
