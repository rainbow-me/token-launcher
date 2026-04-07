import { jest } from '@jest/globals';
import { TokenLauncherErrorCode } from '../src/errors';
import { createTestHarness } from '../src/test/harness/anvil';
import { type LaunchTokenParams, Protocol } from '../src/types/index';
import { base } from 'viem/chains';

describe('TokenLauncher SDK', () => {
  const { publicClient, walletClient, account, sdk, sampleLogoUrl } = createTestHarness();

  beforeEach(() => {
    sdk.configure({ chains: [base.id] });
  });

  it('should check that the creator wallet has funds', async () => {
    const balance = await publicClient.getBalance({ address: account.address });
    expect(balance > 0n).toBe(true);
  });

  it('should store and return chains config', () => {
    sdk.configure({ chains: [base.id] });
    expect(sdk.getConfig()).toEqual({ chains: [base.id] });
  });

  it('should launch a token through the top-level SDK API', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'SDK Integration Token',
      symbol: 'SIT',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    const launchResponse = await sdk.launchToken(txParams);
    expect(launchResponse?.txHash).toBeTruthy();
    expect(launchResponse?.tokenAddress).toBeTruthy();
  }, 60000);

  it('should reject invalid amountIn at the SDK surface', async () => {
    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'SDK Invalid Amount Token',
      symbol: 'SIAT',
      walletClient,
      publicClient,
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
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    await expect(sdk.launchToken(txParams)).rejects.toMatchObject({
      code: TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID,
    });
  });

  it('should reject chains unsupported by the protocol', async () => {
    const getChainIdSpy = jest.spyOn(publicClient, 'getChainId').mockResolvedValue(1);

    const txParams: LaunchTokenParams = {
      protocol: Protocol.Clanker,
      name: 'SDK Wrong Protocol Chain Token',
      symbol: 'SWPC',
      walletClient,
      publicClient,
      logoUrl: sampleLogoUrl,
      links: {},
      amountIn: '0',
    };

    await expect(sdk.launchToken(txParams)).rejects.toMatchObject({
      code: TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID,
    });

    getChainIdSpy.mockRestore();
  });
});
