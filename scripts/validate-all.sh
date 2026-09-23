#!/bin/bash
#
# validate-all.sh — Valida el capstone paso por paso e imprime PASS/FAIL.
#
#   bash scripts/validate-all.sh --static   # solo lo que NO necesita AWS
#   bash scripts/validate-all.sh            # estático + pruebas contra AWS
#   bash scripts/validate-all.sh --aws      # solo las pruebas contra AWS
#
# Pensado para que un estudiante sepa exactamente qué está roto y dónde, sin
# tener que leer stack traces. Sin `set -e`: corremos TODO y damos un resumen.

STACK="${STACK_NAME:-techmoda-ai-aby}"
REGION="${AWS_REGION:-us-east-1}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

MODO="ambos"
case "${1:-}" in
  --static) MODO="static" ;;
  --aws)    MODO="aws" ;;
  -h|--help)
    sed -n '3,10p' "$0" | sed 's/^# \?//'; exit 0 ;;
esac

PASS=0; FAIL=0; SKIP=0
pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
fallo(){ printf '  \033[31m✗\033[0m %s\n' "$1"; [ -n "${2:-}" ] && printf '      %s\n' "$2"; FAIL=$((FAIL+1)); }
skip() { printf '  \033[33m-\033[0m %s\n' "$1"; SKIP=$((SKIP+1)); }
titulo(){ printf '\n\033[1m%s\033[0m\n' "$1"; }

# ============================================================ ESTÁTICO ======
if [ "$MODO" != "aws" ]; then

titulo "1. Herramientas"
  for t in sam aws node npm; do
    command -v "$t" >/dev/null 2>&1 && pass "$t presente" || fallo "falta $t en el PATH"
  done
  # Las Lambdas de IA declaran Runtime: python3.12. Si la local no coincide,
  # `sam build` falla con un error de PythonPipBuilder difícil de interpretar.
  if command -v python3 >/dev/null 2>&1; then
    PYV="$(python3 -c 'import sys;print("%d.%d"%sys.version_info[:2])')"
    [ "$PYV" = "3.12" ] \
      && pass "python $PYV (coincide con Runtime python3.12)" \
      || fallo "python $PYV, se necesita 3.12" "Reconstruí el devcontainer; el feature está fijado en .devcontainer/devcontainer.json"
  else
    fallo "falta python3"
  fi

titulo "2. Templates SAM"
  for t in template.yaml template.sandbox.yaml template.full.yaml; do
    if OUT=$(sam validate --lint -t "$t" 2>&1); then pass "$t"
    else fallo "$t" "$(echo "$OUT" | tail -2 | tr '\n' ' ')"; fi
  done

titulo "3. Snippets de sesión (se pegan en template.yaml y validan)"
  # Reproduce exactamente lo que hace el estudiante: pegar el snippet en Resources.
  for snip in sessions/S0*/template-snippet.yaml; do
    SESS="$(basename "$(dirname "$snip")")"
    TMP="$(mktemp /tmp/splice-XXXXXX.yaml)"
    python3 - "$snip" "$TMP" <<'PY'
import sys, pathlib
base = pathlib.Path('template.yaml').read_text()
body = "\n".join(l for l in pathlib.Path(sys.argv[1]).read_text().splitlines()
                 if not l.startswith('#'))
i = base.index('\nOutputs:')
pathlib.Path(sys.argv[2]).write_text(base[:i] + "\n" + body + "\n" + base[i:])
PY
    if OUT=$(sam validate --lint -t "$TMP" 2>&1); then pass "$SESS"
    else fallo "$SESS" "$(echo "$OUT" | tail -2 | tr '\n' ' ')"; fi
    rm -f "$TMP"
  done

