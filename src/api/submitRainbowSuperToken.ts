import { rainbowFetch } from '../utils/rainbowFetch';
import { DeployRainbowSuperTokenRequest, DeployRainbowSuperTokenResponse } from '../types';

export const submitRainbowSuperToken = async (
  payload: DeployRainbowSuperTokenRequest
): Promise<DeployRainbowSuperTokenResponse> => {
  const response = await rainbowFetch(`${process.env.API_URL_DEV}/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}; 