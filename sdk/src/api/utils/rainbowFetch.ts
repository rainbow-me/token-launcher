import { RainbowFetchError } from '../../types'

/**
 * Wrapper for fetch with improved error handling and logging
 */
export async function rainbowFetch(input: RequestInfo | URL, init?: RequestInit) {
  // TODO: remove this
  console.log('Rainbow API Request:', {
    url: typeof input === 'string' ? input : input.toString(),
    method: init?.method || 'GET',
    headers: init?.headers,
    body: init?.body ? JSON.parse(init.body.toString()) : undefined
  })

  const response = await fetch(input, init)
  
  // TODO: remove this
  console.log('Rainbow API Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  })
  
  if (!response.ok) {
    const errorBody = await response.text()
    console.log('Rainbow API Error:', {
      status: response.status,
      statusText: response.statusText,
      details: errorBody
    })

    throw new RainbowFetchError(
      `HTTP error ${response.status}: ${response.statusText}\nDetails: ${errorBody}`,
      response.status,
      errorBody
    )
  }

  const responseData = await response.json()

  // TODO: remove this
  console.log('Rainbow API Success:', responseData)

  return responseData
}

/**
 * Helper to create common headers for Rainbow API requests
 */
export function createRainbowHeaders(authToken?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  return headers
}
