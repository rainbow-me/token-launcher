import { getAirdropSuggestions } from '../src/api';
import { WALLET_VARS } from './references';

describe('getAirdropSuggestions', () => {
  it.skip('should fetch airdrop suggestions for a user', async () => {
    const response = await getAirdropSuggestions(WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS);

    // Verify response structure
    expect(response).toHaveProperty('data');
    expect(response.data).toHaveProperty('predefinedCohorts');
    expect(response.data).toHaveProperty('personalizedCohorts');
    expect(response.data).toHaveProperty('suggested');

    // Verify predefined cohorts structure
    if (response.data.predefinedCohorts.length > 0) {
      const cohort = response.data.predefinedCohorts[0];
      expect(cohort).toHaveProperty('id');
      expect(cohort).toHaveProperty('Name');
      expect(cohort).toHaveProperty('icons');
      expect(cohort).toHaveProperty('totalUsers');
      expect(cohort.icons).toHaveProperty('iconURL');
    }

    // Verify suggested users structure
    if (response.data.suggested.length > 0) {
      const user = response.data.suggested[0];
      expect(user).toHaveProperty('address');
      expect(user).toHaveProperty('pfpURL');
      expect(user).toHaveProperty('type');
      expect(user).toHaveProperty('typePfpURL');
    }
  });

// TODO: uncomment when data is no longer mocked on api side
//   it('should handle errors gracefully', async () => {
//     await expect(getAirdropSuggestions('invalid-address')).rejects.toThrow();
//   });
}); 