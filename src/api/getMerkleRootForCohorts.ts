import { rainbowFetch } from '../utils/rainbowFetch';

export const getMerkleRootForCohorts = async (addresses: string[]): Promise<void> => {
  await rainbowFetch(`${process.env.API_URL_DEV}/v1/airdrop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ addresses }),
  });
};
