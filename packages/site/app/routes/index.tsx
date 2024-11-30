import { createRoute } from 'honox/factory'

const LINKS = [
  { href: 'https://x.com/buildwithkon', text: 'X(TWITTER)' },
  { href: 'https://github.com/buildwithkon', text: 'GITHUB' }
]

export default createRoute((c) => {
  return c.render(
    <div class="wrapper px-8 py-6">
      <main>
        <h1 class="font-extrabold text-8xl">Build with KON</h1>
      </main>
      <footer class="flex justify-end space-x-4 text-xl">
        {LINKS.map((item) => (
          <a key={item.text} href={item.href} target="_blank" rel="noreferrer">
            {item.text}
          </a>
        ))}
      </footer>
    </div>
  )
})
