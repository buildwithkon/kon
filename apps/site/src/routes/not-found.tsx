/** @jsxImportSource preact */
import { Header } from '../components/header'

export function NotFound() {
  return (
    <main style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
      <Header />
      <h1 style={{ fontSize: '2rem', margin: '4rem 0 1rem 0' }}>not found</h1>
      <p style={{ color: '#666' }}>
        Try <a href="/">the home page</a> or <a href="/stack">the stack</a>.
      </p>
    </main>
  )
}
