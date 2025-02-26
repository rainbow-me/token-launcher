import { rainbowFetch } from './utils/rainbowFetch';
import { GetRainbowSuperTokensResponse, SDKConfig } from '../types';

export const getRainbowSuperTokens = async (config: SDKConfig): Promise<GetRainbowSuperTokensResponse> => {
  let url;
  let headers: HeadersInit = {
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
  return await rainbowFetch(`${url}/v1/tokens`, {
    headers,
  });
};
