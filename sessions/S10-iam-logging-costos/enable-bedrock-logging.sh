#!/usr/bin/env bash
# S10 · Habilita el "model invocation logging" de Amazon Bedrock a CloudWatch.
# Esto registra CADA invocación de modelo (prompt, respuesta, tokens) para auditoría
# y análisis de costos. Se configura UNA vez por cuenta/región.
#
# Requiere un rol de ENTREGA que Bedrock pueda asumir para escribir en CloudWatch Logs.
# No lo crea el stack (es config por cuenta/región, no por stack): pasalo en ROLE_ARN.
# Si no tenés uno, el script te imprime los comandos para crearlo — y crearlo a mano es
# parte del ejercicio de esta sesión (D5: quién puede escribir tus logs de auditoría).
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
LOG_GROUP="${LOG_GROUP:-/techmoda/techmoda-ai-aby/bedrock-invocations}"
ROLE_NAME="${ROLE_NAME:-techmoda-ai-aby-BedrockLogsDelivery}"
ROLE_ARN="${ROLE_ARN:-}"

if [ -z "$ROLE_ARN" ]; then
  if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
    ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
    echo "→ Usando el rol de entrega existente: ${ROLE_NAME}"
  else
    cat <<EOF
✗ Falta el rol de entrega para el logging de Bedrock.

  Bedrock necesita un rol propio que pueda asumir para escribir en CloudWatch Logs.
  No lo crea el stack de SAM: es configuración por cuenta/región.

  Opción A — pasá uno que ya tengas:
      ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/<tu-rol> bash \$0

  Opción B — creá el mínimo necesario (y volvé a correr este script):

      cat > /tmp/bedrock-logs-trust.json <<'JSON'
      { "Version": "2012-10-17", "Statement": [{
          "Effect": "Allow",
          "Principal": { "Service": "bedrock.amazonaws.com" },
          "Action": "sts:AssumeRole" }] }
      JSON

      aws iam create-role --role-name ${ROLE_NAME} \\
        --assume-role-policy-document file:///tmp/bedrock-logs-trust.json

      cat > /tmp/bedrock-logs-perms.json <<'JSON'
      { "Version": "2012-10-17", "Statement": [{
          "Effect": "Allow",
          "Action": [ "logs:CreateLogStream", "logs:PutLogEvents" ],
          "Resource": "arn:aws:logs:*:*:log-group:/techmoda/*" }] }
      JSON

      aws iam put-role-policy --role-name ${ROLE_NAME} \\
        --policy-name WriteTechModaLogs \\
        --policy-document file:///tmp/bedrock-logs-perms.json

  Fijate que el permiso está acotado al prefijo del log group, no a "*".
EOF
    exit 1
  fi
fi

echo "→ Habilitando Bedrock invocation logging en ${REGION}"
echo "  log group: ${LOG_GROUP}"
echo "  delivery role: ${ROLE_ARN}"

aws bedrock put-model-invocation-logging-configuration \
  --region "$REGION" \
  --logging-config "{
    \"cloudWatchConfig\": {
      \"logGroupName\": \"${LOG_GROUP}\",
      \"roleArn\": \"${ROLE_ARN}\"
    },
    \"textDataDeliveryEnabled\": true,
    \"imageDataDeliveryEnabled\": false,
    \"embeddingDataDeliveryEnabled\": false
  }"

echo "✓ Logging habilitado. Verificá con:"
echo "  aws bedrock get-model-invocation-logging-configuration --region ${REGION}"
