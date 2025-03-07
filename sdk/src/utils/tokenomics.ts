import JSBI from 'jsbi';
import invariant from 'tiny-invariant';
import { TickMath, encodePriceToX96 } from './tickMath';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import Decimal from 'decimal.js'; // New: use decimal.js for high‐precision math

const TICK_SPACING = 200;
const ZERO = JSBI.BigInt(0);
const SCALE = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)); // 1e18
const BPS_DENOMINATOR = JSBI.BigInt(10000);
const POOL_FEE = JSBI.BigInt(3000); // 0.3%
const FEE_DENOMINATOR = JSBI.BigInt(1000000);

export const CREATOR_BPS = 69;
export const CREATOR_BPS_WITH_AIRDROP = 46;
export const AIRDROP_BPS = 23;

interface TokenAllocation {
  creator: JSBI;
  airdrop: JSBI;
  lp: JSBI;
  total: JSBI;
}

interface SwapSimulation {
  input: {
    amountInEth: JSBI;
    feeAmount: JSBI;
    amountInAfterFee: JSBI;
  };
  output: {
    tokensOut: JSBI;
    priceImpact: JSBI;
  };
  marketCapAfter: {
    eth: JSBI;
    usd: JSBI;
  };
}

export interface TokenomicsParams {
  targetMarketCapUsd: BigNumber;
  totalSupply: BigNumber;
  ethPriceUsd: BigNumber;
  hasAirdrop?: boolean;
  amountInEth?: BigNumber;
}

export interface TokenomicsResult {
  supply: TokenAllocation;
  allocation: {
    creator: JSBI;
    airdrop: JSBI;
    lp: JSBI;
  };
  price: {
    targetEth: JSBI;
    targetUsd: JSBI;
    actualEth: JSBI;
    actualUsd: JSBI;
  };
  tick: number;
  marketCap: {
    targetEth: JSBI;
    targetUsd: JSBI;
    actualEth: JSBI;
    actualUsd: JSBI;
  };
  swap?: SwapSimulation;
}

export interface TokenomicsResultFormatted {
  supply: {
    total: BigNumberish;
    lp: BigNumberish;
    creator: BigNumberish;
    airdrop: BigNumberish;
  };
  allocation: {
    creator: number;  // Percentage (0-100)
    airdrop: number;
    lp: number;
  };
  price: {
    targetEth: BigNumberish;
    targetUsd: BigNumberish;
    actualEth: BigNumberish;
    actualUsd: BigNumberish;
  };
  tick: number;
  marketCap: {
    targetUsd: BigNumberish;
    actualUsd: BigNumberish;
    actualEth: BigNumberish;
  };
  swap?: {
    input: {
      amountInEth: BigNumberish;
      feeAmount: BigNumberish;
      amountInAfterFee: BigNumberish;
    };
    output: {
      tokensOut: BigNumberish;
      priceImpact: BigNumberish;
    };
    marketCapAfter: {
      eth: BigNumberish;
      usd: BigNumberish;
    };
  };
}

// Debug logging function
function logDebug(label: string, value: JSBI | number | Decimal) {
  // console.log('DEBUG', label, value.toString());
}

// --- Helper: Convert ethers BigNumber to Decimal ---
function toDecimal(value: BigNumber): Decimal {
  return new Decimal(value.toString());
}

/**
 * Calculates token allocations based on total supply and airdrop status.
 * All values are scaled by 1e18.
 */
export function calculateAllocations(
  totalSupply: JSBI,
  hasAirdrop: boolean
): TokenAllocation {
  invariant(JSBI.greaterThan(totalSupply, ZERO), 'ZERO_SUPPLY');

  const creatorBaseBips = JSBI.BigInt(hasAirdrop ? CREATOR_BPS_WITH_AIRDROP : CREATOR_BPS);
  const airdropBips = JSBI.BigInt(hasAirdrop ? AIRDROP_BPS : 0);
  
  const creatorAmount = JSBI.divide(JSBI.multiply(totalSupply, creatorBaseBips), BPS_DENOMINATOR);
  const airdropAmount = JSBI.divide(JSBI.multiply(totalSupply, airdropBips), BPS_DENOMINATOR);
  const lpAmount = JSBI.subtract(totalSupply, JSBI.add(creatorAmount, airdropAmount));

  return { creator: creatorAmount, airdrop: airdropAmount, lp: lpAmount, total: totalSupply };
}