titulo "4. Sintaxis del código"
  N=0; BAD=0
  for f in $(find sessions -name 'app.py'); do
    N=$((N+1)); PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile "$f" 2>/dev/null \
      || { BAD=$((BAD+1)); fallo "sintaxis Python: $f"; }
  done
  [ "$BAD" -eq 0 ] && pass "$N Lambdas Python compilan"
  N=0; BAD=0
  for f in functions/*/index.js; do
    N=$((N+1)); node --check "$f" 2>/dev/null || { BAD=$((BAD+1)); fallo "node --check $f"; }
  done
  [ "$BAD" -eq 0 ] && pass "$N handlers Node válidos"
  N=0; BAD=0
  for f in $(find scripts ai sessions -name '*.sh'); do
    N=$((N+1)); bash -n "$f" 2>/dev/null || { BAD=$((BAD+1)); fallo "bash -n $f"; }
  done
  [ "$BAD" -eq 0 ] && pass "$N scripts shell válidos"

titulo "5. Frontend"
  if [ -d frontend/node_modules ]; then
    (cd frontend && npm run lint >/dev/null 2>&1)      && pass "lint" || fallo "lint" "corré: cd frontend && npm run lint"
    (cd frontend && npm run typecheck >/dev/null 2>&1) && pass "typecheck" || fallo "typecheck" "corré: cd frontend && npm run typecheck"
    if OUT=$(cd frontend && npx vitest run 2>&1); then
      pass "tests ($(echo "$OUT" | grep -oE 'Tests +[0-9]+ passed' | grep -oE '[0-9]+' | head -1) pasando)"
    else
      fallo "tests" "corré: cd frontend && npx vitest run"
    fi
  else
    skip "frontend sin node_modules (corré: cd frontend && npm install)"
  fi

titulo "6. Coherencia del repo"
  # La región debe ser una sola en todo el repo.
  OTRA="$(grep -rIl 'us-west-2' . --exclude-dir=.git --exclude-dir=.aws-sam \
          --exclude-dir=node_modules --exclude-dir=dist \
          --exclude='EPCC_*.md' --exclude='validate-all.sh' 2>/dev/null)"
  [ -z "$OTRA" ] && pass "región consistente (us-east-1)" \
                 || fallo "quedan referencias a us-west-2" "$(echo "$OTRA" | tr '\n' ' ')"
  # Ya no debe haber rol preexistente: cada función declara sus Policies.
  RESTO="$(grep -rIl 'LabRoleArn' template*.yaml sessions/*/template-snippet*.yaml 2>/dev/null)"
  [ -z "$RESTO" ] && pass "sin LabRoleArn (SAM crea los roles)" \
                  || fallo "quedan referencias a LabRoleArn" "$(echo "$RESTO" | tr '\n' ' ')"
  # Ninguna función debe traer `Role:` — anula sus Policies EN SILENCIO.
  ROL="$(grep -rIln '^\s*Role:' template*.yaml sessions/*/template-snippet*.yaml 2>/dev/null)"
  [ -z "$ROL" ] && pass "ninguna función usa Role: (excluyente con Policies)" \
                || fallo "hay Role: en un template — sus Policies se ignoran" "$ROL"
  # Ninguna ACCIÓN debe usar comodín de servicio (`Action: bedrock:*`).
  # Ojo: los ARN de Bedrock llevan `bedrock:*` como comodín de REGIÓN
  # (arn:aws:bedrock:*::foundation-model/*), que es legítimo — de ahí que sólo se
  # inspeccionen las líneas de `Action:`, y sin la parte de comentario.
  WILD=""
  for f in template*.yaml sessions/*/template-snippet*.yaml; do
    [ -f "$f" ] || continue
    HIT="$(sed 's/#.*//' "$f" | grep -nE 'Action.*(bedrock|rekognition|comprehend|polly|translate|dynamodb|s3|logs|iam):\*')"
    [ -n "$HIT" ] && WILD="$WILD $f:$(echo "$HIT" | cut -d: -f1 | tr '\n' ',')"
  done
  [ -z "$WILD" ] && pass "sin comodines de servicio en las acciones" \
                 || fallo "una política usa servicio:* (ver docs/IAM.md)" "$WILD"

  # La DOCUMENTACIÓN tiene que contar el mismo modelo IAM que los templates.
  # Este check existe porque el refactor a Policies: dejó ~130 menciones de LabRole
  # vivas en 39 archivos de docs: el estudiante seguía pasos que ya no aplicaban.
  # Se permiten las menciones marcadas como contexto histórico (docs/IAM.md
  # "Nota histórica", docs/SANDBOX-COMPAT.md §3 y los avisos que las citan).
  DOCS_OK="docs/IAM.md docs/SANDBOX-COMPAT.md QUICKSTART.md sessions/README.md sessions/S00-base/GUIA.md"
  DOC_STALE=""
  while IFS= read -r f; do
    case " $DOCS_OK " in *" ${f#./} "*) continue ;; esac
    DOC_STALE="$DOC_STALE ${f#./}"
  done <<EOF
