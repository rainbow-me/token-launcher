import type { JsonRpcProvider } from '@ethersproject/providers';
import { formatEther } from '@ethersproject/units';
import type { Wallet } from '@ethersproject/wallet';
import { POOL_POSITIONS, type ClankerTokenV4 } from 'clanker-sdk';
import { Clanker } from 'clanker-sdk/v4';
import {
  createPublicClient,
  createWalletClient,
  http,
  type Account,
  type Address,
  type Chain,
  type PublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
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
import { validateToHexStrict } from '../utils';
import type { ClankerClientTypes, RewardRecipient, Social } from './types';

const supportedChains = [base.id] as const;

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
  chainId: NonNullable<ClankerTokenV4['chainId']>
): ClankerTokenV4 => {
  const description =
    (params.description?.length || 0) > 0 ? { description: params.description } : {};
  const socialMediaUrls = formatSocialMediaUrls(params.links || {});
  const metadata = {
    ...description,
    socialMediaUrls,
  };
  const rewards = getRewardsDetails(accountAddress);
  const tokenParams = {
    name: params.name,
    chainId,
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
  };

  return tokenParams;
};

const getClankerClient = async (
  wallet: Wallet,
  chain: Chain,
  operation: string
): Promise<ClankerClientTypes> => {
  const jsonRpcProvider = wallet.provider as JsonRpcProvider;
  const providerUrl = jsonRpcProvider.connection.url;
  const transport = http(providerUrl);

  const client: PublicClient = createPublicClient({ chain, transport });

  const privateKeyHex = validateToHexStrict('wallet key', wallet.privateKey, operation);
  const account: Account = privateKeyToAccount(privateKeyHex);
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const clankerClient = new Clanker({
    wallet: walletClient,
    publicClient: client,
  });

  return {
    chain: chain.id,
    accountAddress: account.address,
    clankerClient,
  };
};

async function launch(params: LaunchTokenParams, operation: string): Promise<LaunchTokenResponse> {
  try {
    const wallet = params.wallet;
    const { accountAddress, chain, clankerClient } = await getClankerClient(
      wallet,
      base,
      operation
    );
    const tokenParams = prepareTokenLaunchParameters(params, accountAddress, chain);

    if (params.amountIn && params.amountIn !== '0') {
      tokenParams.devBuy = { ethAmount: Number(formatEther(params.amountIn)) };
    }

    const { txHash, waitForTransaction, error } = await clankerClient.deploy(tokenParams);
    if (error) throw error;

    const { address: tokenAddress } = await waitForTransaction();
    const tx = await wallet.provider.getTransaction(txHash);

    return {
      transaction: tx,
      tokenUri: params.logoUrl,
      tokenAddress: tokenAddress!,
    };
  } catch (error) {
    if (error instanceof TokenLauncherSDKError) {
      throw error;
    }

    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in launchToken: ${(error as Error).message || String(error)}`,
      {
        operation,
        originalError: error,
        source: 'sdk',
        params: {
          protocol: params.protocol,
          name: params.name,
          symbol: params.symbol,
          amountIn: params.amountIn,
          logoUrl: params.logoUrl,
          description: params.description,
          links: params.links,
        },
      }
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
