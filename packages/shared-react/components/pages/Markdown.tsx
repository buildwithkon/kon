import type { RootLoader } from '@konxyz/shared/types'
import BottomBar from '~/components/BottomBar'
import TopBar from '~/components/TopBar'
import Markdown from 'markdown-to-jsx'

export default function MD({ ld, content }: { ld: RootLoader, content: string }) {
  return (
    <div className="wrapper-app">
      <TopBar>
        🚀 Infomation
      </TopBar>
      <Markdown
        options={{
          overrides: {
            a: {
              component: ({ href, children, ...props }) => {
                const isExternal = href.startsWith('http');
                return (
                  <a
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noreferrer' : undefined}
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
            },
          },
        }}
        className='md'
      >
        {content}
      </Markdown>
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
