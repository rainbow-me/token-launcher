import { getRainbowSuperTokens, getRainbowSuperTokenByUri } from "../src/api";

describe('Get Rainbow Super Tokens', () => {

  it('get all rainbow super tokens', async () => {
    const tokens = await getRainbowSuperTokens();
    console.log('tokens: ', tokens);
    expect(tokens.data.length).toBeGreaterThan(0);
  });

  it('get rainbow super token by uri', async () => {
    const token = await getRainbowSuperTokenByUri('0x1234567890123456789012345678901234567890');
    console.log('token: ', token);
    expect(token.data.address).toBeDefined();
  });
});