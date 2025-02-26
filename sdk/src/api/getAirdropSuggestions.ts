import { rainbowFetch } from './utils/rainbowFetch';
import { GetAirdropSuggestionsResponse } from '../types';

export const getAirdropSuggestions = async (
  userAddress: string
): Promise<GetAirdropSuggestionsResponse> => {
  return await rainbowFetch(
    `https://token-launcher-api.rainbowdotme.workers.dev/airdrop/${userAddress}/suggestions`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}; 