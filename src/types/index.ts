import { Signer } from '@ethersproject/abstract-signer';

export interface LaunchTokenParams {
  name: string;
  symbol: string;
  supply: string;
  wallet: Signer;
  merkleroot?: string;
  initialTick?: number;
  amountIn?: string;
  creator?: string;
  salt?: string;
  transactionOptions?: TransactionOptions;
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
