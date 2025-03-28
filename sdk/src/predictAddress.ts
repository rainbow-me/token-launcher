import { getRainbowSuperTokenFactory } from './utils/getRainbowSuperTokenFactory';
import { SDKConfig, ViemClient } from './types';
import { Hex, Address, zeroHash } from 'viem';

export const predictTokenAddress = async (
  params: {
    merkleroot: Hex;
    salt: Hex;
    client: ViemClient;
    creator: Address;
    name: string;
    symbol: string;
    supply: bigint;
  },
  config: SDKConfig
): Promise<string> => {
  const factory = await getRainbowSuperTokenFactory(params.client, config);
  const creator = params.creator || params.client.account.address;
  const merkleroot = params.merkleroot ?? zeroHash;

  return factory.read.predictTokenAddress([
    creator,
    params.name,
    params.symbol,
    merkleroot,
    params.supply,
    params.salt,
  ]);
};
