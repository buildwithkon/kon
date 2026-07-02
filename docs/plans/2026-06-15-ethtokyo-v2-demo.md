# ETHTokyo'25 v2 Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate last year's ETHTokyo'25 PWA demo (Home / Agenda / Forum / Information) on the KON v2 architecture with a responsive shell (mobile bottom tab-bar ↔ desktop left sidebar) and theme-driven branding, reusing existing v2 plugins.

**Architecture:** Add optional `theme` + page `icon` fields to the manifest types/schemas; make the runtime shell (`app.tsx`) theme-aware with a responsive `TabBar`; polish the `profile-card` (branded header) and `ical` (tag pills, date-pill tabs, timezone) plugins; inline all demo content into `apps/ethtokyo/manifest.source.json`.

**Tech Stack:** Preact 10 + @preact/signals, TypeScript, Zod (`packages/schemas`), Vitest (`vp test run`), Vite+. Spec: `docs/specs/2026-06-15-ethtokyo-v2-demo-design.md`.

---

## File Structure

**Create:**

- `apps/runtime/src/ui/icon.tsx` — `KonIconName → inline SVG` map + `Icon` component.
- `apps/runtime/src/ui/icon.test.tsx`
- `apps/runtime/src/ui/use-theme.ts` — manifest theme → CSS-variable style object.
- `apps/runtime/src/ui/use-theme.test.ts`
- `apps/runtime/src/ui/tab-bar.tsx` — responsive nav (bottom bar + sidebar via CSS).
- `apps/runtime/src/ui/tab-bar.test.tsx`
- `packages/schemas/src/manifest.test.ts` — schema round-trip for new fields.
- `packages/plugins/profile-card/src/index.test.tsx`
- `packages/plugins/ical/src/tags.ts` — `parseEventTag()` pure helper.
- `packages/plugins/ical/src/tags.test.ts`

**Modify:**

- `packages/runtime-core/src/types.ts` — add `KonIconName`, `KonThemeV1`, `app.theme`, `page.icon`.
- `packages/schemas/src/manifest.ts` — add `KonThemeV1Schema`, wire into app + page.
- `apps/runtime/src/app.tsx` — theme vars, responsive `TabBar`, dev-gated diagnostics/admin.
- `packages/plugins/profile-card/src/index.tsx` — branded variant props.
- `packages/plugins/ical/src/index.tsx` — tag pills, date-pill tabs, `tz` formatting.
- `apps/ethtokyo/manifest.source.json` — all demo content + 13 events.
- `apps/runtime/src/dev-app.test.ts` — assert new fields parse.

---

## Task 1: runtime-core types — theme + icon

**Files:**

- Modify: `packages/runtime-core/src/types.ts:99-130`

- [ ] **Step 1: Add the new types and optional fields**

In `packages/runtime-core/src/types.ts`, add above `KonPageV1`:

```ts
export type KonIconName = 'home' | 'calendar' | 'chat' | 'info' | 'list'

export interface KonThemeV1 {
  /** CSS color — header / sidebar background. */
  main: string
  /** CSS color — active nav item / highlights. */
  accent: string
  /** Font family family preset. Defaults to 'sans'. */
  font?: 'sans' | 'serif' | 'mono'
}
```

Add `icon?: KonIconName` to `KonPageV1`:

```ts
export interface KonPageV1 {
  id: string
  title: string
  /** Bottom-tab / sidebar icon. */
  icon?: KonIconName
  source?: IpfsUri
  plugins?: KonPluginV1[]
}
```

Add `theme?: KonThemeV1` to `KonManifestV1.app`:

```ts
  app: {
    id: string
    name: string
    version: number
    description?: string
    icon?: IpfsUri
    theme?: KonThemeV1
  }
```

- [ ] **Step 2: Verify it typechecks**

Run: `bun --filter=@konxyz/runtime-core run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/runtime-core/src/types.ts
git commit -m "feat(runtime-core): add optional theme + page icon to manifest types"
```

---

## Task 2: schemas — Zod for theme + icon

**Files:**

