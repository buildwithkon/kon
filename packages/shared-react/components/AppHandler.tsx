import { TAILWIND_WHITELIST_CLASSES } from '@konxyz/shared/lib/style'
import type { RootLoader } from '@konxyz/shared/types'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { isLoadingAtom } from '~/atoms'
import Loading from '~/components/Loading'

export default function AppHandler({
  ld,
  navigate,
  pathname,
  isNavigating
}: { ld: RootLoader; navigate: (path: string) => void; pathname: string; isNavigating: boolean }) {
  const { isConnected, isConnecting, address } = useAccount()
  const isLoading = useAtomValue(isLoadingAtom)

  // redirect
  useEffect(() => {
    if (pathname !== '/' && !isConnected) {
      navigate('/')
    }
    if (pathname === '/' && isConnected && address) {
      navigate('/home')
    }
    // if (isConnected && address && !user.subname) {
    //   getSubname(address).then((subname) => {
    //     setUser((prev) => ({ ...prev, subname }))
    //     if (!subname) {
    //       navigate('/start')
    //     } else if (pathname === '/') {
    //       navigate('/home')
    //     }
    //   })
    // }
  }, [isConnected, address, navigate, pathname])

  return (
    <>
      {!ld || isLoading || isNavigating || (isConnecting && <Loading />)}
      <span className={`hidden ${TAILWIND_WHITELIST_CLASSES}.join(' ')`} />
    </>
  )
}
