import Loading from '~/components/Loading'
import { useXMTP } from '~/hooks/useXMTP'

export default function Forum() {
  const { connect, isLoading } = useXMTP()

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex w-full flex-col items-center justify-center px-6">
          <button type="button" onClick={() => connect()} className="btn-main mt-48 w-full">
            Join group chat
          </button>
        </div>
      )}
    </>
  )
}
