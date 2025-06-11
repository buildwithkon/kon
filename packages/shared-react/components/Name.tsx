import Skelton from '~/components/Skelton'
import { useName } from '~/hooks/useWallet'

export default function Name({ address }: { address: `0x${string}` | undefined }) {
  const { name, isLoading } = useName(address)
  const [id, rest] = (name ?? '').match(/^([^.]+)\.(.+)$/)?.slice(1) ?? [name ?? '', '']

  return isLoading ? (
    <Skelton className="h-5 w-32" />
  ) : id && rest ? (
    <span>
      {id}
      <span className="opacity-80">.{rest}</span>
    </span>
  ) : (
    <span>{name}</span>
  )
}
