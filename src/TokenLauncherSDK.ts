import { ethers } from 'ethers';
import { fetchWithRetry } from './utils/fetchWithRetry';
import {
  GetTokensResponse,
  GetTokenResponse,
  DeployTokenRequest,
  DeployTokenResponse,
} from './types/api';
import { keccak256, toUtf8Bytes, randomBytes } from 'ethers';
import path from 'path';
import fs from 'fs';

interface SDKConfig {
  apiUrl: string;
  provider: ethers.Provider;
  factoryAddress?: string;
  isProduction?: boolean;
  logger?: Console;
}

interface LaunchTokenParams {
  name: string;
  symbol: string;
  merkleroot?: string; // Optional merkle root for airdrops
  supply: bigint;
  initialTick: number; // For setting initial price
  creator?: string; // Optional, defaults to signer address
  amountIn: bigint; // Amount of ETH/token to buy with
  signer: ethers.Signer;
}

export class TokenLauncherSDK {
  private readonly apiUrl: string;
  private readonly provider: ethers.Provider;
  private readonly factoryAddress?: string;
  private readonly logger: Console;
  private readonly isProduction: boolean;
  private factoryContract?: any;

  constructor(config: SDKConfig) {
    this.apiUrl = config.apiUrl;
    this.provider = config.provider;
    this.factoryAddress = config.factoryAddress;
    this.logger = config.logger || console;
    this.isProduction = config.isProduction || false;
  }

  private async getFactoryContract(signer: ethers.Signer) {
    if (this.factoryContract) return this.factoryContract;

    const artifactPath = path.resolve(
      __dirname,
      '../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json'
    );

    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact file not found at path: ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
    
    if (!this.factoryAddress) {
      throw new Error('Factory address not provided');
    }

    this.factoryContract = new ethers.Contract(
      this.factoryAddress,
      artifact.abi,
      signer
    );

    return this.factoryContract;
  }

  private generateSalt(): string {
    return keccak256(randomBytes(32));
  }

  async launchRainbowSuperTokenAndBuy(
    params: LaunchTokenParams
  ): Promise<ethers.TransactionResponse> {
    const factory = await this.getFactoryContract(params.signer);
    const creator = params.creator || await params.signer.getAddress();
    const merkleroot = params.merkleroot
      ? keccak256(toUtf8Bytes(params.merkleroot))
      : ethers.ZeroHash;
  
    let salt: string;
    let predictedAddress: string;
    // Get the default pair token address from the factory contract.
    const defaultPairTokenAddr = await factory.defaultPairToken();
  
    // Loop until the predicted token address is <= the default pair token address.
    do {
      salt = this.generateSalt();
      predictedAddress = await factory.predictTokenAddress(
        creator,
        params.name,
        params.symbol,
        merkleroot,
        params.supply,
        salt
      );
    } while (BigInt(predictedAddress) > BigInt(defaultPairTokenAddr));
  
    const populatedTransactionData = await factory.launchRainbowSuperTokenAndBuy.populateTransaction(
      params.name,
      params.symbol,
      merkleroot,
      params.supply,
      params.initialTick,
      salt,
      creator,
      params.amountIn,
    );

    const payload = {
      data: populatedTransactionData.data,
      to: this.factoryAddress,
      from: await params.signer.getAddress(),
      value: params.amountIn,
    };

    const tx = await params.signer.sendTransaction(payload);
  
    return tx;
  }

  async predictTokenAddress(
    params: Omit<LaunchTokenParams, 'amountIn' | 'initialTick'>
  ): Promise<string> {
    const factory = await this.getFactoryContract(params.signer);
    const salt = this.generateSalt();
    const creator = params.creator || await params.signer.getAddress();
    const merkleroot = params.merkleroot ? keccak256(toUtf8Bytes(params.merkleroot)) : ethers.ZeroHash;
    
    return await factory.predictTokenAddress(
      creator,
      params.name,
      params.symbol,
      merkleroot,
      params.supply,
      salt
    );
  }

  async getRainbowSuperTokenByUri(tokenUri: string): Promise<GetTokenResponse> {
    const response = await fetchWithRetry(`${this.apiUrl}/v1/token/${tokenUri}`, {
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });
    return response.json();
  }

  async getRainbowSuperTokens(): Promise<GetTokensResponse> {
    const response = await fetchWithRetry(`${this.apiUrl}/v1/token`, {
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });
    return response.json();
  }

  async submitRainbowSuperToken(payload: DeployTokenRequest): Promise<DeployTokenResponse> {
    const response = await fetchWithRetry(`${this.apiUrl}/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  }

  async getMerkleRootForCohorts(tokenUri: string, addresses: string[]): Promise<void> {
    await fetchWithRetry(`${this.apiUrl}/v1/token/${tokenUri}/airdrop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
      body: JSON.stringify({ addresses }),
    });
  }
} 