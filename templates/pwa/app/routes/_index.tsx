import TopPage from '@konxyz/shared-react/components/modules/TopPage'
import { useEnsUser } from '@konxyz/shared-react/hooks/useEnsUser'
import { useRouteLoaderData } from 'react-router'

export default function Top() {
  const ld = useRouteLoaderData('root')
  const res = useEnsUser('0x79644701D0e1Ba5b196dE910D34C2Eec2bF2872a')
  console.log('RES:', res)

  return <TopPage appConfig={ld?.appConfig} />
}
