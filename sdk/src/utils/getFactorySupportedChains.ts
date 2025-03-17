import { SupportedNetwork } from '../types';
export const getFactorySupportedChains = (): SupportedNetwork[] => {
  // This is a fallback used for testing
  return [
    {
      chainId: 73571,
      contractAddress: '0xb80a86E9c4Ac6e85a35178486A687dC9aa619235',
    },
  ];
};
