import { ethers } from 'ethers';

export interface FeeConfig {
  creatorLPFeeBps: number;
  protocolBaseBps: number;
  creatorBaseBps: number;
  airdropBps: number;
  hasAirdrop: boolean;
  feeToken: string;
  creator: string;
}

export interface RainbowSuperTokenFactory extends ethers.Contract {
  // Core deployment functions
  launchRainbowSuperTokenAndBuy(
    name: string,
    symbol: string,
    merkleroot: string,
    supply: bigint,
    initialTick: number,
    salt: string,
    creator: string,
    amountIn: bigint,
    overrides?: ethers.Overrides
  ): Promise<ethers.ContractTransaction>;

  launchRainbowSuperToken(
    name: string,
    symbol: string,
    merkleroot: string,
    supply: bigint,
    initialTick: number,
    salt: string,
    creator: string
  ): Promise<ethers.ContractTransaction>;

  predictTokenAddress(
    creator: string,
    name: string,
    symbol: string,
    merkleroot: string,
    supply: bigint,
    salt: string
  ): Promise<string>;

  // Fee management
  collectFees(token: string): Promise<ethers.ContractTransaction>;
  claimCreatorFees(token: string, recipient: string): Promise<ethers.ContractTransaction>;
  claimProtocolFees(token: string, recipient: string): Promise<ethers.ContractTransaction>;

  // Getters
  tokenFeeConfig(token: string): Promise<FeeConfig>;
  tokenPositionIds(token: string): Promise<bigint>;
  defaultFeeConfig(): Promise<FeeConfig>;
  baseTokenURI(): Promise<string>;
  POOL_FEE(): Promise<number>;
  TICK_SPACING(): Promise<number>;

  // Admin functions
  setBaseTokenURI(newBaseTokenURI: string): Promise<ethers.ContractTransaction>;
  setNewPairToken(newPairToken: string): Promise<ethers.ContractTransaction>;
  setDefaultFeeConfig(newConfig: FeeConfig): Promise<ethers.ContractTransaction>;
  banName(name: string, status: boolean): Promise<ethers.ContractTransaction>;
  banTicker(ticker: string, status: boolean): Promise<ethers.ContractTransaction>;
  setNewTickSpacing(newPoolFee: number): Promise<ethers.ContractTransaction>;
} 