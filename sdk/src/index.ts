import { BigNumberish } from '@ethersproject/bignumber'
import { GetAirdropSuggestionsResponse, GetRainbowSuperTokenResponse, GetRainbowSuperTokensResponse, LaunchTokenParams, SDKConfig, LaunchTokenResponse } from './types'
import { getInitialTick } from './getInitialTick'
import { launchRainbowSuperToken, launchRainbowSuperTokenAndBuy } from './launchToken'
import { getAirdropSuggestions, getRainbowSuperTokenByUri, getRainbowSuperTokens } from './api'

class RainbowSDK {
  private static instance: RainbowSDK;
  private config: SDKConfig = {};

  public static getInstance(): RainbowSDK {
    if (!RainbowSDK.instance) {
      RainbowSDK.instance = new RainbowSDK();
    }
    return RainbowSDK.instance;
  }

  public configure(config: SDKConfig): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): SDKConfig {
    return { ...this.config };
  }

  public getInitialTick(tokenPrice: BigNumberish): number {
    return getInitialTick(tokenPrice);
  }

  public async launchToken(params: LaunchTokenParams): Promise<LaunchTokenResponse> {
    return launchRainbowSuperToken(params, this.config);
  }

  public async launchTokenAndBuy(params: LaunchTokenParams): Promise<LaunchTokenResponse> {
    return launchRainbowSuperTokenAndBuy(params, this.config);
  }

  public async getAirdropSuggestions(address: string): Promise<GetAirdropSuggestionsResponse> {
    return getAirdropSuggestions(address);
  }

  public async getRainbowSuperTokens(): Promise<GetRainbowSuperTokensResponse> {
    return getRainbowSuperTokens(this.config);
  }

  public async getRainbowSuperTokenByUri(uri: string): Promise<GetRainbowSuperTokenResponse> {
    return getRainbowSuperTokenByUri(uri, this.config);
  }
}

// Export singleton instance
export const TokenLauncher = RainbowSDK.getInstance()

// Export types
export type {
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
