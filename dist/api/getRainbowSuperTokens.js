"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRainbowSuperTokens = void 0;
const rainbowFetch_1 = require("../utils/rainbowFetch");
const getRainbowSuperTokens = async () => {
    const response = await (0, rainbowFetch_1.rainbowFetch)(`${process.env.API_URL_DEV}/v1/token`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.json();
};
exports.getRainbowSuperTokens = getRainbowSuperTokens;
//# sourceMappingURL=getRainbowSuperTokens.js.map