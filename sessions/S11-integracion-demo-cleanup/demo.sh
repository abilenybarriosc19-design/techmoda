#!/usr/bin/env bash
# S11 · Demo end-to-end de TechModa AI. Ejercita todas las features de IA en orden.
#
# Sandbox AWS re/Start: NO hay API Gateway. El CRUD usa la Function URL del router
# (output ApiUrl) y CADA función de IA tiene su propia Function URL (outputs
# EnrichLabelsUrl, ModerateImageUrl, ...). Este script resuelve cada una del stack.
# Requiere haber desplegado template.full.yaml (todas las features cableadas).
#
# Uso:  STACK_NAME=techmoda-ai-aby AWS_REGION=us-east-1 bash demo.sh
set -euo pipefail

STACK_NAME="${STACK_NAME:-techmoda-ai-aby}"
REGION="${AWS_REGION:-us-east-1}"

# Lee un output del stack y le quita el slash final (las Function URLs terminan en '/').
out() {
  local v
  v=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text 2>/dev/null || echo "")
  printf '%s' "${v%/}"
}

API_URL="${API_URL:-$(out ApiUrl)}"
[[ -z "$API_URL" || "$API_URL" == "None" ]] && { echo "✗ No pude resolver ApiUrl del stack $STACK_NAME"; exit 1; }

ENRICH=$(out EnrichLabelsUrl)
MODERATE=$(out ModerateImageUrl)
SENTIMENT=$(out AnalyzeSentimentUrl)
TRANSLATE=$(out TranslateCatalogUrl)
VOICE=$(out SynthesizeVoiceUrl)
DESCRIBE=$(out GenerateDescriptionUrl)
INDEX=$(out IndexEmbeddingsUrl)
SEARCH=$(out SemanticSearchUrl)
ASSISTANT=$(out ShoppingAssistantUrl)

jqp() { python3 -m json.tool; }
hr() { printf '\n──────── %s ────────\n' "$1"; }
skip() { printf '  (output %s no encontrado — ¿desplegaste template.full.yaml?)\n' "$1"; }

hr "0 · Catálogo (CRUD base S0 — router Function URL)"
PID=$(curl -s "$API_URL/products" | python3 -c "import sys,json;print(json.load(sys.stdin)['products'][0]['productId'])")
echo "Usando productId=$PID"

hr "1 · Rekognition: etiquetas (requiere imageUrl real)"
[[ -n "$ENRICH" ]] && curl -s -X POST "$ENRICH/products/$PID/labels" | jqp || skip EnrichLabelsUrl

hr "2 · Rekognition: moderación + alt-text"
[[ -n "$MODERATE" ]] && curl -s -X POST "$MODERATE/products/$PID/moderate" | jqp || skip ModerateImageUrl

hr "3 · Comprehend: sentimiento"
[[ -n "$SENTIMENT" ]] && curl -s -X POST "$SENTIMENT" -H "Content-Type: application/json" \
  -d '{"text":"Me encantó la calidad, llegó rapidísimo."}' | jqp || skip AnalyzeSentimentUrl

hr "4 · Translate: ES→EN"
[[ -n "$TRANSLATE" ]] && curl -s -X POST "$TRANSLATE/products/$PID/translate" -H "Content-Type: application/json" \
  -d '{"target":"en"}' | jqp || skip TranslateCatalogUrl

hr "5 · Polly: audio"
[[ -n "$VOICE" ]] && curl -s -X POST "$VOICE/products/$PID/voice" -H "Content-Type: application/json" \
  -d '{"lang":"es"}' | jqp || skip SynthesizeVoiceUrl

hr "6 · Bedrock: descripción generada"
[[ -n "$DESCRIBE" ]] && curl -s -X POST "$DESCRIBE/products/$PID/describe" -H "Content-Type: application/json" \
  -d '{"tone":"elegante","save":true}' | jqp || skip GenerateDescriptionUrl

hr "7 · Bedrock embeddings: indexar + buscar"
[[ -n "$INDEX" ]] && curl -s -X POST "$INDEX/search/index" | jqp || skip IndexEmbeddingsUrl
[[ -n "$SEARCH" ]] && curl -s "$SEARCH/search?q=algo%20abrigado%20para%20el%20frio" | jqp || skip SemanticSearchUrl

hr "8 · Bedrock RAG: asistente de compras"
[[ -n "$ASSISTANT" ]] && curl -s -X POST "$ASSISTANT" -H "Content-Type: application/json" \
  -d '{"message":"Busco algo cómodo y blanco para caminar"}' | jqp || skip ShoppingAssistantUrl

hr "Demo completa ✓"
echo "Recordá el cleanup: bash scripts/delete-all.sh"
