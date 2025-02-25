import { Wallet } from '@ethersproject/wallet';
import { AirdropMetadata } from './api';

export interface LaunchTokenParams {
  name: string;
  symbol: string;
  supply: string;
  wallet: Wallet;
  initialTick?: number;
  amountIn?: string;
  creator?: string;
  transactionOptions?: TransactionOptions;
  logoUrl?: string;
  description?: string;
  links?: string[];
  airdropMetadata?: AirdropMetadata;
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
export type {
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
