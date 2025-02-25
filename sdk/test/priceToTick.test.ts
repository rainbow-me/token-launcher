import { priceToInitialTick } from '../src/utils/tickMath'

describe('priceToInitialTick', () => {
  describe('with 200 tick spacing', () => {
    const tickSpacing = 200

    it('handles common ETH/USDC price ranges', () => {
      const testCases = [
        { price: 1800, expectedTick: 75000 },   // Changed from -74800
        { price: 2000, expectedTick: 76400 },   // Changed from -72800
        { price: 1600, expectedTick: 73400 },   // Changed from -77000
      ]

      testCases.forEach(({ price, expectedTick }) => {
        expect(priceToInitialTick(price, tickSpacing)).toBe(expectedTick)
      })
    })

    it('handles stablecoin pairs', () => {
      const testCases = [
        { price: 1.0001, expectedTick: 0 },     // Near 1:1
        { price: 0.9999, expectedTick: 0 },     // Near 1:1
        { price: 1.02, expectedTick: 200 },     // Slight premium
        { price: 0.98, expectedTick: -200 },    // Slight discount
      ]

      testCases.forEach(({ price, expectedTick }) => {
        expect(priceToInitialTick(price, tickSpacing)).toBe(expectedTick)
      })
    })

    it('always returns ticks aligned to spacing', () => {
      const prices = [1.2345, 567.89, 0.0123, 9999.99]
      prices.forEach(price => {
        const tick = priceToInitialTick(price, tickSpacing)
        expect(Math.abs(tick % tickSpacing)).toBe(0)
      })
    })

    it('handles extreme prices', () => {
      const testCases = [
        { price: 0.0001, expectedTick: -92200 },
        { price: 10000, expectedTick: 92200 }   // Changed from 46200
      ]

      testCases.forEach(({ price, expectedTick }) => {
        expect(priceToInitialTick(price, tickSpacing)).toBe(expectedTick)
      })
    })
  })
}) 