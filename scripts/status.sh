#!/bin/bash
#
# Status script for TechModa Serverless Capstone
# This script shows the current deployment status and URLs
#

set -e

echo "=========================================="
echo "  TechModa - Estado del Despliegue"
echo "=========================================="
echo ""

# Get stack name from samconfig.toml or use default
STACK_NAME="techmoda-ai-aby"
if [ -f "samconfig.toml" ]; then
    STACK_NAME=$(grep 'stack_name' samconfig.toml | cut -d'"' -f2 || echo "techmoda-ai-aby")
fi

echo "🔍 Buscando stack: $STACK_NAME"
echo ""

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" &>/dev/null; then
    echo "❌ Stack no encontrado"
    echo ""
    echo "📝 El stack '$STACK_NAME' no está desplegado."
    echo ""
    echo "💡 Para desplegar, ejecuta:"
    echo "   ./scripts/deploy-all.sh"
    echo ""
    exit 0
fi

# Get stack status
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].StackStatus' \
    --output text)

echo "📊 Estado del Stack"
echo "-------------------------------------------"
echo "Nombre: $STACK_NAME"
echo "Estado: $STACK_STATUS"
echo ""

# If stack is not in a complete state, show warning
if [[ "$STACK_STATUS" != *"COMPLETE"* ]]; then
    echo "⚠️  El stack está en estado: $STACK_STATUS"
    echo "   Espera a que termine o revisa la consola de AWS."
    echo ""
    exit 0
fi

# Get outputs
echo "📋 Información del Despliegue"
echo "-------------------------------------------"

# API URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$API_URL" ]; then
    echo "🔗 API Backend:"
    echo "   $API_URL"
    echo ""
    echo "   Endpoints disponibles:"
    echo "   • GET    $API_URL/products"
    echo "   • POST   $API_URL/products"
    echo "   • GET    $API_URL/products/{id}"
    echo "   • PUT    $API_URL/products/{id}"
    echo "   • DELETE $API_URL/products/{id}"
fi

echo ""

# Frontend URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$FRONTEND_URL" ]; then
    echo "🌐 Frontend Web:"
    echo "   $FRONTEND_URL"
fi

echo ""

# DynamoDB Table
TABLE_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ProductsTableName`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$TABLE_NAME" ]; then
    ITEM_COUNT=$(aws dynamodb scan \
        --table-name "$TABLE_NAME" \
        --select COUNT \
        --query 'Count' \
        --output text 2>/dev/null || echo "0")

    echo "🗄️  Base de Datos:"
    echo "   Tabla: $TABLE_NAME"
    echo "   Productos: $ITEM_COUNT"
fi

echo ""
echo "=========================================="
echo ""
echo "📝 Comandos útiles:"
echo "   • Probar API:     curl $API_URL/products"
echo "   • Ver logs:       ./scripts/logs.sh"
echo "   • Tail logs:      ./scripts/logs.sh --tail"
echo "   • Ver errores:    ./scripts/logs.sh --errors"
echo "   • Re-desplegar:   ./scripts/deploy-all.sh"
echo "   • Eliminar todo:  ./scripts/delete-all.sh"
echo "=========================================="
