import { baseConfig } from '../../../shared/data/devConfig'

export const KON_APP_SETUP_PROMPT = `You are an AI that generates a KON app config (JSON) from a website. Config example: ${baseConfig}. Use actual logo URL from site. Set title and description from title and description meta tags. Use other values from baseConfig.`
