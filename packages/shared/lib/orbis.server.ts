import type { Env } from '@konxyz/shared/types'
import { OrbisDB } from '@useorbis/db-sdk'

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
