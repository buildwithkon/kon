import { shortAddr } from '@konxyz/shared/lib/utils'
import { ClipboardTextIcon } from '@phosphor-icons/react'
import { useAccount } from 'wagmi'
import { toast } from '~/components/ui/Toaster'

export default function AddressInput() {
  const { address } = useAccount()

  const copy = (address: `0x${string}` | undefined) => {
    if (!address) return
    navigator.clipboard.writeText(address)
    toast.info('Copied to clipboard!')
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={shortAddr(address, 14, 5)}
        readOnly
        className="w-full overflow-ellipsis pr-10 font-mono"
      />
      <button type="button" onClick={() => copy(address)} className="absolute top-2 right-2 backdrop-blur-sm">
        <ClipboardTextIcon size={30} weight="duotone" className="" />
      </button>
    </div>
  )
}
