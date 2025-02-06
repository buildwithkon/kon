import type { RootLoader } from '@konxyz/shared/types'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { isLoadingAtom } from '~/atoms'
import Loading from '~/components/Loading'

export default function AppHandler({
  ld,
  navigate,
  pathname
}: { ld: RootLoader; navigate: (path: string) => void; pathname: string }) {
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

  // // manifest
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && ld.appConfig) {
  //     const manifestElement = document.getElementById('manifest')
  //     const manifestString = JSON.stringify({
  //       ...generateManifest(ld?.appConfig),
  //       start_url: `${window.location.origin}/home`
  //     })
  //     manifestElement?.setAttribute(
  //       'href',
  //       `data:application/json;charset=utf-8,${encodeURIComponent(manifestString)}`
  //     )
  //   }
  // }, [ld?.appConfig])

  return <>{!ld || isLoading || (isConnecting && <Loading />)}</>
}
