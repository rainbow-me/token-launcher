#!/bin/bash

# Start Anvil in background
echo "Starting Anvil..."
./scripts/start-anvil.sh &
ANVIL_PID=$!

# Wait for Anvil to be ready
echo "Waiting for Anvil to start..."
while ! nc -z localhost 8545; do
  sleep 1
done
echo "Anvil is running with PID $ANVIL_PID"

# Run tests
echo "Running tests..."
yarn jest
TEST_EXIT_CODE=$?

# Kill Anvil more forcefully
echo "Cleaning up Anvil process..."
kill -9 $ANVIL_PID 2>/dev/null || true

# Also make sure to kill any process on port 8545
echo "Ensuring port 8545 is free..."
lsof -t -i:8545 | xargs -r kill -9

# Verify no process is listening on port 8545
if lsof -i:8545 >/dev/null 2>&1; then
  echo "WARNING: Port 8545 is still in use!"
else
  echo "Port 8545 is now free"
fi

# Exit with test exit code
exit $TEST_EXIT_CODE 