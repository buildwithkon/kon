import { AgentKit, CdpWalletProvider } from '@coinbase/agentkit'
import { getLangChainTools } from '@coinbase/agentkit-langchain'
import { HumanMessage } from '@langchain/core/messages'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import type { Client, Conversation, DecodedMessage } from '@xmtp/node-sdk'
import { KON_APP_SETUP_PROMPT } from './prompt'

interface AgentConfig {
  configurable: {
    thread_id: string
  }
}

type Agent = ReturnType<typeof createReactAgent>

/**
 * Initialize the agent with CDP Agentkit.
 *
 * @param userId - The unique identifier for the user
 * @returns The initialized agent and its configuration
 */
export const initializeAgent = async (userId: string): Promise<{ agent: Agent; config: AgentConfig }> => {
  try {
    const llm = new ChatOpenAI({
      model: 'gpt-4.1-mini'
    })

    // const storedWalletData = getWalletData(userId)
    // console.log(`Wallet data for ${userId}: ${storedWalletData ? 'Found' : 'Not found'}`)

    const config = {
      apiKeyId: process.env.CDP_API_KEY_ID!,
      apiKeySecret: process.env.CDP_API_KEY_SECRET!.replace(/\\n/g, '\n'),
      // cdpWalletData: storedWalletData || undefined,
      networkId: process.env.NETWORK_ID || 'base-sepolia'
    }

    const walletProvider = await CdpWalletProvider.configureWithWallet(config)

    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        // walletActionProvider(),
        // erc20ActionProvider(),
        // cdpApiActionProvider({
        //   apiKeyName: CDP_API_KEY_NAME,
        //   apiKeyPrivateKey: CDP_API_KEY_PRIVATE_KEY.replace(/\\n/g, "\n"),
        // }),
        // cdpWalletActionProvider({
        //   apiKeyName: CDP_API_KEY_NAME,
        //   apiKeyPrivateKey: CDP_API_KEY_PRIVATE_KEY.replace(/\\n/g, "\n"),
        // }),
      ]
    })

    const tools = await getLangChainTools(agentkit)

    // memoryStore[userId] = new MemorySaver()

    const agentConfig: AgentConfig = {
      configurable: { thread_id: userId }
    }

    const agent = createReactAgent({
      llm,
      tools,
      // checkpointSaver: memoryStore[userId],
      messageModifier: KON_APP_SETUP_PROMPT
    })

    // agentStore[userId] = agent

    // const exportedWallet = await walletProvider.exportWallet()
    // const walletDataJson = JSON.stringify(exportedWallet)
    // saveWalletData(userId, walletDataJson)

    return { agent, config: agentConfig }
  } catch (error) {
    console.error('Failed to initialize agent:', error)
    throw error
  }
}

/**
 * Process a message with the agent.
 *
 * @param agent - The agent instance to process the message
 * @param config - The agent configuration
 * @param message - The message to process
 * @returns The processed response as a string
 */
export const processMessage = async (agent: Agent, config: AgentConfig, message: string): Promise<string> => {
  let response = ''

  console.log('----Processing message:', agent, config, message)

  try {
    const stream = await agent.stream({ messages: [new HumanMessage(message)] }, config)

    for await (const chunk of stream) {
      if (chunk && typeof chunk === 'object' && 'agent' in chunk) {
        const agentChunk = chunk as {
          agent: { messages: Array<{ content: unknown }> }
        }
        response += `${String(agentChunk.agent.messages[0].content)}\n`
      }
    }

    return response.trim()
  } catch (error) {
    console.error('Error processing message:', error)
    return '⚠️ Sorry, I encountered an error while processing your request. Please try again later.'
  }
}

/**
 * Handle incoming XMTP messages.
 *
 * @param message - The decoded XMTP message
 * @param client - The XMTP client instance
 */
export const handleMessage = async (message: DecodedMessage, client: Client) => {
  let conversation: Conversation | null = null
  try {
    const senderAddress = message.senderInboxId
    const botAddress = client.inboxId.toLowerCase()

    // Ignore messages from the bot itself
    if (senderAddress.toLowerCase() === botAddress) {
      return
    }

    console.log(`Received message from ${senderAddress}: ${message.content as string}`)

    const { agent, config } = await initializeAgent(senderAddress)
    const response = await processMessage(agent, config, String(message.content))

    // Get the conversation and send response
    conversation = (await client.conversations.getConversationById(
      message.conversationId
    )) as Conversation | null
    if (!conversation) {
      throw new Error(`Could not find conversation for ID: ${message.conversationId}`)
    }
    await conversation.send(response)
    console.debug(`Sent response to ${senderAddress}: ${response}`)
  } catch (error) {
    console.error('Error handling message:', error)
    if (conversation) {
      await conversation.send('I encountered an error while processing your request. Please try again later.')
    }
  }
}
