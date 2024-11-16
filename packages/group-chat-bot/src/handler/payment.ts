import { type HandlerContext, getUserInfo } from '@xmtp/message-kit'

export async function handler(context: HandlerContext) {
  const {
    message: {
      content: { skill, params }
    }
  } = context
  const txpayUrl = 'https://txpay.vercel.app'

  if (skill === 'pay') {
    const { amount: amountSend, token: tokenSend, username } = params
    console.log('username', username)
    const senderInfo = await getUserInfo(username)
    if (!amountSend || !tokenSend || !senderInfo) {
      context.reply('Missing required parameters. Please provide amount, token, and username.')
      return {
        code: 400,
        message: 'Missing required parameters. Please provide amount, token, and username.'
      }
    }

    const sendUrl = `${txpayUrl}/?&amount=${amountSend}&token=${tokenSend}&receiver=${senderInfo.address}`
    await context.send(`${sendUrl}`)
  }
}
