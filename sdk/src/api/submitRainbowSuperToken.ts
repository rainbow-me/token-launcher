import { rainbowFetch } from './utils/rainbowFetch';
import {
  DeployRainbowSuperTokenRequest,
  DeployRainbowSuperTokenResponse,
  SDKConfig,
} from '../types';

export const submitRainbowSuperToken = async (
  payload: DeployRainbowSuperTokenRequest,
  config: SDKConfig
): Promise<DeployRainbowSuperTokenResponse> => {
  let url;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  switch (config.MODE) {
    case 'jest':
    case 'development':
      url = config.API_URL_DEV || process.env.API_URL_DEV;
      headers.Authorization = `Bearer ${config.API_KEY_DEV}`;
      break;
    case 'production':
      url = config.API_URL_PROD || process.env.API_URL_PROD;
      headers.Authorization = `Bearer ${config.API_KEY_PROD}`;
      break;
    default:
      throw new Error('Invalid mode');
  }
  return await rainbowFetch(`${url}/v1/tokens/deploy`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
};
