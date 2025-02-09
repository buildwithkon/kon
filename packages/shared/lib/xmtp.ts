import { Client, type Signer } from '@xmtp/browser-sdk'

const accountAddress = '0x...'
const signer: Signer = {
  getAddress: () => accountAddress,
  signMessage: async (message) => {
    // return value from a signing method here
  }
}

// this value should be generated once per installation and stored securely
const encryptionKey = window.crypto.getRandomValues(new Uint8Array(32))

const client = await Client.create(signer, encryptionKey, options /* optional */)
