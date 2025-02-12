import { Contract } from '@ethersproject/contracts';
import { Signer } from '@ethersproject/abstract-signer';
import { Transaction } from '@ethersproject/transactions';
import { HashZero } from '@ethersproject/constants';
import { LaunchTokenParams } from '../types';
import path from 'path';
import fs from 'fs';

export const createRainbowTokenFactory = (factoryAddress: string) => {
  let factoryContract: Contract | undefined;

  const getFactoryContract = async (wallet: Signer) => {
    if (factoryContract) return factoryContract;

    const artifactPath = path.resolve(
      __dirname,
      '../../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json'
    );

    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact file not found at path: ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
    
    factoryContract = new Contract(
      factoryAddress,
      artifact.abi,
      wallet
    );

    return factoryContract;
  };

  return {
    async launchRainbowSuperTokenAndBuy(params: LaunchTokenParams): Promise<Transaction> {
      const factory = await getFactoryContract(params.wallet);
      const creator = params.creator || await params.wallet.getAddress();
      const merkleroot = params.merkleroot ?? HashZero;
    
      const populatedTransactionData = await factory.populateTransaction.launchRainbowSuperTokenAndBuy(
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
      const merkleroot = params.merkleroot ?? HashZero;
      
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