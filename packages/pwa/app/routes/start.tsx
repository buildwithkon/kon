import { FormProvider, getFormProps, useField, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { checkId } from '@konxyz/shared/lib/app'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { createRegisterSchema } from '@konxyz/shared/schema/Register'
import type { ActionFunctionArgs, MetaFunction } from '@remix-run/cloudflare'
import { useActionData, useRouteLoaderData } from '@remix-run/react'
import { Form } from '@remix-run/react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useRef } from 'react'
import ConfirmDialog from '~/components/ConfirmDialog'
import Transaction from '~/components/CustomTransaction'
import Input from '~/components/Input'
import ProfileCard from '~/components/ProfileCard'
import type { RootLoader } from '~/root'

export const meta: MetaFunction = mergeMeta(({ matches }) => [
  { title: `Start | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const submission = await parseWithZod(formData, {
    schema: createRegisterSchema({
      async isIdUnique(id: string) {
        const res = await checkId(id, request.url, context.cloudflare.env)
        return !res
      }
    }),
    async: true
  })
  if (submission.status !== 'success') {
    return {
      result: submission.reply(),
      showConfirm: false
    }
  }
  return {
    result: submission.reply(),
    showConfirm: true
  }
}

export default function Start() {
  const ld = useRouteLoaderData<RootLoader>('root')
  const ad = useActionData<typeof action>()
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const joinTitle = `👋 Join ${ld?.appConfig?.name}`
  const btnInitRef = useRef<HTMLButtonElement>(null)
  const btnFinalRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (ad?.showConfirm) {
      setConfirmOpen(true)
    }
  }, [ad?.showConfirm])

  const [form, fields] = useForm({
    lastResult: ad?.result,
    onValidate({ formData }) {
      console.log('----client form::', ad)
      return parseWithZod(formData, { schema: createRegisterSchema() })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput'
  })

  return (
    <FormProvider context={form.context}>
      <div className="wrapper-app-full">
        <CardComponent />
        <p className="px-4 pt-6 pb-8 text-xl">{ld?.appConfig?.description}</p>
        <p className="text-center text-xl">⬇️</p>
        <h1 className="pt-10 pb-6 text-center font-bold text-2xl">{joinTitle}</h1>
        <Form method="post" {...getFormProps(form)}>
          <div className="space-y-4">
            <Input field={fields.id} hint="Only lowercase letters, numbers, and hyphens." />
            <Input field={fields.name} hint="Optional, can be changed later." />
            <button
              type="submit"
              className="btn-main w-full"
              disabled={false}
              ref={btnFinalRef}
              onClick={() => {
                if (ad?.showConfirm) {
                  setTimeout(() => {
                    setConfirmOpen(true)
                  }, 150)
                }
              }}
            >
              Join
            </button>
          </div>
        </Form>
        <ConfirmDialog2
          joinTitle={joinTitle}
          confirmOpen={confirmOpen}
          setConfirmOpen={setConfirmOpen}
          btnInitRef={btnInitRef}
          btnFinalRef={btnFinalRef}
        />
      </div>
    </FormProvider>
  )
}
const CardComponent = () => {
  const id = useField('id')
  const name = useField('name')

  return <ProfileCard qr={false} name={name?.[0]?.value} id={id?.[0]?.value} />
}

const ConfirmDialog2 = ({
  joinTitle,
  confirmOpen,
  setConfirmOpen,
  btnInitRef,
  btnFinalRef
}: {
  joinTitle: string
  confirmOpen: boolean
  setConfirmOpen: (open: boolean) => void
  btnInitRef: React.RefObject<HTMLObjectElement>
  btnFinalRef: React.RefObject<HTMLObjectElement>
}) => {
  const id = useField('id')
  const name = useField('name')

  return (
    <ConfirmDialog
      title={joinTitle}
      open={confirmOpen}
      onOpenChange={() => setConfirmOpen(!confirmOpen)}
      initialFocus={btnInitRef}
      finalFocus={btnFinalRef}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="id">Your ID</label>
          <input readOnly type="text" value={id?.[0]?.value ?? ''} />
        </div>
        <div>
          <label htmlFor="name">Display Name</label>
          <input readOnly type="text" value={name?.[0]?.value ?? ''} />
        </div>
      </div>
      <Transaction calls={[]} btnText="Join" btnClass="btn-main mt-7" btnRef={btnInitRef} />
    </ConfirmDialog>
  )
}
