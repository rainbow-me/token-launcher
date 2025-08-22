import { Clanker } from 'clanker-sdk/dist/v4/index.js';
import { ClankerTokenV4, FEE_CONFIGS, POOL_POSITIONS } from 'clanker-sdk';
import { Account, Address, Chain, Client, createWalletClient, createPublicClient, Hex, http, isHex, PublicClient, Transport, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Wallet } from '@ethersproject/wallet';
import { base } from 'viem/chains';
import {
  DeployRainbowSuperTokenResponse,
  LaunchTokenParams,
  SDKConfig,
  LaunchTokenResponse,
} from './types';
import { JsonRpcProvider, TransactionRequest } from '@ethersproject/providers';
import { HashZero } from '@ethersproject/constants';
import { formatEther } from "@ethersproject/units";
import { submitRainbowSuperToken } from './api';
import { findValidSalt } from './utils/findValidSalt';
import { TokenLauncherSDKError, TokenLauncherErrorCode, throwTokenLauncherError } from './errors'; // Import the error utilities

const allowedClankerChains = { [base.id]: base } as const;
type AllowedChainId = keyof typeof allowedClankerChains;
type AllowedChain = typeof allowedClankerChains[keyof typeof allowedClankerChains];

type Social = { platform: string; url: string };

type RewardRecipient = {
  admin: Address;
  recipient: Address;
  bps: number;
  token: 'Both' | 'Paired' | 'Clanker';
};

type ClankerClientTypes = {
  allowedChain: AllowedChain;
  accountAddress: Address;
  clankerClient: Clanker;
}

function validateToHexStrict(errorTag: string, s: string | undefined): Hex {
  if (s && isHex(s)) {
    return s as Hex;
  }
  throwTokenLauncherError(
    TokenLauncherErrorCode.INVALID_ADDRESS,
    `Expected 0x-prefixed hex string for address in launchV2TokenAndBuy`,
    { operation: 'launchV2TokenAndBuy', source: 'sdk', params: { errorTag } }
  );
};

const getRewardsDetails = (config: SDKConfig, creatorAddress: Address) => {
  const interfaceRewardAddress = validateToHexStrict('LAUNCHER_FEE_ADDRESS', config.LAUNCHER_FEE_ADDRESS || process.env.LAUNCHER_FEE_ADDRESS);

  const recipients: RewardRecipient[] = [
    {
      recipient: creatorAddress,
      admin: creatorAddress,
      bps: 5_000, // 50% of reward
      token: 'Both',
    },
    {
      recipient: interfaceRewardAddress,
      admin: interfaceRewardAddress,
      bps: 5_000, // 50% of reward
      token: 'Both',
    },
  ];

  const rewards = {
    recipients,
  };

  return rewards;
};

function toAllowedChain(chainId: number): AllowedChain {
  const allowedChain = allowedClankerChains[chainId as AllowedChainId];
  if (allowedChain) return allowedChain;

  throwTokenLauncherError(
    TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID,
    `Unsupported chainId: ${chainId}`,
    {
      operation: 'launchV2TokenAndBuy',
      params: { chainId },
    }
  );
}

const formatSocialMediaUrls = (links: Record<string, string>): Social[] => {
  return Object.entries(links).map(([platform, url]) => ({
    platform,
    url,
  }));
};

/**
 * Map from LaunchTokenParams to ClankerTokenV4
 */
