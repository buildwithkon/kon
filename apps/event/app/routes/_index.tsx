import TopPage from '@konxyz/shared-react/components/pages/Top'
import { useRouteLoaderData } from 'react-router'

export default function Top() {
  const ld = useRouteLoaderData('root')

  return <TopPage ld={ld} />
}
