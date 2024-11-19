import { OrbisDB } from '@useorbis/db-sdk'
import type { Env } from '~/types'

export const orbis = (ENV: Env) =>
  new OrbisDB({
    ceramic: {
      gateway: ENV.ORBIS_CERAMIC_GATEWAY
    },
    nodes: [
      {
        gateway: ENV.ORBIS_NODE_GATEWAY,
        env: ENV.ORBIS_NODE_ENV
      }
    ]
  })
