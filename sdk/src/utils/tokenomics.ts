import JSBI from 'jsbi'
import invariant from 'tiny-invariant'
import { TickMath, encodePriceToX96 } from './tickMath'
import { BigNumber } from '@ethersproject/bignumber'

const TICK_SPACING = 200;
const ZERO = JSBI.BigInt(0)
const SCALE = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
const BPS_DENOMINATOR = JSBI.BigInt(10000)
const POOL_FEE = JSBI.BigInt(3000) // 0.3%
const FEE_DENOMINATOR = JSBI.BigInt(1000000)

interface TokenAllocation {
  creator: JSBI
  airdrop: JSBI
  lp: JSBI
  total: JSBI
}

interface SwapSimulation {
  input: {
    amountInEth: JSBI
    feeAmount: JSBI
    amountInAfterFee: JSBI
  }
  output: {
    tokensOut: JSBI
    priceImpact: JSBI
  }
  marketCapAfter: {
    eth: JSBI
    usd: JSBI
  }
}

export interface TokenomicsParams {
  targetMarketCapUsd: BigNumber
  totalSupply: BigNumber
  ethPriceUsd: BigNumber
  hasAirdrop?: boolean
  amountInEth?: BigNumber
}

export interface TokenomicsResult {
  supply: TokenAllocation
  allocation: {
    creator: JSBI
    airdrop: JSBI
    lp: JSBI
  }
  price: {
    targetEth: JSBI
    targetUsd: JSBI
    actualEth: JSBI
    actualUsd: JSBI
  }
  tick: number
  marketCap: {
    targetEth: JSBI
    targetUsd: JSBI
    actualEth: JSBI
    actualUsd: JSBI
  }
  swap?: SwapSimulation
}

export interface TokenomicsResultFormatted {
  supply: {
    total: string
    lp: string
    creator: string
    airdrop: string
  }
  allocation: {
    creator: number  // Percentage (0-100)
    airdrop: number
    lp: number
  }
  price: {
    targetEth: string
    targetUsd: string
    actualEth: string
    actualUsd: string
  }
  tick: number
  marketCap: {
    targetUsd: string
    actualUsd: string
    actualEth: string
  }
  swap?: {
    input: {
      amountInEth: string
      feeAmount: string
      amountInAfterFee: string
    }
    output: {
      tokensOut: string
      priceImpact: string
    }
    marketCapAfter: {
      eth: string
      usd: string
    }
  }
}

// Debug logging function
function logDebug(label: string, value: JSBI | number) {
  console.log(`DEBUG ${label}:`, typeof value === 'number' ? value : value.toString())
}

/**
 * Calculates token allocations based on total supply and airdrop status.
 * All values are scaled by 1e18.
 */
export function calculateAllocations(
  totalSupply: JSBI,
  hasAirdrop: boolean
): TokenAllocation {
  invariant(JSBI.greaterThan(totalSupply, ZERO), 'ZERO_SUPPLY')

  const creatorBaseBips = JSBI.BigInt(hasAirdrop ? 1000 : 2000)
  const airdropBips = JSBI.BigInt(hasAirdrop ? 1000 : 0)
  
  const creatorAmount = JSBI.divide(JSBI.multiply(totalSupply, creatorBaseBips), BPS_DENOMINATOR)
  const airdropAmount = JSBI.divide(JSBI.multiply(totalSupply, airdropBips), BPS_DENOMINATOR)
  const lpAmount = JSBI.subtract(
    totalSupply,
    JSBI.add(creatorAmount, airdropAmount)
  )

  return { creator: creatorAmount, airdrop: airdropAmount, lp: lpAmount, total: totalSupply }
}

/**
 * Calculate integer square root for JSBI values using binary search.
 */
function jsbiSqrt(value: JSBI): JSBI {
  if (JSBI.lessThanOrEqual(value, ZERO)) {
    return ZERO
  }
  let n = value
  let x = JSBI.divide(JSBI.add(value, JSBI.BigInt(1)), JSBI.BigInt(2))
  let y = value
  while (JSBI.lessThan(x, y)) {
    y = x
    x = JSBI.divide(JSBI.add(JSBI.divide(n, x), x), JSBI.BigInt(2))
  }
  return y
}

/**
 * Simulates a swap and calculates resulting price impact.
 *
 * The parameter currentSqrtPrice is the current sqrt price in Q64.96 format.
 * For extreme low prices, the adjustment is clamped to SCALE/2 to prevent overflow,
 * which may result in minimal token output.
 */
