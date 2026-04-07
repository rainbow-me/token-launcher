import { Instance, Server } from 'prool';
import { TokenLauncher } from '../../src';
import { type Chain, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const ANVIL_PORT = 8545;
const ANVIL_URL = `http://127.0.0.1:${ANVIL_PORT}/${process.env.JEST_WORKER_ID ?? '1'}`;
const SAMPLE_LOGO_URL =
  'https://rainbowme-res.cloudinary.com/image/upload/v1756412183/token-launcher/tokens/c0zvpu7k52lmdm2ubf2n.jpg';
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
let anvilServer: ReturnType<typeof Server.create> | undefined;

beforeAll(async () => {
  const forkUrl = process.env.RPC_URL;
  if (!forkUrl) {
    throw new Error(
      'RPC_URL is required for forked integration tests. Set it in your shell or .env before running `yarn test`, for example: RPC_URL=https://mainnet.base.org yarn test'
    );
  }

  anvilServer = Server.create({
    host: '127.0.0.1',
    port: ANVIL_PORT,
    instance: Instance.anvil({
      chainId: base.id,
      forkUrl,
      host: '127.0.0.1',
      hardfork: 'Prague',
    }),
  });

  await anvilServer.start();
}, 120_000);

afterAll(async () => {
  await anvilServer?.stop();
});

export function createTestHarness() {
  const account = privateKeyToAccount(TEST_PRIVATE_KEY);
  const chain: Chain = base;
  const publicClient = createPublicClient({
    chain,
    transport: http(ANVIL_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(ANVIL_URL),
  });

  return {
    publicClient,
    walletClient,
    account,
    sdk: TokenLauncher,
    sampleLogoUrl: SAMPLE_LOGO_URL,
  };
}
