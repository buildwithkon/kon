import { getIcalData } from '@konxyz/shared/lib/ical'
import { CalendarDotIcon, ClockIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { IcsCalendar, IcsEvent } from 'ts-ics'

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
  const hasStartTime = event.start && 'dateTime' in event.start
  const hasEndTime = event.end && 'dateTime' in event.end

  if (!hasStartTime) {
    // All-day event
    return 'All day'
  }

  const startDate = new Date(event.start.date)
  const startTime = startDate.toLocaleTimeString('en-US', timeOptions)

  if (!event.end || !hasEndTime) {
    // Only start time available
    return startTime
  }

  const endDate = new Date(event.end.date)
  const endTime = endDate.toLocaleTimeString('en-US', timeOptions)

  // Format as "11:00 PM - 12:00 PM"
  return `${startTime} - ${endTime}`
}

type IcalData = IcsCalendar | { raw: string; parseError: string } | null

export default function Ical({ url }: { url: string }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<IcalData>(null)

  useEffect(() => {
    const fetchIcalData = async () => {
      setLoading(true)

      try {
        // Determine API URL based on environment
        const apiUrl =
          window.location.hostname === 'localhost' ? 'http://localhost:8787' : 'https://api.kon.xyz' // Update with your production API URL

        const data = await getIcalData(url, { apiUrl })
        console.log('Fetched iCal data:', data)
        setData(data)

        // Check if parsing failed
        if ('parseError' in data) {
          console.warn('iCal parsing failed, using raw data:', data.parseError)
          // You can still use the raw data if needed
          // For now, we'll just log it
        } else {
          // Successfully parsed iCal data
          console.log('Successfully parsed iCal calendar with', data.events?.length || 0, 'events')
        }
      } catch (err) {
        console.error('Failed to fetch iCal data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      fetchIcalData()
    }
  }, [url])

  // Sort and group events by date
  const sortedAndGroupedEvents = (() => {
    if (!data || !('events' in data) || !data.events) return []

    // Sort events by start date
    const sortedEvents = [...data.events].sort((a, b) => {
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

    return grouped
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
    <div className="flex h-full min-h-0 flex-col">
      {loading && <div className="text-center text-muted text-sm">Loading calendar events...</div>}
      {!loading && sortedAndGroupedEvents.length > 0 && (
        <>
          {/* Horizontal scrollable date header */}
          <div className="-mx-6 sticky top-16 z-10 border-muted border-b content-blur">
            <div className="flex gap-3 overflow-x-auto p-4">
              {sortedAndGroupedEvents.map(({ date }) => {
                const dateObj = new Date(date)
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => scrollToDate(date)}
                    className="flex w-20 flex-col items-center rounded-lg bg-main px-4 py-2 text-main-fg"
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
          {/* Events list */}
          <div className="-mx-6 relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-4">
            {sortedAndGroupedEvents.map(({ date, events }) => (
              <div key={date} ref={setDateRef(date)} className="flex flex-col">
                <h2 className="flex items-center gap-2 px-4 py-3 font-bold content-blur">
                  <CalendarDotIcon size={24} />
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h2>
                <div className="px-4 pb-4">
                  {events.map((event: IcsEvent) => (
                    <div key={event.uid} className="mb-2 overflow-hidden rounded-lg border border-muted p-4">
                      <h3 className="flex items-center pb-1">{parseHtmlContent(event.summary)}</h3>
                      <p className="line-clamp-2 pl-1 text-muted text-sm">
                        {parseHtmlContent(event.description)}
                      </p>
                      <span className="flex items-center gap-1 pt-2 text-xs">
                        <ClockIcon size={18} />
                        {formatEventTime(event)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
