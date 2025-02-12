import { Signer } from '@ethersproject/abstract-signer';

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
  supply: bigint;
  tokenUri: string;
}

export interface DeployRainbowSuperTokenResponse {
  data: {
    tokenUri: string;
    salt: string;
  },
}

export interface AirdropMetadata {
  merkleRoot: string;
  merkleRootId: number;
}

export interface LaunchTokenParams {
  name: string;
  symbol: string;
  supply: bigint;
  initialTick: number;
  amountIn: bigint;
  wallet: Signer;
  merkleroot?: string;
  creator?: string;
  salt: string;
}