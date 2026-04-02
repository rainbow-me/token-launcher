import type { LaunchTokenParams, LaunchTokenResponse, SDKConfig } from './types';
import { TokenLauncherErrorCode, throwTokenLauncherError } from './errors';
import { getInitialTick } from './getInitialTick';
import { launchToken } from './launchToken';

function validateAmountIn(amountIn: string, operation: string): void {
  try {
    BigInt(amountIn);
  } catch (error) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.INVALID_AMOUNT_IN_PARAM,
      `Error with parsing amountIn param in ${operation}: ${(error as Error).message || String(error)}`,
      { operation, originalError: error, source: 'sdk', params: { amountIn } }
    );
  }
}

function validateLaunchTokenParams(
  params: LaunchTokenParams,
  operation: string
): LaunchTokenParams {
  for (const field of ['walletClient', 'publicClient', 'name', 'symbol', 'protocol'] as const) {
    if (!params[field]) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.MISSING_REQUIRED_PARAM,
        `Missing required parameter: ${field}`,
        {
          operation,
          source: 'sdk',
          params: { protocol: params.protocol, name: params.name, symbol: params.symbol },
        }
      );
    }
  }

  if (params.amountIn && params.amountIn !== '0') {
    validateAmountIn(params.amountIn, operation);
  }

  return params;
}

class TokenLauncherSDK {
  private static instance: TokenLauncherSDK;
  private config: SDKConfig = {};

  public static getInstance(): TokenLauncherSDK {
    if (!TokenLauncherSDK.instance) {
      TokenLauncherSDK.instance = new TokenLauncherSDK();
    }
    return TokenLauncherSDK.instance;
  }

  public configure(config: SDKConfig): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): SDKConfig {
    return { ...this.config };
  }

  public getInitialTick(tokenPrice: bigint): number {
    return getInitialTick(tokenPrice);
  }

  public async launchToken(params: LaunchTokenParams): Promise<LaunchTokenResponse> {
    const validatedParams = validateLaunchTokenParams(params, 'launchToken');
    return launchToken(validatedParams, this.config, 'launchToken');
  }
}

export const TokenLauncher = TokenLauncherSDK.getInstance();

export {
  LaunchTokenParams,
  LaunchTokenResponse,
  Protocol,
  SDKConfig,
  SupportedChain,
} from './types';

export { TokenLauncherErrorCode, TokenLauncherSDKError } from './errors';
