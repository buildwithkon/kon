import { Checkbox } from '@base-ui-components/react/checkbox'
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group'
import {
  BookmarkSimpleIcon,
  CheckIcon,
  DotsNineIcon,
  FunnelIcon,
  MapPinSimpleIcon,
  SlidersHorizontalIcon,
  TrashIcon
} from '@phosphor-icons/react'
import { useAtom } from 'jotai'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/Dialog'
import { selectedLocationsAtom, showSavedOnlyAtom } from './modules/Ical'

interface FilterIcalDialogProps {
  children: React.ReactNode
  locations: string[]
  filteredEventCount: number
}

export default function FilterIcalDialog({ children, locations, filteredEventCount }: FilterIcalDialogProps) {
  const [selectedLocations, setSelectedLocations] = useAtom(selectedLocationsAtom)
  const [showSavedOnly, setShowSavedOnly] = useAtom(showSavedOnlyAtom)
  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="content">
        <DialogTitle className="flex items-center justify-center text-center font-bold text-xl">
          <SlidersHorizontalIcon size={24} weight="bold" className="-mt-0.5 -ml-2 mr-1.5" />
          Filter events
        </DialogTitle>
        <DialogDescription className="hidden text-center">
          Filter events by saved or location
        </DialogDescription>
        <div className="space-y-6 pt-5">
          <div className="space-y-3">
            <div className="flex rounded-xl border border-main text-muted">
              <button
                type="button"
                onClick={() => setShowSavedOnly(false)}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg transition-colors ${
                  !showSavedOnly ? 'bg-main text-main-fg' : ''
                }`}
              >
                <DotsNineIcon size={20} weight="bold" />
                All Events
              </button>
              <button
                type="button"
                onClick={() => setShowSavedOnly(true)}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg transition-colors ${
                  showSavedOnly ? 'bg-main text-main-fg' : ''
                }`}
              >
                <BookmarkSimpleIcon size={20} weight="duotone" /> Saved Only
              </button>
            </div>
          </div>
          {locations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between content-blur">
                <h3 className="flex items-center gap-2 font-bold" id="location-group-label">
                  <MapPinSimpleIcon size={24} weight="duotone" />
                  by Location
                </h3>
                {selectedLocations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedLocations([])}
                    className="flex items-center gap-1 rounded-lg px-2 text-muted text-sm"
                  >
                    <TrashIcon size={20} />
                    Clear all locations
                  </button>
                )}
              </div>
              <CheckboxGroup
                value={selectedLocations}
                onValueChange={setSelectedLocations}
                aria-labelledby="location-group-label"
              >
                <div className="max-h-60 space-y-1.5 overflow-y-auto px-2">
                  {locations.map((location) => (
                    <label
                      htmlFor={`location-${location}`}
                      key={location}
                      className="flex cursor-pointer items-center gap-2 transition-colors hover:text-main"
                    >
                      <Checkbox.Root
                        id={`location-${location}`}
                        name="locations"
                        value={location}
                        className="relative h-4 w-4 rounded border border-muted bg-bg-secondary transition-colors data-[checked]:border-main data-[checked]:bg-main"
                      >
                        <Checkbox.Indicator className="flex items-center justify-center text-main-fg">
                          <CheckIcon size={12} weight="bold" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <span className="flex-1 truncate font-normal text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              </CheckboxGroup>
            </div>
          )}
        </div>
        <div className="flex justify-end content-blur">
          <DialogClose className="btn-main mt-6 mb-4 flex w-full items-center gap-2">
            <FunnelIcon size={24} />
            Apply Filters
            <span className="mx-3 font-normal opacity-90">
              {filteredEventCount > 0 && `(${filteredEventCount})`}
            </span>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
