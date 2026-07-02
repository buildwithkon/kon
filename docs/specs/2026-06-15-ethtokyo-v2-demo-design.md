# ETHTokyo'25 demo on v2 architecture — design

**Date:** 2026-06-15
**Status:** Approved (design), pending implementation plan
**Branch:** v2

## Goal

Bring last year's ETHTokyo'25 PWA demo (4 screenshots: Home / Agenda / Forum /
Information) up on the v2 architecture (Preact + signals, IPFS + ENS, GUN.js),
reusing the existing v2 plugins. Target is **visual parity** — close to the
screenshots, not a pixel-perfect wallet-wired rebuild — with a **responsive
shell** (mobile bottom tab-bar ↔ desktop left sidebar via CSS breakpoint).

## Source of truth

The canonical demo data is `devConfig3` on the `main` branch
(`packages/shared/data/devConfig.ts`):

- name `ETHTokyo'25`, theme `colors.main #562266` (purple) / `accent #FF5545` (red-orange)
- logo `https://i.imgur.com/3G9N6sa.png`, transparent-bg `https://i.imgur.com/wzAQxaz.png`
- 4 tabs, each backed by a remote source:
  - Home → `md:https://hackmd.io/@yujiym/BkWsINrp1e/download`
  - Agenda → `ical:https://calendar.google.com/calendar/ical/c_14dfbc731f48db1e6b25a6603fb2a34eed7d6d7d8828ea82d5ea7c96c695bd57%40group.calendar.google.com/public/basic.ics`
  - Forum → `xmtp:…` (v1 chat; v2 uses the GUN-based `forum` plugin instead)
  - Information → `md:https://hackmd.io/@yujiym/BydSuqUa1x/download`

In v1 these were fetched live at runtime. **In v2 the content is inlined into
`manifest.source.json` at authoring time** (markdown strings, pre-parsed events),
so the demo renders offline with no CORS proxy and no live fetch.

### Content drift note

The live HackMD **Information** page has drifted since the Aug-2025 screenshots:
it now contains only "Official Links" + an empty "Side Events" heading. The
screenshot's richer Information copy (Conference / Hackathons / Hackathon Official
Tracks / "Cypherpunks Anonymous $3,000") is **gone from the source**. Decision:
use the **current** source content (what devConfig3 resolves to today). The Home
markdown is intact (welcome / theme / conference / hackathon / sponsors).

## Architecture

Data flow is unchanged from v2:

```
manifest.source.json
  ├─ dev:  apps/runtime/src/dev-app.ts loads it directly via ?app=ethtokyo
  └─ prod: renderer bakes → IPFS pin → ENS contenthash
        ↓
   apps/runtime/src/app.tsx (shell: theme + responsive nav)
        ↓
   per-page plugins (profile-card / markdown / ical / forum)
```

Three layers of change: (1) `runtime-core` types, (2) runtime shell, (3) plugins,
(4) content. Each is independently testable.

## 1. `runtime-core` + `schemas` type additions

`packages/runtime-core/src/types.ts`:

```ts
export type KonIconName = 'home' | 'calendar' | 'chat' | 'info' | 'list'

export interface KonThemeV1 {
  main: string // CSS color — header / sidebar background
  accent: string // CSS color — active nav / highlights
  font?: 'sans' | 'serif' | 'mono'
}

// KonManifestV1.app gains:
//   theme?: KonThemeV1
// KonPageV1 gains:
//   icon?: KonIconName
```

Both fields are **optional** → existing manifests and the dev preset keep working
unchanged. Add matching Zod definitions in `packages/schemas`.

## 2. Runtime shell — `apps/runtime/src/app.tsx`

Responsive, theme-driven, with the developer chrome gated to dev builds.

### Theme

- A `useTheme(manifest)` helper reads `app.theme` and sets CSS variables on the
  app root: `--kon-main`, `--kon-accent` (and a `font-family` from `theme.font`).
- Header bar background → `--kon-main`; active nav item → `--kon-accent`.
- When `app.theme` is absent, fall back to the current blue (`#1a73e8`) so nothing
  regresses.

