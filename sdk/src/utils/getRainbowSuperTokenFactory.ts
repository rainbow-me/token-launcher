import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { getFactorySupportedChains } from './getFactorySupportedChains';
import rainbowSuperTokenFactoryAbi from '../references/abi/RainbowSuperTokenFactory.json';
import { SDKConfig } from '../types';

export const getRainbowSuperTokenFactory = async (
  wallet: Wallet,
  config: SDKConfig
): Promise<Contract> => {
  const chainId = await wallet.getChainId();
  let factoryAddress;
  if (config.MODE === 'jest') {
    factoryAddress = getFactorySupportedChains().find(network => network.chainId === chainId)
      ?.contractAddress;
  } else {
    factoryAddress = config.SUPPORTED_NETWORKS?.find(network => network.chainId === chainId)
      ?.contractAddress;
  }

  if (!factoryAddress) {
    throw new Error(`No factory address found for chainId: ${chainId}`);
  }

  return new Contract(factoryAddress, rainbowSuperTokenFactoryAbi.abi, wallet);
};