/**
 * Calculate integer square root for JSBI values using binary search.
 */
function jsbiSqrt(value: JSBI): JSBI {
  if (JSBI.lessThanOrEqual(value, ZERO)) {
    return ZERO;
  }
  let n = value;
  let x = JSBI.divide(JSBI.add(value, JSBI.BigInt(1)), JSBI.BigInt(2));
  let y = value;
  while (JSBI.lessThan(x, y)) {
    y = x;
    x = JSBI.divide(JSBI.add(JSBI.divide(n, x), x), JSBI.BigInt(2));
  }
  return y;
}

/**
 * Simulates a swap and calculates resulting price impact.
 *
 * The parameter currentSqrtPrice is the current sqrt price in Q64.96 format.
 * For extreme low prices, the adjustment is clamped to SCALE/2.
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
  // Calculate the rough market cap in ETH terms
  const currentPriceEth = JSBI.divide(
    JSBI.multiply(currentSqrtPrice, currentSqrtPrice),
    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(192))
  );
  
  // Calculate an estimated market cap (might be 0 for extremely low prices)
  const estimatedMarketCapEth = JSBI.divide(
    JSBI.multiply(lpSupply, currentPriceEth),
    SCALE
  );
  
  // Use a fallback market cap if the calculation results in 0
  const effectiveMarketCapEth = JSBI.equal(estimatedMarketCapEth, ZERO) ? 
    JSBI.BigInt('10000000000000000000') : // 10 ETH fallback
    estimatedMarketCapEth;
  
  // Calculate percentage based on amountIn as a portion of market cap
  // Min: 0.5%, Max: 30%
  const MIN_PERCENTAGE = JSBI.BigInt(50); // 0.5% in basis points
  const MAX_PERCENTAGE = JSBI.BigInt(3000); // 30% in basis points
  
  // Scale: percentage = min + (amount_in / market_cap) * scaling_factor
  let scaledPercentage = JSBI.add(
    MIN_PERCENTAGE,
    JSBI.divide(
      JSBI.multiply(amountInEth, JSBI.BigInt(10000)),
      effectiveMarketCapEth
    )
  );
  
  // Cap at maximum percentage
  if (JSBI.greaterThan(scaledPercentage, MAX_PERCENTAGE)) {
    scaledPercentage = MAX_PERCENTAGE;
  }
  
  // Calculate tokens out based on the scaled percentage
  const tokensOut = JSBI.divide(
    JSBI.multiply(lpSupply, scaledPercentage),
    BPS_DENOMINATOR
  );
  
  // Add a minimum tokens out to avoid zero transfers
  const minTokensOut = JSBI.divide(lpSupply, JSBI.BigInt(1000)); // 0.1% of LP
  
  // Ensure we have at least the minimum output
  const finalTokensOut = JSBI.greaterThan(tokensOut, minTokensOut) 
    ? tokensOut 
    : minTokensOut;
  
  const priceImpact = JSBI.divide(
    JSBI.multiply(finalTokensOut, SCALE),
    lpSupply
  );
  
  const priceIncreasePercent = JSBI.add(
    JSBI.BigInt(101), // 1% minimum increase
    JSBI.divide(
      JSBI.multiply(scaledPercentage, JSBI.BigInt(9)),
      MAX_PERCENTAGE // Scale up to 9% additional (10% total max)
    )
  );
  
  const newPriceEth = JSBI.divide(
    JSBI.multiply(
      currentPriceEth,
      priceIncreasePercent
    ),
    JSBI.BigInt(100)
  ); 
  
  return {
    tokensOut: finalTokensOut,
    newPriceEth,
    priceImpact
  };
}

/**
 * Main tokenomics calculation function that uses Decimal for the target price
 * calculation and JSBI for the rest.
 */
