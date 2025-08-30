import { type IcsCalendar, convertIcsCalendar } from 'ts-ics'
import { prepare } from '~/lib/app'
import { apiClient } from '~/lib/hono'

type IcalResult = IcsCalendar | { raw: string; parseError: string }

type IcalOptions = { startDate?: string | Date; endDate?: string | Date }

const withinRange = (d: Date, start?: Date, end?: Date) => {
  if (start && d < start) return false
  if (end && d > end) return false
  return true
}

const toDateOpt = (v?: string | Date) => (v ? new Date(v) : undefined)

export const getIcalData = async (
  urlOrUrls: string | string[],
  requestUrl: string,
  env: Env,
  options?: IcalOptions
): Promise<IcalResult> => {
  const { origin } = prepare(requestUrl)

  try {
    const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls]
    const calendars: IcsCalendar[] = []

    for (const url of urls) {
      const response = (await apiClient(origin, env).ical.proxy.$get({
        query: { url }
      })) as Response

      if (!response.ok) {
        // Skip failed fetches but continue others
        console.warn('Failed to fetch iCal data:', url, response.status)
        continue
      }

      const icalData = await response.text()

      try {
        const ical: IcsCalendar = convertIcsCalendar(undefined, icalData)
        calendars.push(ical)
      } catch (parseError) {
        if (parseError instanceof Error && 'issues' in parseError) {
          console.log('Parsing issues:', JSON.stringify(parseError, null, 2))
        }
        console.log('Skipping one calendar due to parsing error')
      }
    }

    if (calendars.length === 0) {
      throw new Error('No valid calendars fetched')
    }

    // Merge events from multiple calendars
    // Merge events and dedupe by UID
    const mergedEvents = calendars.flatMap((c) => c.events || [])
    const byUid = new Map<string, typeof mergedEvents[number]>()
    for (const e of mergedEvents) {
      if (e?.uid) byUid.set(e.uid, e)
    }
    const merged: IcsCalendar = {
      ...calendars[0],
      events: Array.from(byUid.values())
    }

    // Apply optional date range filter
    const start = toDateOpt(options?.startDate)
    const end = toDateOpt(options?.endDate)
    if (start || end) {
      merged.events = (merged.events || []).filter((evt) => {
        const dStr = evt.start?.date
        if (!dStr) return false
        const d = new Date(dStr)
        return withinRange(d, start, end)
      })
    }

    return merged
  } catch (error) {
    console.error('Error fetching iCal data:', error)
    throw error
  }
}
