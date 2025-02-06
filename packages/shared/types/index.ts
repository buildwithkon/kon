import '@konxyz/pwa/worker-configuration.d.ts'

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
  subdomain: string | undefined
  appConfig: AppConfig | undefined
}

export type RootLoader = LoaderData & {
  ENV: Env
  cookie?: string
}

export type UserData = {
  address: `0x${string}` | undefined
  subname: string | undefined
}
