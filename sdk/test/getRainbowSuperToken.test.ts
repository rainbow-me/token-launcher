import { getRainbowSuperTokens, getRainbowSuperTokenByUri } from '../src/api';

describe('Get Rainbow Super Tokens', () => {
  it.skip('get all rainbow super tokens', async () => {
    const tokens = await getRainbowSuperTokens({});
    expect(tokens.data.length).toBeGreaterThan(0);
  });

  it('get rainbow super token by uri', async () => {
    const response = await getRainbowSuperTokenByUri('123123-abcabc-123123', {});

    // Verify response structure
    expect(response).toHaveProperty('data');
    const data = response.data;

    // Verify all required token metadata fields
    expect(data).toHaveProperty('address');
    expect(data).toHaveProperty('chainId');
    expect(data).toHaveProperty('uri');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('symbol');
    expect(data).toHaveProperty('logoUrl');
    expect(data).toHaveProperty('totalSupply');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('links');
    expect(data).toHaveProperty('creatorAddress');

    // Verify data types
    expect(typeof data.address).toBe('string');
    expect(typeof data.chainId).toBe('number');
    expect(typeof data.uri).toBe('string');
    expect(typeof data.name).toBe('string');
    expect(typeof data.symbol).toBe('string');
    expect(typeof data.logoUrl).toBe('string');
    expect(typeof data.totalSupply).toBe('string');
    expect(typeof data.description).toBe('string');
    expect(Array.isArray(data.links)).toBe(true);
    expect(typeof data.creatorAddress).toBe('string');

    // Optional merkleRoot
    if (data.merkleRoot) {
      expect(typeof data.merkleRoot).toBe('string');
    }
  });
});
