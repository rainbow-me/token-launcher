import { submitRainbowSuperToken } from '../src/api';

describe('Submit Rainbow Super Token', () => {
  it('should submit a rainbow super token', async () => {
    const token = await submitRainbowSuperToken({
      address: '0x1234567890123456789012345678901234567890',
      chainId: 1,
      name: 'Test Token',
      symbol: 'TEST',
      totalSupply: '1000000',
      tokenUri: 'https://example.com/tokenuri', 
      logoUrl: 'https://example.com/logo.png',
      description: 'Test Token Description',
      links: ['https://example.com/link1', 'https://example.com/link2'],
      creatorAddress: '0x1234567890123456789012345678901234567890',
      merkleroot: '0x1234567890123456789012345678901234567890',
      merkle_root_id: '0x1234567890123456789012345678901234567890',
    });
    expect(token).toBeDefined();
  });
});
