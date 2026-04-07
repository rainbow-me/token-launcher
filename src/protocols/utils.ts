import { isHex, type Hex } from 'viem';
import { TokenLauncherErrorCode, throwTokenLauncherError } from '../errors';

export function validateToHexStrict(
  errorTag: string,
  value: string | undefined,
  operation: string
): Hex {
  if (value && isHex(value)) {
    return value as Hex;
  }

  throwTokenLauncherError(
    TokenLauncherErrorCode.INVALID_ADDRESS,
    `Expected 0x-prefixed hex string for ${errorTag}`,
    { operation, source: 'sdk', params: { errorTag } }
  );
}
