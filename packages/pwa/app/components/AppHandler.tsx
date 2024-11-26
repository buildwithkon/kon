import { SpinnerGap } from '@phosphor-icons/react'
import { useSWEffect } from '@remix-pwa/sw'
import { useLocation, useNavigate } from '@remix-run/react'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { isLoadingAtom, userAtom } from '~/atoms'

export default function AppHandler() {
  const { isConnected, isConnecting, address } = useAccount()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isLoading = useAtomValue(isLoadingAtom)
  const [user, setUser] = useAtom(userAtom)
  useSWEffect()

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

  return isLoading || isConnecting ? (
    <div className="fixed top-0 right-0 bottom-0 left-0 z-50 grid place-items-center bg-gray-500/60 backdrop-blur">
      <SpinnerGap weight="bold" size={80} className="animate-spin-slow" />
    </div>
  ) : null
}
