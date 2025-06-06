import { useConnect, useConnections } from 'wagmi'

export const useLogin = () => {
  const { connectAsync, connectors } = useConnect()
  const loginAsync = async () =>
    connectAsync({ connector: connectors.find((c) => c.id === 'coinbaseWalletSDK') ?? connectors[0] })

  return { loginAsync }
}

export const useCurrentConnector = () => {
  const connections = useConnections()

  return {
    connection: connections?.[0],
    connector: connections?.[0]?.connector.id,
    isSCW: connections?.[0]?.connector.id === 'coinbaseWalletSDK'
  }
}
