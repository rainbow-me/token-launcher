import { rainbowFetch } from './utils/rainbowFetch';
import { GetRainbowSuperTokenResponse, SDKConfig } from '../types';

export const getRainbowSuperTokenByUri = async (
  tokenUri: string,
  config: SDKConfig
): Promise<GetRainbowSuperTokenResponse> => {
  let url;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  switch (config.MODE) {
    case 'jest':
    case 'development':
      url = config.API_URL_DEV || process.env.API_URL_DEV;
      break;
    case 'production':
      url = config.API_URL_PROD || process.env.API_URL_PROD;
      break;
    default:
      throw new Error('Invalid mode');
  }
  return await rainbowFetch(`${url}/v1/tokens/${tokenUri}`, {
    headers,
  });
};
