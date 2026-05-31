/** @jsxImportSource preact */
import { BuildWith } from '../components/build-with'
import { Header } from '../components/header'

const wrap = {
  maxWidth: '720px',
  margin: '0 auto',
  padding: '4rem 1.5rem'
}

const titleStyle = {
  fontSize: '2rem',
  fontWeight: 800,
  marginBottom: '1.25rem'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '0.95rem',
  margin: '1.5rem 0'
}

const cellStyle = {
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid #eee',
  verticalAlign: 'top' as const
}

const headerStyle = {
  ...cellStyle,
  textAlign: 'left' as const,
  fontWeight: 700,
  background: '#fafafa'
}

const rows: Array<{ layer: string; tech: string; notes: string }> = [
  {
    layer: 'App resolution',
    tech: 'ENS contenthash (DNS-ENS via DNSSEC + ENSIP-10)',
    notes: 'kon.xyz itself is the ENS name.'
  },
  {
    layer: 'Hosting',
    tech: 'IPFS (web3.storage) + .limo gateway fallback',
    notes: 'CIDs are immutable; service worker caches them forever.'
  },
  {
    layer: 'Runtime',
    tech: 'Vite + Preact + @preact/signals',
    notes: 'Static SPA. Boots from ENS → entry CID → manifest CID.'
  },
  {
    layer: 'Plugins',
    tech: 'KON v2 plugin contract',
    notes: 'Built-in (workspace) + third-party (dynamic IPFS load).'
  },
  {
    layer: 'Chat / realtime',
    tech: 'GUN.js + SEA (passkey-derived keys)',
    notes: 'Self-hostable relay; multi-relay redundancy.'
  },
  {
    layer: 'Wallet',
    tech: 'Safe v1.4.1 + passkey owner + ERC-4337 (Pimlico)',
    notes: 'Lives at id.kon.xyz (or id.<your-domain>) via postMessage SDK.'
  },
  {
    layer: 'Smart contracts',
    tech: 'AppCoin + AppCoinFactory on Base L2',
    notes: 'ERC-20 with admin controls + tipping + redemption.'
  },
  {
    layer: 'Identity',
    tech: 'Passkey (WebAuthn) + Safe smart account',
    notes: 'Same address across chains via predeterministic deploy.'
  }
]

export function Stack() {
  return (
    <main>
      <Header />
      <section style={wrap}>
        <h1 style={titleStyle}>The stack</h1>
        <p style={{ color: '#444', lineHeight: 1.6 }}>
          KON is a decentralized stack hiding behind a normal-feeling PWA. Each layer is replaceable by a
          self-hosted alternative; the defaults are KON-managed so you can ship without ops, the overrides are
          wired into the runtime config so you can leave when you want to.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerStyle}>Layer</th>
              <th style={headerStyle}>Technology</th>
              <th style={headerStyle}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.layer}>
                <td style={cellStyle}>{r.layer}</td>
                <td style={cellStyle}>
                  <code>{r.tech}</code>
                </td>
                <td style={cellStyle}>{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ color: '#444' }}>
          Self-hosters override <code>manifest.deployment.*</code> to point at their own wallet origin, GUN
          peers, IPFS gateways, and ENS domain. The lint at <code>scripts/lint-no-hardcoded-origins.mjs</code>{' '}
          guards the override surface so KON-managed literals cannot sneak past it.
        </p>
      </section>
      <BuildWith />
    </main>
  )
}
