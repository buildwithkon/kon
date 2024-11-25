import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { normalize } from 'viem/ens'
import { client, clientSepolia } from './client'

export const ENS_APPCONFIG_NAME = 'kon.eth'
export const ENS_APPCONFIG_KEY = 'app.kon'

const app = new Hono()

app.get(
  '*',
  cache({
    cacheName: 'kon-api-ens',
    cacheControl: 'max-age=600'
  })
)

app.get('/api/ens/:chain/getAppConfig/:id', async (c) => {
  const id = c.req.param('id')
  const _client = c.req.param('chain') === 'sepolia' ? clientSepolia : client
  const res = await _client.getEnsText({
    name: normalize(`${id}.${ENS_APPCONFIG_NAME}`),
    key: ENS_APPCONFIG_KEY
  })
  return c.json(res)
})

app.get('/api/ens/:chain/getAppAvatar/:id', async (c) => {
  const id = c.req.param('id')
  const _client = c.req.param('chain') === 'sepolia' ? clientSepolia : client
  const res = await _client.getEnsAvatar({
    name: normalize(`${id}.${ENS_APPCONFIG_NAME}`)
  })
  return c.json(res)
})

app.get('/api/ens/:chain/getSubname/:address', async (c) => {
  const address = c.req.param('address') as `0x${string}`
  const _client = c.req.param('chain') === 'sepolia' ? clientSepolia : client
  const res = await _client.getEnsName({
    address
  })
  return c.json(res)
})

app.get('/api/ens/:chain/getSubnameAddress/:name', async (c) => {
  const name = c.req.param('name')
  const _client = c.req.param('chain') === 'sepolia' ? clientSepolia : client
  const res = await _client.getEnsAddress({
    name: normalize(name)
  })
  return c.json(res)
})

export default app
