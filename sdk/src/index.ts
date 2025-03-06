import { GetAirdropSuggestionsResponse, GetRainbowSuperTokenResponse, GetRainbowSuperTokensResponse, LaunchTokenParams, SDKConfig, LaunchTokenResponse } from './types'
import { launchRainbowSuperToken, launchRainbowSuperTokenAndBuy } from './launchToken'
import { getAirdropSuggestions, getRainbowSuperTokenByUri, getRainbowSuperTokens } from './api'
import { calculateTokenomics, TokenomicsParams, TokenomicsResult, TokenomicsResultFormatted, weiToEth } from './utils/tokenomics'
import JSBI from 'jsbi'
import { BigNumber } from '@ethersproject/bignumber';

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

  public convertTokenomicsToNumbers(tokenomics: TokenomicsResult): TokenomicsResultFormatted {
    // Helper to convert JSBI to BigNumber safely
    const toBigNumber = (jsbiValue: JSBI): BigNumber => {
      return BigNumber.from(jsbiValue.toString());
    };

    // Helper to convert JSBI to number safely (with division)
    const toPercentage = (jsbiValue: JSBI): number => {
      return Number(jsbiValue.toString()) / 100;
    };

    const result: TokenomicsResultFormatted = {
      supply: {
        total: toBigNumber(tokenomics.supply.total),
        lp: toBigNumber(tokenomics.supply.lp),
        creator: toBigNumber(tokenomics.supply.creator),
        airdrop: toBigNumber(tokenomics.supply.airdrop)
      },
      allocation: {
        creator: toPercentage(tokenomics.allocation.creator),
        airdrop: toPercentage(tokenomics.allocation.airdrop),
        lp: toPercentage(tokenomics.allocation.lp)
      },
      price: {
        targetEth: toBigNumber(tokenomics.price.targetEth),
        targetUsd: toBigNumber(tokenomics.price.targetUsd),
        actualEth: toBigNumber(tokenomics.price.actualEth),
        actualUsd: toBigNumber(tokenomics.price.actualUsd),
      },
      tick: tokenomics.tick,
      marketCap: {
        targetUsd: toBigNumber(tokenomics.marketCap.targetUsd),
        actualUsd: toBigNumber(tokenomics.marketCap.actualUsd),
        actualEth: toBigNumber(tokenomics.marketCap.actualEth),
      }
    };

    if (tokenomics.swap) {
      result.swap = {
        input: {
          amountInEth: toBigNumber(tokenomics.swap.input.amountInEth),
          feeAmount: toBigNumber(tokenomics.swap.input.feeAmount),
          amountInAfterFee: toBigNumber(tokenomics.swap.input.amountInAfterFee)
        },
        output: {
          tokensOut: toBigNumber(tokenomics.swap.output.tokensOut),
          priceImpact: toBigNumber(tokenomics.swap.output.priceImpact)
        },
        marketCapAfter: {
          eth: toBigNumber(tokenomics.swap.marketCapAfter.eth),
          usd: toBigNumber(tokenomics.swap.marketCapAfter.usd)
        }
      };
    }

    return result;
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
