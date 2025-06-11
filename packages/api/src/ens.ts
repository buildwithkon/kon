import {
  APP_NAME,
  COLOR_HEX_MAIN_DEFAULT,
  DEFAULT_FAVICON_URL,
  ENS_APPCONFIG_COIN_KEY,
  ENS_APPCONFIG_KEY,
  ENS_APPCONFIG_REWARDS_KEY,
  getEnsAppConfigBase
} from '@konxyz/shared/lib/const'
import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { cors } from 'hono/cors'
import { normalize } from 'viem/ens'
import { getClient } from './lib/client'
import { getEnv } from './lib/env'

const ens = new Hono<{ Bindings: Env }>()

ens.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    maxAge: 86400
  })
)

ens.use('*', async (c, next) => {
  const noCache = c.req.header('x-no-cache')

  if (noCache) {
    return next()
  }

  return cache({
    cacheName: 'kon-api',
    cacheControl: 'max-age=600'
  })(c, next)
})

ens.get('/:chain/getAppConfig/:id', async (c) => {
  const { ALCHEMY_API_KEY } = await getEnv(c.env)
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, ALCHEMY_API_KEY)
  const [appConfig, appCoin, appRewards] = await Promise.all([
    client.getEnsText({
      name: normalize(`${id}.${getEnsAppConfigBase(chain === 'mainnet')}`),
      key: ENS_APPCONFIG_KEY
    }),
    client.getEnsText({
      name: normalize(`${id}.${getEnsAppConfigBase(chain === 'mainnet')}`),
      key: ENS_APPCONFIG_COIN_KEY
    }),
    client.getEnsText({
      name: normalize(`${id}.${getEnsAppConfigBase(chain === 'mainnet')}`),
      key: ENS_APPCONFIG_REWARDS_KEY
    })
  ])

  const [coinChainId, coinAddress] = appCoin?.split(':') ?? []

  const res = {
    ...JSON.parse(appConfig ?? '{}'),
    ...(appCoin && {
      coin: {
        chainId: coinChainId,
        address: coinAddress
      }
    }),
    ...(appRewards && {
      rewards: JSON.parse(appRewards)
    })
  }

  return c.json(res)
})

ens.get('/:chain/getAppCoin/:id', async (c) => {
  const { ALCHEMY_API_KEY } = await getEnv(c.env)
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, ALCHEMY_API_KEY)
  const res = await client.getEnsText({
    name: normalize(`${id}.${getEnsAppConfigBase(chain === 'mainnet')}`),
    key: ENS_APPCONFIG_COIN_KEY
  })
  return c.text(res ?? '')
})

ens.get('/:chain/getAppRewards/:id', async (c) => {
  const { ALCHEMY_API_KEY } = await getEnv(c.env)
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, ALCHEMY_API_KEY)
  const res = await client.getEnsText({
    name: normalize(`${id}.${getEnsAppConfigBase(chain === 'mainnet')}`),
    key: ENS_APPCONFIG_REWARDS_KEY
  })
  return c.json(res)
})

ens.get('/:chain/getManigfest/:id', async (c) => {
  const { ALCHEMY_API_KEY } = await getEnv(c.env)
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, ALCHEMY_API_KEY)
  const res = await client.getEnsText({
    name: normalize(`${id}.${getEnsAppConfigBase(chain === 'mainnet')}`),
    key: ENS_APPCONFIG_KEY
  })
  const data = JSON.parse(res ?? '')
  const manifest = {
    short_name: data?.name ?? APP_NAME,
    name: data?.name ?? APP_NAME,
    start_url: '/',
    display: 'standalone',
    background_color: data?.colors?.main ?? COLOR_HEX_MAIN_DEFAULT,
    theme_color: data?.colors?.main ?? COLOR_HEX_MAIN_DEFAULT,
    icons: [
      {
        src: data?.icons?.logo ?? DEFAULT_FAVICON_URL,
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
  return c.json(manifest)
})

ens.get('/:chain/getAppAvatar/:id', async (c) => {
  const { ALCHEMY_API_KEY } = await getEnv(c.env)
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, ALCHEMY_API_KEY)
  const res = await client.getEnsAvatar({
    name: normalize(`${id}.${getEnsAppConfigBase(chain === 'mainnet')}`)
  })
  return c.json(res)
})

ens.get('/:chain/getSubname/:address', async (c) => {
  const { ALCHEMY_API_KEY } = await getEnv(c.env)
  const address = c.req.param('address') as `0x${string}`
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, ALCHEMY_API_KEY)
  const res = await client.getEnsName({
    address
  })
  return c.json(res)
})

ens.get('/:chain/getSubnameAddress/:name', async (c) => {
  const { ALCHEMY_API_KEY } = await getEnv(c.env)
  const name = c.req.param('name')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, ALCHEMY_API_KEY)
  const res = await client.getEnsAddress({
    name: normalize(name)
  })
  return c.json(res)
})

export default ens
