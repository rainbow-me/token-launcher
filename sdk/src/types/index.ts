import { Wallet } from '@ethersproject/wallet';
import { TransactionResponse } from '@ethersproject/providers';

export interface SupportedNetwork {
  chainId: number;
  contractAddress: string;
}

export interface SDKConfig {
  // launcher details
  LAUNCHER_FEE_ADDRESS?: string;
  LAUNCHER_CODE?: string;
  LAUNCHER_PLATFORM?: string;

  // supported networks
  SUPPORTED_NETWORKS?: SupportedNetwork[];
}

export interface LaunchTokenParams {
  name: string;
  symbol: string;
  wallet: Wallet;
  amountIn?: string;
  logoUrl?: string;
  description?: string;
  links?: Record<string, string>;
}

export interface LaunchTokenAndBuyParams extends LaunchTokenParams {
  amountIn: string;
}

export interface LaunchTokenResponse {
  transaction: TransactionResponse;
  tokenUri?: string;
  tokenAddress: string;
}
