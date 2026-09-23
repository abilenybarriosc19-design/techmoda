#!/usr/bin/env bash
# Carga productos de ejemplo en TechModa vía la Function URL del router (S0).
#
# Uso:
#   bash ai/seed/seed-products.sh
#   API_URL=https://xxxx.lambda-url.us-east-1.on.aws bash ai/seed/seed-products.sh
#
# Si no pasás API_URL, intenta leerlo de la salida del stack CloudFormation.
set -euo pipefail

STACK_NAME="${STACK_NAME:-techmoda-ai-aby}"
REGION="${AWS_REGION:-us-east-1}"

if [[ -z "${API_URL:-}" ]]; then
  echo "→ Resolviendo ApiUrl del stack '${STACK_NAME}' en ${REGION}..."
  API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text)
fi

if [[ -z "${API_URL}" || "${API_URL}" == "None" ]]; then
  echo "✗ No pude resolver API_URL. Pasalo explícito: API_URL=... bash $0" >&2
  exit 1
fi

echo "→ Sembrando productos en ${API_URL}/products"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Recorre el JSON y hace POST de cada producto (sin el campo 'reviews', que se usa en S3).
python3 - "$SCRIPT_DIR/seed-products.json" "$API_URL" <<'PY'
import json, sys, urllib.request

path, api = sys.argv[1], sys.argv[2].rstrip('/')
products = json.load(open(path))
for p in products:
    payload = {k: v for k, v in p.items() if k != "reviews"}
    data = json.dumps(payload).encode()
    req = urllib.request.Request(f"{api}/products", data=data,
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            body = json.loads(r.read())
            print(f"  ✓ {payload['name']}  →  productId={body.get('productId','?')}")
    except Exception as e:
        print(f"  ✗ {payload['name']}: {e}", file=sys.stderr)
PY

echo "✓ Seed completo. Recordá subir imágenes reales a s3://${STACK_NAME}-frontend/assets/ y"
echo "  actualizar el imageUrl de cada producto antes de las sesiones de visión (S1/S2)."
