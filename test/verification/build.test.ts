import { getRainbowSuperTokens, launchRainbowSuperTokenAndBuy } from '../../dist';

describe('Build Verification', () => {
  it('should export all required functions', () => {
    expect(typeof getRainbowSuperTokens).toBe('function');
    expect(typeof launchRainbowSuperTokenAndBuy).toBe('function');
  });
}); 