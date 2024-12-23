export type AppConfig = {
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
}

export type LoaderData = {
  subdomain: string | null
  appConfig: AppConfig | null
}

export type RootLoader = LoaderData & {
  ENV: Env
}

export type UserData = {
  address: `0x${string}` | null
  subname: string | null
}
