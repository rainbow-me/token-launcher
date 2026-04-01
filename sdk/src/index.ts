import {
  LaunchTokenParams,
  SDKConfig,
  LaunchTokenResponse,
  LaunchTokenAndBuyParams,
} from './types';
import { launchV2TokenAndBuy } from './deployToken';
import { BigNumber } from '@ethersproject/bignumber';
import { getInitialTick } from './getInitialTick';

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

  public getInitialTick(tokenPrice: BigNumber): number {
    return getInitialTick(tokenPrice);
  }

  public async launchToken(params: LaunchTokenParams): Promise<LaunchTokenResponse | undefined> {
    return launchV2TokenAndBuy(params, this.config);
  }

  public async launchTokenAndBuy(
    params: LaunchTokenAndBuyParams
  ): Promise<LaunchTokenResponse | undefined> {
    return launchV2TokenAndBuy(params, this.config);
  }
}

// Export singleton instance
export const TokenLauncher = TokenLauncherSDK.getInstance();

// Export types
export {
  LaunchTokenParams,
  LaunchTokenResponse,
  LaunchTokenAndBuyParams,
  SDKConfig,
  SupportedNetwork,
} from './types';

export { TokenLauncherErrorCode, TokenLauncherSDKError } from './errors';
