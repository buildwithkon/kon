import { cn } from '@konxyz/shared/lib/utils'
import { LaptopIcon, MoonStarsIcon, SunIcon } from '@phosphor-icons/react'
import { useAtom } from 'jotai'
import { darkModeAtom } from '~/hooks/useDarkMode'

const OPTIONS = [
  { id: 'system', icon: <LaptopIcon size={28} />, text: 'System' },
  { id: 'light', icon: <SunIcon size={28} />, text: 'Light' },
  { id: 'dark', icon: <MoonStarsIcon size={28} />, text: 'Dark' }
]

export default function ThemeChanger() {
  const [darkMode, setDarkMode] = useAtom(darkModeAtom)

  return (
    <div className="grid grid-cols-3 gap-4">
      {OPTIONS.map(({ id, icon, text }) => (
        <button
          key={id}
          type="button"
          className={cn(
            'grid place-items-center rounded-xl border border-2 pt-2 pb-3 text-center hover:bg-gray-400/5',
            id === darkMode ? 'border-accent' : 'border-muted'
          )}
          onClick={() => setDarkMode(id as 'system' | 'light' | 'dark')}
        >
          <span className="mx-auto mb-0.5">{icon}</span>
          <span className="text-xs">{text}</span>
        </button>
      ))}
    </div>
  )
}
