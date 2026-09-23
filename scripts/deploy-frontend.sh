#!/bin/bash
set -e

# Get stack name from samconfig.toml or use default
STACK_NAME="techmoda-ai-aby"
if [ -f "samconfig.toml" ]; then
    STACK_NAME=$(grep 'stack_name' samconfig.toml | cut -d'"' -f2 || echo "techmoda-ai-aby")
fi

echo "Deploying frontend to S3..."

# Get bucket name from CloudFormation outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text)

if [ -z "$BUCKET_NAME" ]; then
    echo "Error: Could not find frontend bucket. Deploy the SAM template first."
    exit 1
fi

# Get API URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

echo "Bucket: $BUCKET_NAME"
echo "API URL: $API_URL"
echo ""

# Inject runtime environment configuration
echo "🔧 Injecting runtime configuration..."
./scripts/inject-env.sh --api-url "$API_URL" --dist-dir frontend/dist
echo ""

# Sync to S3
aws s3 sync frontend/dist/ s3://$BUCKET_NAME/ --delete

echo ""
echo "Frontend deployed successfully!"
echo "CloudFront URL: https://$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
    --output text | sed 's/https:\/\///')"
