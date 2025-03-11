import { DeployRainbowSuperTokenResponse, LaunchTokenParams, SDKConfig, LaunchTokenResponse } from './types';
import { getRainbowSuperTokenFactory } from './utils/getRainbowSuperTokenFactory';
import { TransactionRequest } from '@ethersproject/providers';
import { HashZero } from '@ethersproject/constants';
import { submitRainbowSuperToken } from './api';
import { findValidSalt } from './utils/findValidSalt';
import { TokenLauncherSDKError, TokenLauncherErrorCode, throwTokenLauncherError } from './errors'; // Import the error utilities

export const launchRainbowSuperToken = async (
  params: LaunchTokenParams,
  config: SDKConfig
): Promise<LaunchTokenResponse | undefined> => { 
  try {
    // Validate required parameters
    if (!params.name || !params.symbol || !params.supply || !params.initialTick || !params.logoUrl || !params.description) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.MISSING_REQUIRED_PARAM,
        "Missing required parameters for token launch",
        { operation: "launchRainbowSuperToken", params }
      );
    }

    let factory;
    try {
      factory = await getRainbowSuperTokenFactory(params.wallet, config);
    } catch (error) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED,
        "Failed to get token factory contract",
        { operation: "getRainbowSuperTokenFactory", originalError: error, source: "chain" }
      );
    }

    const creator = params.creator || (await params.wallet.getAddress());
    
    let enrichedParams: LaunchTokenParams & { merkleRoot?: string; salt?: string } = params;
    let tokenUri = '';
    let tokenAddress = '';

    if (process.env.IS_TESTING !== 'true') {
      try {
        const submissionDetails = await getRainbowSuperTokenSubmissionDetails(params, config);
        
        tokenUri = submissionDetails.tokenURI;
        tokenAddress = submissionDetails.token.address;
        enrichedParams = {
          ...params,
          merkleRoot: submissionDetails.merkleRoot ?? HashZero,
          salt: submissionDetails.salt,
        };
      } catch (error) {
        // Error is already formatted by the called function
        throw error;
      }
    } else {
      try {
        const { salt } = await findValidSalt(factory, creator, params.name, params.symbol, HashZero, params.supply);
        enrichedParams = {
          ...params,
          merkleRoot: HashZero,
          salt,
        };
      } catch (error) {
        throwTokenLauncherError(
          TokenLauncherErrorCode.INVALID_SALT,
          "Failed to find valid salt for token deployment",
          { operation: "findValidSalt", originalError: error, source: "sdk" }
        );
      }
    }

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
        "Failed to populate transaction for token launch",
        { operation: "populateTransaction.launchRainbowSuperToken", originalError: error, source: "chain" }
      );
    }

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

    let tx;
    try {
      tx = await params.wallet.sendTransaction(payload);
    } catch (error: any) {
      // Identify common wallet errors
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throwTokenLauncherError(
          TokenLauncherErrorCode.INSUFFICIENT_FUNDS,
          "Insufficient funds to complete transaction",
          { operation: "wallet.sendTransaction", originalError: error, source: "chain" }
        );
      } else {
        throwTokenLauncherError(
          TokenLauncherErrorCode.TRANSACTION_FAILED,
          `Transaction failed: ${error.message || 'Unknown reason'}`,
          { operation: "wallet.sendTransaction", originalError: error, source: "chain" }
        );
      }
    }

    return {
      transaction: tx,
      tokenUri,
      tokenAddress,
    };
  } catch (error: any) {
    // If it's already our custom error, just re-throw it
    if (error instanceof TokenLauncherSDKError) {
      throw error;
    }
    
    // Otherwise wrap it in our custom error
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in launchRainbowSuperToken: ${error.message || String(error)}`,
      { operation: "launchRainbowSuperToken", originalError: error, source: "sdk" }
    );
  }
};

export const launchRainbowSuperTokenAndBuy = async (
  params: LaunchTokenParams,
  config: SDKConfig
): Promise<LaunchTokenResponse> => {
  try {
    // Validate required parameters
    if (!params.name || !params.symbol || !params.supply || !params.initialTick || !params.amountIn) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.MISSING_REQUIRED_PARAM,
        "Missing required parameters for token launch and buy",
        { operation: "launchRainbowSuperTokenAndBuy", params }
      );
    }

    let factory;
    try {
      factory = await getRainbowSuperTokenFactory(params.wallet, config);
    } catch (error) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED,
        "Failed to get token factory contract",
        { operation: "getRainbowSuperTokenFactory", originalError: error, source: "chain" }
      );
    }

    const creator = params.creator || (await params.wallet.getAddress());
    let enrichedParams: LaunchTokenParams & { merkleRoot?: string; salt?: string } = params;
    let tokenUri = '';
    let tokenAddress = '';

    if (process.env.IS_TESTING !== 'true') {
      try {
        const submissionDetails = await getRainbowSuperTokenSubmissionDetails({
          ...params,
          links: params.links || {},
        }, config);
        tokenUri = submissionDetails.tokenURI;
        tokenAddress = submissionDetails.token.address;
        enrichedParams = {
          ...params,
          merkleRoot: submissionDetails.merkleRoot ?? HashZero,
          salt: submissionDetails.salt,
        };
      } catch (error) {
        // Error is already formatted by the called function
        throw error;
      }
    } else {
      try {
        const { salt } = await findValidSalt(factory, creator, params.name, params.symbol, HashZero, params.supply);
        enrichedParams = {
          ...params,
          merkleRoot: HashZero,
          salt,
        };
      } catch (error) {
        throwTokenLauncherError(
          TokenLauncherErrorCode.INVALID_SALT,
          "Failed to find valid salt for token deployment",
          { operation: "findValidSalt", originalError: error, source: "sdk" }
        );
      }
    }

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
        "Failed to populate transaction for token launch and buy",
        { operation: "populateTransaction.launchRainbowSuperTokenAndBuy", originalError: error, source: "chain" }
      );
    }

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

    let tx;
    try {
      tx = await params.wallet.sendTransaction(payload);
    } catch (error: any) {
      // Identify common wallet errors
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throwTokenLauncherError(
          TokenLauncherErrorCode.INSUFFICIENT_FUNDS,
          "Insufficient funds to complete transaction",
          { operation: "wallet.sendTransaction", originalError: error, source: "chain" }
        );
      } else {
        throwTokenLauncherError(
          TokenLauncherErrorCode.TRANSACTION_FAILED,
          `Transaction failed: ${error.message || 'Unknown reason'}`,
          { operation: "wallet.sendTransaction", originalError: error, source: "chain" }
        );
      }
    }

    return {
      transaction: tx,
      tokenUri,
      tokenAddress,
    };
  } catch (error: any) {
    // If it's already our custom error, just re-throw it
    if (error instanceof TokenLauncherSDKError) {
      throw error;
    }
    
    // Otherwise wrap it in our custom error
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in launchRainbowSuperTokenAndBuy: ${error.message || String(error)}`,
      { operation: "launchRainbowSuperTokenAndBuy", originalError: error, source: "sdk" }
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
        "Failed to get chain ID from wallet",
        { operation: "wallet.getChainId", originalError: error, source: "chain" }
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
    } catch (error: any) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.API_REQUEST_FAILED,
        `Failed to submit token details to API: ${error.message || 'Unknown reason'}`,
        { operation: "submitRainbowSuperToken", params: submissionDetailParams, originalError: error, source: "api", chainId }
      );
    }

    if (!submissionDetails.data) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.SUBMISSION_DETAILS_MISSING,
        `No submission details returned for token: ${params.name} (${params.symbol})`,
        { operation: "submitRainbowSuperToken", params: submissionDetailParams, source: "api", chainId }
      );
    }
    
    return submissionDetails.data;
  } catch (error: any) {
    // If it's already our custom error, just re-throw it
    if (error instanceof TokenLauncherSDKError) {
      throw error;
    }
    
    // Otherwise wrap it in our custom error
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in getRainbowSuperTokenSubmissionDetails: ${error.message || String(error)}`,
      { operation: "getRainbowSuperTokenSubmissionDetails", originalError: error, source: "sdk" }
    );
  }
};
