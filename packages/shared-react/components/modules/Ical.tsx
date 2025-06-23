import { Toast } from '@base-ui-components/react'
import {
  BookmarkSimpleIcon,
  CalendarBlankIcon,
  CalendarDotIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  MapPinSimpleIcon,
  SlidersHorizontalIcon
} from '@phosphor-icons/react'
import { atom, useAtom, useAtomValue } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useRef } from 'react'
import type { IcsCalendar, IcsEvent } from 'ts-ics'
import IcalFilterDialog from '~/components/IcalFilterDialog'

// Jotai atoms for persistent filter states
export const savedEventIdsAtom = atomWithStorage('kon.events', [] as string[])
export const showSavedOnlyAtom = atom<boolean>(false)
export const searchQueryAtom = atom<string>('')
export const selectedLocationsAtom = atom([] as string[])

// Helper function to strip HTML tags and decode HTML entities
const parseHtmlContent = (html: string | undefined): string => {
  if (!html) return ''

  // Create a temporary div to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html

  // Get text content which automatically strips HTML tags and decodes entities
  return temp.textContent || temp.innerText || ''
}

// Helper function to format event time only (since date is now in header)
const formatEventTime = (event: IcsEvent): string => {
  if (!event.start) return ''

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }

  // Check if event has specific times (not all-day)
  const hasStartTime = event.start?.date
  const hasEndTime = event.end?.date
  if (!hasStartTime) {
    return 'All day'
  }

  const startDate = new Date(event.start.date)
  const startTime = startDate.toLocaleTimeString('en-US', timeOptions)

  if (!event.end || !hasEndTime) {
    return startTime
  }

  const endDate = new Date(event.end.date)
  const endTime = endDate.toLocaleTimeString('en-US', timeOptions)

  // Format as "11:00 PM - 12:00 PM"
  return `${startTime} - ${endTime}`
}

type IcalData = IcsCalendar | { raw: string; parseError: string } | null

