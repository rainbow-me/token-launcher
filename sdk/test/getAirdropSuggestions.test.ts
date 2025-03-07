import { TokenLauncher } from '../src';
import { GetAirdropSuggestionsResponse } from '../src/types';

describe('Get Airdrop Suggestions', () => {
  it('returns correctly structured response', async () => {
    const mockResponse: GetAirdropSuggestionsResponse = {
      meta: {
        maxUserAllocations: 1000
      },
      data: {
        personalizedCohorts: [{
          addresses: [{
            address: "0x053707b201385ae3421d450a1ff272952d2d6971",
            pfpURL: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0bd53899-d736-4856-3784-f233671d8300/original",
            type: "Farcaster",
            typeIconURL: "https://rainbowme-res.cloudinary.com/image/upload/v1697055518/dapps/ingested_www.farcaster.xyz.png",
            username: "proxystudio.eth"
          }],
          icons: {
            iconURL: "https://rainbowme-res.cloudinary.com/image/upload/v1740649731/token-launcher/backend/suggested_user_farcaster.png",
            pfpURLs: [
              "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0bd53899-d736-4856-3784-f233671d8300/original",
              "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/35af81fb-6e7f-42d9-b3f3-c3384899fe00/rectcrop3"
            ]
          },
          name: "Suggested Users",
          totalUsers: 102
        }],
        predefinedCohorts: [{
          icons: {
            iconURL: "https://rainbowme-res.cloudinary.com/image/upload/v1740649731/token-launcher/backend/rainbow_points_leaderboard.png",
            pfpURLs: [
              "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/2c84463b-21f9-46c6-e336-65d2deb9b200/original",
              "https://i.seadn.io/gae/7wWbxmncJ5CxzEr4f-JeVHqGd4zxP3hmw8LpGTLyo85vu3aFpq-oD_S0Xoi7yNB6x8KB0J77AQ0eK9RmlIiiWVoQGmNA1UkUk3OJ4Sw?w=500&auto=format"
            ]
          },
          id: "rainbow_points_leaderboard",
          name: "Rainbow Points Leaderboard",
          totalUsers: 1000
        }],
        suggestedUsers: [{
          address: "0x053707b201385ae3421d450a1ff272952d2d6971",
          pfpURL: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0bd53899-d736-4856-3784-f233671d8300/original",
          type: "Farcaster",
          typeIconURL: "https://rainbowme-res.cloudinary.com/image/upload/v1697055518/dapps/ingested_www.farcaster.xyz.png",
          username: "proxystudio.eth"
        }]
      }
    };

    // Mock the API call
    const getAirdropSuggestionsSpy = jest.spyOn(TokenLauncher, 'getAirdropSuggestions')
      .mockResolvedValue(mockResponse);

    const result = await TokenLauncher.getAirdropSuggestions('0x123');

    // Verify structure
    expect(result.meta.maxUserAllocations).toBeDefined();
    expect(result.data.personalizedCohorts).toBeInstanceOf(Array);
    expect(result.data.predefinedCohorts).toBeInstanceOf(Array);
    expect(result.data.suggestedUsers).toBeInstanceOf(Array);

    // Verify personalizedCohorts structure
    const personalizedCohort = result.data.personalizedCohorts[0];
    expect(personalizedCohort).toHaveProperty('addresses');
    expect(personalizedCohort).toHaveProperty('icons');
    expect(personalizedCohort.icons).toHaveProperty('iconURL');
    expect(personalizedCohort.icons).toHaveProperty('pfpURLs');
    expect(personalizedCohort).toHaveProperty('name');
    expect(personalizedCohort).toHaveProperty('totalUsers');

    // Verify predefinedCohorts structure
    const predefinedCohort = result.data.predefinedCohorts[0];
    expect(predefinedCohort).toHaveProperty('icons');
    expect(predefinedCohort.icons).toHaveProperty('iconURL');
    expect(predefinedCohort.icons).toHaveProperty('pfpURLs');
    expect(predefinedCohort).toHaveProperty('id');
    expect(predefinedCohort).toHaveProperty('name');
    expect(predefinedCohort).toHaveProperty('totalUsers');

    // Verify suggestedUsers structure
    const suggestedUser = result.data.suggestedUsers[0];
    expect(suggestedUser).toHaveProperty('address');
    expect(suggestedUser).toHaveProperty('pfpURL');
    expect(suggestedUser).toHaveProperty('type');
    expect(suggestedUser).toHaveProperty('typeIconURL');
    expect(suggestedUser).toHaveProperty('username');

    // Clean up
    getAirdropSuggestionsSpy.mockRestore();
  });
}); 