import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { parseEther } from '@ethersproject/units';
import { createTestHarness } from '../../../test/harness/anvil';
import { Protocol, type LaunchTokenParams } from '../../types/index';
import { ClankerToken_v4_abi } from './abis/ClankerToken';
import { base } from 'viem/chains';

describe('Clanker protocol', () => {
  const { provider, wallet, sdk, sampleLogoUrl } = createTestHarness();

  beforeEach(() => {
    sdk.configure({ chains: [base.id] });
  });

  it('should check that the creator wallet has funds', async () => {
    const balance = await provider.getBalance(wallet.address);
    expect(balance.gt(BigNumber.from('0'))).toBe(true);
  });

  it('should launch basic token', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'Api Test Submission Number 1',
      symbol: 'ATS1',
      wallet,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.transaction?.hash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();

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
  }, 60000);

  it('should launch token with description metadata', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'Api Test Submission Number 2',
      symbol: 'ATS2',
      wallet,
      logoUrl: sampleLogoUrl,
      description: 'This is a test token',
      links: {},
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.transaction?.hash).toBeTruthy();

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

  it('should launch token with full metadata', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'Api Test Submission Number 3',
      symbol: 'ATS3',
      wallet,
      logoUrl: sampleLogoUrl,
      description: 'This is another test token',
      links: { other: 'https://rainbow.me' },
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.transaction?.hash).toBeTruthy();

    const deployedToken = new Contract(
      launchResponse?.tokenAddress || '',
      ClankerToken_v4_abi,
      provider
    );
    const metadata = await deployedToken.metadata();
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
      wallet,
      logoUrl: sampleLogoUrl,
      description: 'This is yet another test token',
      links: { other: 'https://rainbow.me' },
      amountIn,
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.transaction?.hash).toBeTruthy();
  }, 60000);
});
