import { JsonRpcProvider } from '@ethersproject/providers';
import { Signer } from '@ethersproject/abstract-signer';
import { Wallet } from '@ethersproject/wallet';
import { BigNumber } from '@ethersproject/bignumber';
import { deployTokenLauncher, startAnvil, stopAnvil } from './helpers';
import { launchRainbowSuperToken, launchRainbowSuperTokenAndBuy, predictTokenAddress } from '../src/factory';
import { WALLET_VARS } from './references';
import { HashZero } from '@ethersproject/constants';
import { isAddress } from '@ethersproject/address';
import { Contract } from '@ethersproject/contracts';
import { hexDataSlice } from '@ethersproject/bytes';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { findValidSalt } from './helpers/findValidSalt';
import { getFactoryContract } from '../src/factory/utils/getFactoryContract';

describe('Launch Rainbow Super Token and Buy', () => {
  let provider: JsonRpcProvider;
  let wallet: Signer;

  beforeAll(async () => {
    await startAnvil();
    // Deploy factory and set FACTORY_ADDRESS in env
    process.env.FACTORY_ADDRESS = await deployTokenLauncher();
    provider = new JsonRpcProvider('http://localhost:8545');
    wallet = new Wallet(WALLET_VARS.PRIVATE_KEY_WALLET.SECRET, provider);
  });

  afterAll(async () => {
    await stopAnvil();
  }, 10000);

  it('should check that the creator wallet has funds', async () => {
    const balance = await provider.getBalance(WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS);
    console.log('creator wallet balance: ', balance);
    expect(balance.gt(BigNumber.from('0'))).toBe(true);
  });

  it('should predict token address', async () => {
    const address = await predictTokenAddress({
      name: 'Test Token',
      symbol: 'TEST',
      supply: '1000000000000000000000',
      wallet,
      merkleroot: HashZero,
      creator: WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS,
      salt: HashZero,
    });

    console.log('predicted address: ', address);
    expect(isAddress(address)).toBe(true);
  });

  it('should launch token and buy', async () => {
    const tx = await launchRainbowSuperTokenAndBuy({
      name: 'Test Token',
      symbol: 'TEST',
      supply: '1000000000000000000000',
      initialTick: 200,
      amountIn: '1000000000000000000',
      wallet,
      merkleroot: HashZero,
      creator: WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS,
      salt: (await findValidSalt(await getFactoryContract(wallet), WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS, 'Test Token', 'TEST', HashZero, '1000000000000000000000')).salt,
    });

    console.log('Transaction submitted, waiting for confirmation...');

    const receipt = await provider.waitForTransaction(tx?.hash || '');
    console.log('Transaction confirmed in block:', receipt?.blockNumber);
    expect(receipt?.status).toBe(1);

    const event = receipt?.logs.find(
      log =>
        log.topics[0] ===
        keccak256(toUtf8Bytes('RainbowSuperTokenCreated(address,address,address)'))
    );
    expect(event).toBeDefined();

    const tokenAddress = hexDataSlice(event!.topics[1], 12);
    expect(isAddress(tokenAddress)).toBe(true);

    const tokenContract = new Contract(
      tokenAddress,
      ['function symbol() view returns (string)'],
      provider
    );
    expect(await tokenContract.symbol()).toBe('TEST');
  }, 20000);
  
  it('should launch a rainbow super token', async () => {
    const tx = await launchRainbowSuperToken({
      name: 'Test Token',
      symbol: 'TEST',
      supply: '1000000000000000000000',
      wallet,
      merkleroot: HashZero,
      creator: WALLET_VARS.PRIVATE_KEY_WALLET.ADDRESS,
      salt: HashZero,
      initialTick: 200,
    });

    console.log('Transaction submitted, waiting for confirmation...');

    const receipt = await provider.waitForTransaction(tx.hash);
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    expect(receipt.status).toBe(1);

    const event = receipt.logs.find(
      log => log.topics[0] === keccak256(toUtf8Bytes('RainbowSuperTokenCreated(address,address,address)'))
    );
    expect(event).toBeDefined();

    const tokenAddress = hexDataSlice(event!.topics[1], 12);
    expect(isAddress(tokenAddress)).toBe(true);

    const tokenContract = new Contract(
      tokenAddress,
      ['function symbol() view returns (string)'],
      provider
    );
    expect(await tokenContract.symbol()).toBe('TEST');
  }, 20000);
});
