import { useAtomValue } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect, useState } from 'react'

export const darkModeAtom = atomWithStorage<'light' | 'dark' | 'system'>('kon.darkMode', 'system')

export function useDarkMode() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // return default
    return {
      isDark: false,
      prefersDarkMode: false,
      current: 'system'
    }
  }

  const darkMode = useAtomValue(darkModeAtom)
  const [prefersDarkMode, setPrefersDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const isDark: boolean = darkMode === 'system' ? prefersDarkMode : darkMode === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)

    function handleDarkModePrefferedChange() {
      const doesMatch = window.matchMedia('(prefers-color-scheme: dark)').matches
      setPrefersDarkMode(doesMatch)
    }

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', handleDarkModePrefferedChange)

    //good house keeping to remove listener, good article here https://www.pluralsight.com/guides/how-to-cleanup-event-listeners-react
    return () => {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', handleDarkModePrefferedChange)
    }
  }, [isDark])

  return {
    isDark,
    prefersDarkMode,
    current: darkMode
  }
}
