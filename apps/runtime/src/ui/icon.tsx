/** @jsxImportSource preact */
import type { KonIconName } from '@konxyz/runtime-core'

export const ICON_NAMES: KonIconName[] = ['home', 'calendar', 'chat', 'info', 'list']

// 24x24 stroke icons (currentColor). Paths kept minimal and recognizable.
const PATHS: Record<KonIconName, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z',
  chat: 'M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z',
  info: 'M12 16v-5M12 8h.01M12 21a9 9 0 110-18 9 9 0 010 18z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'
}

// Solid (filled) variants for the active-tab state. Icons whose silhouette can't
// be filled meaningfully (e.g. list) are omitted and fall back to the stroke icon.
const FILLED_PATHS: Partial<Record<KonIconName, string>> = {
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  calendar:
    'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2zM3 10v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9H3z',
  chat: 'M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z',
  info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
}

export function Icon({
  name,
  size = 24,
  filled = false
}: {
  name: KonIconName
  size?: number
  filled?: boolean
}) {
  const solid = filled ? FILLED_PATHS[name] : undefined
  if (solid) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={solid} fill-rule="evenodd" />
      </svg>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
