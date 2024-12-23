import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { normalize } from 'viem/ens'
import { getClient } from './lib/client'

const ENS_APPCONFIG_NAME = 'kon.eth'
const ENS_APPCONFIG_BASE_KEY = 'app.kon'

const ens = new Hono<{ Bindings: Env }>()

ens.get(
  '*',
  cache({
    cacheName: 'kon-api',
    cacheControl: 'max-age=600'
  })
)

ens.get('/:chain/getAppConfig/:id', async (c) => {
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, c.env.ALCHEMY_API_KEY)
  const res = await client.getEnsText({
    name: normalize(`${id}.${ENS_APPCONFIG_NAME}`),
    key: ENS_APPCONFIG_BASE_KEY
  })
  return c.json(res)
})

ens.get('/:chain/getAppAvatar/:id', async (c) => {
  const id = c.req.param('id')
  const chain = c.req.param('chain') as 'mainnet' | 'sepolia'
  const client = getClient(chain, c.env.ALCHEMY_API_KEY)
  const res = await client.getEnsAvatar({
    name: normalize(`${id}.${ENS_APPCONFIG_NAME}`)
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
