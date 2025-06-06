import type { RootLoader } from '@konxyz/shared/types'
import { base, baseSepolia } from 'viem/chains'
import { APP_FALLBACK_NAME, DEFAULT_LOGO_URL } from './const'

export const getCdpConfig = (ld: RootLoader) => ({
  apiKey: ld?.ENV?.CDP_CLIENT_API_KEY,
  chain: baseSepolia ?? base,
  config: {
    appearance: {
      name: ld?.appConfig?.name ?? APP_FALLBACK_NAME,
      logo: ld?.appConfig?.icons?.logo ?? DEFAULT_LOGO_URL,
      mode: 'auto',
      theme: 'hacker'
    }
  }
})
