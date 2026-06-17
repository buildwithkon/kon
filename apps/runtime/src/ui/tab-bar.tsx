/** @jsxImportSource preact */
import type { KonPageV1 } from '@konxyz/runtime-core'
import { Icon } from './icon'

// Primary navigation.
// Mobile  -> floating horizontal pill, bottom-centered, icon-only, active = accent disc.
// Desktop -> full-height flush-left rail (icon-only), brand monogram on top,
//            active = accent disc. Mirrors the vibes.dappcon.io layout.
const CSS = `
.kon-nav {
  position: fixed; z-index: 30; display: flex;
  background: var(--kon-main); color: var(--kon-on-main, #fff);
}
.kon-nav button {
  appearance: none; border: 0; background: transparent; cursor: pointer; font: inherit;
  display: flex; align-items: center; justify-content: center;
  color: var(--kon-on-main, #fff); opacity: 0.62;
  transition: background-color .18s ease, color .18s ease, opacity .18s ease;
}
.kon-nav button:hover { opacity: 0.9; }
.kon-nav button[aria-current="page"] { opacity: 1; color: var(--kon-on-accent, #fff); background: var(--kon-accent); }
.kon-nav-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.kon-nav-brand { display: none; }

/* Mobile: floating bottom pill */
.kon-nav {
  left: 50%; transform: translateX(-50%); bottom: 1rem;
  flex-direction: row; align-items: center; gap: 0.2rem; padding: 0.35rem;
  border-radius: 999px;
  box-shadow: 0 12px 34px -10px rgba(20,18,30,0.30), 0 2px 8px rgba(20,18,30,0.06);
}
.kon-nav button { width: 3rem; height: 3rem; border-radius: 999px; }

/* Desktop: full-height flush-left rail */
@media (min-width: 768px) {
  .kon-nav {
    left: 0; top: 0; bottom: 0; right: auto; transform: none;
    width: 76px; flex-direction: column; align-items: center; justify-content: flex-start;
    gap: 0.45rem; padding: 1rem 0; border-radius: 0;
    box-shadow: inset -1px 0 0 rgba(20,18,30,0.07), 6px 0 28px -22px rgba(20,18,30,0.4);
  }
  .kon-nav button { width: 2.9rem; height: 2.9rem; border-radius: 16px; }
  .kon-nav-brand {
    display: flex; align-items: center; justify-content: center;
    width: 2.9rem; height: 2.9rem; margin-bottom: 0.55rem;
    border-radius: 16px;
    background: color-mix(in srgb, var(--kon-on-main, #fff) 16%, transparent);
    color: var(--kon-on-main, #fff);
    font-weight: 800; font-size: 1.2rem; letter-spacing: -0.02em; user-select: none;
  }
}
`

export function TabBar({
  pages,
  activeId,
  onSelect,
  brand
}: {
  pages: KonPageV1[]
  activeId: string
  onSelect: (id: string) => void
  brand?: string
}) {
  const monogram = brand?.trim().charAt(0).toUpperCase()
  return (
    <nav class="kon-nav" aria-label="Primary">
      <style>{CSS}</style>
      {monogram && (
        <div class="kon-nav-brand" aria-hidden="true">
          {monogram}
        </div>
      )}
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
