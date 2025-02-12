"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRainbowTokenFactory = void 0;
const ethers_1 = require("ethers");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const createRainbowTokenFactory = (factoryAddress) => {
    let factoryContract;
    const getFactoryContract = async (wallet) => {
        if (factoryContract)
            return factoryContract;
        const artifactPath = path_1.default.resolve(__dirname, '../../smart-contracts/TokenLauncher/out/RainbowSuperTokenFactory.sol/RainbowSuperTokenFactory.json');
        if (!fs_1.default.existsSync(artifactPath)) {
            throw new Error(`Artifact file not found at path: ${artifactPath}`);
        }
        const artifact = JSON.parse(fs_1.default.readFileSync(artifactPath, 'utf-8'));
        factoryContract = new ethers_1.ethers.Contract(factoryAddress, artifact.abi, wallet);
        return factoryContract;
    };
    return {
        async launchRainbowSuperTokenAndBuy(params) {
            var _a;
            const factory = await getFactoryContract(params.wallet);
            const creator = params.creator || await params.wallet.getAddress();
            const merkleroot = (_a = params.merkleroot) !== null && _a !== void 0 ? _a : ethers_1.ethers.ZeroHash;
            const populatedTransactionData = await factory.launchRainbowSuperTokenAndBuy.populateTransaction(params.name, params.symbol, merkleroot, params.supply, params.initialTick, params.salt, creator, params.amountIn);
            const payload = {
                data: populatedTransactionData.data,
                to: factoryAddress,
                from: await params.wallet.getAddress(),
                value: params.amountIn,
            };
            return params.wallet.sendTransaction(payload);
        },
        async predictTokenAddress(params) {
            var _a;
            const factory = await getFactoryContract(params.wallet);
            const creator = params.creator || await params.wallet.getAddress();
            const merkleroot = (_a = params.merkleroot) !== null && _a !== void 0 ? _a : ethers_1.ethers.ZeroHash;
            return factory.predictTokenAddress(creator, params.name, params.symbol, merkleroot, params.supply, params.salt);
        },
    };
};
exports.createRainbowTokenFactory = createRainbowTokenFactory;
__exportStar(require("./launchToken"), exports);
__exportStar(require("./predictAddress"), exports);
//# sourceMappingURL=index.js.map