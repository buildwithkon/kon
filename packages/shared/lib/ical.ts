import { type IcsCalendar, convertIcsCalendar } from 'ts-ics'

interface IcalOptions {
  apiUrl?: string
}

type IcalResult = IcsCalendar | { raw: string; parseError: string }

export const getIcalData = async (url: string, options?: IcalOptions): Promise<IcalResult> => {
  // Use the API proxy to fetch iCal data to avoid CORS issues
  // Default to localhost for development, can be overridden via options
  const apiUrl = options?.apiUrl || 'http://localhost:8787'

  const proxyUrl = `${apiUrl}/ical/proxy?url=${encodeURIComponent(url)}`

  try {
    const response = await fetch(proxyUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch iCal data: ${response.statusText}`)
    }

    const icalData = await response.text()
    console.log('Raw iCal data (first 500 chars):', icalData.substring(0, 500))

    try {
      const ical: IcsCalendar = convertIcsCalendar(undefined, icalData)
      console.log('Parsed iCal calendar:', ical)
      return ical
    } catch (parseError) {
      console.error('Failed to parse iCal data:', parseError)

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
