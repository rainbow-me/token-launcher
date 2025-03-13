import { SupportedNetwork } from '../types';
export const getFactorySupportedChains = (): SupportedNetwork[] => {
  // This is a fallback used for testing
  return [
    {
      chainId: 73571,
      contractAddress: '0x3531899b26827ae0421b71b61dcd43aefa347849',
    },
  ];
};
