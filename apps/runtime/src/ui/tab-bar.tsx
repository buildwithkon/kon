/** @jsxImportSource preact */
import type { KonPageV1 } from '@konxyz/runtime-core'
import { Icon } from './icon'

// Floating "pill" navigation: a detached, rounded, soft-shadowed bar.
// Mobile  -> horizontal pill, bottom-centered, icon-only, active = accent disc.
// Desktop -> vertical pill, left rail, icon + label, active = accent pill.
const CSS = `
.kon-nav {
  position: fixed; z-index: 30; display: flex; gap: 0.2rem;
  background: #fff; border-radius: 999px;
  box-shadow: 0 12px 34px -10px rgba(20,18,30,0.30), 0 2px 8px rgba(20,18,30,0.06);
}
.kon-nav button {
  appearance: none; border: 0; background: transparent; cursor: pointer; font: inherit;
  display: flex; align-items: center; justify-content: center;
  color: var(--kon-ink, #16151a); opacity: 0.5;
  transition: background-color .18s ease, color .18s ease, opacity .18s ease;
}
.kon-nav button:hover { opacity: 0.85; }
.kon-nav .kon-nav-label { font-weight: 600; }
.kon-nav button[aria-current="page"] { opacity: 1; color: #fff; background: var(--kon-accent); }

/* Mobile: bottom-centered horizontal pill, icon only */
.kon-nav {
  left: 50%; transform: translateX(-50%); bottom: 1rem;
  flex-direction: row; align-items: center; padding: 0.35rem;
}
.kon-nav button { width: 3rem; height: 3rem; border-radius: 999px; }
.kon-nav .kon-nav-label {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

/* Desktop: left vertical pill rail, icon + label */
@media (min-width: 768px) {
  .kon-nav {
    left: 1.25rem; top: 50%; bottom: auto; transform: translateY(-50%);
    flex-direction: column; align-items: stretch; padding: 0.5rem; gap: 0.25rem;
    border-radius: 22px;
  }
  .kon-nav button {
    width: auto; height: auto; border-radius: 14px;
    justify-content: flex-start; gap: 0.7rem; padding: 0.7rem 1.1rem 0.7rem 0.8rem;
  }
  .kon-nav .kon-nav-label {
    position: static; width: auto; height: auto; clip: auto;
    font-size: 0.92rem;
  }
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
          aria-label={p.title}
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
