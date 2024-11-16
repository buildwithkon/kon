import { getEnsAvatar, getEnsName, getEnsText } from '@wagmi/core'
import { normalize } from 'viem/ens'
import { ENS_APPCONFIG_CHAINID, ENS_APPCONFIG_KEY, ENS_APPCONFIG_NAME } from '~/lib/const'
import { config } from '~/lib/wagmi'

export const getSubname = async (address: `0x${string}`) =>
  await getEnsName(config, {
    address,
    chainId: ENS_APPCONFIG_CHAINID
  })

export const getAppConfig = async (subdomain: string) => {
  const configText = await getEnsText(config, {
    name: normalize(`${subdomain}.${ENS_APPCONFIG_NAME}`),
    key: ENS_APPCONFIG_KEY,
    chainId: ENS_APPCONFIG_CHAINID
  })
  return configText ? JSON.parse(configText) : null
}

export const getAppAvatar = async (subdomain: string) =>
  await getEnsAvatar(config, {
    name: normalize(`${subdomain}.${ENS_APPCONFIG_NAME}`),
    chainId: ENS_APPCONFIG_CHAINID
  })
