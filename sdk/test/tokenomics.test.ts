import { BigNumber } from '@ethersproject/bignumber'
import JSBI from 'jsbi'
import { calculateTokenomics, calculateAllocations, weiToEth } from '../src/utils/tokenomics'
import { parseUnits } from '@ethersproject/units'

describe('Tokenomics Calculations', () => {
  describe('calculateAllocations', () => {
    it('correctly splits allocations with airdrop', () => {
      const totalSupply = JSBI.BigInt('1000000000000000000000000') // 1M tokens
      const allocations = calculateAllocations(totalSupply, true)

      // With airdrop: 10% creator, 10% airdrop, 80% LP
      expect(JSBI.equal(
        allocations.creator,
        JSBI.BigInt('100000000000000000000000')
      )).toBe(true)
      expect(JSBI.equal(
        allocations.airdrop,
        JSBI.BigInt('100000000000000000000000')
      )).toBe(true)
      expect(JSBI.equal(
        allocations.lp,
        JSBI.BigInt('800000000000000000000000')
      )).toBe(true)
    })

    it('correctly splits allocations without airdrop', () => {
      const totalSupply = JSBI.BigInt('1000000000000000000000000') // 1M tokens
      const allocations = calculateAllocations(totalSupply, false)

      // Without airdrop: 20% creator, 0% airdrop, 80% LP
      expect(JSBI.equal(
        allocations.creator,
        JSBI.BigInt('200000000000000000000000')
      )).toBe(true)
      expect(JSBI.equal(allocations.airdrop, JSBI.BigInt('0'))).toBe(true)
      expect(JSBI.equal(
        allocations.lp,
        JSBI.BigInt('800000000000000000000000')
      )).toBe(true)
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
}) 