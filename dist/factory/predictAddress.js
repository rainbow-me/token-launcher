"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictTokenAddress = void 0;
const ethers_1 = require("ethers");
const getFactoryContract_1 = require("./utils/getFactoryContract");
const predictTokenAddress = async (params) => {
    var _a;
    const factory = await (0, getFactoryContract_1.getFactoryContract)(params.wallet);
    const creator = params.creator || await params.wallet.getAddress();
    const merkleroot = (_a = params.merkleroot) !== null && _a !== void 0 ? _a : ethers_1.ethers.ZeroHash;
    return factory.predictTokenAddress(creator, params.name, params.symbol, merkleroot, params.supply, params.salt);
};
exports.predictTokenAddress = predictTokenAddress;
//# sourceMappingURL=predictAddress.js.map