"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRainbowHeaders = exports.rainbowFetch = exports.RainbowFetchError = void 0;
class RainbowFetchError extends Error {
    constructor(message, url, status, statusText, body) {
        super(message);
        this.url = url;
        this.status = status;
        this.statusText = statusText;
        this.body = body;
        this.name = 'RainbowFetchError';
    }
}
exports.RainbowFetchError = RainbowFetchError;
const defaultConfig = {
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
async function rainbowFetch(url, options = {}) {
    const config = { ...defaultConfig, ...options };
    const { timeout, retries, retryDelay, validateJson, ...fetchOptions } = config;
    let lastError = null;
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
                let errorBody;
                try {
                    errorBody = await response.json();
                }
                catch (_a) {
                    // If we can't parse JSON, use text
                    errorBody = await response.text();
                }
                throw new RainbowFetchError(`HTTP error ${response.status}`, url, response.status, response.statusText, errorBody);
            }
            // Validate JSON if required
            if (validateJson) {
                try {
                    await response.clone().json();
                }
                catch (e) {
                    throw new RainbowFetchError('Invalid JSON response', url, response.status, response.statusText);
                }
            }
            return response;
        }
        catch (error) {
            lastError = error;
            // Don't retry if we've hit our limit or if it's an abort error
            if (attempt === retries ||
                error instanceof RainbowFetchError ||
                (error === null || error === void 0 ? void 0 : error.name) === 'AbortError') {
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
    throw new RainbowFetchError((lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Network error', url, undefined, undefined, lastError);
}
exports.rainbowFetch = rainbowFetch;
/**
 * Helper to create common headers for Rainbow API requests
 */
function createRainbowHeaders(authToken) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}
exports.createRainbowHeaders = createRainbowHeaders;
//# sourceMappingURL=rainbowFetch.js.map