export interface TokenMetadata {
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

export interface GetTokensResponse {
  data: TokenMetadata[];
}

export interface GetTokenResponse {
  data: TokenMetadata;
}

export interface DeployTokenRequest {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  logoUrl: string;
  totalSupply: string;
  description: string;
  links: string[];
  salt: string;
  creatorAddress: string;
  airdropMetadata?: {
    merkleRoot: string;
    merkleRootId: number;
  };
}

export interface DeployTokenResponse {
  data: string; // token URI
} 