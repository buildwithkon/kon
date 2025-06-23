import { Collapsible } from '@base-ui-components/react/collapsible'

export default function CustomCollapsible({
  disabled = false,
  trigger,
  children
}: { disabled: boolean; trigger: React.ReactNode; children: React.ReactNode }) {
  return (
    <Collapsible.Root disabled={disabled} defaultOpen={disabled}>
      <Collapsible.Trigger className="group flex w-full cursor-pointer items-center justify-center">
        {trigger}
      </Collapsible.Trigger>
      <Collapsible.Panel className="flex h-[var(--collapsible-panel-height)] flex-col justify-end overflow-hidden transition-all duration-150 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
