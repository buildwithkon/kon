import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { darkModeAtom } from '~/atoms'

export function useDarkMode() {
  if (typeof window === 'undefined') {
    return false
  }

  const darkMode = useAtomValue(darkModeAtom)

  const [prefersDarkMode, setPrefersDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode === 'dark' || prefersDarkMode)

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
  }, [darkMode, prefersDarkMode])

  return darkMode === 'system' ? prefersDarkMode : darkMode === 'dark'
}
