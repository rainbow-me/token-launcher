import { startAnvil, stopAnvil } from './setupAnvil';
import { ethers } from 'ethers';
import { deployTokenLauncher } from './helpers';
import { TokenLauncherSDK } from '../src/TokenLauncherSDK';
import { WALLET_VARS } from './references';

describe('TokenLauncherSDK', () => {
  let sdk: TokenLauncherSDK;
  let provider: ethers.JsonRpcProvider;
  let signer: ethers.Signer;
  let factoryAddress: string;

  beforeAll(async () => {
    await startAnvil();
    factoryAddress = await deployTokenLauncher();
    provider = new ethers.JsonRpcProvider('http://localhost:8545');
    signer = await provider.getSigner();
  });

  beforeEach(() => {
    sdk = new TokenLauncherSDK({
      apiUrl: process.env.API_URL_DEV || '',
      provider,
      factoryAddress,
      isProduction: false,
    });
  });

  afterAll(() => {
    stopAnvil();
  });

  it('should launch token and buy', async () => {
    const tx = await sdk.launchRainbowSuperTokenAndBuy({
      name: 'Test Token',
      symbol: 'TEST',
      supply: BigInt('1000000000000000000000'), // 1000 tokens
      initialTick: 0, // Start at "fair" price
      amountIn: BigInt('100000000000000000'), 
      signer,
      merkleroot: ethers.ZeroHash,
      creator: WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS,
    });

    console.log('tx: ', tx);
    expect(tx).toBeDefined();
  });

  it('should predict token address', async () => {
    const address = await sdk.predictTokenAddress({
      name: 'Test Token',
      symbol: 'TEST',
      supply: BigInt('1000000000000000000000'),
      signer,
      merkleroot: ethers.ZeroHash,
      creator: WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS,
    });

    console.log('predicted address: ', address);
    expect(ethers.isAddress(address)).toBe(true);
  });
});