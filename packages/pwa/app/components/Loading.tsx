import { SpinnerGap } from '@phosphor-icons/react'

export default function Loading() {
  return (
    <div className="fixed top-0 right-0 bottom-0 left-0 z-50 grid place-items-center bg-gray-500/60 backdrop-blur">
      <SpinnerGap weight="bold" size={80} className="animate-spin-slow" />
    </div>
  )
}
