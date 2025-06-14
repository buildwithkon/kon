import { getRandomValues } from 'node:crypto'
import { type Client, IdentifierKind, type Signer } from '@xmtp/node-sdk'
import { fromString as u8aFromString, toString as u8aToString } from 'uint8arrays'
import { http, createWalletClient, toBytes } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

interface User {
  key: `0x${string}`
  account: ReturnType<typeof privateKeyToAccount>
  wallet: ReturnType<typeof createWalletClient>
}

export const test = () => {
  console.log('xmtp-node.ts is working')
}

export const createUser = (key: string): User => {
  const account = privateKeyToAccount(key as `0x${string}`)
  return {
    key: key as `0x${string}`,
    account,
    wallet: createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(
        `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.CDP_CLIENT_API_KEY!}`
      )
    })
  }
}

export const createSigner = (key: string): Signer => {
  const sanitizedKey = key.startsWith('0x') ? key : `0x${key}`
  const user = createUser(sanitizedKey)
  return {
    type: 'EOA',
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: user.account.address.toLowerCase()
    }),
    signMessage: async (message: string) => {
      const signature = await user.wallet.signMessage({
        message,
        account: user.account
      })
      return toBytes(signature)
    }
  }
}

/**
 * Generate a random encryption key
 * @returns The encryption key
 */
export const generateEncryptionKeyHex = () => {
  /* Generate a random encryption key */
  const uint8Array = getRandomValues(new Uint8Array(32))
  /* Convert the encryption key to a hex string */
  return u8aToString(uint8Array, 'hex')
}

/**
 * Get the encryption key from a hex string
 * @param hex - The hex string
 * @returns The encryption key
 */
export const getEncryptionKeyFromHex = (hex: string) => {
  /* Convert the hex string to an encryption key */
  return u8aFromString(hex, 'hex')
}

export const logAgentDetails = async (clients: Client | Client[]): Promise<void> => {
  const clientArray = Array.isArray(clients) ? clients : [clients]
  const clientsByAddress = clientArray.reduce<Record<string, Client[]>>((acc, client) => {
    const address = client.accountIdentifier?.identifier as string
    acc[address] = acc[address] ?? []
    acc[address].push(client)
    return acc
  }, {})

  for (const [address, clientGroup] of Object.entries(clientsByAddress)) {
    const firstClient = clientGroup[0]
    const inboxId = firstClient.inboxId
    const environments = clientGroup.map((c: Client) => c.options?.env ?? 'dev').join(', ')
    console.log(`\x1b[38;2;252;76;52m
        ██╗  ██╗███╗   ███╗████████╗██████╗
        ╚██╗██╔╝████╗ ████║╚══██╔══╝██╔══██╗
         ╚███╔╝ ██╔████╔██║   ██║   ██████╔╝
         ██╔██╗ ██║╚██╔╝██║   ██║   ██╔═══╝
        ██╔╝ ██╗██║ ╚═╝ ██║   ██║   ██║
        ╚═╝  ╚═╝╚═╝     ╚═╝   ╚═╝   ╚═╝
      \x1b[0m`)

    const urls = [`http://xmtp.chat/dm/${address}`]

    const conversations = await firstClient.conversations.list()
    const installations = await firstClient.preferences.inboxState()

    console.log(`
    ✓ XMTP Client:
    • Address: ${address}
    • Installations: ${installations.installations.length}
    • Conversations: ${conversations.length}
    • InboxId: ${inboxId}
    • Networks: ${environments}
    ${urls.map((url) => `• URL: ${url}`).join('\n')}`)
  }
}
