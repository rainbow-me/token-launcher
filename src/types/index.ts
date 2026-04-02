import type { TransactionResponse } from '@ethersproject/providers';
import type { Wallet } from '@ethersproject/wallet';
import type { SDKConfig, SupportedChain } from './config';
import type { Protocol } from './protocol';

export interface LaunchTokenParams {
  protocol?: Protocol;
  name: string;
  symbol: string;
  wallet: Wallet;
  amountIn?: string;
  logoUrl?: string;
  description?: string;
  links?: Record<string, string>;
}

export interface LaunchTokenResponse {
  transaction: TransactionResponse;
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
