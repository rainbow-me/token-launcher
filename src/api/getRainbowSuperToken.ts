import { rainbowFetch } from '../utils/rainbowFetch';
import { GetRainbowSuperTokenResponse } from '../types';

export const getRainbowSuperTokenByUri = async (
  tokenUri: string
): Promise<GetRainbowSuperTokenResponse> => {
  const response = await rainbowFetch(`${process.env.API_URL_DEV}/v1/token/${tokenUri}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};
