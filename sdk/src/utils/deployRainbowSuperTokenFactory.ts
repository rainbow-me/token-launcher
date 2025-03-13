// TODO: Delete this file
// import fs from 'fs';
// import { dirname, resolve } from 'path';
// import { ContractFactory } from '@ethersproject/contracts';
// import { JsonRpcProvider } from '@ethersproject/providers';
// import { Wallet } from '@ethersproject/wallet';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// async function deployFactoryOnVirtualTestnet(): Promise<string> {
//     // Hardcoded constructor parameters (mainnet values)
//     const uniswapV3FactoryAddress = '0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD';
//     const nonfungiblePositionManagerAddress = '0x655C406EBFa14EE2006250925e54ec43AD184f8B';
//     const swapRouterAddress = '0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE';
//     const wethAddress = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
//     const baseTokenURI = 'https://launcher.rainbow.me/v1/tokens/';

//     // Hardcode the Tenderly virtual testnet RPC URL
//     const tenderlyRpcUrl = 'https://virtual.avalanche.rpc.tenderly.co/36fa9002-9f8e-4e0f-bbd8-1003b5c00037';
//     const provider = new JsonRpcProvider(tenderlyRpcUrl);

//     // Verify provider connection by fetching network info
//     const network = await provider.getNetwork();
//     console.log(`Connected to chain id: ${network.chainId}`);

//     // Hardcode a test private key (DO NOT use a real key in production)
//     const testPrivateKey = '0x34120324fbc54dfb9b92a0a12221fbd63e7bb825733d27ad09efaa617b393c73';
//     const signer = new Wallet(testPrivateKey, provider);

//     // Check signer's balance (native currency, VETH on Tenderly)
//     const balance = await provider.getBalance(signer.address);
//     console.log(`Signer address: ${signer.address}, balance: ${balance.toString()}`);
//     if (balance.eq(0)) {
//       throw new Error('Signer has no funds on the virtual testnet');
//     }

//     // Load the contract artifact (ensure the artifact is correctly built and at this path)
//     const artifactPath = resolve(
//       __dirname,
//       '../../../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json'
//     );
//     if (!fs.existsSync(artifactPath)) {
//       throw new Error(`Artifact file not found at path: ${artifactPath}`);
//     }
//     const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));

//     // Create a ContractFactory instance using ethers
//     const contractFactory = new ContractFactory(artifact.abi, artifact.bytecode, signer);

//     console.log("Deploying RainbowSuperTokenFactory...");
//     const factoryContract = await contractFactory.deploy(
//       uniswapV3FactoryAddress,
//       nonfungiblePositionManagerAddress,
//       swapRouterAddress,
//       wethAddress,
//       baseTokenURI
//     );

//     // Wait until deployment is mined
//     await factoryContract.deployed();
//     console.log("Deployed RainbowSuperTokenFactory at:", factoryContract.address);
//     return factoryContract.address;
// }

// // Execute the deployment function
// deployFactoryOnVirtualTestnet()
//   .then((address) => {
//     console.log("Deployment complete. Factory address:", address);
//   })
//   .catch((err) => {
//     console.error("Deployment failed:", err);
//   });
