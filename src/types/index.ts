import type {
  Account,
  Chain,
  GetTransactionReturnType,
  PublicClient,
  Transport,
  WalletClient,
} from 'viem';
import type { SDKConfig, SupportedChain } from './config';
import type { Protocol } from './protocol';

export interface LaunchTokenParams {
  protocol: Protocol;
  name: string;
  symbol: string;
  walletClient: WalletClient<Transport, Chain, Account>;
  publicClient: PublicClient<Transport, Chain>;
  amountIn?: string;
  logoUrl?: string;
  description?: string;
  links?: Record<string, string>;
}

export interface LaunchTokenResponse {
  transaction: GetTransactionReturnType;
  tokenUri?: string;
  tokenAddress: string;
}

export interface ProtocolAdapter {
  supportedChains: readonly SupportedChain[];
  launchToken(
    params: LaunchTokenParams,
    config: SDKConfig,
    operation: string
  ): Promise<LaunchTokenResponse>;
}

export type { SDKConfig, SupportedChain } from './config';
export { Protocol } from './protocol';
