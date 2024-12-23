import { ENS_APPCONFIG_CHAINID, ENS_APPCONFIG_KEY, ENS_APPCONFIG_NAME } from '@konxyz/shared/lib/const'
import { getConfig } from '@konxyz/shared/lib/wagmi'
import { getEnsAddress, getEnsAvatar, getEnsName, getEnsText } from '@wagmi/core'
import { normalize } from 'viem/ens'

export const getSubname = async (env: Env, address: `0x${string}`) =>
  await getEnsName(getConfig(env), {
    address,
    chainId: ENS_APPCONFIG_CHAINID
  })

export const getSubnameAddress = async (env: Env, name: string) =>
  await getEnsAddress(getConfig(env), {
    name: normalize(name),
    chainId: ENS_APPCONFIG_CHAINID
  })

export const getAppConfig = async (env: Env, subdomain: string) => {
  const configText = await getEnsText(getConfig(env), {
    name: normalize(`${subdomain}.${ENS_APPCONFIG_NAME}`),
    key: ENS_APPCONFIG_KEY,
    chainId: ENS_APPCONFIG_CHAINID
  })
  return configText ? JSON.parse(configText) : null
}

export const getAppAvatar = async (env: Env, subdomain: string) =>
  await getEnsAvatar(getConfig(env), {
    name: normalize(`${subdomain}.${ENS_APPCONFIG_NAME}`),
    chainId: ENS_APPCONFIG_CHAINID
  })
