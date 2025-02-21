export class RainbowFetchError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly status?: number,
    public readonly statusText?: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'RainbowFetchError';
  }
}

interface RainbowFetchConfig extends RequestInit {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Whether to validate response as JSON (default: true) */
  validateJson?: boolean;
}

const defaultConfig: Required<
  Pick<RainbowFetchConfig, 'timeout' | 'retries' | 'retryDelay' | 'validateJson'>
> = {
  timeout: 10000,
  retries: 0,
  retryDelay: 0,
  validateJson: true,
};

/**
 * Enhanced fetch utility with retries, timeouts, and error handling
 * @param url The URL to fetch
 * @param options Request options including Rainbow-specific configurations
 * @returns Promise resolving to the fetch Response
 * @throws RainbowFetchError
 */
export async function rainbowFetch(
  url: string,
  options: RainbowFetchConfig = {}
): Promise<Response> {
  const config = { ...defaultConfig, ...options };
  const { timeout, retries, retryDelay, validateJson, ...fetchOptions } = config;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Add signal to fetch options
      const fetchOptionsWithSignal = {
        ...fetchOptions,
        signal: controller.signal,
      };

      // Attempt fetch
      const response = await fetch(url, fetchOptionsWithSignal);
      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          // If we can't parse JSON, use text
          errorBody = await response.text();
        }

        console.error(errorBody);
        throw new RainbowFetchError(
          `HTTP error ${response.status}`,
          url,
          response.status,
          response.statusText,
          errorBody
        );
      }

      // Validate JSON if required
      if (validateJson) {
        try {
          await response.clone().json();
        } catch (e) {
          console.error(e);
          throw new RainbowFetchError(
            'Invalid JSON response',
            url,
            response.status,
            response.statusText
          );
        }
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry if we've hit our limit or if it's an abort error
      if (
        attempt === retries ||
        error instanceof RainbowFetchError ||
        (error as any)?.name === 'AbortError'
      ) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retries failed
  if (lastError instanceof RainbowFetchError) {
    throw lastError;
  }

  // For other errors (network, timeout, etc)
  console.error(lastError);
  throw new RainbowFetchError(
    lastError?.message || 'Network error',
    url,
    undefined,
    undefined,
    lastError
  );
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
