"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMerkleRootForCohorts = void 0;
const rainbowFetch_1 = require("../utils/rainbowFetch");
const getMerkleRootForCohorts = async (addresses) => {
    await (0, rainbowFetch_1.rainbowFetch)(`${process.env.API_URL_DEV}/v1/airdrop`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses }),
    });
};
exports.getMerkleRootForCohorts = getMerkleRootForCohorts;
//# sourceMappingURL=getMerkleRootForCohorts.js.map