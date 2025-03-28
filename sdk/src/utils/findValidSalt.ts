/* eslint-disable no-await-in-loop */
import { toHex, Address, Hex } from 'viem';
import { randomBytes } from 'node:crypto';
import { RainbowSuperTokenFactory } from './getRainbowSuperTokenFactory';

/**
 * Iterates over candidate salts until a valid one is found.
 *
 * @param factory - The factory contract instance.
 * @param creator - The creator's address.
 * @param name - The token name.
 * @param symbol - The token symbol.
 * @param merkleroot - The merkle root (as a hex string; use Viem's `zeroHash` if none).
 * @param supply - The token's total supply.
 * @returns An object containing the valid salt (as a 32-byte hex string) and the predicted token address.
 */
export async function findValidSalt(
  factory: RainbowSuperTokenFactory,
  creator: Address,
  name: string,
  symbol: string,
  merkleroot: Hex,
  supply: bigint
): Promise<{ salt: Hex; predictedAddress: Address }> {
  const defaultPairToken = await factory.read.defaultPairToken();
  let ret;
  while (!ret) {
    // Generate a random salt as proper hex
    const randomSalt = toHex(randomBytes(32));

    // Use the contract's predictTokenAddress
    const predicted = await factory.read.predictTokenAddress([
      creator,
      name,
      symbol,
      merkleroot,
      supply,
      randomSalt, // Pass the original random salt, not the derived one
    ]);

    // Check if predicted address is less than WETH
    if (predicted < defaultPairToken) {
      ret = {
        salt: randomSalt,
        predictedAddress: predicted,
      };
    }
  }
  return ret;
}
