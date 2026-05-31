/** @jsxImportSource preact */
import { BuildWith } from '../components/build-with'
import { Header } from '../components/header'

const heroStyle = {
  textAlign: 'center' as const,
  padding: '6rem 1.5rem 4rem',
  maxWidth: '720px',
  margin: '0 auto'
}

const titleStyle = {
  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
  fontWeight: 800,
  lineHeight: 1.1,
  margin: '0 0 1.25rem 0',
  letterSpacing: '-0.02em'
}

const subStyle = {
  fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
  color: '#666',
  margin: '0 0 2.5rem 0',
  lineHeight: 1.5
}

const ctaRow = {
  display: 'flex',
  gap: '0.75rem',
  justifyContent: 'center',
  flexWrap: 'wrap' as const
}

const ctaPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.75rem 1.5rem',
  background: '#111',
  color: 'white',
  borderRadius: '999px',
  textDecoration: 'none',
  fontWeight: 600
}

const ctaGhost = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.75rem 1.5rem',
  background: 'transparent',
  color: '#111',
  border: '1px solid #ddd',
  borderRadius: '999px',
  textDecoration: 'none',
  fontWeight: 600
}

export function Home() {
  return (
    <main>
      <Header />
      <section style={heroStyle}>
        <h1 style={titleStyle}>Apps your community owns, free forever.</h1>
        <p style={subStyle}>
          KON lets organizers ship a real app for their community in minutes. ENS for the name, IPFS for the
          bundle, GUN.js for chat, and a wallet you can self-host. No platform can shut you down.
        </p>
        <div style={ctaRow}>
          <a href="/stack" style={ctaPrimary}>
            See the stack
          </a>
          <a href="https://github.com/buildwithkon/kon" style={ctaGhost} rel="noreferrer">
            GitHub
          </a>
        </div>
      </section>
      <BuildWith />
    </main>
  )
}
