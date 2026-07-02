/** @jsxImportSource preact */
import type { KonPluginComponent } from '@konxyz/runtime-core'

export interface BuildWithPluginProps {
  /** Override target URL. Defaults to https://kon.xyz. */
  href?: string
  /** Optional label override. Defaults to 'Build with KON'. */
  label?: string
}

const wrapStyle = {
  margin: '1.5rem 0',
  textAlign: 'center' as const,
  fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
  fontSize: '0.85rem',
  opacity: 0.7
}

const linkStyle = {
  color: 'inherit',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem'
}

const BuildWith: KonPluginComponent<BuildWithPluginProps> = ({ props }) => {
  const href = props?.href ?? 'https://kon.xyz'
  const label = props?.label ?? 'Build with KON'
  return (
    <div style={wrapStyle}>
      <a href={href} target="_blank" rel="noreferrer" style={linkStyle}>
        {label}
      </a>
    </div>
  )
}

export default BuildWith
