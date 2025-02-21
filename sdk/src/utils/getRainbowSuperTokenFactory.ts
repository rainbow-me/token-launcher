import path from 'path';
import fs from 'fs';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { getFactorySupportedChains } from './getFactorySupportedChains';
import rainbowSuperTokenFactoryAbi from '../references/abi/RainbowSuperTokenFactory.json';

export const getRainbowSuperTokenFactory = async (wallet: Wallet): Promise<Contract> => {
  const chainId = await wallet.getChainId();
  const factoryAddress = getFactorySupportedChains()[chainId]?.factoryAddress;

  if (!factoryAddress) {
    throw new Error(`No factory address found for chainId: ${chainId}`);
  }

  return new Contract(factoryAddress, rainbowSuperTokenFactoryAbi.abi, wallet);
};