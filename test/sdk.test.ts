import { BigNumber } from '@ethersproject/bignumber';
import { TokenLauncherErrorCode } from '../src/errors';
import { createTestHarness } from './harness/anvil';
import { Protocol, type LaunchTokenParams } from '../src/types/index';
import { base } from 'viem/chains';

describe('TokenLauncher SDK', () => {
  const { provider, wallet, sdk, sampleLogoUrl } = createTestHarness();

  beforeEach(() => {
    sdk.configure({ chains: [base.id] });
  });

  it('should check that the creator wallet has funds', async () => {
    const balance = await provider.getBalance(wallet.address);
    expect(balance.gt(BigNumber.from('0'))).toBe(true);
  });

  it('should store and return chains config', () => {
    sdk.configure({ chains: [base.id] });
    expect(sdk.getConfig()).toEqual({ chains: [base.id] });
  });

  it('should launch a token through the top-level SDK API using the default protocol', async () => {
    const txParams: LaunchTokenParams = {
      name: 'SDK Integration Token',
      symbol: 'SIT',
      wallet,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.transaction?.hash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();
  }, 60000);

  it('should reject invalid amountIn at the SDK surface', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'SDK Invalid Amount Token',
      symbol: 'SIAT',
      wallet,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: 'NOT_A_VALID_ETH_VALUE',
    };

    await expect(sdk.launchToken(txParams)).rejects.toMatchObject({
      code: TokenLauncherErrorCode.INVALID_AMOUNT_IN_PARAM,
    });
  });

  it('should reject chains outside the SDK configured chains', async () => {
    sdk.configure({ chains: [1] });

    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'SDK Wrong Config Chain Token',
      symbol: 'SWCC',
      wallet,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    await expect(sdk.launchToken(txParams)).rejects.toMatchObject({
      code: TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID,
    });
  });

  it('should reject chains unsupported by the protocol', async () => {
    const getNetworkSpy = jest
      .spyOn(provider, 'getNetwork')
      .mockResolvedValue({ chainId: 1 } as any);

    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'SDK Wrong Protocol Chain Token',
      symbol: 'SWPC',
      wallet,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    await expect(sdk.launchToken(txParams)).rejects.toMatchObject({
      code: TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID,
    });

    getNetworkSpy.mockRestore();
  });
});
