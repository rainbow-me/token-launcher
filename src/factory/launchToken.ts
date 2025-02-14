import { LaunchTokenParams } from '../types';
import { getFactoryContract } from './utils/getFactoryContract';
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers';
import { HashZero } from '@ethersproject/constants';
import { BigNumber } from '@ethersproject/bignumber';

// Helper to get the gas buffer percentage (default 10%)
const getGasBuffer = (): number => {
  const buffer = process.env.GAS_BUFFER_PERCENTAGE;
  return buffer ? parseInt(buffer) : 10;
};

export const launchRainbowSuperToken = async (
  params: LaunchTokenParams
): Promise<TransactionResponse> => {
  try {
    const factory = await getFactoryContract(params.wallet);
    const factoryAddress = process.env.FACTORY_ADDRESS || (await factory.getAddress());
    const creator = params.creator || (await params.wallet.getAddress());
    const merkleroot = params.merkleroot ?? HashZero;

    const populatedTx = await factory.populateTransaction.launchRainbowSuperToken(
      params.name,
      params.symbol,
      merkleroot,
      params.supply,
      params.initialTick,
      params.salt,
      creator
    );

    // This function is non-payable so we send a value of 0.
    const payload: TransactionRequest = {
      data: populatedTx.data,
      to: factoryAddress,
      from: await params.wallet.getAddress(),
      value: 0,
    };

    try {
      if (params.transactionOptions && params.transactionOptions.gasLimit) {
        payload.gasLimit = params.transactionOptions.gasLimit;
        payload.maxFeePerGas = params.transactionOptions.maxFeePerGas;
        payload.maxPriorityFeePerGas = params.transactionOptions.maxPriorityFeePerGas;
      } else {
        const estimatedGas = await params.wallet.provider?.estimateGas(payload);
        const gasBuffer = getGasBuffer();
        payload.gasLimit = estimatedGas?.mul(BigNumber.from(100 + gasBuffer)).div(BigNumber.from(100));
      }
    } catch (error) {
      console.log('Failed to estimate gas:', error);
    }

    const tx = await params.wallet.sendTransaction(payload);
    return tx;
  } catch (error) {
    console.error('Error in launchRainbowSuperToken:', error);
    throw error;
  }
};

export const launchRainbowSuperTokenAndBuy = async (
  params: LaunchTokenParams
): Promise<TransactionResponse> => {
  try {
    const factory = await getFactoryContract(params.wallet);
    const factoryAddress = process.env.FACTORY_ADDRESS || (await factory.getAddress());
    const creator = params.creator || (await params.wallet.getAddress());
    const merkleroot = params.merkleroot ?? HashZero;

    const populatedTx = await factory.populateTransaction.launchRainbowSuperTokenAndBuy(
      params.name,
      params.symbol,
      merkleroot,
      params.supply,
      params.initialTick,
      params.salt,
      creator,
      params.amountIn
    );

    const payload: TransactionRequest = {
      data: populatedTx.data,
      to: factoryAddress,
      from: await params.wallet.getAddress(),
      value: params.amountIn,
    };

    try {
      if (params.transactionOptions && params.transactionOptions.gasLimit) {
        payload.gasLimit = params.transactionOptions.gasLimit;
        payload.maxFeePerGas = params.transactionOptions.maxFeePerGas;
        payload.maxPriorityFeePerGas = params.transactionOptions.maxPriorityFeePerGas;
      } else {
        const estimatedGas = await params.wallet.provider?.estimateGas(payload);
        const gasBuffer = getGasBuffer();
        payload.gasLimit = estimatedGas?.mul(BigNumber.from(100 + gasBuffer)).div(BigNumber.from(100));
      }
    } catch (error) {
      console.log('Failed to estimate gas:', error);
    }

    const tx = await params.wallet.sendTransaction(payload);
    return tx;
  } catch (error) {
    console.error('Error in launchRainbowSuperTokenAndBuy:', error);
    throw error;
  }
};
