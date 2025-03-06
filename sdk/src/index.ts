import { GetAirdropSuggestionsResponse, GetRainbowSuperTokenResponse, GetRainbowSuperTokensResponse, LaunchTokenParams, SDKConfig, LaunchTokenResponse } from './types'
import { launchRainbowSuperToken, launchRainbowSuperTokenAndBuy } from './launchToken'
import { getAirdropSuggestions, getRainbowSuperTokenByUri, getRainbowSuperTokens } from './api'
import { calculateTokenomics, TokenomicsParams, TokenomicsResult, TokenomicsResultFormatted, weiToEth } from './utils/tokenomics'
import JSBI from 'jsbi'
import { formatUnits } from '@ethersproject/units';

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

  public calculateTokenomics(params: TokenomicsParams): TokenomicsResultFormatted {
    const precise = calculateTokenomics(params);
    return this.convertTokenomicsToNumbers(precise);
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

  public serializeTokenomics(result: TokenomicsResult): any {
    const serialize = (obj: any): any => {
      if (obj instanceof JSBI) {
        return obj.toString();
      }
      if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, serialize(v)])
        );
      }
      return obj;
    };
    
    return serialize(result);
  }

  public convertTokenomicsToNumbers(tokenomics: TokenomicsResult): TokenomicsResultFormatted {
    const serialized = this.serializeTokenomics(tokenomics);
    
    return {
      supply: {
        total: formatUnits(serialized.supply.total, 18),
        lp: formatUnits(serialized.supply.lp, 18),
        creator: formatUnits(serialized.supply.creator, 18),
        airdrop: formatUnits(serialized.supply.airdrop, 18),
      },
      price: {
        targetUsd: formatUnits(serialized.price.targetUsd, 18),
        targetEth: formatUnits(serialized.price.targetEth, 18),
        actualUsd: formatUnits(serialized.price.actualUsd, 18),
        actualEth: formatUnits(serialized.price.actualEth, 18),
      },
      marketCap: {
        targetUsd: formatUnits(serialized.marketCap.targetUsd, 18),
        actualUsd: formatUnits(serialized.marketCap.actualUsd, 18),
        actualEth: formatUnits(serialized.marketCap.actualEth, 18),
      },
      allocation: {
        creator: Number(serialized.allocation.creator) / 100,
        airdrop: Number(serialized.allocation.airdrop) / 100,
        lp: Number(serialized.allocation.lp) / 100,
      },
      tick: tokenomics.tick,
    };
  }
}

// Export singleton instance
export const TokenLauncher = TokenLauncherSDK.getInstance()

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

export type {
  TokenomicsParams,
  TokenomicsResult,
  TokenomicsResultFormatted,
} from './utils/tokenomics';
