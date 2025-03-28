import { Transport, Chain, Client, Account, Address, Hex } from 'viem';
import { AirdropMetadata } from './api';

export type ViemClient = Client<Transport, Chain, Account>;

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
  supply: bigint;
  client: ViemClient;
  initialTick?: number;
  amountIn?: bigint;
  creator?: Address;
  transactionOptions?: TransactionOptions;
  logoUrl: string;
  description?: string;
  links?: Record<string, string>;
  airdropMetadata?: AirdropMetadata;
}

export interface LaunchTokenAndBuyParams extends LaunchTokenParams {
  amountIn: bigint;
}

export interface LaunchTokenResponse {
  hash: Hex;
  tokenUri: string;
  tokenAddress: string;
}

// Transaction options for gas customization
export interface TransactionOptions {
  gas?: bigint;
  gasPrice?: bigint; // legacy gas price
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
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
  constructor(
    message: string,
    public status: number,
    public details: string
  ) {
    super(message);
    this.name = 'RainbowFetchError';
  }
}
