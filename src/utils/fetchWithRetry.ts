export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 500
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error(`Error fetching ${url}: ${response.statusText}`);
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw new Error(`Failed to fetch ${url} after multiple retries.`);
    }
    return response;
  } catch (error) {
    console.error(`Fetch error:`, error);
    if (retries > 0) {
      await new Promise(res => setTimeout(res, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
} 