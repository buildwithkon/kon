import Loading from '~/components/Loading'
import Conversation from '~/components/modules/Conversation'
import { useXMTP } from '~/hooks/useXMTP'

export default function Forum({ conversationId }: { conversationId: string }) {
  const { connect, isLoading, client } = useXMTP()

  console.log('client----', client)

  return (
    <>
      {client ? (
        isLoading ? (
          <Loading />
        ) : (
          <Conversation conversationId={conversationId} />
        )
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
