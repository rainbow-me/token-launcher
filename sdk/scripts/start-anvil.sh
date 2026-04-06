#!/bin/bash

# Source .env but don't fail if variables aren't set
source .env 2>/dev/null || true

FORK_URL=${RPC_URL:-"https://virtual.base.us-east.rpc.tenderly.co/8bd88a16-7aed-467c-bfd1-34f39a2ac536"}
echo "Starting anvil with fork-url: ${FORK_URL}"
anvil --fork-url "$FORK_URL" --chain-id 8453
