#!/usr/bin/env bash
# ============================================================================
# bootstrap.sh — Reconstruye el entorno base del capstone de cero.
#
# Por qué existe: si trabajás en un entorno efímero (un sandbox que se recicla) o
# venís de un cleanup, el stack y los datos no existen. Este script deja el entorno
# EXACTAMENTE como debe estar para empezar cualquier sesión, en ~2-3 min. Es
# idempotente: corrércelo 1 o N veces da el mismo resultado (si ya está desplegado,
# `sam deploy` no detecta cambios y termina en segundos).
#
# Uso (paso 0 de cada día / después de un cleanup):
#   bash scripts/bootstrap.sh
#
# Variables opcionales: STACK_NAME (default techmoda-ai-aby), AWS_REGION (default us-east-1)
# ============================================================================
set -euo pipefail
STACK="${STACK_NAME:-techmoda-ai-aby}"
REGION="${AWS_REGION:-us-east-1}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "▶ Bootstrap  ·  stack=$STACK  region=$REGION"
echo "  (template.sandbox.yaml — base + S1/S2/S3/S5, sin CloudFront: levanta rápido)"

sam build -t template.sandbox.yaml >/dev/null
sam deploy -t template.sandbox.yaml \
  --stack-name "$STACK" --region "$REGION" \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --resolve-s3 --no-confirm-changeset --no-fail-on-empty-changeset

echo "▶ Re-sembrando productos de ejemplo…"
STACK_NAME="$STACK" AWS_REGION="$REGION" bash ai/seed/seed-products.sh

echo ""
echo "✓ Entorno listo. Function URLs disponibles:"
aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?contains(OutputKey,'Url')].[OutputKey,OutputValue]" \
  --output table
echo ""
echo "Tip: para las sesiones de visión (S1/S2) subí una imagen real a"
echo "     s3://$STACK-... y apuntá imageUrl del producto a esa ruta s3://, o usá una URL https pública."
