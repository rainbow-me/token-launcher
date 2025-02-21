import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { BigNumber } from '@ethersproject/bignumber';
import { launchRainbowSuperToken, launchRainbowSuperTokenAndBuy } from '../src/launchToken';
import { HashZero } from '@ethersproject/constants';
import { startAnvil, stopAnvil } from './helpers';
import { predictTokenAddress } from '../src/predictAddress';
import { isAddress } from '@ethersproject/address';

describe('Launch Rainbow Super Token and Buy', () => {
  let provider: JsonRpcProvider;
  let wallet: Wallet;

  beforeAll(async () => {
    provider = new JsonRpcProvider('http://localhost:8545');
    wallet = new Wallet('0x34120324fbc54dfb9b92a0a12221fbd63e7bb825733d27ad09efaa617b393c73', provider);
  }, 30000);

  afterAll(async () => {
    // await stopAnvil();
  }, 10000);

  it('should check that the creator wallet has funds', async () => {
    const balance = await provider.getBalance(wallet.address);
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
      creator: wallet.address,
      salt: HashZero,
    });

    console.log('predicted address: ', address);
    expect(isAddress(address)).toBe(true);
  });

  it('should launch token and buy', async () => {
    const txParams = {
      name: "CANTHISBEPURCHASED",
      symbol: "CBP",
      supply: "1000000000000000000000000",
      amountIn: "1000000000000000000",
      initialTick: 200,
      wallet,
      creator: wallet.address,
      transactionOptions: {
        gasLimit: '8000000',
        maxFeePerGas: '1500000000',
        maxPriorityFeePerGas: '1500000000'
      }
    };

    const tx = await launchRainbowSuperTokenAndBuy(txParams);

    console.log('Transaction submitted, waiting for confirmation...');

    const receipt = await provider.waitForTransaction(tx?.hash || '');
    console.log('Transaction confirmed in block:', receipt?.blockNumber);
    expect(receipt?.status).toBe(1);
  }, 20000);
  
  it('should launch a rainbow super token', async () => {
    const txParams = {
      name: "Api Test Submission Number 3",
      symbol: "ATS3",
      supply: "1000000000000000000000000",
      amountIn: "1000000000000000000",
      initialTick: 200,
      wallet,
      creator: wallet.address,
      merkleroot: HashZero,
      transactionOptions: {
        gasLimit: '8000000',
        maxFeePerGas: '1500000000',
        maxPriorityFeePerGas: '1500000000'
      }
    };

    const tx = await launchRainbowSuperToken({
      ...txParams,
    });

    console.log('Transaction submitted, waiting for confirmation...');

    const receipt = await provider.waitForTransaction(tx.hash);
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    expect(receipt.status).toBe(1);
  }, 20000);
});
