import { Wallet } from '@ethersproject/wallet';
import { TransactionResponse } from '@ethersproject/providers';
import { AirdropMetadata } from './api';

export type SupportedNetwork = {
  chainId: number;
  contractAddress: string;
};

export interface SDKConfig {
  // api urls
  API_URL_DEV?: string;
  API_URL_PROD?: string;

  // api keys
  API_KEY_DEV?: string;
  API_KEY_PROD?: string;

  // supported networks
  SUPPORTED_NETWORKS?: SupportedNetwork[];

  // modes
  MODE?: 'jest' | 'development' | 'production';
}

export interface LaunchTokenParams {
  name: string;
  symbol: string;
  supply: string;
  wallet: Wallet;
  initialTick?: number;
  amountIn?: string;
  creator?: string;
  transactionOptions?: TransactionOptions;
  logoUrl: string;
  description?: string;
  links?: Record<string, string>;
  airdropMetadata?: AirdropMetadata;
}

export interface LaunchTokenAndBuyParams extends LaunchTokenParams {
  amountIn: string;
}

export interface LaunchTokenResponse {
  transaction: TransactionResponse;
  tokenUri: string;
  tokenAddress: string;
}

// Transaction options for gas customization
export interface TransactionOptions {
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

// Error types
export interface RainbowError extends Error {
  code?: string;
  data?: unknown;
}

// Re-export API types
export {
  TokenMetadata,
  AirdropMetadata,
  DeployRainbowSuperTokenRequest,
  DeployRainbowSuperTokenResponse,
  GetRainbowSuperTokenResponse,
  GetRainbowSuperTokensResponse,
  GetAirdropSuggestionsResponse,
  SuggestedUser,
  PredefinedCohort,
  PersonalizedCohort,
} from './api';

export class RainbowFetchError extends Error {
  constructor(message: string, public status: number, public details: string) {
    super(message);
    this.name = 'RainbowFetchError';
  }
}
