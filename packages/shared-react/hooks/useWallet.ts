import { useAvatar as useAvatarOCK, useName as useNameOCK } from '@coinbase/onchainkit/identity'
import { base, mainnet } from 'viem/chains'
import { useBalance, useConnect, useConnections } from 'wagmi'

export const useLogin = () => {
  const { connectAsync, connectors } = useConnect()
  const loginAsync = async (connectorId = 'coinbaseWalletSDK') =>
    connectAsync({ connector: connectors.find((c) => c.id === connectorId) ?? connectors[0] })

  return { loginAsync }
}

export const useName = (address: `0x${string}` | undefined) => {
  const { data: baseName, isLoading: isLoadingBaseName } = useNameOCK({
    address: address ?? '0x',
    chain: base
  })
  const { data: ensName, isLoading: isLoadingEnsName } = useNameOCK({
    address: address ?? '0x',
    chain: mainnet
  })

  return {
    name: baseName ?? ensName ?? '',
    ensName,
    baseName,
    isLoading: address ? isLoadingBaseName || isLoadingEnsName : false
  }
}

export const useAvatar = (name: string | undefined) => {
  const { data: avatar, isLoading } = useAvatarOCK({ ensName: name ?? '' })

  return {
    avatar,
    isLoading: name ? isLoading : false
  }
}

export const useCoinBalance = (
  address: `0x${string}` | undefined,
  coinChainId: number | undefined,
  coinAddress: `0x${string}` | undefined
) => {
  const { data, isLoading } = useBalance({
    address,
    token: coinAddress,
    chainId: coinChainId,
    query: {
      enabled: !!address && !!coinAddress && !!coinChainId
    }
  })

  return {
    data,
    isLoading: address || coinChainId || coinAddress ? isLoading : false
  }
}

export const useCurrentConnector = () => {
  const connections = useConnections()

  return {
    connection: connections?.[0],
    connector: connections?.[0]?.connector.id,
    isSCW: connections?.[0]?.connector.id === 'coinbaseWalletSDK'
  }
}
