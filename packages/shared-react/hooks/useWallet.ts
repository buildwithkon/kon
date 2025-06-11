import { useAvatar as useAvatarOCK, useName as useNameOCK } from '@coinbase/onchainkit/identity'
import { ENS_APPCONFIG_COIN_KEY, getEnsAppConfigBase, getEnsAppconfigChainId } from '@konxyz/shared/lib/const'
import { base, baseSepolia, mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useBalance, useConnect, useConnections, useEnsText } from 'wagmi'

export const useLogin = () => {
  const { connectAsync, connectors } = useConnect()
  const loginAsync = async () =>
    connectAsync({ connector: connectors.find((c) => c.id === 'coinbaseWalletSDK') ?? connectors[0] })

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

export const useCoinBalance = (address: `0x${string}` | undefined) => {
  const { data: coinAddress } = useEnsText({
    name: normalize(`${address}.${getEnsAppConfigBase()}`),
    key: ENS_APPCONFIG_COIN_KEY,
    chainId: getEnsAppconfigChainId()
  })
  const { data, isLoading } = useBalance({
    address,
    token: coinAddress as `0x${string}`,
    chainId: baseSepolia.id,
    query: {
      enabled: !!coinAddress
    }
  })

  return {
    data,
    isLoading: address || coinAddress ? isLoading : false
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
