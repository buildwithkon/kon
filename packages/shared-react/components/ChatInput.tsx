import { PaperPlaneTiltIcon } from '@phosphor-icons/react'

export default function ChatInput() {
  return (
    <div className="w-full max-w-screen-xs px-3 pt-2 pb-3 content-blur">
      <div className="relative flex">
        <textarea className="field-sizing-content resize-none pr-15!" />
        <button type="button" className="absolute top-0 right-0 bottom-0 w-14">
          <PaperPlaneTiltIcon size={28} className="absolute right-3.5 bottom-2.5 hover:text-accent" />
        </button>
      </div>
    </div>
  )
}
