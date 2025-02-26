import { submitRainbowSuperToken } from '../src/api';

describe('submitRainbowSuperToken', () => {
  it('should submit token metadata and receive deployment info', async () => {
    // {"chainId": 73571, "creatorAddress": "0x38AF5a9117142F12F81246C595d9961b932bf367", "description": "This is a test.", "links": [], "logoUrl": "https://picsum.photos/200/300", "name": "Integration Test", "symbol": "SDK", "totalSupply": "1000000000000000000000000000"}
    const request = {
      chainId: 73571,
      name: 'Integration Test',
      symbol: 'SDK',
      logoUrl: 'https://picsum.photos/200/300',
      totalSupply: '1000000000000000000000000000',
      description: 'This is a test.',
      links: {},
      creatorAddress: '0x38AF5a9117142F12F81246C595d9961b932bf367',
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
