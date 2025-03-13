import { RainbowFetchError } from '../../types'

export async function rainbowFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init)
   
  if (!response.ok) {
    const errorBody = await response.text()

    throw new RainbowFetchError(
      `HTTP error ${response.status}: ${response.statusText}\nDetails: ${errorBody}`,
      response.status,
      errorBody
    )
  }
  const responseData = await response.json()
  return responseData
}

export function createRainbowHeaders(authToken?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  return headers
}
