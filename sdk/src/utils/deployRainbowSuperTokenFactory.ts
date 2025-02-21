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
//     const uniswapV3FactoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
//     const nonfungiblePositionManagerAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
//     const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
//     const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
//     const baseTokenURI = 'https://launcher.rainbow.me/v1/token';

//     // Hardcode the Tenderly virtual testnet RPC URL
//     const tenderlyRpcUrl = 'https://virtual.mainnet.rpc.tenderly.co/9833b31c-b57c-483a-879f-4fae648e2054';
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
  
  