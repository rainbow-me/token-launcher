import { BigNumberish } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { LaunchTokenParams, SDKConfig } from './types'
import { getInitialTick } from './getInitialTick'
import { launchRainbowSuperToken, launchRainbowSuperTokenAndBuy } from './launchToken'

class RainbowSDK {
  private static instance: RainbowSDK
  private config: SDKConfig = {}

  public static getInstance(): RainbowSDK {
    if (!RainbowSDK.instance) {
      RainbowSDK.instance = new RainbowSDK()
    }
    return RainbowSDK.instance
  }

  public configure(config: SDKConfig): void {
    this.config = { ...this.config, ...config }
  }

  public getConfig(): SDKConfig {
    return { ...this.config }
  }

  public getInitialTick(tokenPrice: BigNumberish): number {
    return getInitialTick(tokenPrice)
  }

  public async launchToken(params: LaunchTokenParams): Promise<TransactionResponse> {
    return launchRainbowSuperToken(params, this.config)
  }

  public async launchTokenAndBuy(params: LaunchTokenParams): Promise<TransactionResponse> {
    return launchRainbowSuperTokenAndBuy(params, this.config)
  }
}

// Export singleton instance
export const TokenLauncher = RainbowSDK.getInstance()

export * from './launchToken';
export * from './predictAddress';
export * from './types';
export * from './api';
export * from './api/utils/rainbowFetch';
export * from './getInitialTick';

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
} from './types';