export function calculateTokenomics({
  targetMarketCapUsd,
  totalSupply,
  ethPriceUsd,
  hasAirdrop = false,
  amountInEth = BigNumber.from(0)
}: TokenomicsParams): TokenomicsResult {
  invariant(!targetMarketCapUsd.isZero(), 'ZERO_MARKET_CAP');
  invariant(!totalSupply.isZero(), 'ZERO_SUPPLY');
  invariant(!ethPriceUsd.isZero(), 'ZERO_ETH_PRICE');

  // Convert inputs to Decimal for our sensitive calculation.
  const targetMarketCapDec = toDecimal(targetMarketCapUsd);
  const totalSupplyDec = toDecimal(totalSupply);
  const ethPriceUsdDec = toDecimal(ethPriceUsd);
  const amountInEthDec = toDecimal(amountInEth);

  logDebug('targetMarketCapUsd', new Decimal(targetMarketCapDec.toFixed()));
  logDebug('totalSupply', new Decimal(totalSupplyDec.toFixed()));
  logDebug('ethPriceUsd', new Decimal(ethPriceUsdDec.toFixed()));

  let allocations = calculateAllocations(
    JSBI.BigInt(totalSupplyDec.toFixed()), // we assume allocations remain calculated with JSBI
    hasAirdrop
  );

  // --- Calculate target price in ETH (in wei) ---
  // Get token count without scaling (raw count)
  const tokensCountDec = totalSupplyDec.div(new Decimal('1e18'));

  // Calculate USD price per token (no extra scaling)
  const targetPriceUsdPerTokenDec = targetMarketCapDec.div(tokensCountDec);

  // Calculate target price in ETH with proper scaling to wei
  let targetPriceEthDec = targetPriceUsdPerTokenDec.mul(new Decimal('1e18')).div(ethPriceUsdDec);
  logDebug('targetPriceEthDec', targetPriceEthDec);

  // Ensure the price doesn't round to zero when converting to BigNumber
  if (targetPriceEthDec.lt(new Decimal('1e-18'))) {
    console.warn('Token price is extremely low, setting to minimum value of 1 wei');
    targetPriceEthDec = new Decimal('1');  // Set to minimum value of 1 wei
  }

  // Convert to BigNumber for downstream processing
  const targetPriceEthBN = BigNumber.from(targetPriceEthDec.toFixed(0));
  invariant(!targetPriceEthBN.isZero(), 'ZERO_PRICE_CALCULATED');

  // For targetUsd, calculate without extra scaling
  const targetPriceUsdBN = BigNumber.from(targetPriceUsdPerTokenDec.toFixed(0));

  // Convert to sqrtPriceX96 and continue with existing flow
  const sqrtPriceX96 = encodePriceToX96(targetPriceEthBN);
  logDebug('sqrtPriceX96', sqrtPriceX96);

  const initialTick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);
  logDebug('initialTick', initialTick);

  let tick = Math.floor(initialTick / TICK_SPACING) * TICK_SPACING;
  if (tick === 0 || tick === -0 || Object.is(tick, -0)) tick = 0;
  const alignedTick = tick;

  const sqrtRatioAtTick = TickMath.getSqrtRatioAtTick(tick);

  const actualPriceEthBI = JSBI.divide(
    JSBI.multiply(JSBI.multiply(sqrtRatioAtTick, sqrtRatioAtTick), SCALE),
    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(192))
  );

  const actualPriceUsdBI = JSBI.divide(
    JSBI.multiply(actualPriceEthBI, JSBI.BigInt(ethPriceUsdDec.toFixed())),
    SCALE
  );

  logDebug('sqrtRatioAtTick', sqrtRatioAtTick);
  logDebug('actualPriceEthBI', actualPriceEthBI);
  logDebug('actualPriceUsdBI', actualPriceUsdBI);

  const totalSupplyBI = JSBI.BigInt(totalSupplyDec.toFixed());
  const ethPriceUsdBI = JSBI.BigInt(ethPriceUsdDec.toFixed());
  
  const actualMarketCapEthBI = JSBI.divide(
    JSBI.multiply(totalSupplyBI, actualPriceEthBI),
    SCALE
  );
  const actualMarketCapUsdBI = JSBI.divide(
    JSBI.multiply(actualMarketCapEthBI, ethPriceUsdBI),
    SCALE
  );

  let swap: SwapSimulation | undefined;

  const amountInEthBI = JSBI.BigInt(amountInEthDec.toFixed(0));

  if (JSBI.greaterThan(amountInEthBI, ZERO)) {
    try {
      const { tokensOut, newPriceEth: postSwapPriceEthBI, priceImpact } = simulateSwap(
        amountInEthBI,
        allocations.lp,
        sqrtRatioAtTick
      );
      
      const finalMarketCapEth = JSBI.add(
        actualMarketCapEthBI,
        JSBI.divide(JSBI.multiply(amountInEthBI, JSBI.BigInt('990')), JSBI.BigInt('1000'))
      );;

      // Ensure the USD market cap is calculated correctly
      const finalMarketCapUsd = JSBI.divide(
        JSBI.multiply(finalMarketCapEth, ethPriceUsdBI),
        SCALE
      );
      
      allocations = {
        creator: JSBI.add(allocations.creator, tokensOut),
        airdrop: allocations.airdrop,
        lp: JSBI.subtract(allocations.lp, tokensOut),
        total: allocations.total
      };

      const feeAmount = JSBI.divide(JSBI.multiply(amountInEthBI, POOL_FEE), FEE_DENOMINATOR);

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
          eth: finalMarketCapEth,
          usd: finalMarketCapUsd
        }
      };
    } catch (error) {
      console.warn('Swap simulation failed, returning minimal impact swap', error);
      swap = {
        input: {
          amountInEth: amountInEthBI,
          feeAmount: JSBI.divide(JSBI.multiply(amountInEthBI, POOL_FEE), FEE_DENOMINATOR),
          amountInAfterFee: JSBI.multiply(amountInEthBI, JSBI.BigInt(997000))
        },
        output: {
          tokensOut: JSBI.divide(allocations.lp, JSBI.BigInt(1000000)),
          priceImpact: JSBI.BigInt(1)
        },
        marketCapAfter: {
          eth: actualMarketCapEthBI,  
          usd: actualMarketCapUsdBI
        }
      };
    }
  }

  // Update allocations after swap
  allocations = {
    creator: JSBI.add(allocations.creator, swap?.output.tokensOut || ZERO),
    airdrop: allocations.airdrop,
    lp: JSBI.subtract(allocations.lp, swap?.output.tokensOut || ZERO),
    total: allocations.total
  };

  // Calculate allocation percentages from the actual token amounts
  // This ensures percentage values match the token distribution exactly
  let creatorBips = JSBI.divide(
    JSBI.multiply(allocations.creator, BPS_DENOMINATOR),
    totalSupplyBI
  );
  const airdropBips = JSBI.divide(
    JSBI.multiply(allocations.airdrop, BPS_DENOMINATOR),
    totalSupplyBI
  );
  let lpBips = JSBI.divide(
    JSBI.multiply(allocations.lp, BPS_DENOMINATOR),
    totalSupplyBI
  );

  // Adjust to ensure total is exactly 100% due to integer division rounding
  const totalBips = JSBI.add(JSBI.add(creatorBips, airdropBips), lpBips);
  if (JSBI.notEqual(totalBips, BPS_DENOMINATOR)) {
    // Add or subtract difference from the largest allocation to ensure total = 100%
    if (JSBI.greaterThan(allocations.lp, JSBI.add(allocations.creator, allocations.airdrop))) {
      lpBips = JSBI.add(lpBips, JSBI.subtract(BPS_DENOMINATOR, totalBips));
    } else {
      creatorBips = JSBI.add(creatorBips, JSBI.subtract(BPS_DENOMINATOR, totalBips));
    }
  }

  const allocationBips = {
    creator: creatorBips,
    airdrop: airdropBips,
    lp: lpBips
  };

  return {
    supply: allocations,
    allocation: allocationBips,
    price: {
      targetEth: JSBI.BigInt(targetPriceEthBN.toString()),
      targetUsd: JSBI.BigInt(targetPriceUsdPerTokenDec.toFixed(0)),
      actualEth: actualPriceEthBI,
      actualUsd: actualPriceUsdBI
    },
    tick: alignedTick,
    marketCap: {
      targetEth: JSBI.divide(
        JSBI.multiply(totalSupplyBI, JSBI.BigInt(targetPriceEthBN.toString())),
        SCALE
      ),
      targetUsd: JSBI.BigInt(targetMarketCapUsd.toString()),
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
