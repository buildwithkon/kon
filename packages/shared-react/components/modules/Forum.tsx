import { createEOASigner, createSCWSigner } from '@konxyz/shared/lib/xmtp'
import { useAccount, useSignMessage } from 'wagmi'
import Loading from '~/components/Loading'
import Conversation from '~/components/modules/Conversation.old'
import { useCurrentConnector } from '~/hooks/useWallet'
import { useXMTP } from '~/hooks/useXMTP'

export default function Forum() {
  const { chainId, address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { client, initialize, isLoading } = useXMTP()
  const { isSCW } = useCurrentConnector()

  console.log('client----', client)

  const init = async () => {
    // create xmtp-client if wallet is connected
    if (!address || (isSCW && !chainId)) {
      return
    }
    void initialize(
      isSCW
        ? createSCWSigner(address, (message: string) => signMessageAsync({ message }))
        : createEOASigner(address, (message: string) => signMessageAsync({ message }))
    )
  }

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : client ? (
        <Conversation />
      ) : (
        <div className="flex w-full flex-col items-center justify-center px-6">
          <button type="button" onClick={() => init()} className="btn-main mt-48 w-full">
            Join group chat
          </button>
        </div>
      )}
    </>
  )
}
