/** @jsxImportSource preact */
import type { KonPageV1 } from '@konxyz/runtime-core'
import { Icon } from './icon'

const CSS = `
.kon-nav {
  position: fixed; z-index: 20; background: var(--kon-main); color: #fff;
  display: flex; gap: 0.25rem;
}
.kon-nav button {
  appearance: none; border: 0; background: transparent; color: inherit;
  cursor: pointer; font: inherit; display: flex; align-items: center;
  opacity: 0.7; gap: 0.5rem;
}
.kon-nav button[aria-current="page"] { opacity: 1; color: var(--kon-accent); }
.kon-nav .kon-nav-label { font-size: 0.7rem; }

/* Mobile: bottom bar */
.kon-nav { left: 0; right: 0; bottom: 0; flex-direction: row; justify-content: space-around; padding: 0.4rem 0.5rem; }
.kon-nav button { flex-direction: column; flex: 1; padding: 0.3rem 0; }

/* Desktop: left sidebar */
@media (min-width: 768px) {
  .kon-nav { top: 0; bottom: 0; right: auto; width: 200px; flex-direction: column; justify-content: flex-start; padding: 1.5rem 0.75rem; gap: 0.25rem; }
  .kon-nav button { flex-direction: row; justify-content: flex-start; padding: 0.6rem 0.75rem; border-radius: 8px; }
  .kon-nav button[aria-current="page"] { background: rgba(255,255,255,0.12); }
  .kon-nav .kon-nav-label { font-size: 0.95rem; }
}
`

export function TabBar({
  pages,
  activeId,
  onSelect
}: {
  pages: KonPageV1[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <nav class="kon-nav" aria-label="Primary">
      <style>{CSS}</style>
      {pages.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-current={p.id === activeId ? 'page' : undefined}
          onClick={() => onSelect(p.id)}
        >
          {p.icon && <Icon name={p.icon} size={22} />}
          <span class="kon-nav-label">{p.title}</span>
        </button>
      ))}
    </nav>
  )
}
