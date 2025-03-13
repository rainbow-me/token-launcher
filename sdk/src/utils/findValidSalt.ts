/* eslint-disable no-await-in-loop */
import { Contract } from '@ethersproject/contracts';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { hexZeroPad, hexlify } from '@ethersproject/bytes';
import { randomBytes } from '@ethersproject/random';

/**
 * Iterates over candidate salts until a valid one is found.
 *
 * @param factory - The factory contract instance.
 * @param creator - The creator's address.
 * @param name - The token name.
 * @param symbol - The token symbol.
 * @param merkleroot - The merkle root (as a hex string; use ethers.constants.HashZero if none).
 * @param supply - The token's total supply.
 * @returns An object containing the valid salt (as a 32-byte hex string) and the predicted token address.
 */
export async function findValidSalt(
  factory: Contract,
  creator: string,
  name: string,
  symbol: string,
  merkleroot: string,
  supply: BigNumberish
): Promise<{ salt: string; predictedAddress: string }> {
  const defaultPairToken = await factory.defaultPairToken();
  let ret;
  while (!ret) {
    // Generate a random salt as proper hex
    const randomSalt = hexZeroPad(
      hexlify(randomBytes(32)), // Convert random bytes to hex properly
      32
    );

    // Use the contract's predictTokenAddress
    const predicted = await factory.predictTokenAddress(
      creator,
      name,
      symbol,
      merkleroot,
      supply,
      randomSalt // Pass the original random salt, not the derived one
    );

    // Check if predicted address is less than WETH
    if (BigNumber.from(predicted).lt(BigNumber.from(defaultPairToken))) {
      ret = {
        salt: randomSalt,
        predictedAddress: predicted,
      };
    }
  }
  return ret;
}
