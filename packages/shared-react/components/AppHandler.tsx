import { TAILWIND_WHITELIST_CLASSES } from '@konxyz/shared/lib/style'
import type { RootLoader } from '@konxyz/shared/types'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { isLoadingAtom, subnameAtom } from '~/atoms'
import Loading from '~/components/Loading'
import { useDarkMode } from '~/hooks/useDarkMode'

export default function AppHandler({
  ld,
  navigate,
  pathname,
  isNavigating
}: { ld: RootLoader; navigate: (path: string) => void; pathname: string; isNavigating: boolean }) {
  const { isConnected, isConnecting, address } = useAccount()
  const isLoading = useAtomValue(isLoadingAtom)
  useDarkMode()
  const subname = useAtomValue(subnameAtom)

  // redirect
  useEffect(() => {
    if (pathname !== '/' && !isConnected) {
      navigate('/')
    }
    if (pathname === '/' && isConnected && address) {
      navigate('/home')
    }
    if (pathname !== '/' && isConnected && address && !subname) {
      navigate('/start')
    }
  }, [isConnected, address, navigate, pathname, subname])

  return (
    <>
      {!ld || isLoading || isNavigating || (isConnecting && <Loading />)}
      <span className={`hidden ${TAILWIND_WHITELIST_CLASSES.join(' ')}`} />
    </>
  )
}
