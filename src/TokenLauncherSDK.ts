import { ethers } from 'ethers';
import { rainbowFetch } from './utils/rainbowFetch';
import {
  GetRainbowSuperTokensResponse,
  GetRainbowSuperTokenResponse,
  DeployRainbowSuperTokenRequest,
  DeployRainbowSuperTokenResponse,
} from './types/api';
import { keccak256, toUtf8Bytes, randomBytes } from 'ethers';
import path from 'path';
import fs from 'fs';

interface SDKConfig {
  apiUrl: string;
  factoryAddress?: string;
}

interface LaunchTokenParams {
  name: string;
  symbol: string;
  merkleroot?: string; // Optional merkle root for airdrops
  supply: bigint;
  initialTick: number; // For setting initial price
  creator?: string; // Optional, defaults to signer address
  amountIn: bigint; // Amount of ETH/token to buy with
  salt: string;
  wallet: ethers.Signer;
}

export class TokenLauncherSDK {
  private readonly apiUrl: string;
  private readonly factoryAddress?: string;
  private factoryContract?: any;

  constructor(config: SDKConfig) {
    this.apiUrl = config.apiUrl;
    this.factoryAddress = config.factoryAddress;
  }

  private async getFactoryContract(wallet: ethers.Signer) {
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
      wallet
    );

    return this.factoryContract;
  }

  async launchRainbowSuperTokenAndBuy(
    params: LaunchTokenParams
  ): Promise<ethers.TransactionResponse> {
    const factory = await this.getFactoryContract(params.wallet);
    const creator = params.creator || await params.wallet.getAddress();
    const merkleroot = params.merkleroot ?? ethers.ZeroHash;
  
    const populatedTransactionData = await factory.launchRainbowSuperTokenAndBuy.populateTransaction(
      params.name,
      params.symbol,
      merkleroot,
      params.supply,
      params.initialTick,
      params.salt,
      creator,
      params.amountIn,
    );

    const payload = {
      data: populatedTransactionData.data,
      to: this.factoryAddress,
      from: await params.wallet.getAddress(),
      value: params.amountIn,
    };

    const tx = await params.wallet.sendTransaction(payload);
  
    return tx;
  }

  async getRainbowSuperTokenByUri(tokenUri: string): Promise<GetRainbowSuperTokenResponse> {
    const response = await rainbowFetch(`${this.apiUrl}/v1/token/${tokenUri}`, {
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });
    return response.json();
  }

  async getRainbowSuperTokens(): Promise<GetRainbowSuperTokensResponse> {
    const response = await rainbowFetch(`${this.apiUrl}/v1/token`, {
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });
    return response.json();
  }

  async submitRainbowSuperToken(payload: DeployRainbowSuperTokenRequest): Promise<DeployRainbowSuperTokenResponse> {
    const response = await rainbowFetch(`${this.apiUrl}/v1/token`, {
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
    await rainbowFetch(`${this.apiUrl}/v1/token/${tokenUri}/airdrop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
      body: JSON.stringify({ addresses }),
    });
  }
 
  // testing purposes only
  async _predictTokenAddress(
    params: Omit<LaunchTokenParams, 'amountIn' | 'initialTick'>
  ): Promise<string> {
    const factory = await this.getFactoryContract(params.wallet);
    const salt = keccak256(randomBytes(32));
    const creator = params.creator || await params.wallet.getAddress();
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
} 