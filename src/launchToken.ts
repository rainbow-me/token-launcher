import type { JsonRpcProvider } from '@ethersproject/providers';
import {
  BaseError,
  ContractFunctionRevertedError,
  EstimateGasExecutionError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from 'viem';
import { protocols } from './protocols';
import type { LaunchTokenParams, LaunchTokenResponse, SDKConfig } from './types/index';
import { TokenLauncherErrorCode, TokenLauncherSDKError, throwTokenLauncherError } from './errors';

export async function launchToken(
  params: LaunchTokenParams,
  config: SDKConfig,
  operation: string
): Promise<LaunchTokenResponse> {
  const protocol = protocols[params.protocol];

  if (!protocol) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.INVALID_PROTOCOL,
      `Unsupported protocol: ${params.protocol}`,
      { operation, params: { protocol: params.protocol } }
    );
  }

  const provider = params.wallet.provider as JsonRpcProvider;
  const { chainId } = await provider.getNetwork();

  if (config.chains?.length && !config.chains.includes(chainId)) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID,
      `Chain ${chainId} is not in the SDK's configured chains`,
      { operation, params: { chainId } }
    );
  }

  if (!protocol.supportedChains.includes(chainId)) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID,
      `Protocol '${params.protocol}' does not support chain ${chainId}`,
      { operation, params: { chainId, protocol: params.protocol } }
    );
  }

  try {
    return await protocol.launchToken(params, config, operation);
  } catch (error) {
    if (error instanceof TokenLauncherSDKError) throw error;

    const context = (source: 'chain' | 'sdk') => ({
      operation,
      originalError: error,
      source,
      params: {
        protocol: params.protocol,
        name: params.name,
        symbol: params.symbol,
        amountIn: params.amountIn,
        logoUrl: params.logoUrl,
        description: params.description,
        links: params.links,
      },
    });

    if (error instanceof BaseError) {
      if (error.walk(e => e instanceof InsufficientFundsError))
        throwTokenLauncherError(
          TokenLauncherErrorCode.INSUFFICIENT_FUNDS,
          error.shortMessage,
          context('chain')
        );
      if (error.walk(e => e instanceof ContractFunctionRevertedError))
        throwTokenLauncherError(
          TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED,
          error.shortMessage,
          context('chain')
        );
      if (error.walk(e => e instanceof UserRejectedRequestError))
        throwTokenLauncherError(
          TokenLauncherErrorCode.WALLET_CONNECTION_ERROR,
          error.shortMessage,
          context('sdk')
        );
      if (error.walk(e => e instanceof EstimateGasExecutionError))
        throwTokenLauncherError(
          TokenLauncherErrorCode.GAS_ESTIMATION_FAILED,
          error.shortMessage,
          context('chain')
        );
      throwTokenLauncherError(
        TokenLauncherErrorCode.TRANSACTION_FAILED,
        error.shortMessage,
        context('chain')
      );
    }

    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in ${operation}: ${(error as Error).message || String(error)}`,
      context('sdk')
    );
  }
}