$(grep -rIl 'LabRole' . --exclude-dir=.git --exclude-dir=.aws-sam --exclude-dir=node_modules \
    --exclude-dir=dist --exclude='EPCC_*.md' --exclude='validate-all.sh' 2>/dev/null)
EOF
  [ -z "$DOC_STALE" ] && pass "la documentación no promete el modelo IAM viejo" \
    || fallo "docs que todavía mandan usar LabRole" "$DOC_STALE"

  # Los model IDs de Bedrock viven en 5 lugares y tienen que coincidir.
  IDS="$(grep -rhoI 'anthropic\.claude[A-Za-z0-9._:-]*' template.full.yaml \
          sessions/S06-*/template-snippet.yaml sessions/S08-*/template-snippet.yaml \
          sessions/S06-*/functions/*/app.py sessions/S08-*/functions/*/app.py 2>/dev/null \
        | sort -u)"
  N_IDS="$(echo "$IDS" | grep -c .)"
  if [ "$N_IDS" -ne 1 ]; then
    fallo "los model IDs de Bedrock no coinciden entre sí" "$(echo "$IDS" | tr '\n' ' ')"
  # bedrock-runtime (Converse/InvokeModel) exige el ID versionado. El alias de la
  # Claude API (anthropic.claude-haiku-4-5 a secas) da ValidationException.
  elif ! echo "$IDS" | grep -q -- '-v1:0$'; then
    fallo "el model ID no es de bedrock-runtime (falta -vN:M)" "$IDS — ver 'Gotchas' en CLAUDE.md"
  else
    pass "model ID de Bedrock único y versionado ($IDS)"
  fi

  # El contrato de campos: el frontend debe usar camelCase como el backend.
  SNAKE="$(grep -rIl 'product_id\|image_url' frontend/src 2>/dev/null)"
  [ -z "$SNAKE" ] && pass "contrato de campos en camelCase" \
                  || fallo "el frontend usa snake_case" "$(echo "$SNAKE" | tr '\n' ' ')"

  # Todo scripts/*.sh que la doc mande a correr tiene que existir.
  FALTAN=""
  for s in $(grep -rhoE '(\./)?scripts/[a-zA-Z0-9_-]+\.sh' --include='*.md' . 2>/dev/null \
             | sed 's|^\./||' | sort -u); do
    [ -f "$s" ] || FALTAN="$FALTAN $s"
  done
  [ -z "$FALTAN" ] && pass "todo script citado en la doc existe" \
                   || fallo "la doc manda a correr scripts que no existen" "$FALTAN"

fi

# ================================================================= AWS ======
if [ "$MODO" != "static" ]; then

titulo "7. Credenciales AWS"
  if ID=$(aws sts get-caller-identity --query Arn --output text 2>&1); then
    pass "autenticado: $ID"
    CREDS=1
  else
    fallo "sin credenciales AWS" "$(echo "$ID" | tail -1)"
    echo ""
    echo "  Configurá credenciales y reintentá, o corré solo lo estático:"
    echo "     bash scripts/validate-all.sh --static"
    CREDS=0
  fi

