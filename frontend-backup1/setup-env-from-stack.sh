#!/usr/bin/env bash
set -euo pipefail
STACK_NAME="${1:-techmoda-ai-aby}"
REGION="${AWS_REGION:-us-east-1}"
get_output() {
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue | [0]" --output text
}
API_URL=$(get_output ApiUrl)
SEMANTIC=$(get_output SemanticSearchUrl)
ASSISTANT=$(get_output ShoppingAssistantUrl)
DESCRIPTION=$(get_output GenerateDescriptionUrl)
VOICE=$(get_output SynthesizeVoiceUrl)
TRANSLATE=$(get_output TranslateCatalogUrl)
SENTIMENT=$(get_output AnalyzeSentimentUrl)
cat > public/env-config.js <<CONFIG
window.__ENV = {
  VITE_API_URL: '$API_URL',
  VITE_SEMANTIC_SEARCH_URL: '$SEMANTIC',
  VITE_SHOPPING_ASSISTANT_URL: '$ASSISTANT',
  VITE_GENERATE_DESCRIPTION_URL: '$DESCRIPTION',
  VITE_SYNTHESIZE_VOICE_URL: '$VOICE',
  VITE_TRANSLATE_CATALOG_URL: '$TRANSLATE',
  VITE_ANALYZE_SENTIMENT_URL: '$SENTIMENT'
};
CONFIG
echo "✓ frontend/public/env-config.js actualizado desde $STACK_NAME ($REGION)"
