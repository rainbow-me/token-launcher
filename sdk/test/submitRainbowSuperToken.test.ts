import { submitRainbowSuperToken } from '../src/api';

describe('submitRainbowSuperToken', () => {
  it.skip('should submit token metadata and receive deployment info', async () => {
    const request = {
      chainId: 73571,
      name: 'Test Token',
      symbol: 'TEST',
      logoUrl: 'https://example.com/logo.png',
      totalSupply: '1000000000000000000000',
      description: 'A test token',
      links: ['https://example.com'],
      creatorAddress: '0x1234567890123456789012345678901234567890',
      airdropMetadata: {
        cohortIds: ['cohort1'],
        addresses: ['0x1234567890123456789012345678901234567890']
      }
    };

    const response = await submitRainbowSuperToken(request);

    // Verify response structure
    expect(response).toHaveProperty('data');
    const data = response.data;

    // Verify all required deployment response fields
    expect(data).toHaveProperty('tokenUri');
    expect(data).toHaveProperty('salt');
    expect(data).toHaveProperty('merkleRoot');
    expect(data).toHaveProperty('totalSupply');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('symbol');
    expect(data).toHaveProperty('creatorAddress');

    // Verify data types
    expect(typeof data.tokenUri).toBe('string');
    expect(typeof data.salt).toBe('string');
    expect(typeof data.merkleRoot).toBe('string');
    expect(typeof data.totalSupply).toBe('string');
    expect(typeof data.name).toBe('string');
    expect(typeof data.symbol).toBe('string');
    expect(typeof data.creatorAddress).toBe('string');

    // Verify values match request where applicable
    expect(data.name).toBe(request.name);
    expect(data.symbol).toBe(request.symbol);
    expect(data.totalSupply).toBe(request.totalSupply);
    expect(data.creatorAddress).toBe(request.creatorAddress);
  });
});