### Responsive navigation (CSS breakpoint ~768px, no JS branching)

- **Mobile (<768px):** fixed **bottom tab-bar** — one item per page, inline-SVG
  icon (from `page.icon`) above a small label. Active item tinted `--kon-accent`.
- **Desktop (≥768px):** the _same_ nav renders as a fixed **left sidebar** (icon +
  label per row); the content column shifts right (sidebar width) and widens to a
  comfortable reading measure. Achieved purely with a media query — one component,
  two layouts.
- Content area gets bottom padding (mobile) / left padding (desktop) so the fixed
  nav never overlaps content.

### Icons

- A small `Icon` component maps `KonIconName → inline SVG`. No icon-font / package
  dependency. Set covers the demo: `home`, `calendar`, `chat`, `info`, `list`.

### Developer chrome

- The "runtime diagnostics" `<details>` block and the `⚙ Admin` link are wrapped
  in `import.meta.env.DEV` so the production view is clean. `/admin` stays
  reachable by URL.

### New components (keep `app.tsx` focused)

- `TabBar` — renders nav for both layouts; one job.
- `Icon` — name → SVG.
- `useTheme` — manifest → CSS vars.

## 3. Plugin polish

### `profile-card` — branded header (`packages/plugins/profile-card`)

New optional props for a branded variant matching the Home header card:

```ts
interface ProfileCardPluginProps {
  // existing: title, subtitle, iconUrl, isSticky, accent
  bg?: string // solid background (use --kon-main / theme.main)
  logoUrl?: string // brand mark, rendered top-right (origami)
  identity?: { label: string; avatarUrl?: string } // static, props-driven
  showQr?: boolean // renders a QR icon button (placeholder action)
}
```

- Identity row is **props-driven only**. Live wallet/ENS identity stays deferred
  (the plugin already documents this — it needs runtime signed-in threading,
  which is the pixel-perfect tier we are not doing here).
- `showQr` renders the QR-button affordance from the screenshot; a working QR
  modal is an explicit follow-up (see Out of scope).

### `ical` — Agenda parity (`packages/plugins/ical`)

Two additions over the existing date-grouped list (which already does search +
save + sticky date headers):

1. **Tag pills.** Parse a leading `[Tag]` from each event title (`[Conf]`,
   `[Workshop]`, `[Hack]`, `[Side]`) into a small colored pill; strip it from the
   displayed title. Color map keyed by tag, derived around the theme accent. An
   untagged title renders no pill.
2. **Date-pill tabs.** Above the list, a row of day pills (e.g. `12 SEP … 15 SEP`)
   derived from the events. Selecting one filters the list to that day; an
   "all" / default state shows the full grouped list. Coexists with search + save.
3. **Timezone.** Add a `tz?: string` prop (e.g. `'Asia/Tokyo'`). When set, event
   times format in that zone via `toLocaleTimeString(..., { timeZone })` so the
   demo shows JST (Opening Talk 10:00) regardless of the viewer's locale.

### `markdown`, `forum` — unchanged

`markdown-to-jsx` already renders the inline sponsor HTML (`<div class="img-list">`
/ `<img>`); logos load from `ethtokyo.org`. `forum` already matches the
"Join group chat" screen.

## 4. Content — `apps/ethtokyo/manifest.source.json`

```jsonc
{
  "app": {
    "id": "ethtokyo.kon.xyz",
    "name": "ETHTokyo'25",
    "version": 1,
    "description": "ETHTokyo'25 — Emancipatory Tech for the Future of Humanity. Built on KON v2.",
    "theme": { "main": "#562266", "accent": "#FF5545", "font": "sans" }
  },
  "pages": [
    { "id": "home", "title": "Home", "icon": "home", "plugins": [
        { "id": "profile-card", … "props": {
            "title": "ETHTokyo'25", "subtitle": "Emancipatory Tech for Future of Humanity",
            "bg": "#562266", "logoUrl": "https://i.imgur.com/3G9N6sa.png" } },
        { "id": "markdown", … "props": { "content": "<inlined Home markdown>" } } ] },
    { "id": "agenda", "title": "Agenda", "icon": "calendar", "plugins": [
        { "id": "ical", … "props": { "tz": "Asia/Tokyo", "events": [ <13 parsed events> ] } } ] },
    { "id": "forum", "title": "Forum", "icon": "chat", "plugins": [
        { "id": "forum", … "props": { "gunPath": "ethtokyo-25-main", "title": "ETHTokyo'25" } } ] },
    { "id": "info", "title": "Information", "icon": "info", "plugins": [
        { "id": "markdown", … "props": { "content": "<inlined Information markdown>" } } ] }
  ],
  "deployment": { "gun_peers": ["https://relay.kon.xyz/gun", "https://relay.peer.ooo/gun"] }
}
```

