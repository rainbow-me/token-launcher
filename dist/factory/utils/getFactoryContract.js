"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployFactoryContract = exports.getFactoryContract = void 0;
const ethers_1 = require("ethers");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let factoryContract;
const getFactoryContract = async (wallet) => {
    const factoryAddress = process.env.FACTORY_ADDRESS || await (0, exports.deployFactoryContract)(wallet);
    if (factoryContract)
        return factoryContract;
    const artifactPath = path_1.default.resolve(__dirname, '../../../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json');
    if (!fs_1.default.existsSync(artifactPath)) {
        throw new Error(`Artifact file not found at path: ${artifactPath}`);
    }
    const artifact = JSON.parse(fs_1.default.readFileSync(artifactPath, 'utf-8'));
    factoryContract = new ethers_1.ethers.Contract(factoryAddress, artifact.abi, wallet);
    return factoryContract;
};
exports.getFactoryContract = getFactoryContract;
const deployFactoryContract = async (signer) => {
    const artifactPath = path_1.default.resolve(__dirname, '../../../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json');
    if (!fs_1.default.existsSync(artifactPath)) {
        throw new Error(`Artifact file not found at path: ${artifactPath}`);
    }
    const artifact = JSON.parse(fs_1.default.readFileSync(artifactPath, 'utf-8'));
    const uniswapV3FactoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
    const nonfungiblePositionManagerAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
    const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const RainbowSuperTokenFactory = new ethers_1.ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const factory = await RainbowSuperTokenFactory.deploy(uniswapV3FactoryAddress, nonfungiblePositionManagerAddress, swapRouterAddress, wethAddress, 'https://rainbow.me/tokens');
    await factory.waitForDeployment();
    return await factory.getAddress();
};
exports.deployFactoryContract = deployFactoryContract;
//# sourceMappingURL=getFactoryContract.js.map