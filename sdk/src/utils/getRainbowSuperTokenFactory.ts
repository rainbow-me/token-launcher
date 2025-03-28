import { Address, getContract, GetContractReturnType } from 'viem';
import { getFactorySupportedChains } from './getFactorySupportedChains';
import { rainbowSuperTokenFactoryAbi } from '../references/abi/RainbowSuperTokenFactory';
import { SDKConfig, ViemClient } from '../types';

export type RainbowSuperTokenFactory = GetContractReturnType<
  typeof rainbowSuperTokenFactoryAbi,
  ViemClient,
  Address
>;

export const getRainbowSuperTokenFactory = async (
  client: ViemClient,
  config: SDKConfig
): Promise<RainbowSuperTokenFactory> => {
  const chainId = client.chain.id;
  let factoryAddress;
  if (config.MODE === 'jest') {
    factoryAddress = getFactorySupportedChains().find(
      network => network.chainId === chainId
    )?.contractAddress;
  } else {
    factoryAddress = config.SUPPORTED_NETWORKS?.find(
      network => network.chainId === chainId
    )?.contractAddress;
  }

  if (!factoryAddress) {
    throw new Error(`No factory address found for chainId: ${chainId}`);
  }

  return getContract({
    address: factoryAddress as Address,
    abi: rainbowSuperTokenFactoryAbi,
    client,
  });
};