if [ "${CREDS:-0}" -eq 1 ]; then
titulo "8. Stack $STACK en $REGION"
  if OUTS=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
            --query 'Stacks[0].Outputs' --output json 2>&1); then
    pass "stack desplegado"
    url() { echo "$OUTS" | python3 -c "
import json,sys
k=sys.argv[1]
print(next((o['OutputValue'] for o in json.load(sys.stdin) or [] if o['OutputKey']==k), ''))" "$1"; }
    API="$(url ApiUrl)"; API="${API%/}"
  else
    fallo "el stack no existe" "desplegá con: bash scripts/deploy-all.sh"
    API=""
  fi

  if [ -n "$API" ]; then
titulo "9. CRUD (S00)"
    if BODY=$(curl -fsS --max-time 25 "$API/products" 2>&1); then
      N="$(echo "$BODY" | python3 -c 'import json,sys; print(len(json.load(sys.stdin).get("products",[])))' 2>/dev/null || echo '?')"
      pass "GET /products -> $N productos"
      [ "$N" = "0" ] && skip "catálogo vacío (sembrá con: bash ai/seed/seed-products.sh)"
    else
      fallo "GET /products" "$BODY"
    fi

    # Ciclo completo create -> get -> update -> delete sobre un producto de prueba.
    NEW=$(curl -fsS --max-time 25 -X POST "$API/products" -H 'Content-Type: application/json' \
          -d '{"name":"__validate__","price":1.5,"stock":3,"category":"Ropa","imageUrl":"https://example.com/x.jpg"}' 2>&1)
    PID="$(echo "$NEW" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("productId",""))' 2>/dev/null)"
    if [ -n "$PID" ]; then
      pass "POST /products -> $PID"
      # stock debe persistirse (antes se descartaba en silencio)
      ST="$(echo "$NEW" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("stock","AUSENTE"))' 2>/dev/null)"
      [ "$ST" = "3" ] && pass "stock persistido" || fallo "stock no se guardó (recibido: $ST)"
      curl -fsS --max-time 25 "$API/products/$PID" >/dev/null 2>&1 && pass "GET /products/{id}" || fallo "GET /products/{id}"
      curl -fsS --max-time 25 -X PUT "$API/products/$PID" -H 'Content-Type: application/json' \
        -d '{"price":2.5}' >/dev/null 2>&1 && pass "PUT /products/{id}" || fallo "PUT /products/{id}"
      curl -fsS --max-time 25 -X DELETE "$API/products/$PID" >/dev/null 2>&1 && pass "DELETE /products/{id}" || fallo "DELETE /products/{id}"
    else
      fallo "POST /products" "$NEW"
    fi

titulo "10. Features de IA (una por Function URL)"
    # Cada feature solo se prueba si su output existe en el stack.
    probar_ia() {
      local nombre="$1" out="$2" metodo="$3" ruta="$4" data="$5"
      local u; u="$(url "$out")"; u="${u%/}"
      if [ -z "$u" ]; then skip "$nombre (no está en este stack)"; return; fi
      local pid; pid="$(curl -fsS --max-time 25 "$API/products" 2>/dev/null | python3 -c '
import json,sys
ps=json.load(sys.stdin).get("products",[])
print(ps[0]["productId"] if ps else "")' 2>/dev/null)"
      local target="${ruta//\{id\}/$pid}"
      local r
      if [ "$metodo" = "GET" ]; then r=$(curl -fsS --max-time 60 "$u$target" 2>&1)
      else r=$(curl -fsS --max-time 60 -X POST "$u$target" -H 'Content-Type: application/json' -d "$data" 2>&1); fi
      if [ $? -eq 0 ]; then pass "$nombre"
      else fallo "$nombre" "$(echo "$r" | tail -1)"; fi
    }
    probar_ia "S1 Rekognition labels"  EnrichLabelsUrl        POST "/products/{id}/labels"   '{}'
    probar_ia "S2 moderación+alt-text" ModerateImageUrl       POST "/products/{id}/moderate" '{}'
    probar_ia "S3 Comprehend"          AnalyzeSentimentUrl    POST "/sentiment"              '{"text":"Me encantó, excelente calidad."}'
    probar_ia "S4 Translate"           TranslateCatalogUrl    POST "/products/{id}/translate" '{"target":"en"}'
    probar_ia "S5 Polly"               SynthesizeVoiceUrl     POST "/products/{id}/voice"    '{"lang":"es"}'
    probar_ia "S6 Bedrock descripción" GenerateDescriptionUrl POST "/products/{id}/describe" '{}'
    probar_ia "S7 indexar embeddings"  IndexEmbeddingsUrl     POST "/search/index"           '{}'
    probar_ia "S7 búsqueda semántica"  SemanticSearchUrl      GET  "/search?q=vestido"       ''
    probar_ia "S8 chatbot"             ShoppingAssistantUrl   POST "/assistant"              '{"message":"Busco algo para una boda"}'
  fi
fi
fi

# ============================================================== RESUMEN =====
printf '\n\033[1m══════════════════════════════════════\033[0m\n'
printf '  \033[32m%d OK\033[0m   \033[31m%d fallo(s)\033[0m   \033[33m%d omitido(s)\033[0m\n' "$PASS" "$FAIL" "$SKIP"
printf '\033[1m══════════════════════════════════════\033[0m\n'
if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "Hay fallos. Cada línea ✗ dice el comando exacto para reproducirlo."
  exit 1
fi
echo ""
echo "Todo en verde."
exit 0
