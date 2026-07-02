/** @jsxImportSource preact */
const navStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.5rem',
  maxWidth: '960px',
  margin: '0 auto'
}

const brandStyle = {
  fontWeight: 800,
  fontSize: '1.25rem',
  letterSpacing: '-0.01em',
  color: 'inherit',
  textDecoration: 'none'
}

const linkRow = {
  display: 'flex',
  gap: '1.25rem',
  fontSize: '0.95rem'
}

const linkStyle = { color: '#444', textDecoration: 'none' }

export function Header() {
  return (
    <header style={navStyle}>
      <a href="/" style={brandStyle}>
        KON
      </a>
      <nav style={linkRow}>
        <a href="/stack" style={linkStyle}>
          Stack
        </a>
        <a href="https://github.com/buildwithkon/kon" style={linkStyle} rel="noreferrer">
          GitHub
        </a>
      </nav>
    </header>
  )
}
