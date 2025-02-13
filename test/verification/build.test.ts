import {
  getRainbowSuperTokens,
  launchRainbowSuperTokenAndBuy,
  launchRainbowSuperToken,
  getRainbowSuperTokenByUri,
  submitRainbowSuperToken,
  getMerkleRootForCohorts,
} from '../../dist';

describe('Build Verification', () => {
  it('should export all required functions', () => {
    expect(typeof getMerkleRootForCohorts).toBe('function');
    expect(typeof getRainbowSuperTokens).toBe('function');
    expect(typeof getRainbowSuperTokenByUri).toBe('function');
    expect(typeof submitRainbowSuperToken).toBe('function');
    expect(typeof launchRainbowSuperToken).toBe('function');
    expect(typeof launchRainbowSuperTokenAndBuy).toBe('function');
  });
});
