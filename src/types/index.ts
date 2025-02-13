import { Signer } from '@ethersproject/abstract-signer';
import { BigNumberish } from '@ethersproject/bignumber';

export interface DeployRainbowSuperTokenRequest {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  logoUrl: string;
  description: string;
  links: string[];
  creatorAddress: string;
  merkleroot: string;
  merkle_root_id: string;
  totalSupply: BigNumberish;
  tokenUri: string;
}

export interface TransactionOptions {
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
  value?: number | BigNumberish;
  from?: string;
}

export interface LaunchTokenParams {
  name: string;
  symbol: string;
  supply: BigNumberish;
  initialTick: number;
  amountIn: BigNumberish;
  wallet: Signer;
  merkleroot?: string;
  creator?: string;
  salt: string;
  options?: TransactionOptions;
}

export interface AirdropMetadata {
  merkleRoot: string;
  merkleRootId: number;
}

export interface RainbowSuperTokenMetadata {
  address: string;
  chainId: number;
  uri: string;
  name: string;
  symbol: string;
  logoUrl: string;
  totalSupply: string;
  description: string;
  links: string[];
  creatorAddress: string;
}

export interface GetRainbowSuperTokensResponse {
  data: RainbowSuperTokenMetadata[];
}

export interface GetRainbowSuperTokenResponse {
  data: RainbowSuperTokenMetadata;
}

export interface DeployRainbowSuperTokenResponse {
  data: {
    tokenUri: string;
    salt: string;
  };
}
