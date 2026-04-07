import { ClankerTokenV4, POOL_POSITIONS } from 'clanker-sdk';
import { Clanker } from 'clanker-sdk/v4';
import {
  BaseError,
  ContractFunctionRevertedError,
  EstimateGasExecutionError,
  InsufficientFundsError,
  UserRejectedRequestError,
  type Address,
  formatEther,
} from 'viem';
import { base } from 'viem/chains';
import {
  TokenLauncherErrorCode,
  TokenLauncherSDKError,
  throwTokenLauncherError,
} from '../../errors';
import type {
  LaunchTokenParams,
  LaunchTokenResponse,
  ProtocolAdapter,
  SDKConfig,
} from '../../types/index';
import { INTERFACE, INTERFACE_REWARD_ADDRESS } from '../constants';
import type { ClankerClientTypes, RewardRecipient, Social } from './types';

const supportedChains = [base.id] as const;

function assertWalletClientAccount(
  walletClient: LaunchTokenParams['walletClient'],
  operation: string
): Address {
  const accountAddress = walletClient.account?.address;
  if (!accountAddress) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      'walletClient must be created with a local account',
      { operation, source: 'sdk' }
    );
  }

  return accountAddress;
}

const formatSocialMediaUrls = (links: Record<string, string>): Social[] => {
  return Object.entries(links).map(([platform, url]) => ({
    platform,
    url,
  }));
};

const getRewardsDetails = (creatorAddress: Address) => {
  const recipients: RewardRecipient[] = [
    {
      recipient: creatorAddress,
      admin: creatorAddress,
      bps: 5_000,
      token: 'Both',
    },
    {
      recipient: INTERFACE_REWARD_ADDRESS,
      admin: INTERFACE_REWARD_ADDRESS,
      bps: 5_000,
      token: 'Paired',
    },
  ];

  return { recipients };
};

const prepareTokenLaunchParameters = (
  params: LaunchTokenParams,
  accountAddress: Address,
  chainId: number
): ClankerTokenV4 => {
  const description =
    (params.description?.length || 0) > 0 ? { description: params.description } : {};
  const socialMediaUrls = formatSocialMediaUrls(params.links || {});
  const metadata = {
    ...description,
    socialMediaUrls,
  };
  const rewards = getRewardsDetails(accountAddress);
  const devBuy =
    params.amountIn && params.amountIn !== '0'
      ? { devBuy: { ethAmount: Number(formatEther(BigInt(params.amountIn))) } }
      : {};

  const tokenParams = {
    name: params.name,
    chainId: chainId as NonNullable<ClankerTokenV4['chainId']>,
    context: {
      interface: INTERFACE,
      platform: 'clanker',
    },
    pool: {
      positions: POOL_POSITIONS.Project,
    },
    rewards,
    symbol: params.symbol,
    tokenAdmin: accountAddress,
    image: params.logoUrl,
    metadata,
    ...devBuy,
  } satisfies ClankerTokenV4;

  return tokenParams;
};

const getClankerClient = (params: LaunchTokenParams, operation: string): ClankerClientTypes => {
  const accountAddress = assertWalletClientAccount(params.walletClient, operation);

  return {
    chainId: base.id,
    accountAddress,
    clankerClient: new Clanker({
      wallet: params.walletClient,
      publicClient: params.publicClient,
    }),
  };
};

async function launch(params: LaunchTokenParams, operation: string): Promise<LaunchTokenResponse> {
  try {
    const { accountAddress, chainId, clankerClient } = getClankerClient(params, operation);
    const tokenParams = prepareTokenLaunchParameters(params, accountAddress, chainId);

    const { txHash, waitForTransaction, error } = await clankerClient.deploy(tokenParams);
    if (error) throw error;

    const { address: tokenAddress, error: waitError } = await waitForTransaction();
    if (waitError) throw waitError;
    if (!tokenAddress) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.TRANSACTION_FAILED,
        'Deploy succeeded but no token address was returned',
        { operation, source: 'chain' }
      );
    }
    const tx = await params.publicClient.getTransaction({ hash: txHash });

    return {
      transaction: tx,
      tokenUri: params.logoUrl,
      tokenAddress,
    };
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

    // ClankerError wraps viem errors with classified .data
    const clankerError = error as { data?: { rawName?: string; label?: string }; error?: Error };
    if (clankerError.data?.rawName) {
      if (clankerError.data.rawName === 'InsufficientFundsError')
        throwTokenLauncherError(
          TokenLauncherErrorCode.INSUFFICIENT_FUNDS,
          clankerError.data.label || 'Insufficient funds',
          context('chain')
        );
      if (
        clankerError.data.rawName === 'unknown' &&
        clankerError.error instanceof EstimateGasExecutionError
      )
        throwTokenLauncherError(
          TokenLauncherErrorCode.GAS_ESTIMATION_FAILED,
          clankerError.data.label || 'Gas estimation failed',
          context('chain')
        );
      throwTokenLauncherError(
        TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED,
        clankerError.data.label || 'Contract interaction failed',
        context('chain')
      );
    }

    // Raw viem errors (from waitForTransaction — not wrapped by Clanker SDK)
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

export const clanker: ProtocolAdapter = {
  supportedChains: Array.from(supportedChains),

  async launchToken(
    params: LaunchTokenParams,
    _config: SDKConfig,
    operation: string
  ): Promise<LaunchTokenResponse> {
    return launch(params, operation);
  },
};
