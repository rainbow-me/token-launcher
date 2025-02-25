import { rainbowFetch } from './utils/rainbowFetch';
import { GetRainbowSuperTokensResponse } from '../types';

export const getRainbowSuperTokens = async (): Promise<GetRainbowSuperTokensResponse> => {
  return await rainbowFetch<GetRainbowSuperTokensResponse>(`https://token-launcher-api.rainbowdotme.workers.dev/v1/token`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
