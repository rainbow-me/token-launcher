import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { parseEther } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { ClankerToken_v4_abi } from './references/abis/ClankerToken';
import { TokenLauncher } from '../src/index';
import { LaunchTokenParams, LaunchTokenAndBuyParams } from '../src/types/index';

const SAMPLE_LOGO_URL =
  'https://rainbowme-res.cloudinary.com/image/upload/v1756412183/token-launcher/tokens/c0zvpu7k52lmdm2ubf2n.jpg';

describe('Launch Rainbow Super Token and Buy', () => {
  let provider: JsonRpcProvider;
  let wallet: Wallet;
  let sdk: typeof TokenLauncher;

  beforeAll(async () => {
    provider = new JsonRpcProvider('http://127.0.0.1:8545');
    wallet = new Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider
    );
    sdk = TokenLauncher;
  }, 30000);

  it('should check that the creator wallet has funds', async () => {
    const balance = await provider.getBalance(wallet.address);
    console.log('creator wallet balance: ', balance);
    expect(balance.gt(BigNumber.from('0'))).toBe(true);
  });

  it('should launch basic v2 token', async () => {
    const txParams: LaunchTokenParams = {
      name: 'Api Test Submission Number 1',
      symbol: 'ATS1',
      wallet,
      logoUrl: SAMPLE_LOGO_URL,
      links: {},
      amountIn: '0',
    };
    try {
      const launchResponse = await sdk.launchToken(txParams);
      console.log('Transaction submitted with hash:', launchResponse?.transaction?.hash);
      expect(launchResponse?.transaction?.hash).toBeTruthy();
      expect(launchResponse?.tokenAddress).toBeTruthy();

      // validate the onchain result
      const deployedToken = new Contract(
        launchResponse?.tokenAddress || '',
        ClankerToken_v4_abi,
        provider
      );
      const [name, symbol, admin] = await Promise.all([
        deployedToken.name(),
        deployedToken.symbol(),
        deployedToken.admin(),
      ]);
      expect(name).toBe(txParams.name);
      expect(admin.toLowerCase()).toBe(wallet.address.toLowerCase());
      expect(symbol).toBe(txParams.symbol);
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }, 60000);

  it('should launch v2 token with description metadata', async () => {
    const txParams: LaunchTokenParams = {
      name: 'Api Test Submission Number 2',
      symbol: 'ATS2',
      wallet,
      logoUrl: SAMPLE_LOGO_URL,
      description: 'This is a test token',
      links: {},
      amountIn: '0',
    };
    const launchResponse = await sdk.launchToken(txParams);
    console.log('Transaction submitted with hash:', launchResponse?.transaction?.hash);
    expect(launchResponse?.transaction?.hash).toBeTruthy();
    // validate the onchain result
    const deployedToken = new Contract(
      launchResponse?.tokenAddress || '',
      ClankerToken_v4_abi,
      provider
    );
    const [imageUrl, metadata] = await Promise.all([
      deployedToken.imageUrl(),
      deployedToken.metadata(),
    ]);
    expect(imageUrl).toBe(txParams.logoUrl);
    const description = JSON.parse(metadata)?.description;
    expect(description).toBe(txParams.description);
  }, 60000);

  it('should launch v2 token with full metadata', async () => {
    const txParams: LaunchTokenParams = {
      name: 'Api Test Submission Number 3',
      symbol: 'ATS3',
      wallet,
      logoUrl: SAMPLE_LOGO_URL,
      description: 'This is another test token',
      links: { other: 'https://rainbow.me' },
      amountIn: '0',
    };
    const launchResponse = await sdk.launchToken(txParams);
    console.log('Transaction submitted with hash:', launchResponse?.transaction?.hash);
    expect(launchResponse?.transaction?.hash).toBeTruthy();

    // validate the onchain result
    const deployedToken = new Contract(
      launchResponse?.tokenAddress || '',
      ClankerToken_v4_abi,
      provider
    );
    const [metadata] = await Promise.all([deployedToken.metadata()]);
    const links = JSON.parse(metadata)?.socialMediaUrls;
    links?.platform;
    expect(links?.[0]?.platform).toBe('other');
    expect(links?.[0]?.url).toBe(txParams.links?.other);
  }, 60000);

  it('should launch v2 token with dev buy', async () => {
    const amountIn = parseEther('0.1').toString();
    const txParams: LaunchTokenAndBuyParams = {
      name: 'Api Test Submission Number 4',
      symbol: 'ATS4',
      wallet,
      logoUrl: SAMPLE_LOGO_URL,
      description: 'This is yet another test token',
      links: { other: 'https://rainbow.me' },
      amountIn,
    };
    const launchResponse = await sdk.launchTokenAndBuy(txParams);
    console.log('Transaction submitted with hash:', launchResponse?.transaction?.hash);
    expect(launchResponse?.transaction?.hash).toBeTruthy();
  }, 60000);

  it('should launch v2 token with invalid amountIn for dev buy', async () => {
    const txParams: LaunchTokenAndBuyParams = {
      name: 'Api Test Submission Number 5 with invalid dev buy',
      symbol: 'ATS5',
      wallet,
      logoUrl: SAMPLE_LOGO_URL,
      description: 'This is yet another test token',
      links: { other: 'https://rainbow.me' },
      amountIn: 'NOT_A_VALID_ETH_VALUE',
    };
    // Await the expectation of the promise rejection and then use .toThrow()
    await expect(sdk.launchTokenAndBuy(txParams)).rejects.toThrow(/^INVALID_AMOUNT_IN_PARAM/);
  }, 60000);
});
