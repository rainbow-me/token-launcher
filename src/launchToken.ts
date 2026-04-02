import { protocols } from './protocols';
import type { LaunchTokenParams, LaunchTokenResponse, SDKConfig } from './types';
import { TokenLauncherErrorCode, throwTokenLauncherError } from './errors';

export async function launchToken(
  params: LaunchTokenParams,
  config: SDKConfig,
  operation: string
): Promise<LaunchTokenResponse> {
  const protocol = protocols[params.protocol];

  if (!protocol) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.INVALID_PROTOCOL,
      `Unsupported protocol: ${params.protocol}`,
      { operation, params: { protocol: params.protocol } }
    );
  }

  const chainId = await params.publicClient.getChainId();
  if (config.chains?.length && !config.chains.includes(chainId)) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID,
      `Chain ${chainId} is not in the SDK's configured chains`,
      { operation, params: { chainId } }
    );
  }

  if (!protocol.supportedChains.includes(chainId)) {
    throwTokenLauncherError(
      TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID,
      `Protocol '${params.protocol}' does not support chain ${chainId}`,
      { operation, params: { chainId, protocol: params.protocol } }
    );
  }

  return protocol.launchToken(params, config, operation);
}
