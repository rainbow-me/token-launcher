import { LaunchTokenParams } from '../types';
import { getFactoryContract } from './utils/getFactoryContract';
import { Transaction } from '@ethersproject/transactions';
import { HashZero } from '@ethersproject/constants';

export const launchRainbowSuperTokenAndBuy = async (
  params: LaunchTokenParams
): Promise<Transaction> => {
  const factory = await getFactoryContract(params.wallet);
  const factoryAddress = process.env.FACTORY_ADDRESS || await factory.getAddress();
  const creator = params.creator || await params.wallet.getAddress();
  const merkleroot = params.merkleroot ?? HashZero;

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