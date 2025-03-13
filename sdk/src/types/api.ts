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
  description?: string;
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

interface Icons {
  iconURL: string;
  pfpURLs: string[];
}

export interface SuggestedUser {
  address: string;
  pfpURL: string;
  type: string;
  typeIconURL: string;
  username: string;
}

export interface CohortIcons {
  iconURL: string;
  pfp1URL?: string;
  pfp2URL?: string;
}

export interface PredefinedCohort {
  icons: Icons;
  id: string;
  name: string;
  totalUsers: number;
}

export interface PersonalizedCohort {
  addresses: SuggestedUser[];
  icons: Icons;
  name: string;
  totalUsers: number;
}

export interface GetAirdropSuggestionsResponse {
  meta: {
    maxUserAllocations: number;
  };
  data: {
    personalizedCohorts: PersonalizedCohort[];
    predefinedCohorts: PredefinedCohort[];
    suggestedUsers: SuggestedUser[];
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
