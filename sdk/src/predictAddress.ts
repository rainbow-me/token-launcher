import { Wallet } from '@ethersproject/wallet';
import { getRainbowSuperTokenFactory } from './utils/getRainbowSuperTokenFactory';
import { HashZero } from '@ethersproject/constants';
import { SDKConfig } from './types';

export const predictTokenAddress = async (
  params: {
    merkleroot: string;
    salt: string;
    wallet: Wallet;
    creator: string;
    name: string;
    symbol: string;
    supply: string;
  },
  config: SDKConfig
): Promise<string> => {
  const factory = await getRainbowSuperTokenFactory(params.wallet, config);
  const creator = params.creator || (await params.wallet.getAddress());
  const merkleroot = params.merkleroot ?? HashZero;

  return factory.predictTokenAddress(
    creator,
    params.name,
    params.symbol,
    merkleroot,
    params.supply,
    params.salt
  );
};
