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
echo "Anvil is running"

# Run tests
echo "Running tests..."
yarn jest
TEST_EXIT_CODE=$?

# Kill Anvil
echo "Cleaning up..."
kill $ANVIL_PID
wait $ANVIL_PID 2>/dev/null

# Exit with test exit code
exit $TEST_EXIT_CODE 