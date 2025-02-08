import { exec, ChildProcess } from 'child_process';
import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';
let anvilProcess: ChildProcess;

export const startAnvil = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    anvilProcess = exec('./scripts/start-anvil.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Anvil error: ${stderr}`);
        return reject(error);
      } else {
        console.log(`Anvil started with PID ${anvilProcess.pid}`);
      }
    });
    // Wait a few seconds to ensure anvil is up
    setTimeout(() => resolve(), 3000);
  });
};

export const stopAnvil = (): void => {
  exec('kill $(lsof -t -i:8545)');
};

export const deployTokenLauncher = async (): Promise<string> => {
  const deployer = await new ethers.JsonRpcProvider('http://localhost:8545').getSigner();
  const uniswapV3FactoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
  const nonfungiblePositionManagerAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
  const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
  const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const artifactPath = path.resolve(
    __dirname,
    '../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json'
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact file not found at path: ${artifactPath}`);
  }

  // Load artifact
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));

  if (!artifact.abi || !artifact.bytecode) {
    throw new Error('Invalid artifact file: missing ABI or bytecode.');
  }

  // Create contract factory manually
  const RainbowSuperTokenFactory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    deployer
  );

  const factory = await RainbowSuperTokenFactory.deploy(
    uniswapV3FactoryAddress,
    nonfungiblePositionManagerAddress,
    swapRouterAddress,
    wethAddress,
    'https://rainbow.me/tokens'
  );
  await factory.waitForDeployment();
  console.log('factory deployed at address: ', await factory.getAddress());
  return await factory.getAddress();
};
