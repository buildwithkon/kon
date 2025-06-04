import { createSigner, logAgentDetails } from '@konxyz/shared/lib/xmtp-node'
import { Client, type XmtpEnv } from '@xmtp/node-sdk'

/* Create the signer using viem and parse the encryption key for the local db */
const walletKey = process.env.WALLET_KEY!

if (!walletKey) {
  throw new Error('WALLET_KEY environment variable is not set')
}

const signer = createSigner(walletKey)

async function main() {
  const client = await Client.create(signer, {
    env: process.env.XMTP_ENV! as XmtpEnv
  })
  void logAgentDetails(client)

  console.log('✓ Syncing conversations...')
  await client.conversations.sync()

  console.log('Waiting for messages...')
  const stream = await client.conversations.streamAllMessages()

  for await (const message of stream) {
    if (
      message?.senderInboxId.toLowerCase() === client.inboxId.toLowerCase() ||
      message?.contentType?.typeId !== 'text'
    ) {
      continue
    }

    const conversation = await client.conversations.getConversationById(message.conversationId)

    if (!conversation) {
      console.log('Unable to find conversation, skipping')
      continue
    }

    const inboxState = await client.preferences.inboxStateFromInboxIds([message.senderInboxId])
    const addressFromInboxId = inboxState[0].identifiers[0].identifier
    console.log(`Sending "gm" response to ${addressFromInboxId}...`)
    await conversation.send('gm')

    console.log('Waiting for messages...')
  }
}

main().catch(console.error)
