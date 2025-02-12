"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchRainbowSuperTokenAndBuy = void 0;
const ethers_1 = require("ethers");
const getFactoryContract_1 = require("./utils/getFactoryContract");
const launchRainbowSuperTokenAndBuy = async (params) => {
    var _a;
    const factory = await (0, getFactoryContract_1.getFactoryContract)(params.wallet);
    const factoryAddress = process.env.FACTORY_ADDRESS || await factory.getAddress();
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
};
exports.launchRainbowSuperTokenAndBuy = launchRainbowSuperTokenAndBuy;
//# sourceMappingURL=launchToken.js.map