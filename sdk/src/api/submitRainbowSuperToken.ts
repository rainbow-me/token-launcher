import { rainbowFetch } from './utils/rainbowFetch';
import { DeployRainbowSuperTokenRequest, DeployRainbowSuperTokenResponse } from '../types';

export const submitRainbowSuperToken = async (
  payload: DeployRainbowSuperTokenRequest
): Promise<DeployRainbowSuperTokenResponse> => {
  return await rainbowFetch<DeployRainbowSuperTokenResponse>(`https://token-launcher-api.rainbowdotme.workers.dev/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};
