import { ENS_APPCONFIG_BASE, ENS_APPCONFIG_CHAINID, ENS_APPCONFIG_KEY } from '@konxyz/shared/lib/const'
import { getWagmiConfig } from '@konxyz/shared/lib/wagmi'
import { getEnsAddress, getEnsAvatar, getEnsName, getEnsText } from '@wagmi/core'
import { normalize } from 'viem/ens'

export const getSubname = async (env: Env, address: `0x${string}`) =>
  await getEnsName(getWagmiConfig(env), {
    address,
    chainId: ENS_APPCONFIG_CHAINID
  })

export const getSubnameAddress = async (env: Env, name: string) =>
  await getEnsAddress(getWagmiConfig(env), {
    name: normalize(name),
    chainId: ENS_APPCONFIG_CHAINID
  })

export const getAppConfig = async (env: Env, subdomain: string) => {
  const configText = await getEnsText(getWagmiConfig(env), {
    name: normalize(`${subdomain}.${ENS_APPCONFIG_BASE}`),
    key: ENS_APPCONFIG_KEY,
    chainId: ENS_APPCONFIG_CHAINID
  })
  return configText ? JSON.parse(configText) : null
}

export const getAppAvatar = async (env: Env, subdomain: string) =>
  await getEnsAvatar(getWagmiConfig(env), {
    name: normalize(`${subdomain}.${ENS_APPCONFIG_BASE}`),
    chainId: ENS_APPCONFIG_CHAINID
  })

export const generateSubname = (id: string, subdomain: string) =>
  normalize(`${id}.${subdomain}.${ENS_APPCONFIG_BASE}`)
