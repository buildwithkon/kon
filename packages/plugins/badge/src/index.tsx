/** @jsxImportSource preact */
import type { KonPluginComponent } from '@konxyz/runtime-core'

export interface BadgePluginProps {
  badges: string[]
}

const containerStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '0.5rem',
  margin: '2rem 0',
  padding: 0,
  listStyle: 'none'
}

const itemStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem 1rem',
  border: '2px solid currentColor',
  borderRadius: '1rem',
  fontWeight: 700,
  fontSize: '1.125rem',
  opacity: 0.85
}

const Badge: KonPluginComponent<BadgePluginProps> = ({ props }) => {
  const badges = Array.isArray(props?.badges) ? props.badges : []
  if (badges.length === 0) return null
  return (
    <ul style={containerStyle}>
      {badges.map((badge) => (
        <li key={badge} style={itemStyle}>
          {badge}
        </li>
      ))}
    </ul>
  )
}

export default Badge