export function simulateSwap(
  amountInEth: JSBI,
  lpSupply: JSBI,
  currentSqrtPrice: JSBI
): {
  tokensOut: JSBI,
  newPriceEth: JSBI,
  priceImpact: JSBI
} {
  invariant(JSBI.greaterThan(amountInEth, ZERO), 'ZERO_AMOUNT');
  invariant(JSBI.greaterThan(lpSupply, ZERO), 'ZERO_SUPPLY');
  invariant(JSBI.greaterThan(currentSqrtPrice, ZERO), 'ZERO_PRICE');

  // Calculate liquidity using the geometric mean of reserves
  const virtualReserveToken = lpSupply;
  const virtualReserveEth = JSBI.divide(
    JSBI.multiply(lpSupply, currentSqrtPrice),
    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))
  );

  // If virtual ETH reserves are too low, return minimal impact swap
  if (JSBI.lessThanOrEqual(virtualReserveEth, ZERO)) {
    console.warn('Virtual ETH reserves too low, returning minimal impact swap');
    return {
      tokensOut: JSBI.divide(lpSupply, JSBI.BigInt(1000000)), // Return 0.0001% of supply
      newPriceEth: currentSqrtPrice,
      priceImpact: JSBI.BigInt(1) // 0.0001% impact
    };
  }

  const liquidity = JSBI.divide(
    JSBI.multiply(
      jsbiSqrt(JSBI.multiply(virtualReserveToken, virtualReserveEth)),
      JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(48))
    ),
    SCALE
  );

  // If liquidity is too low, return minimal impact swap
  if (JSBI.lessThanOrEqual(liquidity, ZERO)) {
    console.warn('Liquidity too low, returning minimal impact swap');
    return {
      tokensOut: JSBI.divide(lpSupply, JSBI.BigInt(1000000)),
      newPriceEth: currentSqrtPrice,
      priceImpact: JSBI.BigInt(1)
    };
  }

  const feeAmount = JSBI.divide(JSBI.multiply(amountInEth, POOL_FEE), FEE_DENOMINATOR);
  const amountInAfterFee = JSBI.subtract(amountInEth, feeAmount);

  // Calculate adjustment = (amountInAfterFee * currentSqrtPrice) / liquidity.
  let adjustment = JSBI.divide(
    JSBI.multiply(amountInAfterFee, currentSqrtPrice),
    liquidity
  );
  // If adjustment is huge, clamp it to SCALE/2 rather than SCALE.
  if (JSBI.greaterThanOrEqual(adjustment, SCALE)) {
    console.warn('Adjustment is huge; clamping adjustment to SCALE/2.');
    adjustment = JSBI.divide(SCALE, JSBI.BigInt(2));
  }

  const sqrtPriceNext = JSBI.divide(
    JSBI.multiply(currentSqrtPrice, SCALE),
    JSBI.add(SCALE, adjustment)
  );

  const tokensOut = JSBI.divide(
    JSBI.multiply(liquidity, JSBI.subtract(currentSqrtPrice, sqrtPriceNext)),
    SCALE
  );

  const newPriceEth = JSBI.divide(
    JSBI.multiply(sqrtPriceNext, sqrtPriceNext),
    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(192))
  );

  const priceImpact = JSBI.divide(
    JSBI.multiply(amountInEth, SCALE),
    liquidity
  );

  return { tokensOut, newPriceEth, priceImpact };
}

/**
 * Converts BigNumber inputs to JSBI for internal calculations.
 */
function toBigInt(value: BigNumber): JSBI {
  return JSBI.BigInt(value.toString());
}

/**
 * Main tokenomics calculation function that uses JSBI for all math operations.
 */
