/** @jsxImportSource preact */
import type { KonPluginComponent } from '@konxyz/runtime-core'

export interface IframePluginProps {
  url: string
  /** Optional fixed height. Defaults to '100vh' minus a small chrome allowance. */
  height?: string
  /** Optional title attribute (a11y). */
  title?: string
}

const wrapStyle = (height: string) => ({
  height,
  width: '100%'
})

const frameStyle = {
  width: '100%',
  height: '100%',
  border: 0
}

const Iframe: KonPluginComponent<IframePluginProps> = ({ props }) => {
  if (!props?.url) return null
  const height = props.height ?? 'calc(100dvh - 4rem)'
  const isSlido = props.url.startsWith('https://app.sli.do')
  return (
    <div style={wrapStyle(height)}>
      <iframe
        src={props.url}
        title={props.title ?? 'embedded content'}
        style={frameStyle}
        {...(isSlido ? { allow: 'clipboard-write' } : {})}
      />
    </div>
  )
}

export default Iframe
