import TopBar from '@konxyz/shared-react/components/TopBar'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import type { AppConfig } from '@konxyz/shared/types'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/admin/config'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `App Config | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function AdminConfig() {
  const ld = useRouteLoaderData('root')

  return (
    <div className="wrapper px-6 pt-16 pb-6">
      <TopBar title="App Config" backBtn rightBtn="admin" isAdmin />
      <AppConfigForm appConfig={ld?.appConfig} />
    </div>
  )
}

const AppConfigForm = ({ appConfig }: { appConfig: AppConfig }) => {
  return (
    <div className="flex flex-col space-y-4 py-6">
      <div>
        <p>ID</p>
        <input type="text" value={appConfig?.id} readOnly />
      </div>
      <div>
        <p>Name</p>
        <input type="text" value={appConfig?.name} readOnly />
      </div>
      <div>
        <p>Description</p>
        <textarea value={appConfig?.description} readOnly />
      </div>
      <div>
        <p>Font</p>
        <select value={appConfig?.font}>
          <option value="sans" selected>
            sans
          </option>
          <option value="serif">serif</option>
          <option value="mono">mono</option>
          <option value="dot">dot</option>
        </select>
      </div>
      <div>
        <p>URL</p>
        <input type="text" value={appConfig?.url} readOnly />
      </div>
      <div>
        <p>🖼️ Icons</p>
        <hr />
        <p>favicon</p>
        <input type="text" value={appConfig?.icons?.favicon} readOnly />
      </div>
      <div>
        <p>logo</p>
        <input type="text" value={appConfig?.icons?.logo} readOnly />
      </div>
      <div>
        <p>🎨 Colors</p>
        <hr />
        <p>main</p>
        <input type="text" value={appConfig?.colors?.main} readOnly />
      </div>
      <p>accent</p>
      <input type="text" value={appConfig?.colors?.accent} readOnly />
      <div>
        <p>🗂️ Template</p>
        <hr />
        <p>Type</p>
        <select value={appConfig?.template?.type}>
          <option value="event" selected>
            Event
          </option>
          <option value="shop">Shop</option>
          <option value="community">Community</option>
        </select>
        <p className="my-4">Tabs</p>
        {appConfig?.template?.tabs?.map((item, i) => (
          <div key={item.id} className="flex flex-col space-y-2">
            <input type="text" value={item.id} readOnly />
            <textarea value={item.content} readOnly className="text-sm" />
            <hr />
          </div>
        ))}
      </div>
      <button className="btn-main w-full" type="button">
        Update
      </button>
    </div>
  )
}
