import path from 'path';
import fs from 'fs';
import { Contract, ContractFactory } from '@ethersproject/contracts';
import { Signer } from '@ethersproject/abstract-signer';

let factoryContract: Contract | undefined;

export const getFactoryContract = async (wallet: Signer): Promise<Contract> => {
  const factoryAddress = process.env.FACTORY_ADDRESS || await deployFactoryContract(wallet);

  if (factoryContract) return factoryContract;

  const artifactPath = path.resolve(
    __dirname,
    '../../../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json'
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact file not found at path: ${artifactPath}`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  
  factoryContract = new Contract(
    factoryAddress,
    artifact.abi,
    wallet
  );

  return factoryContract;
};

export const deployFactoryContract = async (signer: Signer): Promise<string> => {
  const artifactPath = path.resolve(
    __dirname,
    '../../../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json'
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact file not found at path: ${artifactPath}`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));

  const uniswapV3FactoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
  const nonfungiblePositionManagerAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
  const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
  const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

  const RainbowSuperTokenFactory = new ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  );

  const factory = await RainbowSuperTokenFactory.deploy(
    uniswapV3FactoryAddress,
    nonfungiblePositionManagerAddress,
    swapRouterAddress,
    wethAddress,
    'https://rainbow.me/tokens'
  );

  await factory.deployed();
  return factory.address;
}; 