import { cn } from '@konxyz/shared/lib/utils'
import Markdown from 'markdown-to-jsx'

export default function MD({ className, content }: { className?: string; content: string }) {
  return (
    <Markdown
      options={{
        overrides: {
          a: {
            component: ({ href, children, ...props }) => {
              const isExternal = href.startsWith('http')
              return (
                <a
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noreferrer' : undefined}
                  {...props}
                >
                  {children}
                </a>
              )
            }
          },
          table: {
            component: ({ children, ...props }) => (
              <div className="table-wrapper">
                <table {...props}>{children}</table>
              </div>
            )
          }
        }
      }}
      className={cn('md', className)}
    >
      {content}
    </Markdown>
  )
}
