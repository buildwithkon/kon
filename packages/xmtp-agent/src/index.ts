import { TransactionReferenceCodec } from '@xmtp/content-type-transaction-reference'
import { WalletSendCallsCodec } from '@xmtp/content-type-wallet-send-calls'
import { Client, type DecodedMessage, type XmtpEnv } from '@xmtp/node-sdk'
import { getAppInfo } from './lib/ens'
import { USDCHandler } from './lib/usdc'
import { createSigner, logAgentDetails } from './lib/xmtp-node'

/* Create the signer using viem and parse the encryption key for the local db */
const walletKey = process.env.WALLET_KEY!

if (!walletKey) {
  throw new Error('WALLET_KEY environment variable is not set')
}

const signer = createSigner(walletKey)

export async function waitForMessage(
  stream,
  opts?: {
    timeout?: number
    filter?: (msg: DecodedMessage) => boolean
  }
): Promise<DecodedMessage | null> {
  const timeout = opts?.timeout ?? 60000

  return new Promise((resolve) => {
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    }, timeout)
    ;(async () => {
      for await (const msg of stream) {
        if (opts?.filter && !opts.filter(msg)) continue
        if (!resolved) {
          resolved = true
          clearTimeout(timer)
          resolve(msg)
          break
        }
      }
    })()
  })
}

async function main() {
  const client = await Client.create(signer, {
    env: process.env.XMTP_ENV! as XmtpEnv,
    codecs: [new WalletSendCallsCodec(), new TransactionReferenceCodec()]
  })
  const identifier = await signer.getIdentifier()
  const agentAddress = identifier.identifier

  void logAgentDetails(client as Client)

  console.log('✓ Syncing conversations...')
  await client.conversations.sync()

  console.log('Waiting for messages...')
  const stream = await client.conversations.streamAllMessages()

  for await (const message of stream) {
    const usdcHandler = new USDCHandler('base-sepolia')

    /* Ignore messages from the same agent or non-text messages */
    if (
      message?.senderInboxId.toLowerCase() === client.inboxId.toLowerCase() ||
      message?.contentType?.typeId !== 'text'
    ) {
      continue
    }
    console.log(`Received message: ${message.content as string} by ${message.senderInboxId}`)

    /* Get the conversation by id */
    const conversation = await client.conversations.getConversationById(message.conversationId)

    if (!conversation) {
      console.log('Unable to find conversation, skipping')
      continue
    }

    const inboxState = await client.preferences.inboxStateFromInboxIds([message.senderInboxId])
    const memberAddress = inboxState[0].identifiers[0].identifier

    if (!memberAddress) {
      console.log('Unable to find member address, skipping')
      continue
    }

    const messageContent = message.content as string
    const command = messageContent.toLowerCase().trim()
    try {
      if (command === '/help') {
        await conversation.send(
          'Available commands:\n' +
            '▶️ /setup <appName> <appType> <referenceUrl>\n' +
            '- Setup app (e.g. /setup demoapp event https://ethtokyo.org)\n' +
            '  - <appName> ENS subnames for app (e.g. <demoapp>.kon.eth) \n' +
            '  - <appType> "event" or "shop" \n' +
            '▶️ /info <appName>\n' +
            '- Get app information (e.g. /appinfo demoapp)'
        )
      } else if (command === '/setup') {
        await conversation.send('🚀 Setting up A KON App...')
        const reply = await waitForMessage(stream)
        console.log('Reply received:', reply)
        // await conversation.send(
        //   sendSetSubnodeRecordCalls(memberAddress, 'demoapp1'),
        //   ContentTypeWalletSendCalls
        // )
        // await conversation.send(
        //   sendSetTextCalls(memberAddress, 'demoapp', JSON.stringify(devConfig)),
        //   ContentTypeWalletSendCalls
        // )
        await conversation.send('You can access your app 👉 https://demoapp.kon.xyz after tx confirmation.')
      } else if (command.startsWith('/info')) {
        const [, appName] = messageContent.trim().split(/\s+/, 2)
        const appInfo = await getAppInfo(appName)
        if (appInfo && typeof appInfo === 'object') {
          await conversation.send(
            `⏳ Loading '${appInfo.target}' ...\n\n----- ℹ️ General ---------------------\nID : ${appInfo.id}\nName : ${appInfo.name}\nDescription : ${appInfo.description}\n\n----- 🔧 Config ---------------------\nColors : ${appInfo.colors}\nTemplate : ${appInfo.template}`
          )
        } else {
          await conversation.send('🤷‍♂️ Not found or no information available.')
        }
      } else if (command.startsWith('/balance')) {
        const [, addr] = messageContent.trim().split(/\s+/, 2)
        const result = await usdcHandler.getUSDCBalance(addr)
        await conversation.send(`${addr}'s USDC balance is: ${result} USDC`)
      } else if (command === '/gm') {
        await conversation.send('👋 gm!')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('⚠️ Error processing command:', errorMessage)
      await conversation.send('⚠️ Sorry, I encountered an error processing your command.')
    }
  }
}

main().catch(console.error)
