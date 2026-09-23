# Compatibilidad de despliegue — Function URLs, y el legado del sandbox re/Start

> **Guía permanente.** Explica **por qué el capstone no usa API Gateway** (sigue vigente) y **qué
> cuenta AWS necesitás** para desplegarlo (cambió).
>
> Para el modelo de permisos — `Policies:` por función, mínimo privilegio, el patrón a copiar —
> la autoridad es **[`docs/IAM.md`](IAM.md)**. Este documento no lo duplica.

## TL;DR

| # | Decisión | Estado | Dónde está el detalle |
|---|---|---|---|
| 1 | **Sin API Gateway** → Lambda Function URLs + un router para el CRUD | ✅ Vigente | Este documento, §1 |
| 2 | **IAM de mínimo privilegio**: cada función declara `Policies:` y SAM le crea su rol | ✅ Vigente | [`docs/IAM.md`](IAM.md) |
| 3 | **Requiere una cuenta con `iam:CreateRole`** | ⚠️ Requisito nuevo | Este documento, §2 |

⚠️ **Lo que cambió:** versiones anteriores desplegaban con el **`LabRole`** del sandbox AWS re/Start
(Vocareum), que **no permite `iam:CreateRole`**. Por eso cada función llevaba `Role: !Ref LabRoleArn`
y **ningún** bloque `Policies:` — se perdía el mínimo privilegio, que es justamente lo que evalúa el
dominio D5 del AIF-C01. Hoy el proyecto crea sus propios roles acotados y **ya no despliega en el
sandbox re/Start**. Ver §2.

---

## 1. Sin API Gateway → Lambda Function URLs

Esta decisión **no cambió**, y no es sólo herencia del sandbox: una Function URL es más simple de
desplegar y de explicar que un `AWS::Serverless::Api`, y para un capstone de IA el frente HTTP no es
lo que se está enseñando.

El origen sí fue una restricción: el `LabRole` del sandbox deniega `apigateway:POST`, y como SAM crea
la API **durante** el deploy, el `CREATE_FAILED` **revertía el stack entero**. Las Function URLs sí
estaban permitidas (`lambda:CreateFunctionUrlConfig`). La arquitectura que salió de ahí resultó mejor
para el propósito pedagógico, así que se quedó.

### Arquitectura del CRUD: **un router, una Function URL**

```
                 Lambda Function URL (AuthType: NONE, CORS *)
                 https://<id>.lambda-url.us-east-1.on.aws/
                                  │
                                  ▼
                    functions/router/index.js      ← parsea method + rawPath
                ┌───────────┬─────────┴────┬───────────┬───────────┐
                ▼           ▼              ▼           ▼           ▼
          list-items   create-item     get-item   update-item  delete-item   (require '../')
```

**Por qué un router y no 5 Function URLs:**

1. **El frontend no cambia de lógica.** `frontend/src/lib/api.ts` arma rutas como
   `${API_URL}/products` y `${API_URL}/products/{id}`. Con **una** base URL apuntando al router, esas
   rutas funcionan tal cual. Cinco URLs obligarían a mapear cada operación a una URL distinta.
2. **Reutiliza la lógica existente sin duplicar.** El router se empaqueta con `CodeUri: functions/` +
   `Handler: router/index.handler`, así que puede `require('../list-items/index.js')` etc. — los 5
   handlers CRUD probados se ejecutan sin tocar su código.
3. **Una sola URL para inyectar/operar.** Menos outputs, menos variables de entorno.

El router lee el evento de **Function URL (payload v2.0)**: `event.requestContext.http.method`,
`event.rawPath`, `event.body` (decodifica base64 si `isBase64Encoded`), normaliza dobles slash, y
reconstruye `pathParameters.id` para reusar los handlers.

### Funciones de IA

- **HTTP on-demand** (S1 labels, S2 moderate, S3 sentiment, S4 translate, S5 voice, S6 describe,
  S7 index/search, S8 assistant) → **cada una con su propia Function URL**. Se agregan sesión por
  sesión sin tocar el router. Los handlers Python extraen el `productId` del `rawPath`
  (`/products/<id>/...`) o del body, así funcionan igual con Function URL que con API Gateway.
- **Event-driven** (p. ej. Rekognition disparado por subida a S3 → evento S3, no HTTP) → **mantener
  el trigger de evento** (`Events: Type: S3`), sin Function URL. *(En el diseño actual ninguna función
  es S3-event-driven; todas son on-demand. Si agregás una, no le pongas Function URL.)*

### Patrón de recurso (copiá esto)

```yaml
  MiFuncion:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub ${AWS::StackName}-MiFuncion
      CodeUri: sessions/SXX-.../functions/mi-funcion
      Handler: app.lambda_handler
      Runtime: python3.12
      Policies:                      # ← acotadas; SAM crea el rol. Ver docs/IAM.md
        - DynamoDBCrudPolicy:
            TableName: !Ref ProductsTable
      FunctionUrlConfig:             # ← HTTP sin API Gateway
        AuthType: NONE
        Cors:
          AllowOrigins: [ "*" ]
          AllowMethods: [ "*" ]
          AllowHeaders: [ "*" ]
```

**Nunca pongas `Role:` junto a `Policies:`** — son mutuamente excluyentes en SAM y tus `Policies` se
ignoran **en silencio**. Y `Role` tampoco va en `Globals.Function` (SAM no lo soporta ahí: rompe con
`InvalidSamDocumentException`).

Y el output para obtener la URL (SAM crea el recurso `<LogicalId>Url`):

```yaml
Outputs:
  MiFuncionUrl:
    Value: !GetAtt MiFuncionFunctionUrl.FunctionUrl   # nota: <LogicalId> + "Url"
```

