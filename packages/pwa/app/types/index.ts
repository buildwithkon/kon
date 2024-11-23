export type Env = {
  ORBIS_CERAMIC_GATEWAY: string
  ORBIS_NODE_GATEWAY: string
  ORBIS_NODE_ENV: string
  COINBASE_CLIENT_API_KEY: string
  ALCHEMY_API_KEY: string
}

export type LoaderData = {
  subdomain: string | null
  appConfig: {
    id: string
    name: string
    description?: string
    url: string
    icons: {
      favicon: string
      logo?: string
    }
    version: string
    font?: 'sans' | 'serif' | 'dot'
    colors?: {
      main: string
      sub?: string
    }
    plugins?: {
      xmtp?: string
      points?: string
    }
  } | null
}

export type UserData = {
  address: `0x${string}` | null
  subname: string | null
}
