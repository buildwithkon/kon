import { useConnect } from 'wagmi'

export const useWagmi = () => {
  const { connectAsync, connectors } = useConnect()
  const loginAsync = async () => connectAsync({ connector: connectors[0] })
  return { loginAsync }
}
