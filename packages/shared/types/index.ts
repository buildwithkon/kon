import '@konxyz/event/worker-configuration.d.ts'

export type AppConfig = {
  id: string
  name: string
  site?: string
  description?: string
  version: string
  template: {
    type: 'shop' | 'event' | 'community'
    tabs?: []
  }
  font?: 'sans' | 'serif' | 'dot' | 'mono'
  icons: {
    logo: string
    logoBgTransparent?: string
  }
  colors?: {
    main: string
    accent?: string
    bg?: string
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
