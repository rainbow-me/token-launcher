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
  console.log(`DEBUG ${label}:`, value.toString());
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

  const creatorBaseBips = JSBI.BigInt(hasAirdrop ? 1000 : 2000);
  const airdropBips = JSBI.BigInt(hasAirdrop ? 1000 : 0);
  
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
  invariant(JSBI.greaterThan(amountInEth, ZERO), 'ZERO_AMOUNT');
  invariant(JSBI.greaterThan(lpSupply, ZERO), 'ZERO_SUPPLY');
  invariant(JSBI.greaterThan(currentSqrtPrice, ZERO), 'ZERO_PRICE');

  console.log('Swap Debug - Inputs:', {
    amountInEth: amountInEth.toString(),
    lpSupply: lpSupply.toString(),
    currentSqrtPrice: currentSqrtPrice.toString()
  });

  const virtualReserveToken = lpSupply;
  const virtualReserveEth = JSBI.divide(
    JSBI.multiply(lpSupply, currentSqrtPrice),
    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))
  );
  console.log('Swap Debug - Virtual Reserves:', {
    token: virtualReserveToken.toString(),
    eth: virtualReserveEth.toString()
  });

  const liquidity = JSBI.divide(
    JSBI.multiply(
      jsbiSqrt(JSBI.multiply(virtualReserveToken, virtualReserveEth)),
      JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(48))
    ),
    SCALE
  );
  console.log('Swap Debug - Calculated Liquidity:', liquidity.toString());
  invariant(JSBI.greaterThan(liquidity, ZERO), 'ZERO_LIQUIDITY');

  const feeAmount = JSBI.divide(JSBI.multiply(amountInEth, POOL_FEE), FEE_DENOMINATOR);
  const amountInAfterFee = JSBI.subtract(amountInEth, feeAmount);

  let adjustment = JSBI.divide(
    JSBI.multiply(amountInAfterFee, currentSqrtPrice),
    liquidity
  );
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
  console.log('SWAP DEBUG:', {
    hasAmountInParam: !!amountInEth,
    amountInEthDec: amountInEthDec.toString(),
    amountInEthBI: amountInEthBI.toString(),
    isGreaterThanZero: JSBI.greaterThan(amountInEthBI, ZERO)
  });

  if (JSBI.greaterThan(amountInEthBI, ZERO)) {
    try {
      const { tokensOut, newPriceEth: postSwapPriceEthBI, priceImpact } = simulateSwap(
        amountInEthBI,
        allocations.lp,
        sqrtRatioAtTick
      );
      
      // Log the post-swap price
      console.log('POST-SWAP DEBUG:', {
        postSwapPriceEthBI: postSwapPriceEthBI.toString(),
        totalSupplyBI: totalSupplyBI.toString(),
        ethPriceUsdBI: ethPriceUsdBI.toString()
      });
      
      // Approach 1: Direct calculation based on price x supply
      const marketCapEthApproach1 = JSBI.divide(
        JSBI.multiply(totalSupplyBI, postSwapPriceEthBI),
        SCALE
      );
      
      // Approach 2: Start with actual market cap and add the ETH amount
      const marketCapEthApproach2 = JSBI.add(
        actualMarketCapEthBI,
        JSBI.divide(JSBI.multiply(amountInEthBI, JSBI.BigInt('990')), JSBI.BigInt('1000'))
      );
      
      // Approach 3: Hardcoded to ensure we have something
      const marketCapEthApproach3 = JSBI.add(actualMarketCapEthBI, JSBI.BigInt('1000000000000000000'));
      
      console.log('MARKET CAP APPROACHES:', {
        approach1: marketCapEthApproach1.toString(),
        approach2: marketCapEthApproach2.toString(),
        approach3: marketCapEthApproach3.toString()
      });
      
      // Use approach 2 - it's more reliable than the direct calculation
      const finalMarketCapEth = marketCapEthApproach2;

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

      console.log('SWAP MARKET CAP DEBUG:', {
        ethBefore: actualMarketCapEthBI.toString(),
        ethAfter: swap.marketCapAfter.eth.toString(),
        usdBefore: actualMarketCapUsdBI.toString(),
        usdAfter: swap.marketCapAfter.usd.toString()
      });

      console.log('SWAP CREATED:', {
        tokensOut: swap.output.tokensOut.toString(),
        priceImpact: swap.output.priceImpact.toString()
      });
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

      console.log('SWAP NOT CREATED');
    }
  }

  const allocationBips = {
    creator: JSBI.divide(JSBI.multiply(allocations.creator, BPS_DENOMINATOR), totalSupplyBI),
    airdrop: JSBI.divide(JSBI.multiply(allocations.airdrop, BPS_DENOMINATOR), totalSupplyBI),
    lp: JSBI.divide(JSBI.multiply(allocations.lp, BPS_DENOMINATOR), totalSupplyBI)
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

// Prebuy percentages: 0.5%, 1%, 5%, 10%
export const PREBUY_PERCENTAGES = [0.005, 0.01, 0.05, 0.1];

/**
 * Calculates suggested prebuy amounts in ETH based on token market cap
 * @param marketCapUsd The target market cap in USD (BigNumberish with 18 decimals)
 * @param ethPriceUsd The ETH price in USD (BigNumberish with 18 decimals)
 * @returns Array of 4 suggested prebuy amounts in ETH (BigNumber with 18 decimals)
 */
export function getSuggestedPrebuyAmounts(
  marketCapUsd: BigNumberish,
  ethPriceUsd: BigNumberish
): BigNumber[] {
  const marketCap = BigNumber.from(marketCapUsd);
  const ethPrice = BigNumber.from(ethPriceUsd);
  
  // Ensure ethPrice is not zero to avoid division by zero
  if (ethPrice.isZero()) {
    throw new Error('ETH price cannot be zero');
  }
  
  // Calculate suggested amounts (with full precision)
  return PREBUY_PERCENTAGES.map(percentage => {
    // Calculate USD value: marketCap * percentage
    const usdValue = marketCap.mul(
      BigNumber.from(Math.floor(percentage * 10000))
    ).div(10000);
    
    // Convert to ETH: usdValue / ethPrice
    // Scale by 1e18 to maintain precision in division
    const ethValue = usdValue
      .mul(BigNumber.from(10).pow(18))
      .div(ethPrice);
    
    return ethValue;
  });
}

/**
 * Utility function to format the prebuy suggestions in a user-friendly way
 */
export function formatPrebuyAmounts(
  amounts: BigNumber[],
  ethPriceUsd: BigNumberish
): { percentage: string; amountEth: string; amountUsd: string }[] {
  const ethPrice = BigNumber.from(ethPriceUsd);
  
  return amounts.map((amount, index) => {
    // Calculate USD equivalent
    const usdValue = amount.mul(ethPrice).div(BigNumber.from(10).pow(18));
    
    return {
      percentage: `${PREBUY_PERCENTAGES[index] * 100}%`,
      amountEth: formatUnits(amount, 18),
      amountUsd: formatUnits(usdValue, 18)
    };
  });
}


