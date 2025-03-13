import {
  DeployRainbowSuperTokenResponse,
  LaunchTokenParams,
  SDKConfig,
  LaunchTokenResponse,
  LaunchTokenAndBuyParams,
} from './types';
import { getRainbowSuperTokenFactory } from './utils/getRainbowSuperTokenFactory';
import { TransactionRequest } from '@ethersproject/providers';
import { HashZero } from '@ethersproject/constants';
import { submitRainbowSuperToken } from './api';
import { findValidSalt } from './utils/findValidSalt';
import { TokenLauncherSDKError, TokenLauncherErrorCode, throwTokenLauncherError } from './errors'; // Import the error utilities

/**
 * Core function to handle common functionality for token launch operations
 */
async function prepareTokenLaunch(
  params: LaunchTokenParams,
  config: SDKConfig,
  operation: 'launch' | 'launchAndBuy'
): Promise<{
  factory: any;
  creator: string;
  enrichedParams: LaunchTokenParams & { merkleRoot?: string; salt?: string };
  tokenUri: string;
  tokenAddress: string;
}> {
  // Validate required parameters
  const requiredParams = ['name', 'symbol', 'supply', 'initialTick', 'logoUrl'];
  if (operation === 'launchAndBuy') {
    requiredParams.push('amountIn');
  }

  for (const param of requiredParams) {
    if (!params[param as keyof LaunchTokenParams]) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.MISSING_REQUIRED_PARAM,
        `Missing required parameter: ${param}`,
        {
          operation:
            operation === 'launch' ? 'launchRainbowSuperToken' : 'launchRainbowSuperTokenAndBuy',
          params,
        }
      );
    }
  }

  // Get factory contract
  let factory;
  try {
    factory = await getRainbowSuperTokenFactory(params.wallet, config);
  } catch (error) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED,
      'Failed to get token factory contract',
      { operation: 'getRainbowSuperTokenFactory', originalError: error, source: 'chain' }
    );
  }

  const creator = params.creator || (await params.wallet.getAddress());

  let enrichedParams: LaunchTokenParams & { merkleRoot?: string; salt?: string } = params;
  let tokenUri = '';
  let tokenAddress = '';

  // Get submission details or generate salt for testing
  if (process.env.IS_TESTING !== 'true') {
    const submissionDetails = await getRainbowSuperTokenSubmissionDetails(
      {
        ...params,
        links: params.links || {},
      },
      config
    );
    tokenUri = submissionDetails.tokenURI;
    tokenAddress = submissionDetails.token.address;
    enrichedParams = {
      ...params,
      merkleRoot: submissionDetails.merkleRoot ?? HashZero,
      salt: submissionDetails.salt,
    };
  } else {
    try {
      const { salt } = await findValidSalt(
        factory,
        creator,
        params.name,
        params.symbol,
        HashZero,
        params.supply
      );
      enrichedParams = {
        ...params,
        merkleRoot: HashZero,
        salt,
      };
    } catch (error) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.INVALID_SALT,
        'Failed to find valid salt for token deployment',
        { operation: 'findValidSalt', originalError: error, source: 'sdk' }
      );
    }
  }

  return {
    factory,
    creator,
    enrichedParams,
    tokenUri,
    tokenAddress,
  };
}

/**
 * Execute a token launch transaction
 */
async function executeTransaction(
  wallet: any,
  payload: TransactionRequest,
  operation: string
): Promise<any> {
  try {
    return await wallet.sendTransaction(payload);
  } catch (error) {
    // Identify common wallet errors
    const err = error as Error;
    if ((error as any).code === 'INSUFFICIENT_FUNDS') {
      throwTokenLauncherError(
        TokenLauncherErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient funds to complete transaction',
        { operation, originalError: err, source: 'chain', params: payload }
      );
    } else {
      throwTokenLauncherError(
        TokenLauncherErrorCode.TRANSACTION_FAILED,
        `Transaction failed: ${err.message || 'Unknown reason'}`,
        { operation, originalError: err, source: 'chain', params: payload }
      );
    }
  }
}

