import JSBI from 'jsbi'

export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const MaxUint256 = JSBI.subtract(JSBI.exponentiate(TWO, JSBI.BigInt(256)), ONE) 