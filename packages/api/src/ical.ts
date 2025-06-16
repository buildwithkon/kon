import { Hono } from 'hono'
import { cors } from 'hono/cors'

const ical = new Hono()

// Enable CORS for this endpoint
ical.use('/*', cors())

// Proxy endpoint for fetching iCal data
ical.get('/proxy', async (c) => {
  const url = c.req.query('url')
  
  if (!url) {
    return c.json({ error: 'URL parameter is required' }, 400)
  }

  try {
    // Fetch the iCal data from the provided URL
    const response = await fetch(url)
    
    if (!response.ok) {
      return c.json({ error: `Failed to fetch iCal data: ${response.statusText}` }, response.status)
    }
    
    const icalData = await response.text()
    
    // Return the iCal data with appropriate headers
    return c.text(icalData, 200, {
      'Content-Type': 'text/calendar',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    })
  } catch (error) {
    console.error('Error fetching iCal data:', error)
    return c.json({ error: 'Failed to fetch iCal data' }, 500)
  }
})

export default ical