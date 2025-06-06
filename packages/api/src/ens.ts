// import { FaviconPng } from '@konxyz/shared/assets'
import {
  APP_NAME,
  COLOR_HEX_MAIN_DEFAULT,
  DEFAULT_FAVICON_URL,
  ENS_APPCONFIG_BASE,
  ENS_APPCONFIG_KEY
} from '@konxyz/shared/lib/const'
import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { cors } from 'hono/cors'
import { normalize } from 'viem/ens'
import { getClient } from './lib/client'

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
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, c.env.ALCHEMY_API_KEY)
  const res = await client.getEnsText({
    name: normalize(`${id}.${ENS_APPCONFIG_BASE}`),
    key: ENS_APPCONFIG_KEY
  })
  return c.json(res)
})

ens.get('/:chain/getManigfest/:id', async (c) => {
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, c.env.ALCHEMY_API_KEY)
  const res = await client.getEnsText({
    name: normalize(`${id}.${ENS_APPCONFIG_BASE}`),
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
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, c.env.ALCHEMY_API_KEY)
  const res = await client.getEnsAvatar({
    name: normalize(`${id}.${ENS_APPCONFIG_BASE}`)
  })
  return c.json(res)
})

ens.get('/:chain/getSubname/:address', async (c) => {
  const address = c.req.param('address') as `0x${string}`
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, c.env.ALCHEMY_API_KEY)
  const res = await client.getEnsName({
    address
  })
  return c.json(res)
})

ens.get('/:chain/getSubnameAddress/:name', async (c) => {
  const name = c.req.param('name')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, c.env.ALCHEMY_API_KEY)
  const res = await client.getEnsAddress({
    name: normalize(name)
  })
  return c.json(res)
})

export default ens
