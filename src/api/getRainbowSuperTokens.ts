import { rainbowFetch } from '../utils/rainbowFetch';
import { GetRainbowSuperTokensResponse } from '../types';

export const getRainbowSuperTokens = async (): Promise<GetRainbowSuperTokensResponse> => {
  const response = await rainbowFetch(`${process.env.API_URL_DEV}/v1/token`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};
