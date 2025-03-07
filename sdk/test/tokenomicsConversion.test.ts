import { TokenLauncher } from '../src'
import { parseUnits, formatUnits } from '@ethersproject/units'
import { calculateTokenomics } from '../src/utils/tokenomics'
import JSBI from 'jsbi'
import { BigNumber } from '@ethersproject/bignumber'
import { CREATOR_BPS, CREATOR_BPS_WITH_AIRDROP, AIRDROP_BPS } from '../src/utils/tokenomics'

describe.skip('Tokenomics Conversion', () => {
  const mockTokenomics = {
    supply: {
      total: JSBI.BigInt('1000000000000000000000000'), // 1M tokens
      lp: JSBI.BigInt('800000000000000000000000'),    // 800k tokens
      creator: JSBI.BigInt('200000000000000000000000'), // 200k tokens
      airdrop: JSBI.BigInt('0')
    },
    allocation: {
      creator: JSBI.BigInt('2000'), // 20%
      airdrop: JSBI.BigInt('0'),    // 0%
      lp: JSBI.BigInt('8000')       // 80%
    },
    price: {
      targetEth: JSBI.BigInt('500000000000000'),      // 0.0005 ETH
      targetUsd: JSBI.BigInt('1000000000000000000'),  // $1
      actualEth: JSBI.BigInt('500000000000000'),      // 0.0005 ETH
      actualUsd: JSBI.BigInt('1000000000000000000')   // $1
    },
    marketCap: {
      targetEth: JSBI.BigInt('500000000000000000000'), // 500 ETH
      targetUsd: JSBI.BigInt('1000000000000000000000000'), // $1M
      actualEth: JSBI.BigInt('500000000000000000000'), // 500 ETH
      actualUsd: JSBI.BigInt('1000000000000000000000000')  // $1M
    },
    tick: -76000
  }

  describe('convertTokenomicsToNumbers', () => {
    it('correctly converts values to BigNumber', () => {
      const converted = TokenLauncher.convertTokenomicsToNumbers(mockTokenomics)

      // Check supply values as BigNumber
      expect(converted.supply.total instanceof BigNumber).toBe(true)
      expect(converted.supply.total.toString()).toBe('1000000000000000000000000')
      expect(converted.supply.lp.toString()).toBe('800000000000000000000000')
      expect(converted.supply.creator.toString()).toBe('200000000000000000000000')
      expect(converted.supply.airdrop.toString()).toBe('0')

      // Check allocations (in percentages)
      expect(converted.allocation.creator).toBe(20)
      expect(converted.allocation.airdrop).toBe(0)
      expect(converted.allocation.lp).toBe(80)

      // Check prices as BigNumber
      expect(converted.price.targetEth.toString()).toBe('500000000000000')
      expect(converted.price.targetUsd.toString()).toBe('1000000000000000000')
      expect(converted.price.actualEth.toString()).toBe('500000000000000')
      expect(converted.price.actualUsd.toString()).toBe('1000000000000000000')

      // Check market caps as BigNumber
      expect(converted.marketCap.actualEth.toString()).toBe('500000000000000000000')
      expect(converted.marketCap.actualUsd.toString()).toBe('1000000000000000000000000')
      expect(converted.marketCap.targetUsd.toString()).toBe('1000000000000000000000000')

      // Check tick remains unchanged
      expect(converted.tick).toBe(-76000)
    })
  })

  describe('end-to-end conversion', () => {
    it('correctly converts calculated tokenomics', () => {
      const preciseResult = calculateTokenomics({
        targetMarketCapUsd: parseUnits('1000000', 18), // $1M
        totalSupply: parseUnits('1000000', 18),        // 1M tokens
        ethPriceUsd: parseUnits('2000', 18),           // ETH at $2000
        hasAirdrop: false
      });

      const result = TokenLauncher.convertTokenomicsToNumbers(preciseResult);

      // Verify key values
      expect(formatUnits(result.price.targetUsd, 18)).toBe('1.0')
      expect(formatUnits(result.price.targetEth, 18)).toBe('0.0005')
      expect(formatUnits(result.supply.total, 18)).toBe('1000000.0')
      expect(result.allocation.creator).toBe(CREATOR_BPS / 100);
    })
  })
})

