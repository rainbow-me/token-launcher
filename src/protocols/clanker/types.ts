import type { Clanker } from 'clanker-sdk/v4';
import type { Address } from 'viem';

export type Social = { platform: string; url: string };

export type RewardRecipient = {
  admin: Address;
  recipient: Address;
  bps: number;
  token: 'Both' | 'Paired' | 'Clanker';
};

export type ClankerClientTypes = {
  chainId: number;
  accountAddress: Address;
  clankerClient: Clanker;
};