const prepareTokenLaunchParameters = (
  params: LaunchTokenParams,
  config: SDKConfig,
  accountAddress: Address,
  allowedChain: AllowedChain,
): ClankerTokenV4 => {
  // Validate required parameters
  const requiredParams = ['name', 'symbol', 'logoUrl'];

  for (const param of requiredParams) {
    if (!params[param as keyof LaunchTokenParams]) {
      throwTokenLauncherError(
        TokenLauncherErrorCode.MISSING_REQUIRED_PARAM,
        `Missing required parameter: ${param}`,
        {
          operation: 'launchV2TokenAndBuy',
          params,
        }
      );
    }
  }

  // Step 2: Map Rainbow params to Clanker params
  let devBuy = {};
  try {
    if (params.amountIn && params.amountIn !== '0') {
      const devBuyEthAmount = Number(formatEther(params.amountIn));
      devBuy = { devBuy: { ethAmount: devBuyEthAmount } };
    }
  } catch (error) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.INVALID_AMOUNT_IN_PARAM,
      `Error with parsing amountIn param in prepareTokenLaunchParameters : ${(error as Error).message ||
        String(error)}`,
      { operation: 'launchV2TokenAndBuy', originalError: error, source: 'sdk', params: params.amountIn }
    );
  }
  const description = (params.description?.length || 0) > 0 ? { description: params.description } : {};
  const socialMediaUrls = formatSocialMediaUrls(params.links || {});
  const metadata = {
    ...description,
    socialMediaUrls,
  };
  const context = {
    interface: config.LAUNCHER_CODE || process.env.LAUNCHER_CODE,
    platform: config.LAUNCHER_PLATFORM || process.env.LAUNCHER_PLATFORM,
  };
  const rewards = getRewardsDetails(config, accountAddress);
  const tokenParams = {
    name: params.name,
    chainId: allowedChain.id,
    context,
    fees: FEE_CONFIGS.DynamicBasic,
    pool: {
      positions: POOL_POSITIONS.Project,
    },
    rewards,
    symbol: params.symbol,
    tokenAdmin: accountAddress,
    image: params.logoUrl,
    metadata,
    ...devBuy,
  };

  console.log('token params sent to clanker', tokenParams);
  return tokenParams;
};

const getClankerClient = async (wallet: Wallet): Promise<ClankerClientTypes> => {
  const jsonRpcProvider = wallet.provider as JsonRpcProvider;
  const network = await jsonRpcProvider.getNetwork();
  const chainId = network.chainId;
  const allowedChain = toAllowedChain(chainId);
  const chain: Chain = allowedChain;

  const providerUrl = jsonRpcProvider.connection.url;
  const transport = http(providerUrl);

  const client: PublicClient = createPublicClient({ chain, transport });

  const privateKeyHex = validateToHexStrict('wallet key', wallet.privateKey)
  const account: Account = privateKeyToAccount(privateKeyHex);
  const walletClient: WalletClient<Transport, Chain, Account> = createWalletClient({ account, chain, transport });

  const clankerClient = new Clanker({
    wallet: walletClient,
    publicClient: client,
  });

  return {
    allowedChain,
    accountAddress: account.address,
    clankerClient,
  };
};

export const launchV2TokenAndBuy = async (
  params: LaunchTokenParams,
  config: SDKConfig
): Promise<LaunchTokenResponse> => {
  try {
    const wallet = params.wallet;
    const { accountAddress, allowedChain, clankerClient } = await getClankerClient(wallet);
    const tokenParams = prepareTokenLaunchParameters(
      params,
      config,
      accountAddress,
      allowedChain,
    );

    const { txHash, waitForTransaction, error } = await clankerClient.deploy(tokenParams);
    if (error) throw error;

    const { address: tokenAddress } = await waitForTransaction();
    const tx = await wallet.provider.getTransaction(txHash);
    console.log('tx', tx);

    return {
      transaction: tx,
      tokenUri: params.logoUrl,
      tokenAddress: tokenAddress || '',
    };
  } catch (error) {
    // If it's already our custom error, just re-throw it
    if (error instanceof TokenLauncherSDKError) {
      throw error;
    }

    // Otherwise wrap it in our custom error
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNKNOWN_ERROR,
      `Unexpected error in launchV2TokenAndBuy: ${(error as Error).message ||
        String(error)}`,
      { operation: 'launchV2TokenAndBuy', originalError: error, source: 'sdk', params }
    );
  }
};
