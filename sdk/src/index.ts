import {
  GetAirdropSuggestionsResponse,
  GetRainbowSuperTokenResponse,
  GetRainbowSuperTokensResponse,
  LaunchTokenParams,
  SDKConfig,
  LaunchTokenResponse,
  LaunchTokenAndBuyParams,
} from './types';
import { launchRainbowSuperToken, launchRainbowSuperTokenAndBuy } from './launchToken';
import { getAirdropSuggestions, getRainbowSuperTokenByUri, getRainbowSuperTokens } from './api';
import { getTokenLauncherContractConfig, FeeConfig } from './utils/getFactoryConfig';
import { BigNumber } from '@ethersproject/bignumber';
import { getInitialTick } from './getInitialTick';
import { Wallet } from '@ethersproject/wallet';

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
    return launchRainbowSuperToken(params, this.config);
  }

  public async launchTokenAndBuy(
    params: LaunchTokenAndBuyParams
  ): Promise<LaunchTokenResponse | undefined> {
    return launchRainbowSuperTokenAndBuy(params, this.config);
  }

  public async getAirdropSuggestions(address: string): Promise<GetAirdropSuggestionsResponse> {
    return getAirdropSuggestions(address, this.config);
  }

  public async getRainbowSuperTokens(): Promise<GetRainbowSuperTokensResponse> {
    return getRainbowSuperTokens(this.config);
  }

  public async getRainbowSuperTokenByUri(uri: string): Promise<GetRainbowSuperTokenResponse> {
    return getRainbowSuperTokenByUri(uri, this.config);
  }

  public async getTokenLauncherContractConfig(wallet: Wallet): Promise<FeeConfig> {
    return getTokenLauncherContractConfig(wallet, this.config);
  }
}

// Export singleton instance
export const TokenLauncher = TokenLauncherSDK.getInstance();

// Export types
export {
  TokenMetadata,
  AirdropMetadata,
  GetAirdropSuggestionsResponse,
  SuggestedUser,
  PredefinedCohort,
  PersonalizedCohort,
  GetRainbowSuperTokensResponse,
  GetRainbowSuperTokenResponse,
  DeployRainbowSuperTokenRequest,
  DeployRainbowSuperTokenResponse,
  LaunchTokenParams,
  LaunchTokenResponse,
  SDKConfig,
} from './types';

export { TokenLauncherErrorCode, TokenLauncherSDKError } from './errors';