- Modify: `packages/schemas/src/manifest.ts:11-26`
- Test: `packages/schemas/src/manifest.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/schemas/src/manifest.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { KonManifestV1Schema } from './manifest'

const base = {
  schema: 'kon-manifest-v1' as const,
  app: { id: 'x.kon.xyz', name: 'X', version: 1 },
  pages: [{ id: 'home', title: 'Home' }],
  publishedAt: '2026-01-01T00:00:00Z',
  publisher: 'did:pkh:eip155:8453:0x0000000000000000000000000000000000000000'
}

describe('KonManifestV1Schema theme + icon', () => {
  test('accepts app.theme and page.icon', () => {
    const out = KonManifestV1Schema.parse({
      ...base,
      app: { ...base.app, theme: { main: '#562266', accent: '#FF5545', font: 'sans' } },
      pages: [{ id: 'home', title: 'Home', icon: 'home' }]
    })
    expect(out.app.theme?.main).toBe('#562266')
    expect(out.pages[0].icon).toBe('home')
  })

  test('still accepts a manifest with neither field (back-compat)', () => {
    expect(() => KonManifestV1Schema.parse(base)).not.toThrow()
  })

  test('rejects an unknown icon name', () => {
    expect(() =>
      KonManifestV1Schema.parse({ ...base, pages: [{ id: 'home', title: 'Home', icon: 'rocket' }] })
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vp test run manifest.test`
Expected: FAIL — `page.icon` / `app.theme` rejected or stripped (unknown icon not rejected).

- [ ] **Step 3: Implement the schema changes**

In `packages/schemas/src/manifest.ts`, add after the imports:

```ts
export const KonThemeV1Schema = z.object({
  main: z.string().min(1),
  accent: z.string().min(1),
  font: z.enum(['sans', 'serif', 'mono']).optional()
})

export const KonIconNameSchema = z.enum(['home', 'calendar', 'chat', 'info', 'list'])
```

Add `icon` to `KonPageV1Schema`:

```ts
export const KonPageV1Schema = z.object({
  id: z.string().min(1),
  title: z.string(),
  icon: KonIconNameSchema.optional(),
  source: ipfsUriSchema.optional(),
  plugins: z.array(KonPluginV1Schema).optional()
})
```

Add `theme` to the `app` object inside `KonManifestV1Schema`:

```ts
  app: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.number().int().nonnegative(),
    description: z.string().optional(),
    icon: ipfsUriSchema.optional(),
    theme: KonThemeV1Schema.optional()
  }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vp test run manifest.test`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/src/manifest.ts packages/schemas/src/manifest.test.ts
git commit -m "feat(schemas): validate optional app.theme + page.icon"
```

---

## Task 3: Icon component

**Files:**

- Create: `apps/runtime/src/ui/icon.tsx`
- Test: `apps/runtime/src/ui/icon.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/runtime/src/ui/icon.test.tsx`:

```tsx
import { render } from 'preact'
import { describe, expect, test } from 'vitest'
import { ICON_NAMES, Icon } from './icon'

function html(node: ReturnType<typeof Icon>): string {
  const host = document.createElement('div')
  // biome-ignore lint/suspicious/noExplicitAny: vnode host render
  render(node as any, host)
  return host.innerHTML
}

