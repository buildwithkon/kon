import { getEnsAppConfigBase, getEnsAppconfigChainId, ENS_APPCONFIG_KEY } from '@konxyz/shared/lib/const'
import { getWagmiConfig } from '@konxyz/shared/lib/wagmi'
import { getEnsAddress, getEnsAvatar, getEnsName, getEnsText } from '@wagmi/core'
import { normalize } from 'viem/ens'

export const getSubname = async (env: Env, address: `0x${string}`) =>
  await getEnsName(getWagmiConfig(env), {
    address,
    chainId: getEnsAppconfigChainId(env.NODE_ENV === 'production')
  })

export const getSubnameAddress = async (env: Env, name: string) =>
  await getEnsAddress(getWagmiConfig(env), {
    name: normalize(name),
    chainId: getEnsAppconfigChainId(env.NODE_ENV === 'production')
  })

export const getAppConfig = async (env: Env, subdomain: string) => {
  const configText = await getEnsText(getWagmiConfig(env), {
    name: normalize(`${subdomain}.${getEnsAppConfigBase(env.NODE_ENV === 'production')}`),
    key: ENS_APPCONFIG_KEY,
    chainId: getEnsAppconfigChainId(env.NODE_ENV === 'production')
  })
  return configText ? JSON.parse(configText) : null
}

export const getAppAvatar = async (env: Env, subdomain: string) =>
  await getEnsAvatar(getWagmiConfig(env), {
    name: normalize(`${subdomain}.${getEnsAppConfigBase(env.NODE_ENV === 'production')}`),
    chainId: getEnsAppconfigChainId(env.NODE_ENV === 'production')
  })

export const generateSubname = (id: string, subdomain: string) =>
  normalize(`${id}.${subdomain}.${getEnsAppConfigBase(env.NODE_ENV === 'production')}`)
