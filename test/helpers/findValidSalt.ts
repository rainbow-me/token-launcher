import { Contract } from '@ethersproject/contracts';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { hexZeroPad } from '@ethersproject/bytes';

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
  // Start candidate salt at 1.
  let candidate = BigNumber.from(1);
  // Retrieve the default pair token address from the factory.
  const defaultPairTokenAddress: string = await factory.defaultPairToken();

  while (true) {
    // Convert the candidate to a 32-byte hex string.
    const saltCandidate = hexZeroPad(candidate.toHexString(), 32);

    // Call the contract's predictTokenAddress function.
    const predictedAddress: string = await factory.predictTokenAddress(
      creator,
      name,
      symbol,
      merkleroot,
      supply,
      saltCandidate
    );

    // Compare addresses as BigNumbers.
    // A valid salt produces a token address that is less than the default pair token address.
    if (BigNumber.from(predictedAddress).lt(BigNumber.from(defaultPairTokenAddress))) {
      return { salt: saltCandidate, predictedAddress };
    }

    // Increment candidate salt.
    candidate = candidate.add(1);
  }
}