#!/bin/bash

# Source .env but don't fail if variables aren't set
source .env 2>/dev/null || true

FORK_URL=${RPC_URL:-"https://virtual.mainnet.rpc.tenderly.co/b77d0217-59f5-4110-92df-dd41c6824a62"}

echo "Starting anvil with fork-url: ${FORK_URL}"
anvil --fork-url "$FORK_URL"