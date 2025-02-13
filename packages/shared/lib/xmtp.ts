import {Client, type Signer } from '@xmtp/browser-sdk'
import secureRandom from 'secure-random'

const generateEncKey = secureRandom(32, {type: 'Uint8Array'})

export const getSigner: Signer = (address: `0x${string}`) => ({
  getAddress: () => address,
  signMessage: async (message) => {},
  getChainId: () => BigInt(84532) // Base Sepolia
})


export const getClient = async (address: `0x${string}`, encKey: Uint8Array | undefined) => await Client.create(
  signer: getSigner(address),
  encryptionKey: encKey ?? generateEncKey()),
)
