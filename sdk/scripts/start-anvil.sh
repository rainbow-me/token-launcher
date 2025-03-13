#!/bin/bash

# Source .env but don't fail if variables aren't set
source .env 2>/dev/null || true

# Default RPC URL if not provided in environment
FORK_URL=${TENDERLY_RPC_URL:-"https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"}

echo "Starting anvil with fork-url: ${FORK_URL}"
anvil --fork-url "$FORK_URL"