export const launchRainbowSuperToken = async (
  params: LaunchTokenParams,
  config: SDKConfig
): Promise<LaunchTokenResponse | undefined> => {
  try {
    const { factory, creator, enrichedParams, tokenUri, tokenAddress } = await prepareTokenLaunch(
      params,
      config,
      'launch'
    );

    // Populate transaction
    let populatedTx;
    try {
      populatedTx = await factory.populateTransaction.launchRainbowSuperToken(
        enrichedParams.name,
        enrichedParams.symbol,
        enrichedParams.merkleRoot ?? HashZero,
        enrichedParams.supply,
        enrichedParams.initialTick,
        enrichedParams.salt,
        creator
      );
    } catch (error) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED,
        'Failed to populate transaction for token launch',
        {
          operation: 'populateTransaction.launchRainbowSuperToken',
          originalError: error,
          source: 'chain',
          params,
        }
      );
    }

    // Prepare transaction payload
    const payload: TransactionRequest = {
      data: populatedTx.data,
      to: factory.address,
      from: await params.wallet.getAddress(),
      value: 0,
    };

    // Add transaction options if specified
    if (params.transactionOptions && params.transactionOptions.gasLimit) {
      payload.gasLimit = params.transactionOptions.gasLimit;
      payload.maxFeePerGas = params.transactionOptions.maxFeePerGas;
      payload.maxPriorityFeePerGas = params.transactionOptions.maxPriorityFeePerGas;
    }

    // Execute transaction
    const tx = await executeTransaction(params.wallet, payload, 'launchRainbowSuperToken');

    return {
      transaction: tx,
      tokenUri,
      tokenAddress,
    };
  } catch (error) {
    // If it's already our custom error, just re-throw it
    if (error instanceof TokenLauncherSDKError) {
      throw error;
    }

    // Otherwise wrap it in our custom error
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in launchRainbowSuperToken: ${(error as Error).message || String(error)}`,
      { operation: 'launchRainbowSuperToken', originalError: error, source: 'sdk', params }
    );
  }
};

export const launchRainbowSuperTokenAndBuy = async (
  params: LaunchTokenAndBuyParams,
  config: SDKConfig
): Promise<LaunchTokenResponse> => {
  try {
    const { factory, creator, enrichedParams, tokenUri, tokenAddress } = await prepareTokenLaunch(
      params,
      config,
      'launchAndBuy'
    );

    // Populate transaction
    let populatedTx;
    try {
      populatedTx = await factory.populateTransaction.launchRainbowSuperTokenAndBuy(
        enrichedParams.name,
        enrichedParams.symbol,
        enrichedParams.merkleRoot ?? HashZero,
        enrichedParams.supply,
        enrichedParams.initialTick,
        enrichedParams.salt,
        creator,
        params.amountIn
      );
    } catch (error) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED,
        'Failed to populate transaction for token launch and buy',
        {
          operation: 'populateTransaction.launchRainbowSuperTokenAndBuy',
          originalError: error,
          source: 'chain',
          params,
        }
      );
    }

    // Prepare transaction payload
    const payload: TransactionRequest = {
      data: populatedTx.data,
      to: factory.address,
      from: await params.wallet.getAddress(),
      value: params.amountIn,
    };

    // Add transaction options if specified
    if (params.transactionOptions && params.transactionOptions.gasLimit) {
      payload.gasLimit = params.transactionOptions.gasLimit;
      payload.maxFeePerGas = params.transactionOptions.maxFeePerGas;
      payload.maxPriorityFeePerGas = params.transactionOptions.maxPriorityFeePerGas;
    }

    // Execute transaction
    const tx = await executeTransaction(params.wallet, payload, 'launchRainbowSuperTokenAndBuy');

    return {
      transaction: tx,
      tokenUri,
      tokenAddress,
    };
  } catch (error) {
    // If it's already our custom error, just re-throw it
    if (error instanceof TokenLauncherSDKError) {
      throw error;
    }

    // Otherwise wrap it in our custom error
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in launchRainbowSuperTokenAndBuy: ${(error as Error).message ||
        String(error)}`,
      { operation: 'launchRainbowSuperTokenAndBuy', originalError: error, source: 'sdk', params }
    );
  }
};

const getRainbowSuperTokenSubmissionDetails = async (
  params: LaunchTokenParams,
  config: SDKConfig
): Promise<DeployRainbowSuperTokenResponse['data']> => {
  try {
    const creator = params.creator || (await params.wallet.getAddress());

    let chainId;
    try {
      chainId = await params.wallet.getChainId();
    } catch (error) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.WALLET_CONNECTION_ERROR,
        'Failed to get chain ID from wallet',
        { operation: 'wallet.getChainId', originalError: error, source: 'chain', params }
      );
    }

    const submissionDetailParams = {
      chainId,
      name: params.name,
      symbol: params.symbol,
      logoUrl: params.logoUrl,
      totalSupply: params.supply,
      description: params.description,
      links: params.links || {},
      creatorAddress: creator,
      airdropMetadata: params.airdropMetadata,
    };

    let submissionDetails;
    try {
      submissionDetails = await submitRainbowSuperToken(submissionDetailParams, config);
    } catch (error) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.API_REQUEST_FAILED,
        `Failed to submit token details to API: ${(error as Error).message || 'Unknown reason'}`,
        {
          operation: 'submitRainbowSuperToken',
          params: submissionDetailParams,
          originalError: error,
          source: 'api',
          chainId,
        }
      );
    }

    if (!submissionDetails.data) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.SUBMISSION_DETAILS_MISSING,
        `No submission details returned for token: ${params.name} (${params.symbol})`,
        {
          operation: 'submitRainbowSuperToken',
          params: submissionDetailParams,
          source: 'api',
          chainId,
        }
      );
    }

    return submissionDetails.data;
  } catch (error) {
    // If it's already our custom error, just re-throw it
    if (error instanceof TokenLauncherSDKError) {
      throw error;
    }

    // Otherwise wrap it in our custom error
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in getRainbowSuperTokenSubmissionDetails: ${(error as Error).message ||
        String(error)}`,
      {
        operation: 'getRainbowSuperTokenSubmissionDetails',
        originalError: error,
        source: 'sdk',
        params,
      }
    );
  }
};
