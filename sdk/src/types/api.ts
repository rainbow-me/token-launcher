export interface AirdropMetadata {
  cohortIds: string[];
  addresses: string[];
}

export interface TokenMetadata {
  chainId: number;
  name: string;
  symbol: string;
  logoUrl: string;
  totalSupply: string;
  description: string;
  links: Record<string, string>;
  creatorAddress: string;
}

export interface DeployRainbowSuperTokenRequest extends TokenMetadata {
  airdropMetadata?: AirdropMetadata;
}

export interface DeployRainbowSuperTokenResponse {
  data: {
    tokenURI: string;
    salt: string;
    merkleRoot: string;
    totalSupply: string;
    name: string;
    symbol: string;
    creatorAddress: string;
    token: {
      address: string;
      chainId: number;
      decimals: number;
      name: string;
      symbol: string;
      logoUrl: string;
      totalSupply: string;
      description: string;
      links: Record<string, string>;
      version: string;
      status: string;
      creatorAddress: string;
      tokenUri: string;
      merkleRoot: string;
  };
  };
}

export interface SuggestedUser {
  username?: string;
  address: string;
  pfpURL: string;
  type: 'Farcaster' | 'ENS' | 'Rainbow';
  typePfpURL: string;
}

export interface CohortIcons {
  iconURL: string;
  pfp1URL?: string;
  pfp2URL?: string;
}

export interface PredefinedCohort {
  id: string;
  name: string;
  icons: CohortIcons;
  totalUsers: number;
}

export interface PersonalizedCohort {
  name: string;
  icons: CohortIcons;
  totalUsers: number;
  addresses: SuggestedUser[];
}

export interface GetAirdropSuggestionsResponse {
  data: {
    predefinedCohorts: PredefinedCohort[];
    personalizedCohorts: PersonalizedCohort[];
    suggested: SuggestedUser[];
  };
}

export interface GetRainbowSuperTokenResponse {
  data: {
    address: string;
    chainId: number;
    uri: string;
    name: string;
    symbol: string;
    logoUrl: string;
    totalSupply: string;
    description: string;
    links: Record<string, string>;
    creatorAddress: string;
    merkleRoot?: string;
  };
}

export interface GetRainbowSuperTokensResponse {
  data: GetRainbowSuperTokenResponse['data'][];
} 