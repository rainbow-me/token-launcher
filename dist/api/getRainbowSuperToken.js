"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRainbowSuperTokenByUri = void 0;
const rainbowFetch_1 = require("../utils/rainbowFetch");
const getRainbowSuperTokenByUri = async (tokenUri) => {
    const response = await (0, rainbowFetch_1.rainbowFetch)(`${process.env.API_URL_DEV}/v1/token/${tokenUri}`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.json();
};
exports.getRainbowSuperTokenByUri = getRainbowSuperTokenByUri;
//# sourceMappingURL=getRainbowSuperToken.js.map