describe('App Integration', () => {
  it('handles realistic app parameters correctly', () => {
    // Mock app parameters
    const TARGET_MARKET_CAP_IN_USD = 35000;
    const params = {
      targetMarketCapUsd: parseUnits(TARGET_MARKET_CAP_IN_USD.toString(), 18),
      totalSupply: parseUnits('1000000000', 18), // 1B tokens
      ethPriceUsd: parseUnits('2253.88', 18),    // $2,253.88
      hasAirdrop: false,
      amountInEth: parseUnits('0', 18)           // No initial buy
    };

    // Calculate tokenomics
    const result = TokenLauncher.calculateTokenomics(params);

    // Expected values
    const expectedTokenPrice = TARGET_MARKET_CAP_IN_USD / 1_000_000_000; // $0.000035 per token
    const expectedTokenPriceEth = expectedTokenPrice / 2253.88;          // ~0.0000000155 ETH per token

    // Test supply
    expect(formatUnits(result.supply.total, 18)).toBe('1000000000.0');
    expect(formatUnits(result.supply.creator, 18)).toBe(`${1000000000 * CREATOR_BPS / 10000}.0`);
    expect(formatUnits(result.supply.lp, 18)).toBe(`${1000000000 * (10000 - CREATOR_BPS) / 10000}.0`);
    expect(formatUnits(result.supply.airdrop, 18)).toBe('0.0');        // No airdrop

    // Test allocations (for hasAirdrop: false)
    expect(result.allocation.creator).toBe(CREATOR_BPS / 100);  // Use CREATOR_BPS (not WITH_AIRDROP)
    expect(result.allocation.airdrop).toBe(0);                  // Should be 0 with hasAirdrop=false
    expect(result.allocation.lp).toBe(100 - (CREATOR_BPS / 100));

    // Test prices (with more tolerance due to tick spacing constraints)
    expect(Number(formatUnits(result.price.targetUsd, 18))).toBeCloseTo(0.000035, 5);
    expect(Number(formatUnits(result.price.actualUsd, 18))).toBeCloseTo(0.000035, 5);
    expect(Number(formatUnits(result.price.targetEth, 18))).toBeCloseTo(0.0000000155, 9);
    expect(Number(formatUnits(result.price.actualEth, 18))).toBeCloseTo(0.0000000155, 9);

    // Test market caps with more tolerance due to tick spacing constraints
    const targetUsd = Number(formatUnits(result.marketCap.targetUsd, 18));
    const actualUsd = Number(formatUnits(result.marketCap.actualUsd, 18));
    expect(Math.abs(actualUsd - targetUsd) / targetUsd).toBeLessThan(0.02); // 2% tolerance

    // Test that tick is aligned to spacing
    expect(Math.abs(result.tick % 200)).toBe(0);

    // Verify no swap data when amount is zero
    expect(result.swap).toBeUndefined();
  });

  it('handles non-zero buy amount correctly', () => {
    const params = {
      targetMarketCapUsd: parseUnits('35000', 18),
      totalSupply: parseUnits('1000000000', 18),
      ethPriceUsd: parseUnits('2253.88', 18),
      hasAirdrop: false,
      amountInEth: parseUnits('10', 18) // 10 ETH buy
    };

    const result = TokenLauncher.calculateTokenomics(params);

    // Verify swap exists
    expect(result.swap).toBeDefined();
    if (result.swap) {
      // Check fee calculation (0.3% of 10 ETH)
      expect(Number(formatUnits(result.swap.input.feeAmount, 18))).toBeCloseTo(0.03, 2);
      
      // Verify price impact is positive
      expect(Number(formatUnits(result.swap.output.priceImpact, 18))).toBeGreaterThan(0);

      // Debug the market cap values
      console.log('TEST SWAP MARKET CAP VALUES:', {
        afterUsd: formatUnits(result.swap.marketCapAfter.usd, 18),
        actualUsd: formatUnits(result.marketCap.actualUsd, 18)
      });
      
      // Compare BigNumber values directly
      expect(BigNumber.from(result.swap.marketCapAfter.usd).gt(BigNumber.from(result.marketCap.actualUsd))).toBe(true);
    }
  });

  it('handles airdrop flag correctly', () => {
    const params = {
      targetMarketCapUsd: parseUnits('35000', 18),
      totalSupply: parseUnits('1000000000', 18),
      ethPriceUsd: parseUnits('2253.88', 18),
      hasAirdrop: true,
      amountInEth: parseUnits('0', 18)
    };

    const result = TokenLauncher.calculateTokenomics(params);

    // With airdrop: 10% creator, 10% airdrop, 80% LP
    expect(result.allocation.creator).toBe(CREATOR_BPS_WITH_AIRDROP / 100);
    expect(result.allocation.airdrop).toBe(AIRDROP_BPS / 100);
    expect(result.allocation.lp).toBe(100 - (CREATOR_BPS_WITH_AIRDROP / 100) - (AIRDROP_BPS / 100));
  });

  it('formats numbers correctly', () => {
    const targetPriceUsd = parseUnits('1', 18);
    const targetPriceEth = parseUnits('0.0005', 18);
    
    const params = {
      targetMarketCapUsd: parseUnits('1000000', 18),
      totalSupply: parseUnits('1000000', 18),
      ethPriceUsd: parseUnits('2000', 18),
      hasAirdrop: false
    };
    
    const result = TokenLauncher.calculateTokenomics(params);
    
    // Check formatted values (use .toString() to compare BigNumber values)
    expect(result.price.targetUsd.toString()).toBe(targetPriceUsd.toString());
    
    // Or use formatUnits to get human-readable values for display/logging
    expect(formatUnits(result.price.targetUsd, 18)).toBe('1.0');
  });
}) 