---

## 2. Qué cuenta AWS necesitás

**Requisito:** una cuenta donde tu identidad de deploy pueda **crear roles IAM**
(`iam:CreateRole`, `iam:PutRolePolicy`, `iam:AttachRolePolicy`) — además de Lambda, DynamoDB, S3,
CloudFormation y los servicios de IA de las sesiones que vayas a correr.

Sirve: una cuenta propia, una cuenta de Bootcamp/empresa, o cualquier sandbox que dé permisos de IAM.
**No sirve** el sandbox AWS re/Start (Vocareum) con el `LabRole` — ver §3.

**Síntoma si la cuenta no puede crear roles:** el deploy falla con

```
User: arn:aws:sts::<acct>:assumed-role/... is not authorized to perform:
iam:CreateRole on resource: ... because no identity-based policy allows the action
```

y CloudFormation revierte el stack (`ROLLBACK_COMPLETE`). No es un error del template: es la cuenta.

**Capabilities del deploy** — ninguna es opcional:

```bash
cp samconfig.us-east-1.example samconfig.toml      # stack techmoda-ai-aby, us-east-1
sam build
sam deploy --stack-name techmoda-ai-aby --region us-east-1 \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --resolve-s3 --no-confirm-changeset
```

`CAPABILITY_AUTO_EXPAND` por el Transform de SAM; **`CAPABILITY_IAM` porque el stack sí crea roles**
(uno por función). Atajo: `bash scripts/deploy.sh`.

### Verificación post-deploy

```bash
bash scripts/validate-all.sh          # estático + CRUD E2E + las 9 features de IA

# O a mano, sólo la base:
API=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
       --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
curl "${API%/}/products"                       # -> {"products":[...]}
curl -X POST "${API%/}/products" -H 'Content-Type: application/json' \
     -d '{"name":"Test","price":10}'
```

Para ver el rol que SAM le generó a una función (útil como ejercicio de D5):

```bash
aws lambda get-function-configuration --function-name techmoda-ai-aby-EnrichLabels \
  --query Role --output text
```

---

## 3. Nota histórica — por qué el sandbox re/Start quedó afuera

El sandbox de AWS re/Start (Vocareum) ejecuta todo con el `LabRole`
(`ReadOnlyAccess` + `VocLabPolicy1/2`), que **no es modificable**. Esta matriz se midió
empíricamente el **2026-06-18** en la cuenta `879652687082`, invocando las Lambdas con ese rol:

| Servicio · acción | ¿El LabRole lo permitía? | Sesión |
|---|---|---|
| `rekognition:DetectLabels` | ✅ Sí | S01 |
| `rekognition:DetectModerationLabels` | ✅ Sí | S02 |
| `comprehend:DetectSentiment` | ✅ Sí | S03 |
| `polly:SynthesizeSpeech` | ✅ Sí | S05 |
| `s3:GetObject` / `dynamodb:*` | ✅ Sí | S00–S10 |
| `apigateway:POST` | ❌ No | (origen de la decisión #1) |
| `iam:CreateRole` | ❌ No | (origen del viejo `Role: !Ref LabRoleArn`) |
| `translate:TranslateText` | ❌ No | S04 |
| `bedrock:InvokeModel` | ❌ No | S06, S07, S08 |
| `bedrock:CreateGuardrail` / `ApplyGuardrail` | ❌ No | S09 |

Esos tres últimos denegados obligaban a partir el capstone en **dos pistas**: las sesiones de
Bedrock/Translate no corrían en el sandbox y se demostraban en una cuenta aparte. **Esa estructura ya
no existe:** con roles propios y una cuenta con permisos plenos, **las 12 sesiones son ejecutables**.
El único requisito externo que queda para S06–S09 es habilitar **Bedrock → Model access** en la
consola, en la región del deploy (es un setting **por región**).

> Si S06–S09 devuelven `AccessDeniedException`, el primer sospechoso es Model access, **no** las
> políticas IAM. El permiso `bedrock:InvokeModel` concedido + modelo no habilitado da un
> `AccessDeniedException` del lado del servicio. Ver [`docs/IAM.md`](IAM.md).

El historial de git conserva la variante con `LabRole` — es material didáctico útil para comparar un
rol amplio compartido contra roles acotados por función.

---

## Checklist antes de mergear una sesión nueva

- [ ] La función declara `Policies:` acotadas y **no** tiene `Role:` (ver [`docs/IAM.md`](IAM.md)).
- [ ] Ninguna política usa comodín de servicio (`bedrock:*`, `rekognition:*`, `dynamodb:*`…).
- [ ] Si es HTTP: tiene `FunctionUrlConfig` (no `Events: Type: Api`, no `RestApiId`).
- [ ] Si es event-driven: tiene su trigger (`Events: Type: S3/SQS/...`), sin Function URL.
- [ ] No hay ningún `AWS::Serverless::Api` ni `apigateway:` en el template/snippet.
- [ ] El handler extrae sus parámetros del `rawPath`/`queryStringParameters`/body
      (no asume `pathParameters` de API Gateway).
- [ ] `bash scripts/validate-all.sh --static` pasa (incluye `sam validate --lint` en los 3 templates
      y el splice de cada snippet en `template.yaml`).

---

## Gotcha de código encontrado (S01)

DynamoDB **no acepta `float`** vía el resource de boto3: hay que convertir los `Confidence` de
Rekognition a `Decimal` (`Decimal(str(valor))`) antes del `update_item`, o el handler crashea con
`TypeError: Float types are not supported`. Corregido en
`sessions/S01-rekognition-labels/functions/enrich-labels/app.py`. Aplica a cualquier handler nuevo que
persista números devueltos por un servicio de IA.
