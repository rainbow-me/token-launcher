import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { TokenLauncher } from '../../src';
import { base } from 'viem/chains';

const ANVIL_URL = 'http://127.0.0.1:8545';
const SAMPLE_LOGO_URL =
  'https://rainbowme-res.cloudinary.com/image/upload/v1756412183/token-launcher/tokens/c0zvpu7k52lmdm2ubf2n.jpg';
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export function createTestHarness() {
  const provider = new JsonRpcProvider(ANVIL_URL);
  const wallet = new Wallet(TEST_PRIVATE_KEY, provider);
  const sdk = TokenLauncher;
  sdk.configure({ chains: [base.id] });

  return {
    provider,
    wallet,
    sdk,
    sampleLogoUrl: SAMPLE_LOGO_URL,
  };
}
