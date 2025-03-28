import { getRainbowSuperTokenFactory } from './getRainbowSuperTokenFactory';
import { SDKConfig, ViemClient } from '../types';

interface FeeConfig {
  creatorLPFeeBps: number;
  protocolBaseBps: number;
  creatorBaseBps: number;
  airdropBps: number;
  hasAirdrop: boolean;
  feeToken: string;
  creator: string;
}

export async function getTokenLauncherContractConfig(
  client: ViemClient,
  config: SDKConfig
): Promise<FeeConfig> {
  const factory = await getRainbowSuperTokenFactory(client, config);
  const result = await factory.read.defaultFeeConfig();
  return {
    creatorLPFeeBps: result[0],
    protocolBaseBps: result[1],
    creatorBaseBps: result[2],
    airdropBps: result[3],
    hasAirdrop: result[4],
    feeToken: result[5],
    creator: result[6],
  };
}
