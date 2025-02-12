export declare class RainbowFetchError extends Error {
    readonly url: string;
    readonly status?: number | undefined;
    readonly statusText?: string | undefined;
    readonly body?: unknown;
    constructor(message: string, url: string, status?: number | undefined, statusText?: string | undefined, body?: unknown);
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
/**
 * Enhanced fetch utility with retries, timeouts, and error handling
 * @param url The URL to fetch
 * @param options Request options including Rainbow-specific configurations
 * @returns Promise resolving to the fetch Response
 * @throws RainbowFetchError
 */
export declare function rainbowFetch(url: string, options?: RainbowFetchConfig): Promise<Response>;
/**
 * Helper to create common headers for Rainbow API requests
 */
export declare function createRainbowHeaders(authToken?: string): HeadersInit;
export {};
