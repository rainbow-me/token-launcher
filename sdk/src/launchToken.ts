import { DeployRainbowSuperTokenResponse, LaunchTokenParams } from './types';
import { getRainbowSuperTokenFactory } from './utils/getRainbowSuperTokenFactory';
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers';
import { HashZero } from '@ethersproject/constants';
import { submitRainbowSuperToken } from './api';
import { findValidSalt } from './utils/findValidSalt';

export const launchRainbowSuperToken = async (
  params: LaunchTokenParams
): Promise<TransactionResponse> => {
  try {
    const factory = await getRainbowSuperTokenFactory(params.wallet);
    const creator = params.creator || (await params.wallet.getAddress());

    let enrichedParams: LaunchTokenParams & { merkleRoot?: string; salt?: string } = params;
    if (process.env.IS_TESTING !== 'true') {
      const submissionDetails = await getRainbowSuperTokenSubmissionDetails(params);
      enrichedParams = {
        ...params,
        merkleRoot: submissionDetails.merkleRoot ?? HashZero,
        salt: submissionDetails.salt,
      };
    } else {
      const { salt } = await findValidSalt(factory, creator, params.name, params.symbol, HashZero, params.supply);
      enrichedParams = {
        ...params,
        merkleRoot: HashZero,
        salt,
      };
    }

    const populatedTx = await factory.populateTransaction.launchRainbowSuperToken(
      enrichedParams.name,
      enrichedParams.symbol,
      enrichedParams.merkleRoot ?? HashZero,
      enrichedParams.supply,
      enrichedParams.initialTick,
      enrichedParams.salt,
      creator
    );

    // This function is non-payable so we send a value of 0.
    const payload: TransactionRequest = {
      data: populatedTx.data,
      to: factory.address,
      from: await params.wallet.getAddress(),
      value: 0,
    };

    if (params.transactionOptions && params.transactionOptions.gasLimit) {
      payload.gasLimit = params.transactionOptions.gasLimit;
      payload.maxFeePerGas = params.transactionOptions.maxFeePerGas;
      payload.maxPriorityFeePerGas = params.transactionOptions.maxPriorityFeePerGas;
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
    const factory = await getRainbowSuperTokenFactory(params.wallet);
    const creator = params.creator || (await params.wallet.getAddress());
    let enrichedParams: LaunchTokenParams & { merkleRoot?: string; salt?: string } = params;
    if (process.env.IS_TESTING !== 'true') {
      const submissionDetails = await getRainbowSuperTokenSubmissionDetails(params);
      enrichedParams = {
        ...params,
        merkleRoot: submissionDetails.merkleRoot ?? HashZero,
        salt: submissionDetails.salt,
      };
    } else {
      const { salt } = await findValidSalt(factory, creator, params.name, params.symbol, HashZero, params.supply);
      enrichedParams = {
        ...params,
        merkleRoot: HashZero,
        salt,
      };
    }

    const populatedTx = await factory.populateTransaction.launchRainbowSuperTokenAndBuy(
      enrichedParams.name,
      enrichedParams.symbol,
      enrichedParams.merkleRoot ?? HashZero,
      enrichedParams.supply,
      enrichedParams.initialTick,
      enrichedParams.salt,
      creator,
      params.amountIn
    );

    const payload: TransactionRequest = {
      data: populatedTx.data,
      to: factory.address,
      from: await params.wallet.getAddress(),
      value: params.amountIn,
    };

    if (params.transactionOptions && params.transactionOptions.gasLimit) {
      payload.gasLimit = params.transactionOptions.gasLimit;
      payload.maxFeePerGas = params.transactionOptions.maxFeePerGas;
      payload.maxPriorityFeePerGas = params.transactionOptions.maxPriorityFeePerGas;
    }

    const tx = await params.wallet.sendTransaction(payload);
    return tx;
  } catch (error) {
    console.error('Error in launchRainbowSuperTokenAndBuy:', error);
    throw error;
  }
};

const getRainbowSuperTokenSubmissionDetails = async (
  params: LaunchTokenParams
): Promise<DeployRainbowSuperTokenResponse['data']> => {
  const creator = params.creator || (await params.wallet.getAddress());
  const chainId = await params.wallet.getChainId();
  const submissionDetailParams = {
    chainId,
    name: params.name,
    symbol: params.symbol,
    logoUrl: params.logoUrl || 'http://example.com/logo.png',
    totalSupply: params.supply,
    description: params.description || 'This is a test token.',
    links: params.links || [],
    creatorAddress: creator,
  };

  try {
    const submissionDetails = await submitRainbowSuperToken(submissionDetailParams);
    if (!submissionDetails.data) {
      throw new Error(`No submission details returned for params: ${JSON.stringify(submissionDetailParams)}`);
    }
    return submissionDetails.data;
  } catch (error) {
    console.error('Error in getRainbowSuperTokenSubmissionDetails:', error);
    throw error;
  }
};
