import { createRoute } from 'honox/factory'

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <rect width="256" height="256" fill="none" />
    <line
      x1="144"
      y1="128"
      x2="80"
      y2="128"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="24"
    />
    <path
      d="M48.49,221.28A8,8,0,0,0,59.93,231l168-96.09a8,8,0,0,0,0-14l-168-95.85a8,8,0,0,0-11.44,9.67L80,128Z"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="24"
    />
  </svg>
)

const LINKS = [
  {
    href: 'https://x.com/buildwithkon',
    text: 'X(TWITTER)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <rect width="256" height="256" fill="none" />
        <polygon
          points="48 40 96 40 208 216 160 216 48 40"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="24"
        />
        <line
          x1="113.88"
          y1="143.53"
          x2="48"
          y2="216"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="24"
        />
        <line
          x1="208"
          y1="40"
          x2="142.12"
          y2="112.47"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="24"
        />
      </svg>
    )
  },
  {
    href: 'https://github.com/buildwithkon',
    text: 'GITHUB',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <rect width="256" height="256" fill="none" />
        <path
          d="M119.83,56A52,52,0,0,0,76,32a51.92,51.92,0,0,0-3.49,44.7A49.28,49.28,0,0,0,64,104v8a48,48,0,0,0,48,48h48a48,48,0,0,0,48-48v-8a49.28,49.28,0,0,0-8.51-27.3A51.92,51.92,0,0,0,196,32a52,52,0,0,0-43.83,24Z"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="24"
        />
        <path
          d="M104,232V192a32,32,0,0,1,32-32h0a32,32,0,0,1,32,32v40"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="24"
        />
        <path
          d="M104,208H76a32,32,0,0,1-32-32,32,32,0,0,0-32-32"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="24"
        />
      </svg>
    )
  }
]

export default createRoute((c) => {
  return c.render(
    <div class="wrapper px-8 py-6">
      <main>
        <h1 class="text-pretty text-[2.4rem]/normal tracking-tight sm:text-6xl/tight">
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
          <span class="font-bold leading-relaxed">with KON</span>
        </h1>
        <a
          href="https://app.deform.cc/form/ab05c58b-5db9-4aea-855c-e4790b39b74c/?page_number=0"
          target="_blank"
          rel="noreferrer"
          class="mt-4 inline-flex items-center space-x-2 rounded-full border-2 border-black py-2 pr-8 pl-6 font-bold text-lg hover:bg-black/5"
        >
          <div class="h-6 w-6">
            <MailIcon />
          </div>
          <span>Pre sign-up</span>
        </a>
      </main>
      <footer class="flex justify-end space-x-4 text-xl">
        {LINKS.map((item) => (
          <a key={item.text} href={item.href} target="_blank" rel="noreferrer">
            <span class="block h-10 w-10">{item.icon}</span>
          </a>
        ))}
      </footer>
    </div>
  )
})
