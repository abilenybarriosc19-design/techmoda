#!/bin/bash
#
# Delete script for TechModa Serverless Capstone
# This script deletes the CloudFormation stack to clean up all resources
#

set -e

# Get stack name from samconfig.toml or use default
STACK_NAME="techmoda-ai-aby"

if [ -f "samconfig.toml" ]; then
    STACK_NAME=$(grep 'stack_name' samconfig.toml | cut -d'"' -f2 || echo "techmoda-ai-aby")
fi

echo "Deleting SAM application..."
echo "============================"
echo ""
echo "Stack name: $STACK_NAME"
echo ""
read -p "Are you sure you want to delete this stack? (yes/no): " CONFIRM

if [ "$CONFIRM" = "yes" ]; then
    sam delete --stack-name "$STACK_NAME" --no-prompts
    echo ""
    echo "Stack deleted successfully!"
    echo "All resources have been removed to prevent AWS charges."
else
    echo "Deletion cancelled."
    exit 1
fi
