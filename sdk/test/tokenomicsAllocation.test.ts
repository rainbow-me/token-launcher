import { TokenLauncher } from '../src'
import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import { CREATOR_BPS, CREATOR_BPS_WITH_AIRDROP, AIRDROP_BPS } from '../src/utils/tokenomics'

describe('Tokenomics Allocation Tests', () => {
  // Base parameters - $35,000 market cap, 1B tokens, ETH at $2200
  const baseParams = {
    targetMarketCapUsd: parseUnits('35000', 18),
    totalSupply: parseUnits('1000000000', 18),
    ethPriceUsd: parseUnits('2200', 18),
    hasAirdrop: false
  };

  // Market cap in ETH (≈ 16 ETH)
  const marketCapEth = baseParams.targetMarketCapUsd
    .mul(parseUnits('1', 18))
    .div(baseParams.ethPriceUsd);

  const testCases = [
    { name: 'zero amount', percentage: 0, amountInEth: parseUnits('0', 18) },
    { name: 'tiny amount (0.1%)', percentage: 0.1, amountInEth: marketCapEth.mul(1).div(1000) },
    { name: 'small amount (1%)', percentage: 1, amountInEth: marketCapEth.mul(1).div(100) },
    { name: 'medium amount (5%)', percentage: 5, amountInEth: marketCapEth.mul(5).div(100) },
    { name: 'large amount (10%)', percentage: 10, amountInEth: marketCapEth.mul(10).div(100) },
    { name: 'very large amount (20%)', percentage: 20, amountInEth: marketCapEth.mul(20).div(100) },
    { name: 'extreme amount (50%)', percentage: 50, amountInEth: marketCapEth.mul(50).div(100) }
  ];

  testCases.forEach(({ name, percentage, amountInEth }) => {
    it(`calculates valid allocations with ${name} input`, () => {
      const params = {
        ...baseParams,
        amountInEth
      };

      const result = TokenLauncher.calculateTokenomics(params);

      // Log detailed results for analysis
      console.log(`--- Test with ${name} (${percentage}% of market cap) ---`);
      console.log(`Amount in ETH: ${formatUnits(amountInEth, 18)} ETH`);
      console.log(`Creator allocation: ${result.allocation.creator}%`);
      console.log(`LP allocation: ${result.allocation.lp}%`);
      console.log(`Airdrop allocation: ${result.allocation.airdrop}%`);
      console.log(`Total allocation: ${result.allocation.creator + result.allocation.lp + result.allocation.airdrop}%`);
      
      if (result.swap) {
        console.log(`Tokens transferred to creator: ${formatUnits(result.swap.output.tokensOut, 18)}`);
        console.log(`Price impact: ${formatUnits(result.swap.output.priceImpact, 18)}`);
      }
      
      // Verify allocations are valid
      expect(result.allocation.creator).toBeGreaterThanOrEqual(CREATOR_BPS / 100);
      expect(result.allocation.creator).toBeLessThanOrEqual(100);
      
      expect(result.allocation.lp).toBeGreaterThanOrEqual(0);
      expect(result.allocation.lp).toBeLessThanOrEqual(100);
      
      expect(result.allocation.airdrop).toBeGreaterThanOrEqual(0);
      expect(result.allocation.airdrop).toBeLessThanOrEqual(100);
      
      // Verify that allocation percentages sum to exactly 100%
      const totalAllocation = result.allocation.creator + result.allocation.lp + result.allocation.airdrop;
      expect(totalAllocation).toBe(100);
    });
  });

  it('validates allocation percentages match actual token allocations', () => {
    // Test with a moderate amount (5%)
    const params = {
      ...baseParams,
      amountInEth: marketCapEth.mul(5).div(100)
    };

    const result = TokenLauncher.calculateTokenomics(params);
    
    // Calculate actual percentages from token amounts
    const totalSupply = result.supply.total;
    const creatorPercentage = BigNumber.from(result.supply.creator).mul(100).div(totalSupply);
    const lpPercentage = BigNumber.from(result.supply.lp).mul(100).div(totalSupply);
    const airdropPercentage = BigNumber.from(result.supply.airdrop).mul(100).div(totalSupply);
    
    console.log('Calculated vs Reported Percentages:');
    console.log(`Creator: ${creatorPercentage}% vs ${result.allocation.creator}%`);
    console.log(`LP: ${lpPercentage}% vs ${result.allocation.lp}%`);
    console.log(`Airdrop: ${airdropPercentage}% vs ${result.allocation.airdrop}%`);
    
    // Verify reported percentages match calculated percentages with higher tolerance 
    // due to integer division and rounding in the calculations
    expect(Math.abs(Number(creatorPercentage) - result.allocation.creator)).toBeLessThan(0.6);
    expect(Math.abs(Number(lpPercentage) - result.allocation.lp)).toBeLessThan(0.6);
    expect(Math.abs(Number(airdropPercentage) - result.allocation.airdrop)).toBeLessThan(0.6);
  });

  it('uses correct default allocations with no airdrop', () => {
    const result = TokenLauncher.calculateTokenomics({
      ...baseParams,
      hasAirdrop: false
    });

    // Default allocation with no airdrop and no buys
    expect(result.allocation.creator).toBe(CREATOR_BPS / 100);
    expect(result.allocation.airdrop).toBe(0);
    expect(result.allocation.lp).toBe(100 - (CREATOR_BPS / 100));
  });

  it('uses correct default allocations with airdrop', () => {
    const result = TokenLauncher.calculateTokenomics({
      ...baseParams,
      hasAirdrop: true
    });

    // Default allocation with airdrop and no buys
    expect(result.allocation.creator).toBe(CREATOR_BPS_WITH_AIRDROP / 100);
    expect(result.allocation.airdrop).toBe(AIRDROP_BPS / 100);
    expect(result.allocation.lp).toBe(100 - (CREATOR_BPS_WITH_AIRDROP / 100) - (AIRDROP_BPS / 100));
  });
}); 