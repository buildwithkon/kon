import TopPage from '@konxyz/shared-react/components/modules/TopPage'
import { useRouteLoaderData } from 'react-router'

export default function Top() {
  const ld = useRouteLoaderData('root')

  return <TopPage appConfig={ld?.appConfig} />
}