- Home / Information markdown content inlined verbatim from the HackMD sources
  (see Source of truth). Forum `gunPath` namespaced to the 2025 demo.
- The 13 agenda events inlined as `IcalEvent[]`, times converted to JST
  (see Appendix A).

## 5. Testing

- **Unit (Vitest, co-located):**
  - `ical`: `[Tag]` parse + strip; date-pill filter; `tz` formatting.
  - `Icon`: every `KonIconName` resolves to an SVG.
  - `useTheme`: emits expected CSS vars; falls back when `theme` absent.
- **`apps/runtime/src/dev-app.test.ts`:** extend to assert the ethtokyo manifest
  parses with the new `app.theme` + `page.icon` fields.
- **Schemas:** round-trip test for the new optional fields (present + absent).
- **Manual:** `bun @relay-gun:start` then `bun @runtime:dev` →
  `open http://127.0.0.1:5174/?app=ethtokyo`; verify all 4 pages, tag pills, date
  pills, and the nav at both <768px and ≥768px widths.

## Out of scope (deferred)

- **Live wallet/ENS identity + working QR modal.** Needs the runtime to thread
  signed-in state through `KonPluginContext`. Identity row stays props-driven; QR
  is an affordance only.
- **Reconstructing the richer Aug-2025 Information copy** (Conference / Hackathons /
  Tracks / prizes) — not in the current source. Revisit if desired.
- **`img-list` sponsor grid styling** — sponsors render as a plain stacked image
  list; a styled grid is a nice-to-have, not required for parity.

## Appendix A — agenda events (parsed from the .ics, JST)

Source UIDs from the Google Calendar feed; `DTSTART`/`DTEND` are UTC `Z` →
converted to Asia/Tokyo. `id` = UID local-part.

| Tag      | Title (display)        | Day (JST) | Time (JST)  | Location                 |
| -------- | ---------------------- | --------- | ----------- | ------------------------ |
| Conf     | Opening Talk           | Sep 12    | 10:00–11:00 | 国際連合大学             |
| Conf     | Session1               | Sep 12    | 11:15–12:30 | 国際連合大学             |
| Conf     | Session2               | Sep 12    | 13:00–14:00 | 国際連合大学             |
| Conf     | Session #3             | Sep 12    | 14:15–15:15 | —                        |
| Hack     | Entry                  | Sep 13    | 09:00–18:00 | Digital Garage "Pangaea" |
| Workshop | ZK Workshop            | Sep 13    | 09:00–10:30 | Digital Garage "Pangaea" |
| Workshop | SmartWallet            | Sep 13    | 10:45–12:15 | —                        |
| Hack     | Start                  | Sep 13    | 18:00–19:15 | Digital Garage "Pangaea" |
| Hack     | Bento                  | Sep 13    | 20:00–21:00 | Digital Garage "Pangaea" |
| Hack     | 🚨 Submission deadline | Sep 14    | 09:00       | Digital Garage "Pangaea" |
| Hack     | 👀 Project review      | Sep 14    | 10:00–12:00 | Digital Garage "Pangaea" |
| Hack     | 🏆 Finale              | Sep 14    | 15:00–16:00 | Digital Garage "Pangaea" |
| Side     | Exhibition 1           | Sep 15    | 19:00–21:00 | 東京タワー               |

(The "DUMMY Schedule" descriptions on the Conf events are preserved in `description`.)
