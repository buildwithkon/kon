import type { OrbisConnectResult, OrbisDB } from '@useorbis/db-sdk'
import { OrbisKeyDidAuth } from '@useorbis/db-sdk/auth'

export const orbisDidAuth = async (orbis: OrbisDB) => {
  // get from EIP712
  const seed = '0xccccccc'
  const auth = await OrbisKeyDidAuth.fromSeed(seed)
  const authResult: OrbisConnectResult = await orbis.connectUser({ auth })

  // Log the result
  console.log({ authResult })
}

export const isOrbisConnected = async (orbis: OrbisDB): Promise<boolean> => await orbis.isUserConnected()

export const getOrbisUser = async (orbis: OrbisDB): Promise<OrbisConnectResult | false> =>
  await orbis.getConnectedUser()
