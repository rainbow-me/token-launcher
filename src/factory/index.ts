import { ethers } from 'ethers';
import { LaunchTokenParams } from '../types';
import path from 'path';
import fs from 'fs';

export const createRainbowTokenFactory = (factoryAddress: string) => {
  let factoryContract: ethers.Contract | undefined;

  const getFactoryContract = async (wallet: ethers.Signer) => {
    if (factoryContract) return factoryContract;

    const artifactPath = path.resolve(
      __dirname,
      '../../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json'
    );

    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact file not found at path: ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
    
    factoryContract = new ethers.Contract(
      factoryAddress,
      artifact.abi,
      wallet
    );

    return factoryContract;
  };

  return {
    async launchRainbowSuperTokenAndBuy(params: LaunchTokenParams): Promise<ethers.TransactionResponse> {
      const factory = await getFactoryContract(params.wallet);
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
        to: factoryAddress,
        from: await params.wallet.getAddress(),
        value: params.amountIn,
      };

      return params.wallet.sendTransaction(payload);
    },

    async predictTokenAddress(params: Omit<LaunchTokenParams, 'amountIn' | 'initialTick'>): Promise<string> {
      const factory = await getFactoryContract(params.wallet);
      const creator = params.creator || await params.wallet.getAddress();
      const merkleroot = params.merkleroot ?? ethers.ZeroHash;
      
      return factory.predictTokenAddress(
        creator,
        params.name,
        params.symbol,
        merkleroot,
        params.supply,
        params.salt
      );
    },
  };
};

export type RainbowTokenFactory = ReturnType<typeof createRainbowTokenFactory>;

export * from './launchToken';
export * from './predictAddress'; 