import JSBI from 'jsbi'
import { ONE, TickMath } from '../src/utils/tickMath'

describe('TickMath', () => {
  describe('#MIN_TICK', () => {
    it('equals correct value', () => {
      expect(TickMath.MIN_TICK).toEqual(-887272)
    })
  })

  describe('#MAX_TICK', () => {
    it('equals correct value', () => {
      expect(TickMath.MAX_TICK).toEqual(887272)
    })
  })

  describe('#getSqrtRatioAtTick', () => {
    it('throws for non integer', () => {
      expect(() => TickMath.getSqrtRatioAtTick(1.5)).toThrow('TICK')
    })

    it('throws for tick too small', () => {
      expect(() => TickMath.getSqrtRatioAtTick(TickMath.MIN_TICK - 1)).toThrow('TICK')
    })

    it('throws for tick too large', () => {
      expect(() => TickMath.getSqrtRatioAtTick(TickMath.MAX_TICK + 1)).toThrow('TICK')
    })

    it('returns the correct value for min tick', () => {
      expect(TickMath.getSqrtRatioAtTick(TickMath.MIN_TICK)).toEqual(TickMath.MIN_SQRT_RATIO)
    })

    it('returns the correct value for tick 0', () => {
      expect(TickMath.getSqrtRatioAtTick(0)).toEqual(JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(96)))
    })

    it('returns the correct value for max tick', () => {
      expect(TickMath.getSqrtRatioAtTick(TickMath.MAX_TICK)).toEqual(TickMath.MAX_SQRT_RATIO)
    })

    const testCases = [
      { tick: -1, expected: '79223500852295105574357232832' },
      { tick: 1, expected: '79232824175972643963009617408' },
      { tick: 100, expected: '80015876315023715955392452582' },
      { tick: -100, expected: '78451796569126576793691375826' }
    ]

    testCases.forEach(({ tick, expected }) => {
      it(`returns correct value for tick ${tick}`, () => {
        expect(TickMath.getSqrtRatioAtTick(tick).toString()).toBe(expected)
      })
    })
  })

  describe('#getTickAtSqrtRatio', () => {
    it('returns the correct value for sqrt ratio at min tick', () => {
      expect(TickMath.getTickAtSqrtRatio(TickMath.MIN_SQRT_RATIO)).toEqual(TickMath.MIN_TICK)
    })

    it('returns the correct value for sqrt ratio at max tick', () => {
      expect(TickMath.getTickAtSqrtRatio(JSBI.subtract(TickMath.MAX_SQRT_RATIO, ONE))).toEqual(TickMath.MAX_TICK - 1)
    })

    it('throws for sqrt ratio below MIN_SQRT_RATIO', () => {
      expect(() => TickMath.getTickAtSqrtRatio(JSBI.subtract(TickMath.MIN_SQRT_RATIO, JSBI.BigInt(1)))).toThrow('SQRT_RATIO')
    })

    it('throws for sqrt ratio above MAX_SQRT_RATIO', () => {
      expect(() => TickMath.getTickAtSqrtRatio(TickMath.MAX_SQRT_RATIO)).toThrow('SQRT_RATIO')
    })

    const testCases = [
      { sqrtRatio: '79228162514264337593543950336', expectedTick: 0 },
      { sqrtRatio: '79223500852295105574357232832', expectedTick: -1 },
      { sqrtRatio: '79232824175972643963009617408', expectedTick: 1 }
    ]

    testCases.forEach(({ sqrtRatio, expectedTick }) => {
      it(`returns correct tick for sqrt ratio ${sqrtRatio}`, () => {
        expect(TickMath.getTickAtSqrtRatio(JSBI.BigInt(sqrtRatio))).toBe(expectedTick)
      })
    })
  })
}) 