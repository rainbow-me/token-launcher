import {
  DeployRainbowSuperTokenResponse,
  LaunchTokenParams,
  SDKConfig,
  LaunchTokenResponse,
  LaunchTokenAndBuyParams,
  ViemClient,
} from './types';
import {
  getRainbowSuperTokenFactory,
  RainbowSuperTokenFactory,
} from './utils/getRainbowSuperTokenFactory';
import { submitRainbowSuperToken } from './api';
import { findValidSalt } from './utils/findValidSalt';
import { TokenLauncherSDKError, TokenLauncherErrorCode, throwTokenLauncherError } from './errors'; // Import the error utilities
import { TransactionRequest, zeroHash, Hex, Address, encodeFunctionData } from 'viem';
import { sendTransaction } from 'viem/actions';

/**
 * Core function to handle common functionality for token launch operations
 */
async function prepareTokenLaunch(
  params: LaunchTokenParams,
  config: SDKConfig,
  operation: 'launch' | 'launchAndBuy'
): Promise<{
  factory: RainbowSuperTokenFactory;
  creator: Address;
  enrichedParams: LaunchTokenParams & { merkleRoot?: Hex; salt?: Hex };
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
  const factory = await getRainbowSuperTokenFactory(params.client, config).catch(error => {
    throwTokenLauncherError(
      TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED,
      'Failed to get token factory contract',
      { operation: 'getRainbowSuperTokenFactory', originalError: error, source: 'chain' }
    );
  });

  const creator = params.creator || params.client.account.address;

  let enrichedParams: LaunchTokenParams & { merkleRoot?: Hex; salt?: Hex } = params;
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
      merkleRoot: submissionDetails.merkleRoot ?? zeroHash,
      salt: submissionDetails.salt,
    };
  } else {
    try {
      const { salt } = await findValidSalt(
        factory,
        creator,
        params.name,
        params.symbol,
        zeroHash,
        params.supply
      );
      enrichedParams = {
        ...params,
        merkleRoot: zeroHash,
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
  client: ViemClient,
  payload: TransactionRequest,
  operation: string
): Promise<Hex> {
  try {
    return await sendTransaction(client, payload);
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
    const data = encodeFunctionData({
      ...factory,
      functionName: 'launchRainbowSuperToken',
      args: [
        enrichedParams.name,
        enrichedParams.symbol,
        enrichedParams.merkleRoot ?? zeroHash,
        enrichedParams.supply,
        enrichedParams.initialTick ?? 0,
        enrichedParams.salt ?? zeroHash,
        creator,
      ],
    });

    // Prepare transaction payload
    const payload: TransactionRequest = {
      data,
      to: factory.address,
      from: params.client.account.address,
      value: 0n,
    };

    if (params.transactionOptions?.gas) {
      payload.gas = params.transactionOptions.gas;
    }

    if (params.transactionOptions?.gasPrice) {
      payload.gasPrice = params.transactionOptions.gasPrice;
    } else if (
      params.transactionOptions?.maxFeePerGas ||
      params.transactionOptions?.maxPriorityFeePerGas
    ) {
      payload.maxFeePerGas = params.transactionOptions.maxFeePerGas;
      payload.maxPriorityFeePerGas = params.transactionOptions.maxPriorityFeePerGas;
    }

    // Execute transaction
    const hash = await executeTransaction(params.client, payload, 'launchRainbowSuperToken');

    return {
      hash,
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
    const data = encodeFunctionData({
      ...factory,
      functionName: 'launchRainbowSuperTokenAndBuy',
      args: [
        enrichedParams.name,
        enrichedParams.symbol,
        enrichedParams.merkleRoot ?? zeroHash,
        enrichedParams.supply,
        enrichedParams.initialTick ?? 0,
        enrichedParams.salt ?? zeroHash,
        creator,
        params.amountIn,
      ],
    });

    // Prepare transaction payload
    const payload: TransactionRequest = {
      data,
      to: factory.address,
      from: params.client.account.address,
      value: params.amountIn,
    };

    if (params.transactionOptions?.gas) {
      payload.gas = params.transactionOptions.gas;
    }

    if (params.transactionOptions?.gasPrice) {
      payload.gasPrice = params.transactionOptions.gasPrice;
    } else if (
      params.transactionOptions?.maxFeePerGas ||
      params.transactionOptions?.maxPriorityFeePerGas
    ) {
      payload.maxFeePerGas = params.transactionOptions.maxFeePerGas;
      payload.maxPriorityFeePerGas = params.transactionOptions.maxPriorityFeePerGas;
    }

    // Execute transaction
    const hash = await executeTransaction(params.client, payload, 'launchRainbowSuperTokenAndBuy');

    return {
      hash,
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
      `Unexpected error in launchRainbowSuperTokenAndBuy: ${
        (error as Error).message || String(error)
      }`,
      { operation: 'launchRainbowSuperTokenAndBuy', originalError: error, source: 'sdk', params }
    );
  }
};

const getRainbowSuperTokenSubmissionDetails = async (
  params: LaunchTokenParams,
  config: SDKConfig
): Promise<DeployRainbowSuperTokenResponse['data']> => {
  try {
    const chainId = params.client.chain.id
    const creator = params.creator || params.client.account.address;

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
      `Unexpected error in getRainbowSuperTokenSubmissionDetails: ${
        (error as Error).message || String(error)
      }`,
      {
        operation: 'getRainbowSuperTokenSubmissionDetails',
        originalError: error,
        source: 'sdk',
        params,
      }
    );
  }
};
