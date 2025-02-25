export class RainbowFetchError extends Error {
  constructor(
    message: string,
    public url: string,
    public status?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'RainbowFetchError';
  }
}

export async function rainbowFetch<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new RainbowFetchError(
      `HTTP error ${response.status}`,
      url,
      response.status,
      data
    );
  }

  return data;
}

/**
 * Helper to create common headers for Rainbow API requests
 */
export function createRainbowHeaders(authToken?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}
