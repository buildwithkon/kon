import { CalendarPlusIcon, ClockClockwiseIcon, ClockUserIcon } from '@phosphor-icons/react'
import { CalendarCheckIcon } from '@phosphor-icons/react/dist/ssr'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '~/components/ui/Dialog'

interface Props {
  children: React.ReactNode
  icalUrl: string
}

export default function IcalConfigDialog({ children, icalUrl }: Props) {
  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle className="flex items-center justify-center text-center font-bold text-xl">
          <CalendarCheckIcon size={24} weight="bold" className="-mt-0.5 -ml-2 mr-1.5" />
          Config
        </DialogTitle>
        <DialogDescription className="hidden text-center">Calendar config</DialogDescription>
        <ul className="mt-4 space-y-4">
          <li>
            <label htmlFor="timezone">Display timezone</label>
            <div className="mt-1.5 flex rounded-xl border border-main text-muted">
              <button
                type="button"
                onClick={() => {}}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg transition-colors ${
                  true ? 'bg-main text-main-fg' : ''
                }`}
              >
                <ClockUserIcon size={20} weight="bold" />
                Current timezone
              </button>
              <button
                type="button"
                onClick={() => {}}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg transition-colors ${
                  false ? 'bg-main text-main-fg' : ''
                }`}
              >
                <ClockClockwiseIcon size={20} weight="duotone" />
                IRL timezone
              </button>
            </div>
          </li>
          <li>
            <label htmlFor="cal-import">Import events to calendar</label>
            <a
              href={icalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-main mt-1.5 items-center justify-center"
            >
              <CalendarPlusIcon size={24} weight="bold" />
              Import
            </a>
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}
