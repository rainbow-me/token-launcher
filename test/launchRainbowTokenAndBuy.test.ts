import { ethers } from 'ethers';
import { deployTokenLauncher, startAnvil, stopAnvil } from './helpers/index';
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

  afterAll(async () => {
    await stopAnvil();
  }, 10000);

  it ('should check that the creator wallet has funds', async () => {
    const balance = await provider.getBalance(WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS);
    console.log('balance: ', balance);
    expect(balance).toBeGreaterThan(BigInt('0'));
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

  it('should launch token and buy', async () => {
    const tx = await sdk.launchRainbowSuperTokenAndBuy({
      name: 'Test Token',
      symbol: 'TEST',
      supply: BigInt('1000000000000000000000'),
      initialTick: 200,
      amountIn: BigInt('1000000000000000000'),
      signer: new ethers.Wallet(WALLET_VARS.PRIVATE_KEY_WALLET.SECRET, provider),
      merkleroot: ethers.ZeroHash,
      creator: WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS,
    });

    console.log('Transaction submitted, waiting for confirmation...');

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt?.blockNumber);
    expect(receipt?.status).toBe(1);

    // Get the token creation event
    const event = receipt?.logs.find(
      log => log.topics[0] === ethers.id("RainbowSuperTokenCreated(address,address,address)")
    );
    expect(event).toBeDefined();

    // Get the new token address from the event
    const tokenAddress = ethers.dataSlice(event!.topics[1], 12);
    expect(ethers.isAddress(tokenAddress)).toBe(true);

    // Verify the token exists and has the correct properties
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function symbol() view returns (string)'],
      provider
    );
    expect(await tokenContract.symbol()).toBe('TEST');
  }, 20000);
});