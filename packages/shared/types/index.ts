import '@konxyz/pwa/worker-configuration.d.ts'

export type AppConfig = {
  id: string
  name: string
  description?: string
  url: string
  version: string
  template: {
    type: 'shop' | 'event' | 'community'
    tabs?: []
  }
  font?: 'sans' | 'serif' | 'dot' | 'mono'
  icons: {
    favicon: string
    logo?: string
  }
  colors?: {
    main: string
    sub?: string
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
