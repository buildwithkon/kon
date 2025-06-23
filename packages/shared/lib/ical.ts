import type { Env } from 'hono/types'
import { type IcsCalendar, convertIcsCalendar } from 'ts-ics'
import { client, prepare } from '~/lib/app'

type IcalResult = IcsCalendar | { raw: string; parseError: string }

export const getIcalData = async (url: string, requestUrl: string, env: Env): Promise<IcalResult> => {
  const { origin } = prepare(requestUrl)

  console.log('****origin', origin, client)

  try {
    const res = (await client(origin, env).ical.proxy.$get({
      query: { url }
    })) as Response

    if (!res.ok) {
      throw new Error(`Failed to fetch iCal data: ${res.statusText}`)
    }

    const icalData = await res.text()

    try {
      const ical: IcsCalendar = convertIcsCalendar(undefined, icalData)
      return ical
    } catch (parseError) {
      // Log more details about the parsing error
      if (parseError instanceof Error && 'issues' in parseError) {
        console.log('Parsing issues:', JSON.stringify(parseError, null, 2))
      }

      // For now, return the raw data so the component can still function
      console.log('Returning raw iCal data due to parsing error')
      return { raw: icalData, parseError: parseError instanceof Error ? parseError.message : 'Unknown error' }
    }
  } catch (error) {
    console.error('Error fetching iCal data:', error)
    throw error
  }
}
