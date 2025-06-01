import { createEOASigner, createSCWSigner } from '@konxyz/shared/lib/xmtp'
import { base } from 'viem/chains'
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi'
import Chats from '~/components/Chats'
import { useCurrentConnector } from '~/hooks/useWallet'
import { useXMTP } from '~/hooks/useXMTP'

export default function Forum() {
  const { address, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { initialize, client, disconnect, getConversations, conversation } = useXMTP()
  const { isSCW } = useCurrentConnector()
  const { switchChainAsync } = useSwitchChain()

  const init = async () => {
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
      const client = await initialize(signer)
      console.log('conv:', client)
      const conv = await client?.conversations.listGroups()
      console.log('conv:', conv)
    }
  }

  // useEffect(() => {
  //   const init = async () => {
  //     if (!address || (isSCW && !chainId)) {
  //       return
  //     }
  //     if (chainId !== base.id) {
  //       await switchChainAsync({ chainId: base.id })
  //     }
  //     if (!client) {
  //       const signer = isSCW
  //         ? await createSCWSigner(
  //             address,
  //             (message: string) => signMessageAsync({ message }),
  //             chainId ?? base.id
  //           )
  //         : await createEOASigner(address, (message: string) => signMessageAsync({ message }))
  //       await initialize(signer)
  //     }
  //   }
  // }, [initialize, isSCW, signMessageAsync, address, chainId, client, switchChainAsync])

  const conncect = async () => {
    await init()
  }

  const getConv = async () => {
    const conv = await getConversations()
    console.log('getConv----', conv)
  }
  console.log('xmtpClient:', client, 'conversations::', conversation)

  return (
    <Chats>
      {client ? (
        <>
          <button onClick={() => getConv()} type="button">
            getCoonv
          </button>

          <button onClick={() => disconnect()} type="button">
            Disconnect from XMTP
          </button>
        </>
      ) : (
        <button onClick={() => conncect()} type="button">
          Connect to XMTP
        </button>
      )}
    </Chats>
  )
}
