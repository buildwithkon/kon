/** @jsxImportSource preact */
import type { KonPluginComponent } from '@konxyz/runtime-core'

export interface ProfileCardPluginProps {
  /** Card title. Falls back to context.appId when unset. */
  title?: string
  /** Subtitle / tagline shown under title. */
  subtitle?: string
  /** Optional brand image URL (https or ipfs://). */
  iconUrl?: string
  /** Position-sticky inside its scroll container. */
  isSticky?: boolean
  /** Accent color override (CSS color). */
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

const containerStyle = (sticky: boolean): import('preact').JSX.CSSProperties => ({
  position: sticky ? 'sticky' : 'static',
  top: sticky ? '1rem' : 'auto',
  zIndex: sticky ? 10 : 'auto',
  marginBottom: '1rem'
})

const cardStyle = (_accent: string): import('preact').JSX.CSSProperties => ({
  position: 'relative',
  borderRadius: '24px',
  padding: '1.6rem 1.7rem',
  backgroundColor: '#111',
  // Subtle top-sheen / bottom-shade overlay for depth over the solid brand color.
  backgroundImage: 'linear-gradient(158deg, rgba(255,255,255,0.13), rgba(0,0,0,0.18))',
  color: 'white',
  boxShadow: '0 22px 48px -24px rgba(20,18,30,0.55)',
  overflow: 'hidden',
  minHeight: '9rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  gap: '0.35rem'
})

const titleStyle: import('preact').JSX.CSSProperties = {
  fontWeight: 800,
  fontSize: '1.7rem',
  lineHeight: 1.12,
  letterSpacing: '-0.02em',
  maxWidth: '72%',
  wordBreak: 'break-word'
}

const subStyle: import('preact').JSX.CSSProperties = {
  fontSize: '0.85rem',
  opacity: 0.7,
  maxWidth: '70%'
}

const iconWrap: import('preact').JSX.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  width: '4rem',
  height: '4rem',
  borderRadius: '999px',
  overflow: 'hidden',
  background: '#fff2'
}

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

  const card = props?.bg
    ? Object.assign({}, cardStyle(accent), { backgroundColor: props.bg })
    : cardStyle(accent)

  return (
    <div style={containerStyle(sticky)}>
      <div style={card}>
        <div style={titleStyle}>{title}</div>
        {subtitle && <div style={subStyle}>{subtitle}</div>}
        {logoUrl && (
          <div style={iconWrap}>
            <img
              src={logoUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(ev) => {
                // Hide the whole badge if the brand mark fails to load, rather
                // than leaving a broken-image glyph in the hero.
                const wrap = ev.currentTarget.parentElement
                if (wrap) wrap.style.display = 'none'
              }}
            />
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

export default ProfileCard
