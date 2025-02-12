import { getRainbowSuperTokens, getRainbowSuperTokenByUri } from "../src/api";

describe('Get Rainbow Super Tokens', () => {

  it('get all rainbow super tokens', async () => {
    const tokens = await getRainbowSuperTokens();
    expect(tokens.data.length).toBeGreaterThan(0);
  });

  it('get rainbow super token by uri', async () => {
    const token = await getRainbowSuperTokenByUri('123123-abcabc-123123');
    expect(token.data.address).toBeDefined();
  });
});