# TechModa AI Capstone — Mapa de sesiones (AIF-C01)

Capstone de **AWS Certified AI Practitioner (AIF-C01)** construido sobre un catálogo
serverless de moda. Cada sesión es atómica (~1 h) y suma una capacidad de IA.

## Las 12 sesiones corren

Cada Lambda declara sus propias `Policies:` y **SAM le crea un rol de mínimo privilegio**
(ver [`docs/IAM.md`](../docs/IAM.md)). No hay rol preexistente ni account ID hardcodeado,
así que el capstone se despliega **en cualquier cuenta AWS donde puedas crear roles IAM**
(`iam:CreateRole`) y las 12 sesiones son ejecutables por el estudiante.

Lo único que sigue siendo un **requisito externo** es habilitar **Bedrock → Model access**
en la consola, en la región del deploy (es un setting **por región**), para S06–S09. Si esas
sesiones devuelven `AccessDeniedException`, ese es el primer sospechoso — no las políticas IAM.

> ℹ️ Versiones anteriores partían el capstone en dos pistas porque el `LabRole` del sandbox
> AWS re/Start denegaba `bedrock:InvokeModel` y `translate:TranslateText`. Con roles propios
> esa división desapareció; el contexto histórico está en
> [`docs/SANDBOX-COMPAT.md`](../docs/SANDBOX-COMPAT.md) §3.

## Tabla de sesiones

| Sesión | Capacidad | Servicio AWS | Dominio AIF-C01 | Requiere |
|---|---|---|---|---|
| **S00** Base | Catálogo CRUD serverless | Lambda + DynamoDB + S3/CloudFront | Base (lienzo) | — |
| **S01** Etiquetado | Auto-labels de imágenes | Rekognition `DetectLabels` | D1 | imagen real en S3 |
| **S02** Moderación | Moderación + alt-text accesible | Rekognition `DetectModerationLabels` | D1 · D4 | imagen real en S3 |
| **S03** Sentimiento | Análisis de reseñas | Comprehend | D1 | — |
| **S04** Multilingüe | Catálogo traducido | Translate | D1 | — |
| **S05** Voz | Fichas habladas | Polly | D1 | — |
| **S06** Descripciones | Texto generado por IA | Bedrock (Converse) | D2 · D3 | **Model access** |
| **S07** Búsqueda RAG | Embeddings + búsqueda semántica | Bedrock (Titan Embeddings) | D3 | **Model access** |
| **S08** Chatbot | Asistente de compras (RAG) | Bedrock | D2 · D3 | **Model access** |
| **S09** Guardrails | Filtros de contenido / sesgo | Bedrock Guardrails | D4 | **Model access** |
| **S10** Gobernanza | Logging de invocaciones + tags de costo | CloudWatch Logs / IAM | D5 | — |
| **S11** Integración | Demo end-to-end + cleanup | — | Cierre | — |

## Cómo correr todo de una

```bash
# 1. Desplegar base + las 8 features de IA + gobernanza
sam build -t template.full.yaml
sam deploy -t template.full.yaml --stack-name techmoda-ai-aby --region us-east-1 \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND --resolve-s3 --no-confirm-changeset
# 2. Sembrar productos
bash ai/seed/seed-products.sh
# 3. Verificar todo (CRUD E2E + las 9 Function URLs de IA, con PASS/FAIL por feature)
bash scripts/validate-all.sh
# 4. Demo narrada de punta a punta
bash sessions/S11-integracion-demo-cleanup/demo.sh
```

`CAPABILITY_IAM` **no es opcional**: el stack crea un rol por función.

Para S01/S02 (visión) hay que subir una imagen real a `s3://techmoda-ai-aby-frontend/assets/`
y apuntar el `imageUrl` del producto a esa ruta (`s3://...`).

La ruta progresiva (una sesión por vez, pegando cada `template-snippet.yaml` en
`template.yaml`) está en la `GUIA.md` de cada sesión. Ver también
[`../SESSION-PLAN.md`](../SESSION-PLAN.md).

## Permisos por sesión

La tabla completa (qué política lleva cada Lambda y por qué) está en
[`docs/IAM.md`](../docs/IAM.md#permisos-por-sesión). Resumen del criterio:

- **DynamoDB y S3** admiten ARN → se acotan **por recurso** (`DynamoDBCrudPolicy` /
  `DynamoDBReadPolicy` por tabla, `S3CrudPolicy` por bucket).
- **Bedrock** admite ARN → se acota **por ARN de modelo** (más `inference-profile/*` para los
  IDs con prefijo `us.`).
- **Rekognition, Comprehend, Translate y Polly** no admiten ARN en sus APIs `Detect*`/`Synthesize*`
  → se acotan **por acción**. `Resource: "*"` ahí no es descuido: es el límite real que existe.

## Estado verificado

**Servicios de IA end-to-end (2026-06-18)** — cada llamada probada contra el servicio real:

| Sesión | Llamada | Resultado |
|---|---|---|
| S01/S02 | Rekognition `DetectLabels` / `DetectModerationLabels` | ✅ |
| S03 | Comprehend `DetectSentiment` | ✅ |
| S04 | `translate:TranslateText` | ✅ traducción ES→EN |
| S05 | Polly `SynthesizeSpeech` + URL prefirmada | ✅ |
| S06 | Bedrock Converse (Claude Haiku) | ✅ descripción generada |
| S07/S08 | Bedrock `amazon.titan-embed-text-v2:0` (InvokeModel) | ✅ embedding de 1024 dims |
| S09 | Bedrock Guardrails | ✅ API con acceso |

⚠️ **Pendiente de verificar:** el refactor a roles de mínimo privilegio (`Policies:` por función)
**no se ha probado en la nube todavía**. Las llamadas de arriba se validaron cuando las Lambdas
usaban un rol compartido y amplio; que los roles generados por SAM alcancen en runtime es lo que
falta confirmar. Correr `bash scripts/validate-all.sh` (modo completo) contra un stack desplegado
es lo que cierra ese hueco.
