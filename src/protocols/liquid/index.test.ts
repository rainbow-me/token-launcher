import { ERC20Abi, LiquidFactoryAbi, LiquidSDK } from 'liquid-sdk';
import { type Address, decodeFunctionData, getContract, parseEther, zeroAddress } from 'viem';
import { base } from 'viem/chains';
import { createTestHarness } from '../../../test/harness/anvil';
import { type LaunchTokenParams, Protocol } from '../../types/index';
import { protocols } from '../index';
import { liquid } from './index';

function parseDeployTokenCall(publicClient: any, txHash: `0x${string}`) {
  return publicClient.getTransaction({ hash: txHash }).then((tx: any) => {
    const decoded = decodeFunctionData({
      abi: LiquidFactoryAbi,
      data: tx.input,
    });
    if (decoded.functionName !== 'deployToken') return null;
    return (decoded.args as any)[0];
  });
}

describe('Liquid protocol', () => {
  const { publicClient, walletClient, account, sdk, sampleLogoUrl } = createTestHarness();

  beforeEach(() => {
    sdk.configure({ chains: [base.id] });
  });

  it('registers the liquid adapter on the protocol map', () => {
    expect(protocols[Protocol.Liquid]).toBe(liquid);
    expect(liquid.supportedChains).toEqual([8453]);
  });

  it('should check that the creator wallet has funds', async () => {
    const balance = await publicClient.getBalance({ address: account.address });
    expect(balance > 0n).toBe(true);
  });

  it('should launch basic token', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Liquid,
      name: 'Liquid Test Token 1',
      symbol: 'LTT1',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.txHash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();
    const tokenAddress = launchResponse!.tokenAddress as Address;

    const deployedToken = getContract({
      address: tokenAddress,
      abi: ERC20Abi,
      client: publicClient,
    });
    const [name, symbol] = await Promise.all([
      deployedToken.read.name(),
      deployedToken.read.symbol(),
    ]);
    expect(name).toBe(txParams.name);
    expect(symbol).toBe(txParams.symbol);
  }, 60000);

  it('should launch token with description metadata', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Liquid,
      name: 'Liquid Test Token 2',
      symbol: 'LTT2',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      description: 'This is a test token on Liquid',
      links: {},
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.txHash).toBeTruthy();

    const config = await parseDeployTokenCall(publicClient, launchResponse!.txHash);
    expect(config).toBeTruthy();
    expect(config.tokenConfig.image).toBe(txParams.logoUrl);
    const metadata = JSON.parse(config.tokenConfig.metadata);
    expect(metadata?.description).toBe(txParams.description);
  }, 60000);

  it('should launch token with full metadata', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Liquid,
      name: 'Liquid Test Token 3',
      symbol: 'LTT3',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      description: 'Another test token on Liquid',
      links: { other: 'https://rainbow.me' },
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.txHash).toBeTruthy();

    const config = await parseDeployTokenCall(publicClient, launchResponse!.txHash);
    expect(config).toBeTruthy();
    const metadata = JSON.parse(config.tokenConfig.metadata);
    expect(metadata?.socialMediaUrls?.[0]?.platform).toBe('other');
    expect(metadata?.socialMediaUrls?.[0]?.url).toBe(txParams.links?.other);
  }, 60000);

  it('should launch token with dev buy', async () => {
    const amountIn = parseEther('0.1').toString();
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Liquid,
      name: 'Liquid Test Token 4',
      symbol: 'LTT4',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      description: 'Dev buy test token on Liquid',
      links: { other: 'https://rainbow.me' },
      amountIn,
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.txHash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();
    const tokenAddress = launchResponse!.tokenAddress as Address;

    const deployedToken = getContract({
      address: tokenAddress,
      abi: ERC20Abi,
      client: publicClient,
    });
    const balance = await deployedToken.read.balanceOf([account.address]);
    expect(balance > 0n).toBe(true);
  }, 60000);

  it('should launch token with a very small dev buy', async () => {
    const amountIn = parseEther('0.0000001').toString();
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Liquid,
      name: 'Liquid Tiny Buy',
      symbol: 'LTB',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn,
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.txHash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();
    const tokenAddress = launchResponse!.tokenAddress as Address;

    const deployedToken = getContract({
      address: tokenAddress,
      abi: ERC20Abi,
      client: publicClient,
    });
    const balance = await deployedToken.read.balanceOf([account.address]);
    expect(balance > 0n).toBe(true);
  }, 60000);

  it('should launch token with a large dev buy', async () => {
    const amountIn = parseEther('10').toString();
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Liquid,
      name: 'Liquid Large Buy',
      symbol: 'LLB',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn,
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.txHash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();
    const tokenAddress = launchResponse!.tokenAddress as Address;

    const deployedToken = getContract({
      address: tokenAddress,
      abi: ERC20Abi,
      client: publicClient,
    });
    const balance = await deployedToken.read.balanceOf([account.address]);
    expect(balance > 0n).toBe(true);
  }, 60000);

  it('should verify deployment info on-chain', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Liquid,
      name: 'Liquid Test Token 5',
      symbol: 'LTT5',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    const tokenAddress = launchResponse!.tokenAddress as Address;

    const liquidSdk = new LiquidSDK({ publicClient });
    const deployment = await liquidSdk.getDeploymentInfo(tokenAddress);
    expect(deployment.token.toLowerCase()).toBe(tokenAddress.toLowerCase());
    expect(deployment.hook).not.toBe(zeroAddress);
    expect(deployment.locker).not.toBe(zeroAddress);
  }, 60000);
});
