import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(__dirname, '../../.env') });

// Ensure required environment variables are set
const requiredEnvVars = ['API_URL_DEV', 'ETHEREUM_MAINNET_RPC_DEV'];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
});
