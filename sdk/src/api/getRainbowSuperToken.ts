import { rainbowFetch } from './utils/rainbowFetch';
import { GetRainbowSuperTokenResponse } from '../types';

export const getRainbowSuperTokenByUri = async (
  tokenUri: string
): Promise<GetRainbowSuperTokenResponse> => {
  return await rainbowFetch<GetRainbowSuperTokenResponse>(`https://token-launcher-api.rainbowdotme.workers.dev/v1/token/${tokenUri}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
