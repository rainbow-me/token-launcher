export enum TokenLauncherErrorCode {
  // Parameter errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  UNSUPPORTED_CHAIN_ID = 'UNSUPPORTED_CHAIN_ID',
  INVALID_AMOUNT_IN_PARAM = 'INVALID_AMOUNT_IN_PARAM',
  MISSING_REQUIRED_PARAM = 'MISSING_REQUIRED_PARAM',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class TokenLauncherSDKError extends Error {
  readonly code: TokenLauncherErrorCode;
  readonly context: {
    operation: string;
    params?: any;
    source: 'api' | 'chain' | 'sdk';
    chainId?: number;
    transactionHash?: string;
    originalError?: any;
  };

  constructor(
    code: TokenLauncherErrorCode,
    message: string,
    context: {
      operation: string;
      params?: any;
      source: 'api' | 'chain' | 'sdk';
      chainId?: number;
      transactionHash?: string;
      originalError?: any;
    }
  ) {
    super(`${code}: ${message}`);
    this.name = 'TokenLauncherSDKError';
    this.code = code;
    this.context = context;

    // Maintain proper stack trace in V8 engines
    Object.setPrototypeOf(this, TokenLauncherSDKError.prototype);
  }
}

// Helper function to format and throw errors
export function throwTokenLauncherError(
  code: TokenLauncherErrorCode,
  message: string,
  context: Omit<TokenLauncherSDKError['context'], 'source'> & { source?: 'api' | 'chain' | 'sdk' }
): never {
  throw new TokenLauncherSDKError(code, message, {
    ...context,
    source: context.source || 'sdk',
  });
}
