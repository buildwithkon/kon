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

export function Icon({ name, size = 24 }: { name: KonIconName; size?: number }) {
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
