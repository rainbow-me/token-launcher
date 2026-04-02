import { parseEther } from 'viem';
import { TokenLauncher } from './index';

describe('TokenLauncher.getInitialTick', () => {
  it('returns the same tick for equivalent bigint wei values', () => {
    const decimalPrice = '0.0001';
    expect(TokenLauncher.getInitialTick(parseEther(decimalPrice))).toBe(
      TokenLauncher.getInitialTick(100000000000000n)
    );
  });
});
