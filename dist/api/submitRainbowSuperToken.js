"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitRainbowSuperToken = void 0;
const rainbowFetch_1 = require("../utils/rainbowFetch");
const submitRainbowSuperToken = async (payload) => {
    const response = await (0, rainbowFetch_1.rainbowFetch)(`${process.env.API_URL_DEV}/v1/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return response.json();
};
exports.submitRainbowSuperToken = submitRainbowSuperToken;
//# sourceMappingURL=submitRainbowSuperToken.js.map