export function calculateTokenomics({
  targetMarketCapUsd,
  totalSupply,
  ethPriceUsd,
  hasAirdrop = false,
  amountInEth = BigNumber.from(0)
}: TokenomicsParams): TokenomicsResult {
  // Input validation
  invariant(!targetMarketCapUsd.isZero(), 'ZERO_MARKET_CAP');
  invariant(!totalSupply.isZero(), 'ZERO_SUPPLY');
  invariant(!ethPriceUsd.isZero(), 'ZERO_ETH_PRICE');

  // Convert inputs to JSBI
  const targetMarketCapUsdBI = toBigInt(targetMarketCapUsd);
  const totalSupplyBI = toBigInt(totalSupply);
  const ethPriceUsdBI = toBigInt(ethPriceUsd);
  const amountInEthBI = toBigInt(amountInEth);

  // Log input values
  logDebug('targetMarketCapUsd', targetMarketCapUsdBI);
  logDebug('totalSupply', totalSupplyBI);
  logDebug('ethPriceUsd', ethPriceUsdBI);

  // Calculate initial allocations
  let allocations = calculateAllocations(totalSupplyBI, hasAirdrop);

  // --- Calculate target price in ETH (in wei) ---
  // Formula: targetPriceEth = (targetMarketCapUsd × SCALE²) / (totalSupply × ethPriceUsd)
  const numerator = JSBI.multiply(JSBI.multiply(targetMarketCapUsdBI, SCALE), SCALE);
  const denominator = JSBI.multiply(totalSupplyBI, ethPriceUsdBI);
  logDebug('numerator', numerator);
  logDebug('denominator', denominator);
  const targetPriceEthBI = JSBI.divide(numerator, denominator);
  logDebug('targetPriceEthBI', targetPriceEthBI);

  // Convert targetPriceEthBI to sqrtPriceX96 and log
  const sqrtPriceX96 = encodePriceToX96(BigNumber.from(targetPriceEthBI.toString()));
  logDebug('sqrtPriceX96', sqrtPriceX96);

  // Get tick and actual sqrt price from target sqrtPrice
  const initialTick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);
  logDebug('initialTick', initialTick);

  // Align tick to spacing while preserving negative values
  let tick = Math.floor(initialTick / TICK_SPACING) * TICK_SPACING;
  if (tick === 0 || Object.is(tick, -0)) tick = 0;  // Force positive zero
  const alignedTick = tick;

  // Get the current sqrt price for the aligned tick
  const sqrtRatioAtTick = TickMath.getSqrtRatioAtTick(tick);

  // --- Calculate actual ETH price from sqrt ratio ---
  // For a Q64.96 number, price = (sqrtRatioAtTick²) / 2^192.
  // Multiply by SCALE to recover the price in wei.
  const actualPriceEthBI = JSBI.divide(
    JSBI.multiply(JSBI.multiply(sqrtRatioAtTick, sqrtRatioAtTick), SCALE),
    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(192))
  );

  // Calculate USD price directly from ETH price: actualPriceUsd = (actualPriceEth × ethPriceUsd) / SCALE
  const actualPriceUsdBI = JSBI.divide(
    JSBI.multiply(actualPriceEthBI, ethPriceUsdBI),
    SCALE
  );

  // Debug intermediate values
  logDebug('sqrtRatioAtTick', sqrtRatioAtTick);
  logDebug('actualPriceEthBI', actualPriceEthBI);
  logDebug('actualPriceUsdBI', actualPriceUsdBI);

  // Calculate market caps
  const actualMarketCapEthBI = JSBI.divide(
    JSBI.multiply(totalSupplyBI, actualPriceEthBI),
    SCALE
  );
  const actualMarketCapUsdBI = JSBI.divide(
    JSBI.multiply(actualMarketCapEthBI, ethPriceUsdBI),
    SCALE
  );

  let swap: SwapSimulation | undefined;

  if (!JSBI.equal(amountInEthBI, ZERO)) {
    // For swap simulation, pass the current sqrt price (Q64.96) rather than the actual price in wei.
    const { tokensOut, newPriceEth: postSwapPriceEthBI, priceImpact } = simulateSwap(amountInEthBI, allocations.lp, sqrtRatioAtTick);

    // Update allocations after swap
    allocations = {
      creator: JSBI.add(allocations.creator, tokensOut),
      airdrop: allocations.airdrop,
      lp: JSBI.subtract(allocations.lp, tokensOut),
      total: allocations.total
    };

    const feeAmount = JSBI.divide(
      JSBI.multiply(amountInEthBI, POOL_FEE),
      FEE_DENOMINATOR
    );

    swap = {
      input: {
        amountInEth: amountInEthBI,
        feeAmount,
        amountInAfterFee: JSBI.subtract(amountInEthBI, feeAmount)
      },
      output: {
        tokensOut,
        priceImpact
      },
      marketCapAfter: {
        eth: JSBI.divide(JSBI.multiply(totalSupplyBI, postSwapPriceEthBI), SCALE),
        usd: JSBI.divide(
          JSBI.multiply(
            JSBI.multiply(totalSupplyBI, postSwapPriceEthBI),
            ethPriceUsdBI
          ),
          JSBI.multiply(SCALE, SCALE)
        )
      }
    };
  }

  // Calculate final allocations in basis points
  const allocationBips = {
    creator: JSBI.divide(JSBI.multiply(allocations.creator, BPS_DENOMINATOR), totalSupplyBI),
    airdrop: JSBI.divide(JSBI.multiply(allocations.airdrop, BPS_DENOMINATOR), totalSupplyBI),
    lp: JSBI.divide(JSBI.multiply(allocations.lp, BPS_DENOMINATOR), totalSupplyBI)
  };

  return {
    supply: allocations,
    allocation: allocationBips,
    price: {
      targetEth: targetPriceEthBI,
      targetUsd: JSBI.divide(JSBI.multiply(targetPriceEthBI, ethPriceUsdBI), SCALE),
      actualEth: actualPriceEthBI,
      actualUsd: actualPriceUsdBI
    },
    tick: alignedTick,
    marketCap: {
      targetEth: JSBI.divide(targetMarketCapUsdBI, ethPriceUsdBI),
      targetUsd: targetMarketCapUsdBI,
      actualEth: actualMarketCapEthBI,
      actualUsd: actualMarketCapUsdBI
    },
    swap
  };
}

export function weiToEth(wei: JSBI): number {
  const weiStr = wei.toString();
  const padded = weiStr.padStart(19, '0');
  const integerPart = padded.slice(0, -18) || '0';
  const decimalPart = padded.slice(-18);
  return parseFloat(`${integerPart}.${decimalPart}`);
}

export function serializeJSBI(jsbi: JSBI): string {
  return jsbi.toString();
}



