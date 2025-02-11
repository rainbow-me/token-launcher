import { rainbowFetch } from '../utils/rainbowFetch';

export const getMerkleRootForCohorts = async (tokenUri: string, addresses: string[]): Promise<void> => {
  await rainbowFetch(`${process.env.API_URL_DEV}/v1/token/${tokenUri}/airdrop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ addresses }),
  });
}; 