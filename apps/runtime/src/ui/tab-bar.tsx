/** @jsxImportSource preact */
import type { KonPageIcon, KonPageV1 } from '@konxyz/runtime-core'
import { Icon } from './icon'
import { sanitizeSvg } from './sanitize-svg'

/** Render a page icon: built-in name (with active fill swap) or a custom SVG. */
function TabIcon({ icon, active }: { icon: KonPageIcon; active: boolean }) {
  if (typeof icon === 'string') return <Icon name={icon} size={22} filled={active} />
  const html = sanitizeSvg(icon.svg)
  if (!html) return null
  return <span class="kon-cicon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
}

// Primary navigation.
// Mobile  -> floating horizontal pill, bottom-centered, icon-only, active = translucent chip.
// Desktop -> full-height flush-left rail (icon-only), brand monogram on top,
//            active = translucent chip + filled icon. Mirrors the vibes.dappcon.io layout.
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
.kon-nav button[aria-current="page"] {
  opacity: 1; color: var(--kon-on-main, #fff);
  background: color-mix(in srgb, var(--kon-on-main, #fff) 16%, transparent);
}
.kon-nav-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.kon-nav .kon-cicon { display: inline-flex; align-items: center; justify-content: center; font-size: 22px; }
.kon-nav-brand { display: none; }
/* Admin cog: hidden in the mobile pill (lives in a page footer there),
   pinned to the bottom of the desktop rail. */
.kon-nav-admin { display: none; }

/* Mobile: floating bottom pill */
.kon-nav {
  left: 50%; transform: translateX(-50%); bottom: 1rem;
  flex-direction: row; align-items: center; gap: 0.2rem; padding: 0.35rem 0.375rem;
  border-radius: 999px;
  box-shadow: 0 12px 34px -10px rgba(20,18,30,0.30), 0 2px 8px rgba(20,18,30,0.06);
}
.kon-nav button { width: 4rem; height: 3rem; border-radius: 999px; }

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
    display: flex; align-items: center; justify-content: center; overflow: hidden;
    width: 2.9rem; height: 2.9rem; margin-bottom: 1.5rem;
    border-radius: 16px;
    background: color-mix(in srgb, var(--kon-on-main, #fff) 16%, transparent);
    color: var(--kon-on-main, #fff);
    font-weight: 800; font-size: 1.2rem; letter-spacing: -0.02em; user-select: none;
  }
  .kon-nav-brand--img { background: transparent; }
  .kon-nav-brand-img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
  .kon-nav-admin {
    display: flex; align-items: center; justify-content: center;
    margin-top: auto; width: 2.9rem; height: 2.9rem; border-radius: 16px;
    color: var(--kon-on-main, #fff); opacity: 0.5; text-decoration: none;
    transition: background-color .18s ease, opacity .18s ease;
  }
  .kon-nav-admin:hover {
    opacity: 0.9;
    background: color-mix(in srgb, var(--kon-on-main, #fff) 12%, transparent);
  }
}
`

export function TabBar({
  pages,
  activeId,
  onSelect,
  brand,
  brandIcon,
  adminHref
}: {
  pages: KonPageV1[]
  activeId: string
  onSelect: (id: string) => void
  brand?: string
  brandIcon?: string
  adminHref?: string
}) {
  const monogram = brand?.trim().charAt(0).toUpperCase()
  return (
    <nav class="kon-nav" aria-label="Primary">
      <style>{CSS}</style>
      {(brandIcon || monogram) && (
        <div class={`kon-nav-brand${brandIcon ? ' kon-nav-brand--img' : ''}`} aria-hidden="true">
          {brandIcon ? <img class="kon-nav-brand-img" src={brandIcon} alt="" /> : monogram}
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
          {p.icon && <TabIcon icon={p.icon} active={p.id === activeId} />}
          <span class="kon-nav-label">{p.title}</span>
        </button>
      ))}
      {adminHref && (
        <a class="kon-nav-admin" href={adminHref} aria-label="Admin">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </a>
      )}
    </nav>
  )
}
