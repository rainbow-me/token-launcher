import { createTestHarness } from '../../../test/harness/anvil';
import { type LaunchTokenParams, Protocol } from '../../types/index';
import { ClankerToken_v4_abi } from './abis/ClankerToken';
import { type Address, getContract, parseEther } from 'viem';
import { base } from 'viem/chains';

describe('Clanker protocol', () => {
  const { publicClient, walletClient, account, sdk, sampleLogoUrl } = createTestHarness();

  beforeEach(() => {
    sdk.configure({ chains: [base.id] });
  });

  it('should check that the creator wallet has funds', async () => {
    const balance = await publicClient.getBalance({ address: account.address });
    expect(balance > 0n).toBe(true);
  });

  it('should launch basic token', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'Api Test Submission Number 1',
      symbol: 'ATS1',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.transaction?.hash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();
    const tokenAddress = launchResponse!.tokenAddress as Address;

    const deployedToken = getContract({
      address: tokenAddress,
      abi: ClankerToken_v4_abi,
      client: publicClient,
    });
    const [name, symbol, admin] = await Promise.all([
      deployedToken.read.name(),
      deployedToken.read.symbol(),
      deployedToken.read.admin(),
    ]);
    expect(name).toBe(txParams.name);
    expect(admin.toLowerCase()).toBe(account.address.toLowerCase());
    expect(symbol).toBe(txParams.symbol);
  }, 60000);

  it('should launch token with description metadata', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'Api Test Submission Number 2',
      symbol: 'ATS2',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      description: 'This is a test token',
      links: {},
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.transaction?.hash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();
    const tokenAddress = launchResponse!.tokenAddress as Address;

    const deployedToken = getContract({
      address: tokenAddress,
      abi: ClankerToken_v4_abi,
      client: publicClient,
    });
    const [imageUrl, metadata] = await Promise.all([
      deployedToken.read.imageUrl(),
      deployedToken.read.metadata(),
    ]);
    expect(imageUrl).toBe(txParams.logoUrl);
    const description = JSON.parse(metadata)?.description;
    expect(description).toBe(txParams.description);
  }, 60000);

  it('should launch token with full metadata', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'Api Test Submission Number 3',
      symbol: 'ATS3',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      description: 'This is another test token',
      links: { other: 'https://rainbow.me' },
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.transaction?.hash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();
    const tokenAddress = launchResponse!.tokenAddress as Address;

    const deployedToken = getContract({
      address: tokenAddress,
      abi: ClankerToken_v4_abi,
      client: publicClient,
    });
    const metadata = await deployedToken.read.metadata();
    const links = JSON.parse(metadata)?.socialMediaUrls;
    expect(links?.[0]?.platform).toBe('other');
    expect(links?.[0]?.url).toBe(txParams.links?.other);
  }, 60000);

  it('should launch token with dev buy', async () => {
    const amountIn = parseEther('0.1').toString();
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'Api Test Submission Number 4',
      symbol: 'ATS4',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      description: 'This is yet another test token',
      links: { other: 'https://rainbow.me' },
      amountIn,
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.transaction?.hash).toBeTruthy();
  }, 60000);
});
