import { ethers } from 'ethers';
import { LaunchTokenParams } from '../types';
import { getFactoryContract } from './utils/getFactoryContract';

export const launchRainbowSuperTokenAndBuy = async (
  params: LaunchTokenParams
): Promise<ethers.TransactionResponse> => {
  const factory = await getFactoryContract(params.wallet);
  const factoryAddress = process.env.FACTORY_ADDRESS || await factory.getAddress();
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
}; 