import { ethers } from 'ethers';
import { deployTokenLauncher, startAnvil, stopAnvil } from '../../helpers';
import { launchRainbowSuperTokenAndBuy, predictTokenAddress } from '../../../src/factory';
import { WALLET_VARS } from '../../references';

describe('Launch Rainbow Super Token and Buy', () => {
  let provider: ethers.JsonRpcProvider;
  let wallet: ethers.Signer;

  beforeAll(async () => {
    await startAnvil();
    // Deploy factory and set FACTORY_ADDRESS in env
    process.env.FACTORY_ADDRESS = await deployTokenLauncher();
    provider = new ethers.JsonRpcProvider('http://localhost:8545');
    wallet = new ethers.Wallet(WALLET_VARS.PRIVATE_KEY_WALLET.SECRET, provider);
  });

  afterAll(async () => {
    await stopAnvil();
  }, 10000);

  it('should check that the creator wallet has funds', async () => {
    const balance = await provider.getBalance(WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS);
    console.log('creator wallet balance: ', balance);
    expect(balance).toBeGreaterThan(BigInt('0'));
  });
  
  it('should predict token address', async () => {
    const address = await predictTokenAddress({
      name: 'Test Token',
      symbol: 'TEST',
      supply: BigInt('1000000000000000000000'),
      wallet,
      merkleroot: ethers.ZeroHash,
      creator: WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS,
      salt: ethers.ZeroHash,
    });

    console.log('predicted address: ', address);
    expect(ethers.isAddress(address)).toBe(true);
  });

  it('should launch token and buy', async () => {
    const tx = await launchRainbowSuperTokenAndBuy({
      name: 'Test Token',
      symbol: 'TEST',
      supply: BigInt('1000000000000000000000'),
      initialTick: 200,
      amountIn: BigInt('1000000000000000000'),
      wallet,
      merkleroot: ethers.ZeroHash,
      creator: WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS,
      salt: ethers.ZeroHash,
    });

    console.log('Transaction submitted, waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt?.blockNumber);
    expect(receipt?.status).toBe(1);

    const event = receipt?.logs.find(
      log => log.topics[0] === ethers.id("RainbowSuperTokenCreated(address,address,address)")
    );
    expect(event).toBeDefined();

    const tokenAddress = ethers.dataSlice(event!.topics[1], 12);
    expect(ethers.isAddress(tokenAddress)).toBe(true);

    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function symbol() view returns (string)'],
      provider
    );
    expect(await tokenContract.symbol()).toBe('TEST');
  }, 20000);
}); 