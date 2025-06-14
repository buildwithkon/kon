import { TransactionReferenceCodec } from '@xmtp/content-type-transaction-reference'
import { ContentTypeWalletSendCalls, WalletSendCallsCodec } from '@xmtp/content-type-wallet-send-calls'
import { Client, type Conversation, type DecodedMessage, type XmtpEnv } from '@xmtp/node-sdk'
import { initializeAgent, processMessage } from './lib/agent'
import { createCoinCalls, sendCoinCalls } from './lib/coin'
import { checkENS, getAppInfo, getCoinInfo, sendSetSubnodeRecordCalls, sendSetTextCalls } from './lib/ens'
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
    const senderInboxId = message.senderInboxId as `0x${string}`
    const inboxState = await client.preferences.inboxStateFromInboxIds([message.senderInboxId])
    const senderAddress = inboxState[0].identifiers[0].identifier
    const botAddress = client.inboxId.toLowerCase() as `0x${string}`

    // Ignore messages from the bot itself
    if (senderInboxId.toLowerCase() === botAddress) {
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

    const messageContent = message.content
    if (typeof messageContent !== 'string') {
      console.log('----005---', console.dir(messageContent, { depth: null }))
      return
    }
    const command = messageContent.toLowerCase().trim()

    if (command.startsWith('/app-info')) {
      const [, appName] = messageContent.trim().split(/\s+/, 2)
      const appInfo = await getAppInfo(appName)
      if (appInfo && typeof appInfo === 'object') {
        await conversation.send(
          `⏳ Loading '${appInfo.target}' ...\n\n----- ℹ️ General -----\nID : ${appInfo.id}\nName : ${appInfo.name}\nDescription : ${appInfo.description}\n\n----- 🔧 Config -----\nColors : ${appInfo.colors}\nTemplate : ${appInfo.template}`
        )
      } else {
        await conversation.send('🤷‍♂️ Not found or no information available.')
      }
    } else if (command.startsWith('/app-setup')) {
      const [, appName, referenceUrl] = messageContent.trim().split(/\s+/)
      // Check args
      if (!appName || !referenceUrl || !isValidName(appName) || !isValidURL(referenceUrl)) {
        await conversation.send(
          '⚠️ Usage: /app-setup <appName> <referenceUrl>\ne.g. /app-setup demoapp https://ethtokyo.org'
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
      const { agent, config } = await initializeAgent(senderAddress)
      const response = await processMessage(agent, config, referenceUrl)
      // Write app config
      await conversation.send(
        sendSetTextCalls(senderAddress, appName, 'kon.app', JSON.stringify(JSON.parse(response))),
        ContentTypeWalletSendCalls
      )
      await conversation.send(`You can access your app 👉 https://${appName}.kon.wtf after tx confirmation.`)
    } else if (command.startsWith('/coin-info')) {
      const [, appName] = messageContent.trim().split(/\s+/, 2)
      if (!appName) {
        await conversation.send('⚠️ Usage: /coin-info <appName>\ne.g. /coin-info demoapp')
        return
      }

      const coinInfo = await getCoinInfo(appName)
      if (!coinInfo) {
        await conversation.send('⚠️ Coin not found for this app.')
        return
      }

      await conversation.send(
        `----- 🪙 ${appName}'s coin -----\n` +
          `Address: ${coinInfo.address}\n` +
          `Name: ${coinInfo.name}\n` +
          `Symbol: ${coinInfo.symbol}\n` +
          `Total supply: ${coinInfo.totalSupply}`
      )
    } else if (command.startsWith('/coin-setup')) {
      const [, appName, name, symbol] = messageContent.trim().split(/\s+/)
      // Check args
      if (!appName || !name || !symbol || !isValidName(appName)) {
        await conversation.send(
          '⚠️ Usage: /coin-setup <appName> <coinName> <coinSymbol>\ne.g. /coin-setup demoapp MYCOIN MYCOIN'
        )
        return
      }

      // Create app's coin
      await conversation.send(
        createCoinCalls(senderAddress, appName, name, symbol),
        ContentTypeWalletSendCalls
      )
      await conversation.send("🚀 Creating your app's coin... Please wait for tx confirmation.")
    } else if (command.startsWith('/coin-set')) {
      const [, appName, coinAddress] = messageContent.trim().split(/\s+/)

      // Get the deployed coin address
      if (!coinAddress) {
        await conversation.send('⚠️ Failed to get coin address. Please try again.')
        return
      }

      // Set ENS text record
      await conversation.send(
        sendSetTextCalls(senderAddress, appName, 'kon.coin', `8453:${coinAddress}`),
        ContentTypeWalletSendCalls
      )
      await conversation.send('💫 Coin created!')
    } else if (command.startsWith('/coin-send')) {
      const [, appName, toAddress, amount] = messageContent.trim().split(/\s+/)
      const coinInfo = await getCoinInfo(appName)
      if (coinInfo?.address) {
        await conversation.send(
          sendCoinCalls(senderAddress, coinInfo.address, { address: toAddress, amount: BigInt(amount) }),
          ContentTypeWalletSendCalls
        )
      }
    } else if (command === '/gm') {
      await conversation.send(`👋 gm! "${shortAddr(senderAddress)}" from "${shortAddr(botAddress)}"`)
    } else if (command.startsWith('/agent-test')) {
      const [, url] = messageContent.trim().split(/\s+/, 2)
      const { agent, config } = await initializeAgent(senderAddress)
      const response = await processMessage(agent, config, url)
      console.log('---response---', response)
    } else {
      await conversation.send(
        '----- 👨‍💻 Available commands -----\n' +
          '▶️ /gm\n' +
          '▶️ /app-info <appName>\n' +
          '・Get app information (e.g. /appinfo demoapp)\n' +
          '▶️ /coin-info <appName>\n' +
          "・Get app's coin information (e.g. /coin demoapp)\n" +
          '▶️ /app-setup <appName> <referenceUrl>\n' +
          '・Setup app (e.g. /app-setup demoapp https://ethtokyo.org)\n' +
          '  ・<appName> - ENS subnames for app (e.g. <demoapp>.kon.wtf) \n' +
          '  ・<referenceUrl> - official site or similar linkfor app info\n' +
          '▶️ /coin-setup <appName> <coinName> <coinSymbol>\n' +
          "・Setup app's coin (e.g. /coin-setup demoapp MYCOIN MYCOIN)\n" +
          '  ・<appName> - App name \n' +
          '  ・<coinName> - Name of coin \n' +
          '  ・<coinSymbol> - SYMBOL of coin\n' +
          '▶️ /coin-send <appName> <toAddress> <amount> \n' +
          "・Send app's coin (e.g. /coin-send demoapp 0x000 1)\n" +
          '  ・<appName> - App name \n' +
          '  ・<toAddress> - Address to send \n' +
          '  ・<amount> - Amount'
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