describe('Icon', () => {
  test('every name renders an <svg>', () => {
    for (const name of ICON_NAMES) {
      expect(html(Icon({ name }))).toContain('<svg')
    }
  })

  test('applies the given size to width/height', () => {
    expect(html(Icon({ name: 'home', size: 28 }))).toContain('width="28"')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vp test run icon.test`
Expected: FAIL — `./icon` not found.

- [ ] **Step 3: Implement the Icon component**

Create `apps/runtime/src/ui/icon.tsx`:

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vp test run icon.test`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/runtime/src/ui/icon.tsx apps/runtime/src/ui/icon.test.tsx
git commit -m "feat(runtime): inline-SVG Icon component for nav"
```

---

## Task 4: useTheme helper

**Files:**

- Create: `apps/runtime/src/ui/use-theme.ts`
- Test: `apps/runtime/src/ui/use-theme.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/runtime/src/ui/use-theme.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { themeVars } from './use-theme'

describe('themeVars', () => {
  test('maps theme to CSS variables + font family', () => {
    const v = themeVars({ main: '#562266', accent: '#FF5545', font: 'mono' })
    expect(v['--kon-main']).toBe('#562266')
    expect(v['--kon-accent']).toBe('#FF5545')
    expect(String(v.fontFamily)).toContain('mono')
  })

  test('falls back to blue defaults when theme is undefined', () => {
    const v = themeVars(undefined)
    expect(v['--kon-main']).toBe('#1a73e8')
    expect(v['--kon-accent']).toBe('#1a73e8')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vp test run use-theme.test`
Expected: FAIL — `./use-theme` not found.

- [ ] **Step 3: Implement the helper**

Create `apps/runtime/src/ui/use-theme.ts`:

```ts
import type { JSX } from 'preact'
import type { KonThemeV1 } from '@konxyz/runtime-core'

const FONT_STACKS: Record<NonNullable<KonThemeV1['font']>, string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SF Mono", "Cascadia Code", monospace'
}

const DEFAULT_MAIN = '#1a73e8'

/** Build a style object carrying theme CSS variables + font family for the app root. */
export function themeVars(theme: KonThemeV1 | undefined): JSX.CSSProperties {
  const main = theme?.main ?? DEFAULT_MAIN
  const accent = theme?.accent ?? DEFAULT_MAIN
  return {
    '--kon-main': main,
    '--kon-accent': accent,
    fontFamily: FONT_STACKS[theme?.font ?? 'sans']
    // biome-ignore lint/suspicious/noExplicitAny: CSS custom properties aren't in JSX.CSSProperties
  } as any
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vp test run use-theme.test`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/runtime/src/ui/use-theme.ts apps/runtime/src/ui/use-theme.test.ts
git commit -m "feat(runtime): themeVars helper maps manifest theme to CSS vars"
```

---

## Task 5: Responsive TabBar component

**Files:**

- Create: `apps/runtime/src/ui/tab-bar.tsx`
- Test: `apps/runtime/src/ui/tab-bar.test.tsx`

The TabBar renders one element per page and calls `onSelect(id)` on click. Layout
(bottom bar vs left sidebar) is purely CSS via a `<style>` block keyed off a media
query; the component markup is identical at all widths.

- [ ] **Step 1: Write the failing test**

Create `apps/runtime/src/ui/tab-bar.test.tsx`:

```tsx
import { render } from 'preact'
import { describe, expect, test } from 'vitest'
import type { KonPageV1 } from '@konxyz/runtime-core'
import { TabBar } from './tab-bar'

const pages: KonPageV1[] = [
  { id: 'home', title: 'Home', icon: 'home' },
  { id: 'agenda', title: 'Agenda', icon: 'calendar' }
]

function mount(activeId: string) {
  const host = document.createElement('div')
  const clicks: string[] = []
  // biome-ignore lint/suspicious/noExplicitAny: vnode host render
  render(TabBar({ pages, activeId, onSelect: (id) => clicks.push(id) }) as any, host)
  return { host, clicks }
}

describe('TabBar', () => {
  test('renders a button per page with its title', () => {
    const { host } = mount('home')
    const labels = [...host.querySelectorAll('button')].map((b) => b.textContent)
    expect(labels.some((l) => l?.includes('Home'))).toBe(true)
    expect(labels.some((l) => l?.includes('Agenda'))).toBe(true)
  })

  test('marks the active page with aria-current', () => {
    const { host } = mount('agenda')
    const current = host.querySelector('[aria-current="page"]')
    expect(current?.textContent).toContain('Agenda')
  })

  test('calls onSelect with the page id on click', () => {
    const { host, clicks } = mount('home')
    const agenda = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Agenda'))
    agenda?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(clicks).toEqual(['agenda'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vp test run tab-bar.test`
Expected: FAIL — `./tab-bar` not found.

- [ ] **Step 3: Implement the TabBar**

Create `apps/runtime/src/ui/tab-bar.tsx`:

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vp test run tab-bar.test`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/runtime/src/ui/tab-bar.tsx apps/runtime/src/ui/tab-bar.test.tsx
git commit -m "feat(runtime): responsive TabBar (bottom bar + sidebar)"
```

---

## Task 6: Wire the shell in app.tsx

No new unit test (full-shell integration is covered by manual verification + the
existing `dev-app.test.ts`). This task swaps the dev nav for the themed responsive
shell and gates developer chrome behind `import.meta.env.DEV`.

**Files:**

- Modify: `apps/runtime/src/app.tsx:116-253`

- [ ] **Step 1: Replace the `Nav` component usage and header with the themed shell**

In `apps/runtime/src/app.tsx`:

1. Add imports near the top:

```tsx
import { themeVars } from './ui/use-theme'
import { TabBar } from './ui/tab-bar'
```

2. Delete the local `Nav` function (the `function Nav(...) { ... }` block).

3. Replace the returned tree of `App()` (the final `return (<div …>…</div>)`) with:

```tsx
return (
  <div style={{ ...themeVars(m.app.theme), minHeight: '100vh' }} class="kon-shell">
    <style>{`
        .kon-shell { padding-bottom: 4.5rem; }
        .kon-shell-main { max-width: 720px; margin: 0 auto; padding: 1.5rem 1rem; }
        .kon-header { background: var(--kon-main); color: #fff; padding: 1.25rem 1rem; }
        .kon-header h1 { font-size: 1.4rem; margin: 0; }
        @media (min-width: 768px) {
          .kon-shell { padding-bottom: 0; padding-left: 200px; }
        }
      `}</style>

    <header class="kon-header">
      <h1>{m.app.name}</h1>
      {import.meta.env.DEV && (
        <a href="/admin" style={{ color: '#fff', opacity: 0.7, fontSize: '0.8rem', textDecoration: 'none' }}>
          ⚙ Admin
        </a>
      )}
    </header>

    <main class="kon-shell-main">{currentPage && <PageView page={currentPage} />}</main>

    <TabBar
      pages={pages}
      activeId={currentPage?.id ?? ''}
      onSelect={(id) => {
        activePageId.value = id
      }}
    />

    {import.meta.env.DEV && (
      <details style={{ margin: '2rem 1rem', color: '#888', fontSize: '0.85rem' }}>
        <summary>runtime diagnostics</summary>
        <dl style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
          <dt>wallet_origin</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.wallet_origin}</dd>
          <dt>gun_peers</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.gun_peers.join(', ')}</dd>
          <dt>ipfs_gateways</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{d.ipfs_gateways.join(', ')}</dd>
          <dt>entry.runtime</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{fmtIpfs(e.runtime)}</dd>
          <dt>entry.manifest</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{fmtIpfs(e.manifest)}</dd>
        </dl>
      </details>
    )}
  </div>
)
```

Note: `PageView`'s own `<h2>{page.title}</h2>` stays — it titles the active page
under the brand header. Keep the existing `PageView`/`PluginRenderer` functions.

- [ ] **Step 2: Verify it typechecks + builds**

Run: `bun --filter=@konxyz/runtime run typecheck` (falls back to repo `typecheck` if the per-package script is absent: `bun run typecheck`)
Expected: no errors. If `JSX.IntrinsicElements` complains about `class`, use `className` instead (Preact accepts both at runtime; match the file's existing convention — it uses inline styles, so `class` on `nav`/`div` is fine under Preact).

- [ ] **Step 3: Run the full test suite (no regressions)**

Run: `vp test run`
Expected: PASS, including the existing `dev-app.test.ts`.

- [ ] **Step 4: Commit**

```bash
git add apps/runtime/src/app.tsx
git commit -m "feat(runtime): theme-driven responsive shell with TabBar; gate dev chrome"
```

---

## Task 7: profile-card branded variant

**Files:**

- Modify: `packages/plugins/profile-card/src/index.tsx`
- Test: `packages/plugins/profile-card/src/index.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/plugins/profile-card/src/index.test.tsx`:

```tsx
import { render } from 'preact'
import { describe, expect, test } from 'vitest'
import ProfileCard from './index'

const ctx = {
  appId: 'ethtokyo.kon.xyz',
  // biome-ignore lint/suspicious/noExplicitAny: minimal context stub
  deployment: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: wallet not used by this plugin
  wallet: {} as any
}

function html(props: Record<string, unknown>): string {
  const host = document.createElement('div')
  // biome-ignore lint/suspicious/noExplicitAny: plugin contract
  render(ProfileCard({ props, context: ctx }) as any, host)
  return host.innerHTML
}

describe('ProfileCard branded variant', () => {
  test('renders the logo image when logoUrl is set', () => {
    const out = html({ title: 'ETHTokyo', logoUrl: 'https://example.com/o.png' })
    expect(out).toContain('https://example.com/o.png')
  })

  test('renders the identity label when identity is set', () => {
    const out = html({ title: 'ETHTokyo', identity: { label: 'caffein.base.eth' } })
    expect(out).toContain('caffein.base.eth')
  })

  test('renders a QR affordance when showQr is true', () => {
    const out = html({ title: 'ETHTokyo', identity: { label: 'caffein.base.eth' }, showQr: true })
    expect(out.toLowerCase()).toContain('qr')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vp test run profile-card`
Expected: FAIL — logoUrl/identity/showQr not rendered.

- [ ] **Step 3: Extend the plugin**

In `packages/plugins/profile-card/src/index.tsx`, extend the props interface:

```ts
export interface ProfileCardPluginProps {
  title?: string
  subtitle?: string
  iconUrl?: string
  isSticky?: boolean
  accent?: string
  /** Solid background (e.g. the app theme main color). */
  bg?: string
  /** Brand mark rendered top-right. */
  logoUrl?: string
  /** Static identity row. Live wallet/ENS threading is deferred. */
  identity?: { label: string; avatarUrl?: string }
  /** Render a QR affordance button in the identity row. */
  showQr?: boolean
}
```

Update the component body. Replace the `cardStyle` background with `props.bg` when
present, render `logoUrl` in the existing `iconWrap` slot, and append an identity
row below the title/subtitle:

```tsx
const identityRow: import('preact').JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginTop: '0.75rem'
}

const avatarStyle: import('preact').JSX.CSSProperties = {
  width: '2rem',
  height: '2rem',
  borderRadius: '999px',
  objectFit: 'cover',
  background: '#fff3'
}

const qrButtonStyle: import('preact').JSX.CSSProperties = {
  marginLeft: 'auto',
  width: '2rem',
  height: '2rem',
  borderRadius: '6px',
  border: '1px solid #fff5',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: '0.7rem'
}

const ProfileCard: KonPluginComponent<ProfileCardPluginProps> = ({ props, context }) => {
  const title = props?.title ?? context.appId
  const subtitle = props?.subtitle
  const logoUrl = props?.logoUrl ?? props?.iconUrl
  const accent = props?.accent ?? '#1a73e8'
  const sticky = props?.isSticky === true
  const identity = props?.identity

  const card: import('preact').JSX.CSSProperties = {
    ...cardStyle(accent),
    ...(props?.bg ? { background: props.bg } : {})
  }

  return (
    <div style={containerStyle(sticky)}>
      <div style={card}>
        <div style={titleStyle}>{title}</div>
        {subtitle && <div style={subStyle}>{subtitle}</div>}
        {logoUrl && (
          <div style={iconWrap}>
            <img src={logoUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        {identity && (
          <div style={identityRow}>
            {identity.avatarUrl && <img src={identity.avatarUrl} alt={identity.label} style={avatarStyle} />}
            <span style={{ fontWeight: 600 }}>{identity.label}</span>
            {props?.showQr && (
              <button type="button" style={qrButtonStyle} aria-label="Show QR code" title="Show QR code">
                QR
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

Keep the existing `containerStyle`, `cardStyle`, `titleStyle`, `subStyle`, `iconWrap`
definitions above.

- [ ] **Step 4: Run test to verify it passes**

Run: `vp test run profile-card`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/plugins/profile-card/src/index.tsx packages/plugins/profile-card/src/index.test.tsx
git commit -m "feat(plugin-profile-card): branded variant — bg, logo, identity row, QR affordance"
```

---

## Task 8: ical tag-pill parsing

**Files:**

- Create: `packages/plugins/ical/src/tags.ts`
- Test: `packages/plugins/ical/src/tags.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/plugins/ical/src/tags.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { TAG_COLORS, parseEventTag } from './tags'

describe('parseEventTag', () => {
  test('splits a leading [Tag] off the title', () => {
    expect(parseEventTag('[Conf] Opening Talk')).toEqual({ tag: 'Conf', title: 'Opening Talk' })
  })

  test('returns null tag when there is no bracket prefix', () => {
    expect(parseEventTag('Lunch')).toEqual({ tag: null, title: 'Lunch' })
  })

  test('keeps emoji and inner brackets in the title', () => {
    expect(parseEventTag('[Hack] 🚨 Submission deadline')).toEqual({
      tag: 'Hack',
      title: '🚨 Submission deadline'
    })
  })

  test('every known tag has a color', () => {
    for (const tag of ['Conf', 'Workshop', 'Hack', 'Side']) {
      expect(TAG_COLORS[tag]).toMatch(/^#/)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vp test run ical/src/tags`
Expected: FAIL — `./tags` not found.

- [ ] **Step 3: Implement the helper**

Create `packages/plugins/ical/src/tags.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `vp test run ical/src/tags`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/plugins/ical/src/tags.ts packages/plugins/ical/src/tags.test.ts
git commit -m "feat(plugin-ical): parseEventTag helper + tag color map"
```

---

## Task 9: ical — render tag pills, date-pill tabs, timezone

**Files:**

- Modify: `packages/plugins/ical/src/index.tsx`
- Test: `packages/plugins/ical/src/index.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/plugins/ical/src/index.test.tsx`:

```tsx
import { render } from 'preact'
import { describe, expect, test } from 'vitest'
import Ical from './index'

const events = [
  { id: 'a', title: '[Conf] Opening Talk', start: '2025-09-12T01:00:00Z', end: '2025-09-12T02:00:00Z' },
  { id: 'b', title: '[Hack] Entry', start: '2025-09-13T00:00:00Z', end: '2025-09-13T09:00:00Z' }
]

function html(props: Record<string, unknown>): string {
  const host = document.createElement('div')
  // biome-ignore lint/suspicious/noExplicitAny: plugin contract
  render(Ical({ props, context: {} as any }) as any, host)
  return host.innerHTML
}

describe('Ical tags + tz', () => {
  test('renders the tag text as a pill and strips it from the title', () => {
    const out = html({ events })
    expect(out).toContain('Conf')
    expect(out).toContain('Opening Talk')
    expect(out).not.toContain('[Conf]')
  })

  test('formats time in the given tz (Asia/Tokyo → 10:00 for 01:00Z)', () => {
    const out = html({ events, tz: 'Asia/Tokyo' })
    expect(out).toContain('10:00')
  })

  test('renders a day pill per event date', () => {
    const out = html({ events, tz: 'Asia/Tokyo' })
    expect(out).toContain('Sep 12')
    expect(out).toContain('Sep 13')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `vp test run ical/src/index`
Expected: FAIL — `[Conf]` still present / no `tz` support / no day pills.

- [ ] **Step 3: Implement the changes**

In `packages/plugins/ical/src/index.tsx`:

1. Add imports + extend props:

```ts
import { TAG_COLORS, parseEventTag } from './tags'
```

```ts
export interface IcalPluginProps {
  events: IcalEvent[]
  toolsThreshold?: number
  saveStorageKey?: string
  /** IANA timezone for formatting + grouping (e.g. 'Asia/Tokyo'). Default: viewer locale. */
  tz?: string
}
```

2. Make the time/date formatters timezone-aware. Replace `fmtTime`, `fmtDateHeader`,
   and `dateKey` with `tz`-accepting versions:

```ts
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
  // en-CA gives YYYY-MM-DD; with timeZone it yields the tz-local calendar day.
  return d.toLocaleDateString('en-CA', { timeZone: tz })
}
```

3. In the component, read `tz`, thread it through grouping, add a `selectedDay`
   state and a day-pill row, and render the tag pill. Key edits inside `Ical`:

```ts
const tz = props?.tz
const [selectedDay, setSelectedDay] = useState<string | null>(null)
```

In the `grouped` useMemo, pass `tz` to `dateKey`/`fmtDateHeader`:

```ts
      const k = dateKey(start, tz)
      ...
        group = { key: k, label: fmtDateHeader(start, tz), events: [] }
```

Derive the day pills (all distinct days, ordered) and the visible groups:

```ts
const dayPills = useMemo(
  () => grouped.map((g) => ({ key: g.key, label: fmtDayPill(new Date(g.events[0].start), tz) })),
  [grouped, tz]
)
const visibleGroups = selectedDay ? grouped.filter((g) => g.key === selectedDay) : grouped
```

Render the day-pill row above the toolbar (only when there is more than one day):

```tsx
{
  dayPills.length > 1 && (
    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', padding: '0.25rem 0' }}>
      <button type="button" style={toggleStyle(selectedDay === null)} onClick={() => setSelectedDay(null)}>
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
  )
}
```

Change the grouped render to iterate `visibleGroups` instead of `grouped`, pass
`tz` to `fmtTime`, and render the tag pill before the title:

```tsx
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
```

Note: the empty-state branch (`grouped.length === 0`) stays keyed off `grouped`.

- [ ] **Step 4: Run test to verify it passes**

Run: `vp test run ical/src/index`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the ical tests together (no regressions)**

Run: `vp test run ical`
Expected: PASS (tags + index).

- [ ] **Step 6: Commit**

```bash
git add packages/plugins/ical/src/index.tsx packages/plugins/ical/src/index.test.tsx
git commit -m "feat(plugin-ical): tag pills, day-pill filter, timezone-aware formatting"
```

---

## Task 10: Content — ethtokyo manifest

**Files:**

- Modify: `apps/ethtokyo/manifest.source.json`
- Test: `apps/runtime/src/dev-app.test.ts`

The two markdown bodies are long; fetch them fresh and JSON-encode them rather than
hand-copying. The 13 events are listed in full below.

- [ ] **Step 1: Fetch the two markdown bodies as JSON strings**

Run (writes JSON-escaped strings to inspect/paste):

```bash
cd /Users/yujiym/GitHub/kon
curl -sL "https://hackmd.io/@yujiym/BkWsINrp1e/download" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' > /tmp/home.jsonstr
curl -sL "https://hackmd.io/@yujiym/BydSuqUa1x/download" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' > /tmp/info.jsonstr
wc -c /tmp/home.jsonstr /tmp/info.jsonstr
```

These files now hold ready-to-paste JSON string literals (including surrounding
quotes) for the `content` props in Step 3.

- [ ] **Step 2: Write the failing test (extend dev-app.test.ts)**

Append to `apps/runtime/src/dev-app.test.ts` inside the existing
`describe('DEV_APP_MANIFESTS', …)` block:

```ts
test('ethtokyo manifest carries theme, 4 iconed pages, and 13 agenda events', () => {
  // biome-ignore lint/suspicious/noExplicitAny: test introspection of parsed JSON
  const m = DEV_APP_MANIFESTS.ethtokyo as any
  expect(m.app.theme.main).toBe('#562266')
  expect(m.pages.map((p: any) => p.id)).toEqual(['home', 'agenda', 'forum', 'info'])
  expect(m.pages.every((p: any) => typeof p.icon === 'string')).toBe(true)
  const agenda = m.pages.find((p: any) => p.id === 'agenda')
  const ical = agenda.plugins.find((pl: any) => pl.id === 'ical')
  expect(ical.props.tz).toBe('Asia/Tokyo')
  expect(ical.props.events).toHaveLength(13)
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `vp test run dev-app.test`
Expected: FAIL — current manifest has 3 pages, no theme, empty events.

- [ ] **Step 4: Rewrite `apps/ethtokyo/manifest.source.json`**

Use this exact structure. For the two `content` props, paste the JSON string
literals produced in Step 1 (from `/tmp/home.jsonstr` and `/tmp/info.jsonstr`) in
place of the `"PASTE_*"` placeholders (paste the file contents verbatim — they
already include the surrounding quotes). Keep the plugin `source` CID
(`ipfs://bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy`) as-is — the
dev loader ignores it and resolves built-in plugins by id.

```jsonc
{
  "schema": "kon-manifest-v1",
  "app": {
    "id": "ethtokyo.kon.xyz",
    "name": "ETHTokyo'25",
    "version": 1,
    "description": "ETHTokyo'25 — Emancipatory Tech for the Future of Humanity. Built on KON v2.",
    "theme": { "main": "#562266", "accent": "#FF5545", "font": "sans" }
  },
  "deployment": {
    "gun_peers": ["https://relay.kon.xyz/gun", "https://relay.peer.ooo/gun"]
  },
  "pages": [
    {
      "id": "home",
      "title": "Home",
      "icon": "home",
      "plugins": [
        {
          "id": "profile-card",
          "version": "1.0.0",
          "source": "ipfs://bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy",
          "props": {
            "title": "ETHTokyo'25",
            "subtitle": "Emancipatory Tech for Future of Humanity",
            "bg": "#562266",
            "logoUrl": "https://i.imgur.com/3G9N6sa.png",
            "identity": { "label": "caffein.base.eth" },
            "showQr": true
          }
        },
        {
          "id": "markdown",
          "version": "1.0.0",
          "source": "ipfs://bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy",
          "props": { "content": PASTE_HOME_MD }
        }
      ]
    },
    {
      "id": "agenda",
      "title": "Agenda",
      "icon": "calendar",
      "plugins": [
        {
          "id": "ical",
          "version": "1.0.0",
          "source": "ipfs://bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy",
          "props": {
            "tz": "Asia/Tokyo",
            "events": [
              { "id": "23188bhrnirgco5jrsvvtqgjm4", "title": "[Conf] Opening Talk", "description": "<b>This is DUMMY Schedule</b><br>Opening Talk", "location": "国際連合大学, 日本、〒150-8925 東京都渋谷区神宮前５丁目５３−７０", "start": "2025-09-12T01:00:00Z", "end": "2025-09-12T02:00:00Z" },
              { "id": "1ietmhja31ls9lq5rc52gqltds", "title": "[Conf] Session1", "description": "<b>This is DUMMY Schedule</b><br>Session 1", "location": "国際連合大学, 日本、〒150-8925 東京都渋谷区神宮前５丁目５３−７０", "start": "2025-09-12T02:15:00Z", "end": "2025-09-12T03:30:00Z" },
              { "id": "67ndvr8tkshktu46603tbn4vi3", "title": "[Conf] Session2", "location": "国際連合大学, 日本、〒150-8925 東京都渋谷区神宮前５丁目５３−７０", "start": "2025-09-12T04:00:00Z", "end": "2025-09-12T05:00:00Z" },
              { "id": "0mfj56tim12rf27kcsarat75b2", "title": "[Conf] Session #3", "start": "2025-09-12T05:15:00Z", "end": "2025-09-12T06:15:00Z" },
              { "id": "3l3ntp39fj53mp5je6u66p0hcr", "title": "[Hack] Entry", "location": "Digital Garage “Pangaea”, 日本、〒150-0042 東京都渋谷区宇田川町１５−１", "start": "2025-09-13T00:00:00Z", "end": "2025-09-13T09:00:00Z" },
              { "id": "1c0oc4pe15u50u35rjiqbgl6dm", "title": "[Workshop] ZK Workshop", "location": "Digital Garage “Pangaea”, 日本、〒150-0042 東京都渋谷区宇田川町１５−１", "start": "2025-09-13T00:00:00Z", "end": "2025-09-13T01:30:00Z" },
              { "id": "0hu4ceoaqi0l86m1s9qpnmh20i", "title": "[Workshop] SmartWallet", "description": "<b>This is DUMMY Schedule</b><br>Workshop", "start": "2025-09-13T01:45:00Z", "end": "2025-09-13T03:15:00Z" },
              { "id": "5pms74jortrhhhq5n9nhtdt32k", "title": "[Hack] Start", "location": "Digital Garage “Pangaea”, 日本、〒150-0042 東京都渋谷区宇田川町１５−１", "start": "2025-09-13T09:00:00Z", "end": "2025-09-13T10:15:00Z" },
              { "id": "23bmjis5hikiou9rfm5fngols0", "title": "[Hack] Bento", "location": "Digital Garage “Pangaea”, 日本、〒150-0042 東京都渋谷区宇田川町１５−１", "start": "2025-09-13T11:00:00Z", "end": "2025-09-13T12:00:00Z" },
              { "id": "765smtcft1c4hppbn16k20qfbh", "title": "[Hack] 🚨 Submission deadline", "location": "Digital Garage “Pangaea”, 日本、〒150-0042 東京都渋谷区宇田川町１５−１", "start": "2025-09-14T00:00:00Z" },
              { "id": "3o3sq37k4322eff8c6nrt4h8df", "title": "[Hack] 👀 Project review", "location": "Digital Garage “Pangaea”, 日本、〒150-0042 東京都渋谷区宇田川町１５−１", "start": "2025-09-14T01:00:00Z", "end": "2025-09-14T03:00:00Z" },
              { "id": "06ajgjpdie1mpf3loqfrsf3v5r", "title": "[Hack] 🏆 Finale", "location": "Digital Garage “Pangaea”, 日本、〒150-0042 東京都渋谷区宇田川町１５−１", "start": "2025-09-14T06:00:00Z", "end": "2025-09-14T07:00:00Z" },
              { "id": "7mik10rcst19o14nn4r14pbjuv", "title": "[Side] Exhibition 1", "description": "A nice side event", "location": "東京タワー, 日本、〒105-0011 東京都港区芝公園４丁目２−８", "start": "2025-09-15T10:00:00Z", "end": "2025-09-15T12:00:00Z" }
            ]
          }
        }
      ]
    },
    {
      "id": "forum",
      "title": "Forum",
      "icon": "chat",
      "plugins": [
        {
          "id": "forum",
          "version": "1.0.0",
          "source": "ipfs://bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy",
          "props": { "gunPath": "ethtokyo-25-main", "title": "ETHTokyo'25" }
        }
      ]
    },
    {
      "id": "info",
      "title": "Information",
      "icon": "info",
      "plugins": [
        {
          "id": "markdown",
          "version": "1.0.0",
          "source": "ipfs://bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy",
          "props": { "content": PASTE_INFO_MD }
        }
      ]
    }
  ],
  "publishedAt": "2026-09-01T00:00:00Z",
  "publisher": "did:pkh:eip155:8453:0x0000000000000000000000000000000000000000"
}
```

- [ ] **Step 5: Validate the JSON parses**

Run: `python3 -c "import json; json.load(open('apps/ethtokyo/manifest.source.json')); print('ok')"`
Expected: `ok` (catches a bad paste / trailing comma before running Vitest).

- [ ] **Step 6: Run test to verify it passes**

Run: `vp test run dev-app.test`
Expected: PASS — including the new theme/pages/events assertions.

- [ ] **Step 7: Commit**

```bash
git add apps/ethtokyo/manifest.source.json apps/runtime/src/dev-app.test.ts
git commit -m "feat(ethtokyo): full ETHTokyo'25 demo content — theme, 4 pages, 13 events"
```

---

## Task 11: Full verification + manual dogfood

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `bun run typecheck`
Expected: no errors (runtime-core + schemas).

- [ ] **Step 2: Lint + format check**

Run: `bun run lint && bun run format:check`
Expected: clean. If format flags files, run `bun run format` and re-commit.

- [ ] **Step 3: Full test suite**

Run: `vp test run`
Expected: all PASS (schemas, runtime ui, plugins, dev-app).

- [ ] **Step 4: Manual dogfood (mobile + desktop)**

```bash
bun @relay-gun:start    # terminal 1 — local chat relay on :8765
bun @runtime:dev        # terminal 2
open "http://127.0.0.1:5174/?app=ethtokyo"
```

Verify against the screenshots:

- Purple themed header + bottom tab-bar at narrow width; resize ≥768px → nav becomes a left sidebar, content shifts right.
- **Home:** branded purple card (origami logo top-right, `caffein.base.eth` + QR affordance), welcome/theme/conference/hackathon/sponsors markdown.
- **Agenda:** day pills (12–15 SEP), `[Conf]`/`[Workshop]`/`[Hack]`/`[Side]` colored pills, JST times (Opening Talk 10:00), search + save.
- **Forum:** "Join group chat".
- **Information:** Official Links + Side Events.

- [ ] **Step 5: Final commit (only if format/lint required fixups)**

```bash
git add -A
git commit -m "chore: lint/format fixups for ethtokyo v2 demo"
```

---

## Notes / deferred (from spec)

- Live wallet/ENS identity + working QR modal — needs runtime signed-in threading through `KonPluginContext`. Identity row is props-driven; QR is an affordance only.
- Richer Aug-2025 Information copy (Conference / Hackathons / Tracks / prizes) is gone from the live source; using current source content.
- `img-list` sponsor grid styling — sponsors render as a stacked image list; a styled grid is a nice-to-have.
