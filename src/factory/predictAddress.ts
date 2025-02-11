import { ethers } from 'ethers';
import { LaunchTokenParams } from '../types';
import { getFactoryContract } from './utils/getFactoryContract';

export const predictTokenAddress = async (
  params: Omit<LaunchTokenParams, 'amountIn' | 'initialTick'>
): Promise<string> => {
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
}; 