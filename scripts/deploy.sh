#!/bin/bash
#
# Deploy script for TechModa AI Capstone
# Despliega el backend (Lambda + Function URLs + DynamoDB) sin API Gateway.
#
# No hay API Gateway: el frente HTTP son Lambda Function URLs (docs/SANDBOX-COMPAT.md).
# Cada Lambda declara sus Policies: y SAM le crea un rol de mínimo privilegio (docs/IAM.md),
# por eso CAPABILITY_IAM es obligatoria. CAPABILITY_AUTO_EXPAND, por el Transform de SAM.
# Requiere una cuenta donde puedas crear roles IAM (iam:CreateRole).
#

set -e

STACK_NAME="${STACK_NAME:-techmoda-ai-aby}"
REGION="${AWS_REGION:-us-east-1}"

echo "Deploying SAM application (Function URLs, sin API Gateway)..."
echo "============================================================="
echo "  Stack:  $STACK_NAME"
echo "  Region: $REGION"
echo ""

echo "📦 sam build..."
sam build

echo "🚀 sam deploy..."
if [ -f "samconfig.toml" ]; then
    echo "📝 Usando configuración existente en samconfig.toml"
    sam deploy
else
    echo "⚠️  No hay samconfig.toml — desplegando con flags explícitos."
    sam deploy \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
        --resolve-s3 \
        --no-confirm-changeset \
        --no-fail-on-empty-changeset
fi

echo ""
echo "Deployment complete!"
echo "Revisá los Outputs (ApiUrl = Function URL del router) arriba."
