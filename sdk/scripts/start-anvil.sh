#!/bin/bash

# Source .env but don't fail if variables aren't set
source .env 2>/dev/null || true

FORK_URL=${RPC_URL:-"https://virtual.mainnet.rpc.tenderly.co/4a300182-608c-491f-8dd0-3e7fe8d2ec52"}

echo "Starting anvil with fork-url: ${FORK_URL}"
anvil --fork-url "$FORK_URL"