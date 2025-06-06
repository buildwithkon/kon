import { createEOASigner, createSCWSigner } from '@konxyz/shared/lib/xmtp'
import { useCallback, useEffect } from 'react'
import { base } from 'viem/chains'
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi'
import Conversations from '~/components/modules/Conversations'
import { useCurrentConnector } from '~/hooks/useWallet'
import { useXMTP } from '~/hooks/useXMTP'

export default function Forum() {
  const { address, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { initialize, client } = useXMTP()
  const { isSCW } = useCurrentConnector()
  const { switchChainAsync } = useSwitchChain()

  const init = useCallback(async () => {
    if (!address || (isSCW && !chainId)) {
      return
    }
    if (chainId !== base.id) {
      await switchChainAsync({ chainId: base.id })
    }
    if (!client) {
      const signer = isSCW
        ? await createSCWSigner(
            address,
            (message: string) => signMessageAsync({ message }),
            chainId ?? base.id
          )
        : await createEOASigner(address, (message: string) => signMessageAsync({ message }))
      await initialize(signer)
    }
  }, [address, chainId, client, initialize, signMessageAsync, isSCW, switchChainAsync])

  useEffect(() => {
    init()
  }, [init])

  return <Conversations />
}
