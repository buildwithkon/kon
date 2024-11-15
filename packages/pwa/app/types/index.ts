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
    font?: string
    colors?: {
      main: string
      sub?: string
    }
    plugins?: {
      forum?: string
      points?: string
      notifications?: string
    }
  } | null
}
