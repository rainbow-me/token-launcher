import { priceToInitialTick } from './utils/tickMath';

const TICK_SPACING = 200;

/**
 * Computes the initial tick given a desired token price (expressed in ETH).
 *
 * @param tokenPrice The token’s price in wei.
 * @returns The nearest valid tick.
 */
export function getInitialTick(tokenPrice: bigint): number {
  return priceToInitialTick(tokenPrice, TICK_SPACING);
}
