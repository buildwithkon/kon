import { createRoute } from 'honox/factory'

const LINKS = [
  { href: 'https://x.com/buildwithkon', text: 'X(TWITTER)' },
  { href: 'https://github.com/buildwithkon', text: 'GITHUB' }
]

export default createRoute((c) => {
  return c.render(
    <div class="wrapper px-8 py-6">
      <main>
        <h1 class="text-pretty text-5xl leading-normal tracking-tighter">
          <span class="text-nowrap">
            Build<i>💪</i>
          </span>{' '}
          your own PWA{' '}
          <span class="text-nowrap">
            apps<i>📲</i>
          </span>{' '}
          in{' '}
          <span class="text-nowrap">
            minutes<i>⏱️</i>
          </span>
          <br />
          <span class="font-extrabold text-6xl leading-relaxed">with KON</span>
        </h1>
        {/* <h1 class="font-extrabold text-8xl leading-tighter tracking-tighter">Build with KON</h1>
        <p class="px-1.5 pt-4 text-4xl leading-normal tracking-tight">
          Build<i>💪</i> your own PWA apps<i>📲</i> in minutes<i>⏱️</i>
        </p> */}
      </main>
      <footer class="flex justify-end space-x-4 text-xl">
        {LINKS.map((item, i) => (
          <>
            <a key={item.text} href={item.href} target="_blank" rel="noreferrer">
              {item.text}
            </a>
            {i < LINKS.length - 1 && <span>/</span>}
          </>
        ))}
      </footer>
    </div>
  )
})
