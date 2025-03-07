import JSBI from 'jsbi'
import { calculateTokenomics, calculateAllocations, weiToEth } from '../src/utils/tokenomics'
import { parseUnits } from '@ethersproject/units'
import { CREATOR_BPS, CREATOR_BPS_WITH_AIRDROP, AIRDROP_BPS } from '../src/utils/tokenomics'

describe('Tokenomics Calculations', () => {
  describe('calculateAllocations', () => {
    it('correctly splits allocations with airdrop', () => {
      const totalSupply = JSBI.BigInt('1000000000000000000000000') // 1M tokens
      const allocations = calculateAllocations(totalSupply, true)
      
      // Calculate expected amounts
      const expectedCreator = JSBI.divide(
        JSBI.multiply(totalSupply, JSBI.BigInt(CREATOR_BPS_WITH_AIRDROP)),
        JSBI.BigInt(10000)
      )
      const expectedAirdrop = JSBI.divide(
        JSBI.multiply(totalSupply, JSBI.BigInt(AIRDROP_BPS)),
        JSBI.BigInt(10000)
      )
      const expectedLp = JSBI.subtract(
        totalSupply, 
        JSBI.add(expectedCreator, expectedAirdrop)
      )
      
      // Check allocations match expected values
      expect(JSBI.equal(allocations.creator, expectedCreator)).toBe(true)
      expect(JSBI.equal(allocations.airdrop, expectedAirdrop)).toBe(true)
      expect(JSBI.equal(allocations.lp, expectedLp)).toBe(true)
      expect(JSBI.equal(allocations.total, totalSupply)).toBe(true)
    })

    it('correctly splits allocations without airdrop', () => {
      const totalSupply = JSBI.BigInt('1000000000000000000000000') // 1M tokens
      const allocations = calculateAllocations(totalSupply, false)
      
      // Calculate expected amounts
      const expectedCreator = JSBI.divide(
        JSBI.multiply(totalSupply, JSBI.BigInt(CREATOR_BPS)),
        JSBI.BigInt(10000)
      )
      const expectedLp = JSBI.subtract(totalSupply, expectedCreator)
      
      // Check allocations match expected values
      expect(JSBI.equal(allocations.creator, expectedCreator)).toBe(true)
      expect(JSBI.equal(allocations.airdrop, JSBI.BigInt('0'))).toBe(true)
      expect(JSBI.equal(allocations.lp, expectedLp)).toBe(true)
      expect(JSBI.equal(allocations.total, totalSupply)).toBe(true)
    })
  })

  describe('calculateTokenomics', () => {
    it('calculates correct initial state without swap', () => {
      const result = calculateTokenomics({
        targetMarketCapUsd: parseUnits('1000000', 18), // $1M market cap
        totalSupply: parseUnits('1000000', 18), // 1M tokens
        ethPriceUsd: parseUnits('2000', 18), // ETH at $2000
        hasAirdrop: false
      })

      // Target price should be $1 per token = 0.0005 ETH
      const expectedPriceEth = parseUnits('0.0005', 18)
      expect(JSBI.equal(
        result.price.targetEth,
        JSBI.BigInt(expectedPriceEth.toString())
      )).toBe(true)

      // Tick should be aligned to 200
      expect(Math.abs(result.tick % 200)).toBeLessThanOrEqual(0.1)
    })

    it('simulates swap impact correctly', () => {
      const result = calculateTokenomics({
        targetMarketCapUsd: parseUnits('1000000', 18), // $1M market cap
        totalSupply: parseUnits('1000000', 18), // 1M tokens
        ethPriceUsd: parseUnits('2000', 18), // ETH at $2000
        hasAirdrop: false,
        amountInEth: parseUnits('10', 18) // Buy with 10 ETH
      })

      // Verify swap exists
      expect(result.swap).toBeDefined()
      
      if (result.swap) {
        // Fee should be 0.3% of input
        const expectedFee = parseUnits('0.03', 18) // 0.3% of 10 ETH
        expect(JSBI.equal(
          result.swap.input.feeAmount,
          JSBI.BigInt(expectedFee.toString())
        )).toBe(true)

        // Price impact should be positive
        expect(JSBI.greaterThan(result.swap.output.priceImpact, JSBI.BigInt(0))).toBe(true)

        // Post-swap creator allocation should be higher
        expect(JSBI.greaterThan(
          result.allocation.creator,
          JSBI.BigInt('2000') // > 20%
        )).toBe(true)
      }
    })

    it('handles extreme market caps', () => {
      const result = calculateTokenomics({
        targetMarketCapUsd: parseUnits('1000000000', 18), // $1B market cap
        totalSupply: parseUnits('1000000', 18), // 1M tokens
        ethPriceUsd: parseUnits('2000', 18), // ETH at $2000
        hasAirdrop: false
      })

      // Verify tick is within bounds
      expect(result.tick).toBeGreaterThanOrEqual(-887272)
      expect(result.tick).toBeLessThanOrEqual(887272)
    })

    it('handles extremely low token prices correctly (app scenario)', () => {
      // Properly match the app's actual parameters with correct decimals
      const params = {
        targetMarketCapUsd: parseUnits('35000', 18),  // $35,000 with 18 decimals
        totalSupply: parseUnits('1000000000', 18),    // 1 billion tokens with 18 decimals
        ethPriceUsd: parseUnits('2000', 18),          // $2000 per ETH
        hasAirdrop: false
      };
      
      // This would crash before our fix
      const result = calculateTokenomics(params);
      
      // Verify our minimum price safeguard is working
      expect(JSBI.greaterThan(result.price.targetEth, JSBI.BigInt(0))).toBe(true);
      expect(JSBI.greaterThan(result.price.actualEth, JSBI.BigInt(0))).toBe(true);
      
      // Test with a 1 ETH swap to ensure it also works
      const paramsWithSwap = {
        ...params,
        amountInEth: parseUnits('1', 18)  // 1 ETH buy
      };
      
      const resultWithSwap = calculateTokenomics(paramsWithSwap);
      expect(resultWithSwap.swap).toBeDefined();
      
      // Log the results to help debug
      console.log('APP SCENARIO TEST (FIXED): Price in ETH wei =', result.price.actualEth.toString());
      console.log('APP SCENARIO TEST (FIXED): Market cap USD =', weiToEth(result.marketCap.actualUsd) * 1e18);
    });
  })

  describe('weiToEth', () => {
    it('correctly converts wei values to ETH', () => {
      const testCases = [
        {
          wei: JSBI.BigInt('1000000000000000000'), // 1 ETH
          expected: 1
        },
        {
          wei: JSBI.BigInt('500000000000000'), // 0.0005 ETH
          expected: 0.0005
        },
        {
          wei: JSBI.BigInt('0'),
          expected: 0
        }
      ]

      testCases.forEach(({ wei, expected }) => {
        expect(weiToEth(wei)).toBeCloseTo(expected, 6)
      })
    })

    it('handles large numbers correctly', () => {
      const largeWei = JSBI.BigInt('1234567890000000000000') // 1234.5679 ETH
      expect(weiToEth(largeWei)).toBeCloseTo(1234.5679, 4)
    })
  })

  describe('Edge Cases', () => { 
    it('handles large market cap correctly', () => {
      const params = {
        targetMarketCapUsd: parseUnits('1000000000', 18),  // $1B market cap
        totalSupply: parseUnits('1000000', 18),           // 1M tokens
        ethPriceUsd: parseUnits('2000', 18),
        hasAirdrop: false
      };
      
      const result = calculateTokenomics(params);
      
      // Convert JSBI to string first
      expect(Number(result.price.targetUsd.toString()) / 1e18).toBeCloseTo(1000, 0);
    });
    
    it('handles varying ETH prices correctly', () => {
      // Test with ETH at different price points
      const testCases = [
        { ethPrice: '500', expected: '0.002' },    // ETH at $500
        { ethPrice: '10000', expected: '0.0001' }  // ETH at $10,000
      ];
      
      for (const testCase of testCases) {
        const params = {
          targetMarketCapUsd: parseUnits('1000000', 18),  // $1M market cap
          totalSupply: parseUnits('1000000', 18),         // 1M tokens
          ethPriceUsd: parseUnits(testCase.ethPrice, 18),
          hasAirdrop: false
        };
        
        const result = calculateTokenomics(params);
        
        // Use the weiToEth helper or convert to string first
        expect(weiToEth(result.price.targetEth)).toBeCloseTo(Number(testCase.expected), 4);
      }
    });
    
    it('handles swap with significant price impact', () => {
      const params = {
        targetMarketCapUsd: parseUnits('10000', 18),    // Small $10K market cap
        totalSupply: parseUnits('1000000', 18),         // 1M tokens
        ethPriceUsd: parseUnits('2000', 18),
        hasAirdrop: false,
        amountInEth: parseUnits('100', 18)              // Large 100 ETH buy
      };
      
      const result = calculateTokenomics(params);
      
      expect(result.swap).toBeDefined();
      if (result.swap) {
        // Convert JSBI to string first
        expect(Number(result.swap.output.priceImpact.toString()) / 1e18).toBeGreaterThan(0.01);
        
        // Compare using JSBI for correct numeric comparison of large values
        const afterUsd = result.swap.marketCapAfter.usd;
        const beforeUsd = result.marketCap.actualUsd;
        
        // Log the values for debugging
        console.log("Market cap comparison:", {
          before: beforeUsd.toString(),
          after: afterUsd.toString()
        });
        
        // Use JSBI for correct numeric comparison
        expect(JSBI.greaterThan(afterUsd, beforeUsd)).toBe(true);
      }
    });
  })
}) 