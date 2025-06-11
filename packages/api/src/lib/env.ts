export interface Env {
  ALCHEMY_API_KEY: string
}

export const getEnv = async (env: Env): Promise<Env> => {
  const ALCHEMY_API_KEY =
    process.env.NODE_ENV === 'development' ? env.ALCHEMY_API_KEY : await env.ALCHEMY_API_KEY.get()

  return {
    ALCHEMY_API_KEY
  }
}