export default function Ical({ data }: { url: string; data?: IcalData }) {
  const [eventIds, setEventIds] = useAtom(savedEventIdsAtom)
  const showSavedOnly = useAtomValue(showSavedOnlyAtom)
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const selectedLocations = useAtomValue(selectedLocationsAtom)
  const tm = Toast.useToastManager()

  const saveEventId = (uid: string) => {
    if (eventIds.includes(uid)) {
      setEventIds(eventIds.filter((id) => id !== uid))
      tm.add({ title: '🗑️ Removed' })
    } else {
      setEventIds([...eventIds, uid])
      tm.add({ title: '✅ Saved!' })
    }
  }

  const loading = !data

  // Extract unique locations from all events and get total event count
  const { uniqueLocations, totalEventCount } = (() => {
    if (!data || !('events' in data) || !data.events) return { uniqueLocations: [], totalEventCount: 0 }

    const locations = new Set<string>()
    for (const event of data.events) {
      if (event.location?.trim()) {
        locations.add(event.location.trim())
      }
    }

    return {
      uniqueLocations: Array.from(locations).sort(),
      totalEventCount: data.events.length
    }
  })()

  // Filter events and calculate count
  const { sortedAndGroupedEvents, filteredEventCount } = (() => {
    if (!data || !('events' in data) || !data.events)
      return { sortedAndGroupedEvents: [], filteredEventCount: 0 }

    // Filter events based on search query and saved only
    let eventsToShow = [...data.events]

    // Apply search filter if query is not empty
    if (searchQuery.trim() && searchQuery.trim().length > 2) {
      const query = searchQuery.toLowerCase()
      eventsToShow = eventsToShow.filter((event) => {
        const summary = parseHtmlContent(event.summary).toLowerCase()
        const description = parseHtmlContent(event.description).toLowerCase()
        const location = (event.location || '').toLowerCase()

        return summary.includes(query) || description.includes(query) || location.includes(query)
      })
    }

    // Apply saved only filter
    if (showSavedOnly) {
      eventsToShow = eventsToShow.filter((event) => eventIds.includes(event.uid))
    }

    // Apply location filter
    if (selectedLocations.length > 0) {
      eventsToShow = eventsToShow.filter((event) => {
        return event.location && selectedLocations.includes(event.location.trim())
      })
    }

    // Store the filtered event count
    const filteredEventCount = eventsToShow.length

    // Sort events by start date
    const sortedEvents = eventsToShow.sort((a, b) => {
      const dateA = new Date(a.start?.date || 0)
      const dateB = new Date(b.start?.date || 0)
      return dateA.getTime() - dateB.getTime()
    })

    // Group events by date
    const grouped: { date: string; events: IcsEvent[] }[] = []
    let currentGroup: { date: string; events: IcsEvent[] } | null = null

    for (const event of sortedEvents) {
      if (!event.start) continue

      const eventDate = new Date(event.start.date)
      const dateKey = eventDate.toDateString()

      if (!currentGroup || currentGroup.date !== dateKey) {
        currentGroup = { date: dateKey, events: [] }
        grouped.push(currentGroup)
      }

      currentGroup.events.push(event)
    }

    return { sortedAndGroupedEvents: grouped, filteredEventCount }
  })()

  // Create refs for scrolling to date sections
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const setDateRef = (date: string) => (el: HTMLDivElement | null) => {
    if (el) dateRefs.current[date] = el
  }

  const scrollToDate = (date: string) => {
    dateRefs.current[date]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="">
      {totalEventCount >= 5 && (
        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="relative flex w-full items-center">
            <input
              type="search"
              placeholder="Search Events"
              onBlur={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-muted bg-bg-secondary py-2 pr-4 pl-10! text-sm"
            />
            <button type="button" className="absolute left-3 text-muted">
              <MagnifyingGlassIcon size={24} />
            </button>
          </div>
          <IcalFilterDialog locations={uniqueLocations} filteredEventCount={filteredEventCount}>
            <button type="button" className="btn-main rounded-lg">
              <SlidersHorizontalIcon size={24} />
            </button>
          </IcalFilterDialog>
        </div>
      )}
      {!loading &&
        (sortedAndGroupedEvents.length > 0 ? (
          <>
            {/* Horizontal scrollable date header - only show if 2 or more dates */}
            {sortedAndGroupedEvents.length >= 2 && (
              <div className="sticky top-16 z-10 border-muted border-b content-blur">
                <div className="flex gap-3 overflow-x-auto p-4">
                  {sortedAndGroupedEvents.map(({ date }) => {
                    const dateObj = new Date(date)
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => scrollToDate(date)}
                        className="flex w-16 flex-col items-center rounded-lg bg-main px-4 py-2 text-main-fg"
                      >
                        <span className="font-bold text-2xl">{dateObj.getDate()}</span>
                        <span className="text-xs uppercase">
                          {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {/* Events list */}
            <div className="relative overflow-y-auto overflow-x-hidden pt-4">
              {sortedAndGroupedEvents.map(({ date, events }) => (
                <div key={date} ref={setDateRef(date)} className="flex scroll-mt-42 flex-col">
                  <h2 className="flex items-center gap-2 px-4 py-3 font-bold content-blur">
                    <CalendarDotIcon size={24} />
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h2>
                  <div className="px-4 pb-4">
                    {events.map((event: IcsEvent) => (
                      <div
                        key={event.uid}
                        className="relative mb-2 overflow-hidden rounded-lg border border-muted p-4"
                      >
                        <h3 className="flex items-center pr-6 pb-1">{parseHtmlContent(event.summary)}</h3>
                        <p className="line-clamp-2 pl-1 text-muted text-sm">
                          {parseHtmlContent(event.description)}
                        </p>
                        <div className="flex flex-col gap-0.5 pt-2">
                          {event?.location && (
                            <div className="flex items-center gap-1 overflow-x-scroll text-nowrap text-xs">
                              <MapPinSimpleIcon />
                              {event.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-right text-xs">
                            <ClockIcon size={18} />
                            {formatEventTime(event)}
                          </div>
                        </div>
                        {totalEventCount >= 5 && (
                          <button
                            type="button"
                            className={`absolute top-3.5 right-3.5 ${
                              eventIds.includes(event.uid) ? 'text-main' : 'text-muted hover:text-main'
                            }`}
                            onClick={() => saveEventId(event.uid)}
                          >
                            <BookmarkSimpleIcon
                              size={22}
                              weight={eventIds.includes(event.uid) ? 'duotone' : 'regular'}
                            />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center gap-2 text-center text-muted">
            <CalendarBlankIcon size={24} />
            {showSavedOnly ? 'No saved events yet' : 'No events found'}
          </div>
        ))}
    </div>
  )
}
