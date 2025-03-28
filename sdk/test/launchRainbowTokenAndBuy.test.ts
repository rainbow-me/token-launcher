import { http, createClient, parseEther, zeroHash, isAddress, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import { getBalance } from 'viem/actions';
import { predictTokenAddress } from '../src/predictAddress';
import { getInitialTick } from '../src/getInitialTick';
import { TokenLauncher } from '../src/index';
import { getFactorySupportedChains } from '../src/utils/getFactorySupportedChains';
import { getTokenLauncherContractConfig } from '../src/utils/getFactoryConfig';
import { ViemClient } from '../src/types';

describe('Launch Rainbow Super Token and Buy', () => {
  let client: ViemClient;
  let sdk: typeof TokenLauncher;

  beforeAll(async () => {
    client = createClient({
      account: privateKeyToAccount(
        '0x34120324fbc54dfb9b92a0a12221fbd63e7bb825733d27ad09efaa617b393c73'
      ),
      chain: anvil,
      transport: http(),
    });
    sdk = TokenLauncher;
    sdk.configure({
      MODE: 'jest',
      SUPPORTED_NETWORKS: getFactorySupportedChains(),
    });
  }, 30000);

  it('should check that the creator wallet has funds', async () => {
    const balance = await getBalance(client, { address: client.account.address });
    console.log('creator wallet balance: ', balance);
    expect(balance > 0n).toBe(true);
  });

  it('should get factory config', async () => {
    const config = await getTokenLauncherContractConfig(client, sdk.getConfig());
    expect(config).toBeDefined();
    console.log('factory config: ', config);
  });

  it('should predict token address', async () => {
    const address = await predictTokenAddress(
      {
        name: 'Test Token',
        symbol: 'TEST',
        supply: 1000000000000000000000n,
        client,
        merkleroot: zeroHash,
        creator: client.account.address,
        salt: zeroHash,
      },
      sdk.getConfig()
    );

    console.log('predicted address: ', address);
    expect(isAddress(address)).toBe(true);
  });

  it('calculates correct initial tick for common token prices', async () => {
    const testCases = [
      {
        tokenPrice: parseEther('1'), // 1 ETH
        expectedPrice: 1,
      },
      {
        tokenPrice: parseEther('2'), // 2 ETH
        expectedPrice: 2,
      },
      {
        tokenPrice: parseEther('0.5'), // 0.5 ETH
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
      supply: 1000000000000000000000000n,
      amountIn: 1000000000000000000n,
      initialTick: 200,
      logoUrl: 'https://example.com/logo.png',
      description: 'This is a test token',
      client,
      creator: client.account.address,
      transactionOptions: {
        gas: 8000000n,
        maxFeePerGas: 1500000000n,
        maxPriorityFeePerGas: 1500000000n,
      },
    };
    try {
      const tx = await sdk.launchTokenAndBuy(txParams);
      console.log('Transaction submitted with hash:', tx?.hash);
      expect(tx?.hash).toBeTruthy();
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }, 60000);

  it('should launch a rainbow super token', async () => {
    const txParams = {
      name: 'Api Test Submission Number 3',
      symbol: 'ATS3',
      supply: 1000000000000000000000000n,
      amountIn: 1000000000000000000n,
      initialTick: 200,
      client,
      creator: client.account.address,
      links: {},
      merkleroot: zeroHash,
      logoUrl: 'https://example.com/logo.png',
      description: 'This is a test token',
      transactionOptions: {
        gas: 8000000n,
        maxFeePerGas: 1500000000n,
        maxPriorityFeePerGas: 1500000000n,
      },
    };
    const tx = await sdk.launchToken(txParams);
    console.log('Transaction submitted with hash:', tx?.hash);
    expect(tx?.hash).toBeTruthy();
  }, 60000);
});
