import { TransactionReferenceCodec } from '@xmtp/content-type-transaction-reference'
import { ContentTypeWalletSendCalls, WalletSendCallsCodec } from '@xmtp/content-type-wallet-send-calls'
import { Client, type Conversation, type DecodedMessage, type XmtpEnv } from '@xmtp/node-sdk'
// import { initializeAgent, processMessage } from './lib/agent'
import { checkENS, getAppInfo, sendSetSubnodeRecordCalls, sendSetTextCalls } from './lib/ens'
import { isValidName, isValidURL, shortAddr } from './lib/utils'
import { createSigner, logAgentDetails } from './lib/xmtp-node'

/* Create the signer using viem and parse the encryption key for the local db */
const walletKey = process.env.WALLET_KEY!

if (!walletKey) {
  throw new Error('WALLET_KEY environment variable is not set')
}

/**
 * Initialize the XMTP client.
 *
 * @returns An initialized XMTP Client instance
 */
async function initializeXmtpClient() {
  const signer = createSigner(process.env.WALLET_KEY!)
  // const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

  // const identifier = await signer.getIdentifier()
  // const address = identifier.identifier

  const client = await Client.create(signer, {
    env: process.env.XMTP_ENV as XmtpEnv,
    codecs: [new WalletSendCallsCodec(), new TransactionReferenceCodec()]
  })

  void logAgentDetails(client)

  /* Sync the conversations from the network to update the local db */
  console.log('✓ Syncing conversations...')
  await client.conversations.sync()

  return client
}

/**
 * Handle incoming XMTP messages.
 *
 * @param message - The decoded XMTP message
 * @param client - The XMTP client instance
 */
const handleMessage = async (message: DecodedMessage, client: Client) => {
  let conversation: Conversation | null = null
  try {
    const senderAddress = message.senderInboxId as `0x${string}`
    const botAddress = client.inboxId.toLowerCase() as `0x${string}`

    // Ignore messages from the bot itself
    if (senderAddress.toLowerCase() === botAddress) {
      return
    }

    console.log(`Received message from ${senderAddress}: ${message.content as string}`)

    // Get the conversation
    conversation = (await client.conversations.getConversationById(
      message.conversationId
    )) as Conversation | null
    if (!conversation) {
      throw new Error(`Could not find conversation for ID: ${message.conversationId}`)
    }

    const messageContent = message.content as string
    const command = messageContent.toLowerCase().trim()

    if (command.startsWith('/info')) {
      const [, appName] = messageContent.trim().split(/\s+/, 2)
      const appInfo = await getAppInfo(appName)
      console.log('App Info:', appInfo)
      if (appInfo && typeof appInfo === 'object') {
        await conversation.send(
          `⏳ Loading '${appInfo.target}' ...\n\n----- ℹ️ General ---------------------\nID : ${appInfo.id}\nName : ${appInfo.name}\nDescription : ${appInfo.description}\n\n----- 🔧 Config ---------------------\nColors : ${appInfo.colors}\nTemplate : ${appInfo.template}`
        )
      } else {
        await conversation.send('🤷‍♂️ Not found or no information available.')
      }
    } else if (command.startsWith('/setup')) {
      const [, appName, referenceUrl] = messageContent.trim().split(/\s+/)
      // Check args
      if (!appName || !referenceUrl || !isValidName(appName) || !isValidURL(referenceUrl)) {
        await conversation.send(
          '⚠️ Usage: /setup <appName> <referenceUrl>\ne.g. /setup demoapp https://ethtokyo.org'
        )
        return
      }
      // check ENS Subnames
      if (await checkENS(appName)) {
        await conversation.send('⚠️ Your appName (ENS Subnames) already taken.')
        return
      }
      // Start setup
      await conversation.send('🚀 Setting up your app ...')
      // Claim ENS Subnames
      await conversation.send(sendSetSubnodeRecordCalls(senderAddress, appName), ContentTypeWalletSendCalls)
      // Create app config with AI
      // const { agent, config } = await initializeAgent(senderAddress)
      // const response = await processMessage(agent, config, referenceUrl)
      // Write app config
      await conversation.send(
        sendSetTextCalls(senderAddress, appName, JSON.stringify({})),
        ContentTypeWalletSendCalls
      )
      await conversation.send(`You can access your app 👉 https://${appName}.kon.xyz after tx confirmation.`)
    } else if (command === '/gm') {
      await conversation.send(`👋 gm! "${shortAddr(senderAddress)}" from "${shortAddr(botAddress)}"`)
    } else {
      await conversation.send(
        '----- 👨‍💻 Available commands -----\n' +
          '▶️ /setup <appName> <referenceUrl>\n' +
          '・Setup app (e.g. /setup demoapp https://ethtokyo.org)\n' +
          '  ・<appName> - ENS subnames for app (e.g. <demoapp>.kon.eth) \n' +
          '  ・<referenceUrl> - official site or similar linkfor app info\n' +
          '▶️ /info <appName>\n' +
          '・Get app information (e.g. /appinfo demoapp)\n' +
          '▶️ /gm'
      )
    }
  } catch (error) {
    console.error('⚠️ Error handling message:', error)
    if (conversation) {
      await conversation.send(
        '⚠️ I encountered an error while processing your request. Please try again later.'
      )
    }
  }
}

/**
 * Start listening for XMTP messages.
 *
 * @param client - The XMTP client instance
 */
const startMessageListener = async (client: Client) => {
  console.log('Starting message listener...')
  const stream = await client.conversations.streamAllMessages()
  for await (const message of stream) {
    if (message) {
      await handleMessage(message, client)
    }
  }
}

/**
 * Main function to start the chatbot.
 */
const main = async () => {
  console.log('Initializing Agent on XMTP...')

  const xmtpClient = await initializeXmtpClient()
  await startMessageListener(xmtpClient)
}

main().catch(console.error)
