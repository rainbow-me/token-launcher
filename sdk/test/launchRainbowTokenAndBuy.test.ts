import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { BigNumber } from '@ethersproject/bignumber';
import { HashZero } from '@ethersproject/constants';
import { predictTokenAddress } from '../src/predictAddress';
import { isAddress } from '@ethersproject/address';
import { getInitialTick } from '../src/getInitialTick';
import { formatUnits } from '@ethersproject/units';
import { TokenLauncher } from '../src/index';
import { getFactorySupportedChains } from '../src/utils/getFactorySupportedChains';
import { getTokenLauncherContractConfig } from '../src/utils/getFactoryConfig';

describe('Launch Rainbow Super Token and Buy', () => {
  let provider: JsonRpcProvider;
  let wallet: Wallet;
  let sdk: typeof TokenLauncher;

  beforeAll(async () => {
    provider = new JsonRpcProvider('http://127.0.0.1:8545');
    wallet = new Wallet(
      '0x34120324fbc54dfb9b92a0a12221fbd63e7bb825733d27ad09efaa617b393c73',
      provider
    );
    sdk = TokenLauncher;
    sdk.configure({
      MODE: 'jest',
      SUPPORTED_NETWORKS: getFactorySupportedChains(),
    });
  }, 30000);

  it('should check that the creator wallet has funds', async () => {
    const balance = await provider.getBalance(wallet.address);
    console.log('creator wallet balance: ', balance);
    expect(balance.gt(BigNumber.from('0'))).toBe(true);
  });

  it('should get factory config', async () => {
    const config = await getTokenLauncherContractConfig(wallet, sdk.getConfig());
    expect(config).toBeDefined();
    console.log('factory config: ', config);
  });

  it('should predict token address', async () => {
    const address = await predictTokenAddress(
      {
        name: 'Test Token',
        symbol: 'TEST',
        supply: '1000000000000000000000',
        wallet,
        merkleroot: HashZero,
        creator: wallet.address,
        salt: HashZero,
      },
      sdk.getConfig()
    );

    console.log('predicted address: ', address);
    expect(isAddress(address)).toBe(true);
  });

  it('calculates correct initial tick for common token prices', async () => {
    const testCases = [
      {
        tokenPrice: BigNumber.from(10).pow(18), // 1 ETH
        expectedPrice: 1,
      },
      {
        tokenPrice: BigNumber.from(2).mul(BigNumber.from(10).pow(18)), // 2 ETH
        expectedPrice: 2,
      },
      {
        tokenPrice: BigNumber.from(10)
          .pow(18)
          .div(2), // 0.5 ETH
        expectedPrice: 0.5,
      },
    ];

    for (const { tokenPrice, expectedPrice } of testCases) {
      console.log('\nTest case:', { tokenPrice: tokenPrice.toString(), expectedPrice });

      // Convert fixed-point tokenPrice to a number for logging.
      const inputPrice = parseFloat(formatUnits(tokenPrice, 18));
      console.log('Input token price:', inputPrice);

      const tick = getInitialTick(tokenPrice);
      console.log('Calculated tick:', tick);

      // Convert tick back to price: price = 1.0001^(tick)
      const actualPrice = Math.pow(1.0001, tick);
      console.log('Actual price from tick:', actualPrice);

      const percentDiff = Math.abs((actualPrice - expectedPrice) / expectedPrice);

      // Verify tick is aligned to spacing.
      expect(Math.abs(tick % 200)).toBe(0);

      // Verify price roughly matches expected.
      expect(percentDiff).toBeLessThan(0.1);
    }
  });

  it('handles extreme token prices', async () => {
    const testCases = [
      { tokenPrice: '0.0001', comment: 'Very cheap token' },
      { tokenPrice: '10000', comment: 'Very expensive token' },
    ];

    for (const { tokenPrice } of testCases) {
      const tick = getInitialTick(tokenPrice);

      // Verify tick is within Uniswap V3 bounds.
      expect(tick).toBeGreaterThanOrEqual(-887272); // MIN_TICK
      expect(tick).toBeLessThanOrEqual(887272); // MAX_TICK
      expect(Math.abs(tick % 200)).toBe(0); // Aligned to spacing
    }
  });

  it('should launch token and buy', async () => {
    const txParams = {
      name: 'CANTHISBEPURCHASED',
      symbol: 'CBP',
      supply: '1000000000000000000000000',
      amountIn: '1000000000000000000',
      initialTick: 200,
      logoUrl: 'https://example.com/logo.png',
      description: 'This is a test token',
      wallet,
      creator: wallet.address,
      transactionOptions: {
        gasLimit: '8000000',
        maxFeePerGas: '1500000000',
        maxPriorityFeePerGas: '1500000000',
      },
    };
    try {
      const tx = await sdk.launchTokenAndBuy(txParams);
      console.log('Transaction submitted with hash:', tx?.transaction.hash);
      expect(tx?.transaction.hash).toBeTruthy();
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }, 60000);

  it('should launch a rainbow super token', async () => {
    const txParams = {
      name: 'Api Test Submission Number 3',
      symbol: 'ATS3',
      supply: '1000000000000000000000000',
      amountIn: '1000000000000000000',
      initialTick: 200,
      wallet,
      creator: wallet.address,
      links: {},
      merkleroot: HashZero,
      logoUrl: 'https://example.com/logo.png',
      description: 'This is a test token',
      transactionOptions: {
        gasLimit: '8000000',
        maxFeePerGas: '1500000000',
        maxPriorityFeePerGas: '1500000000',
      },
    };
    const tx = await sdk.launchToken(txParams);
    console.log('Transaction submitted with hash:', tx?.transaction.hash);
    expect(tx?.transaction.hash).toBeTruthy();
  }, 60000);
});
