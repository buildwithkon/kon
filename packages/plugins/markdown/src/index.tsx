/** @jsxImportSource preact */
import type { KonPluginComponent } from '@konxyz/runtime-core'
import Markdown from 'markdown-to-jsx'

export interface MarkdownPluginProps {
  content: string
  /** Optional class name appended to the root element. */
  className?: string
}

// markdown-to-jsx is React-based; works under Preact via @preact/preset-vite
// which aliases react -> preact/compat at build time.
const Md: KonPluginComponent<MarkdownPluginProps> = ({ props }) => {
  if (typeof props?.content !== 'string') return null
  return (
    <Markdown
      options={{
        overrides: {
          a: {
            component: ({ href, children, ...rest }: any) => {
              const isExternal = typeof href === 'string' && /^https?:\/\//.test(href)
              return (
                <a
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noreferrer' : undefined}
                  {...rest}
                >
                  {children}
                </a>
              )
            }
          },
          table: {
            component: ({ children, ...rest }: any) => (
              <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
                <table {...rest}>{children}</table>
              </div>
            )
          }
        }
      }}
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- markdown-to-jsx accepts className
      {...({ className: props.className } as any)}
    >
      {props.content}
    </Markdown>
  )
}

export default Md
