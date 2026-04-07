import { buildContext, buildMetadata, LiquidSDK } from 'liquid-sdk';
import type { Address } from 'viem';
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
import { INTERFACE } from '../constants';

const supportedChains = [base.id] as const;

function assertWalletClientAccount(
  walletClient: LaunchTokenParams['walletClient'],
  operation: string
): Address {
  const accountAddress = walletClient.account?.address;
  if (!accountAddress) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.MISSING_REQUIRED_PARAM,
      'walletClient must be created with a local account',
      { operation, source: 'sdk' }
    );
  }

  return accountAddress;
}

function buildSocialMediaUrls(links: Record<string, string> = {}) {
  return Object.entries(links).map(([platform, url]) => ({
    platform,
    url,
  }));
}

function buildLiquidDeployParams(params: LaunchTokenParams, accountAddress: Address) {
  const devBuy =
    params.amountIn && params.amountIn !== '0'
      ? {
          devBuy: {
            ethAmount: BigInt(params.amountIn),
            recipient: accountAddress,
          },
        }
      : {};

  return {
    name: params.name,
    symbol: params.symbol,
    tokenAdmin: accountAddress,
    image: params.logoUrl,
    metadata: buildMetadata({
      description: params.description,
      socialMediaUrls: buildSocialMediaUrls(params.links),
    }),
    context: buildContext({
      interface: INTERFACE,
      platform: 'liquid',
    }),
    rewardAdmins: [accountAddress],
    rewardRecipients: [accountAddress],
    rewardBps: [10_000],
    ...devBuy,
  } satisfies Parameters<LiquidSDK['deployToken']>[0];
}

function getLiquidClient(params: LaunchTokenParams, operation: string) {
  const accountAddress = assertWalletClientAccount(params.walletClient, operation);

  return {
    accountAddress,
    liquidClient: new LiquidSDK({
      walletClient: params.walletClient,
      publicClient: params.publicClient,
    }),
  };
}

async function launch(params: LaunchTokenParams, operation: string): Promise<LaunchTokenResponse> {
  try {
    const { accountAddress, liquidClient } = getLiquidClient(params, operation);
    const deployParams = buildLiquidDeployParams(params, accountAddress);
    const result = await liquidClient.deployToken(deployParams);

    return {
      txHash: result.txHash,
      tokenUri: params.logoUrl,
      tokenAddress: result.tokenAddress,
    };
  } catch (error) {
    if (error instanceof TokenLauncherSDKError) {
      throw error;
    }

    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in ${operation}: ${(error as Error).message || String(error)}`,
      { operation, originalError: error, source: 'sdk', params }
    );
  }
}

export const liquid: ProtocolAdapter = {
  supportedChains: Array.from(supportedChains),

  async launchToken(
    params: LaunchTokenParams,
    _config: SDKConfig,
    operation: string
  ): Promise<LaunchTokenResponse> {
    return launch(params, operation);
  },
};
