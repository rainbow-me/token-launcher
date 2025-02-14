import { rainbowFetch } from '../utils/rainbowFetch';
import { GetAirdropSuggestionsResponse } from '../types';

export const getAirdropSuggestions = async (
  userAddress: string
): Promise<GetAirdropSuggestionsResponse> => {
  const response = await rainbowFetch(
    `${process.env.API_URL_DEV}/v1/airdrop/${userAddress}/suggestions`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.json();
}; 