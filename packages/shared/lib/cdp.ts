import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk'
import { base, baseSepolia } from 'wagmi/chains'
import { APP_NAME } from './const'

const sdk = new createCoinbaseWalletSDK({
  appName: APP_NAME,
  appChainIds: [base.id, baseSepolia.id]
})

export const getProvider = () => sdk.getProvider({ options: 'smartWalletOnly' })
