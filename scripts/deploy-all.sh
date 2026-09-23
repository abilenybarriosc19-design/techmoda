#!/bin/bash
#
# Deploy ALL script for TechModa AI Capstone
# Despliega backend (Lambda Function URLs + DynamoDB) y frontend (React a S3/CloudFront).
# No hay API Gateway: el frente HTTP son Function URLs (ver docs/SANDBOX-COMPAT.md).
#

set -e

echo "=========================================="
echo "  TechModa - Despliegue Completo"
echo "=========================================="
echo ""

# Get stack name from samconfig.toml or use default
STACK_NAME="${STACK_NAME:-techmoda-ai-aby}"
if [ -f "samconfig.toml" ]; then
    STACK_NAME=$(grep 'stack_name' samconfig.toml | cut -d'"' -f2 || echo "techmoda-ai-aby")
fi

echo "📦 Paso 1/3: Construyendo y desplegando Backend..."
echo "-------------------------------------------"
echo "    (Function URLs, sin API Gateway; SAM crea un rol de mínimo privilegio por Lambda)"
echo "    Detalle: docs/IAM.md"
# scripts/deploy.sh hace sam build + sam deploy con las capabilities correctas.
# CAPABILITY_IAM es obligatoria: el stack crea roles. CAPABILITY_AUTO_EXPAND, por el Transform SAM.
STACK_NAME="$STACK_NAME" ./scripts/deploy.sh
echo "✅ Backend desplegado exitosamente"
echo ""

# Get API URL for display later
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

echo "🎨 Paso 2/3: Construyendo Frontend..."
echo "-------------------------------------------"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependencias..."
    npm install
fi
echo "🔨 Compilando aplicación React..."
npm run build
cd ..
echo "✅ Frontend construido exitosamente"
echo ""

echo "☁️  Paso 3/3: Desplegando Frontend a S3..."
echo "-------------------------------------------"
./scripts/deploy-frontend.sh
echo ""

echo "=========================================="
echo "  ✅ ¡DESPLIEGUE COMPLETO EXITOSO!"
echo "=========================================="
echo ""
echo "📋 URLs de tu aplicación:"
echo "-------------------------------------------"
if [ -n "$API_URL" ]; then
    echo "🔗 API Backend:"
    echo "   $API_URL"
fi
echo ""
echo "🌐 Frontend Web:"
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")
if [ -n "$CLOUDFRONT_URL" ]; then
    echo "   $CLOUDFRONT_URL"
    echo ""
    echo "⏱️  Nota: CloudFront puede tardar 15-20 minutos en estar"
    echo "   completamente disponible después del primer despliegue."
fi
echo ""
echo "📝 Próximos pasos:"
echo "   1. Prueba tu API con curl (ver docs/TESTING_GUIDE.md)"
echo "   2. Abre el frontend en tu navegador"
echo "   3. Cuando termines, ejecuta: ./scripts/delete-all.sh"
echo "=========================================="
