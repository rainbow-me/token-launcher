import { priceToInitialTick } from './utils/tickMath'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'

const TICK_SPACING = 200;

/**
   * Computes the initial tick given a desired token price (expressed in ETH).
   *
   * @param tokenPrice The token’s price in ETH (for example, "0.000035" or 1, 2, 0.5, etc.)
   * @returns The nearest valid tick.
   */
  export function getInitialTick(tokenPrice: BigNumberish): number {
    const scaledPrice =
        typeof tokenPrice === 'string'
            ? parseUnits(tokenPrice, 18)
            : BigNumber.from(tokenPrice);
      return priceToInitialTick(scaledPrice, TICK_SPACING);
}