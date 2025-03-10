export enum TokenLauncherErrorCode {
    // API errors
    API_REQUEST_FAILED = "API_REQUEST_FAILED",
    API_RESPONSE_INVALID = "API_RESPONSE_INVALID",
    SUBMISSION_DETAILS_MISSING = "SUBMISSION_DETAILS_MISSING",
    
    // Blockchain errors
    TRANSACTION_FAILED = "TRANSACTION_FAILED",
    CONTRACT_INTERACTION_FAILED = "CONTRACT_INTERACTION_FAILED",
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
    GAS_ESTIMATION_FAILED = "GAS_ESTIMATION_FAILED",
    INVALID_SALT = "INVALID_SALT",
    
    // Parameter errors
    INVALID_PARAMS = "INVALID_PARAMS",
    MISSING_REQUIRED_PARAM = "MISSING_REQUIRED_PARAM",
    
    // Wallet errors
    WALLET_CONNECTION_ERROR = "WALLET_CONNECTION_ERROR",
    
    // Generic errors
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
  }
  
  export class TokenLauncherSDKError extends Error {
    readonly code: TokenLauncherErrorCode;
    readonly context: {
      operation: string;
      params?: any;
      source: "api" | "blockchain" | "sdk";
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
        source: "api" | "blockchain" | "sdk";
        chainId?: number;
        transactionHash?: string;
        originalError?: any;
      }
    ) {
      super(`${code}: ${message}`);
      this.name = "TokenLauncherSDKError";
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
    context: Omit<TokenLauncherSDKError["context"], "source"> & { source?: "api" | "blockchain" | "sdk" }
  ): never {
    throw new TokenLauncherSDKError(code, message, {
      ...context,
      source: context.source || "sdk"
    });
  }