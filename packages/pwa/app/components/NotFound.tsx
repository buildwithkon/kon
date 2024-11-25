import { WifiX } from '@phosphor-icons/react'

export default function NotFound() {
  return (
    <div className="wrapper flex min-h-screen flex-col items-center justify-center">
      <WifiX size={128} />
      <p className="mt-6 font-bold text-2xl">Not found</p>
    </div>
  )
}
