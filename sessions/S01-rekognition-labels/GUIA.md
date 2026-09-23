> ⚡ **Paso 0 — Bootstrap del entorno.** Si el stack no está desplegado (cuenta nueva,
> sandbox reciclado, o venís de un cleanup), corré `bash scripts/bootstrap.sh` (~2-3 min)
> para dejar el entorno listo. Es idempotente y seguro de correr siempre: si ya está
> desplegado termina en segundos. Detalle en `SESSION-PLAN.md`.

# S1 · Auto-etiquetado de imágenes de producto (Rekognition DetectLabels)

**Duración:** ~60 min · **Servicio:** Amazon Rekognition · **Dominio AIF-C01:** **D1 — Fundamentals of AI and ML (20%)**

> 🔌 **Cómo se expone:** esta función tiene su propia **Lambda Function URL** (no API Gateway) y un
> **rol de mínimo privilegio que SAM le crea** a partir de sus `Policies:` — ver
> [`docs/IAM.md`](../../docs/IAM.md). Su URL es el output **`EnrichLabelsUrl`** del stack.

---

## 🎯 Objetivo

Que TechModa **etiquete sola** cada foto de producto. Cuando subimos la imagen de un vestido, el sistema
detecta automáticamente `["Clothing", "Dress", "Apparel", "Person", "Floral Design"]`. Esas etiquetas
sirven para **filtros de catálogo, búsqueda por facetas y control de calidad de las fotos** — sin que
nadie las escriba a mano.

Al terminar vas a llamar a un endpoint nuevo y ver cómo el producto en DynamoDB se enriquece con un
campo `aiLabels`.

---

## 🧩 Prerequisitos

- **S0 desplegado** y funcionando (catálogo visible, `ApiUrl` a mano).
- Al menos **un producto con una imagen real**. La `imageUrl` puede ser:
  - `s3://techmoda-ai-aby-aby-frontend/assets/vestido.jpg` (subí la foto a ese bucket), **o**
  - una URL pública `https://...jpg`.
- Acceso a Rekognition en `us-east-1` (confirmado disponible en el sandbox).

```bash
# Subir una foto de ejemplo al bucket de assets y apuntar el producto a ella:
aws s3 cp ./mi-vestido.jpg s3://techmoda-ai-aby-aby-frontend/assets/vestido.jpg
# luego, PUT al producto con imageUrl = s3://techmoda-ai-aby-aby-frontend/assets/vestido.jpg
```

---

## 🧠 El concepto: visión por computadora **preentrenada**

Rekognition es un **modelo de visión ya entrenado por AWS** con millones de imágenes. Vos **no entrenás
nada**: le pasás una imagen y te devuelve etiquetas con un **nivel de confianza** (0–100%). Esto es el
corazón de D1: *usar IA preentrenada para percibir el mundo*.

Conceptos clave que el examen evalúa y que aparecen acá:

- **Inferencia vs. entrenamiento.** Acá solo hacemos **inferencia** (pedir una predicción a un modelo ya hecho). No hay dataset ni GPUs.
- **Confianza / umbral.** Cada etiqueta trae un `Confidence`. Filtramos con `MinConfidence=80` para evitar ruido. Subir/bajar el umbral es un trade-off **precisión vs. cobertura**.
- **Caso de uso correcto.** "Etiquetar imágenes" → Rekognition. (El examen te da escenarios y vos elegís el servicio: imagen→Rekognition, texto→Comprehend, voz→Polly/Transcribe, generación→Bedrock.)

### ¿Por qué `DetectLabels` y no otra cosa?
`DetectLabels` devuelve **objetos, escenas y conceptos**. Es exactamente lo que necesita un catálogo de
moda. Rekognition tiene además `DetectModerationLabels` (lo vemos en S2), `DetectText`, `DetectFaces`, etc.

---

## 🚶 Paso a paso

### 1. Agregar la Lambda (con su Function URL) al `template.yaml`
Abrí `sessions/S01-rekognition-labels/template-snippet.yaml` y:
1. Copiá el recurso `EnrichLabelsFunction` dentro de `Resources:` en `template.yaml` (trae sus `Policies:` acotadas y su `FunctionUrlConfig`).
2. Copiá el output `EnrichLabelsUrl` dentro de `Outputs:` para obtener su Function URL tras el deploy.

> El código de la Lambda ya está en `functions/enrich-labels/app.py`. No tenés que escribirlo.

### 2. Construir y desplegar
```bash
sam build && sam deploy
```

### 3. Ejecutar
```bash
# URL = Function URL de esta función (output EnrichLabelsUrl); ${URL%/} quita la barra final.
URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby-aby --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='EnrichLabelsUrl'].OutputValue" --output text)

# Reemplazá PRODUCT_ID por el productId de un producto con imagen real.
# El productId puede ir en el path o en el body ({"productId":"..."}) — el handler soporta ambos:
curl -s -X POST "${URL%/}/products/PRODUCT_ID/labels" | python3 -m json.tool
```

Respuesta esperada (ejemplo):
```json
{
  "productId": "a1b2...",
  "imageSource": "s3",
  "minConfidence": 80.0,
  "labels": [
    {"name": "Clothing", "confidence": 99.8},
    {"name": "Dress", "confidence": 97.1},
    {"name": "Floral Design", "confidence": 88.4}
  ]
}
```

### 4. Ver el enriquecimiento en DynamoDB
```bash
aws dynamodb get-item --region us-east-1 \
  --table-name techmoda-ai-aby-aby-Products \
  --key '{"productId":{"S":"PRODUCT_ID"}}' \
  --query 'Item.aiLabels'
```

---

## 🔐 Mínimo privilegio (mirá el snippet)

La Lambda tiene **solo tres permisos**, y ese es el punto pedagógico:

| Permiso | Alcance | Por qué |
|---------|---------|---------|
| `DynamoDBCrudPolicy` | Solo la tabla `ProductsTable` | Leer la imagen y escribir `aiLabels`. |
| `rekognition:DetectLabels` | `Resource: "*"` | Las APIs *Detect* de Rekognition **no admiten ARN a nivel de recurso**; acotamos por **acción única**, no por recurso. |
| `s3:GetObject` | `arn:...:${StackName}-frontend/*` | Leer la imagen **solo** del bucket de assets, nunca de cualquier bucket. |

> 🧠 **Para el examen (D5 lo profundiza en S10):** "mínimo privilegio" no siempre significa ARN específico.
> Cuando el servicio no soporta permisos a nivel de recurso, el control correcto es **limitar la acción**
> a la mínima necesaria (`DetectLabels`, no `rekognition:*`).

---

## ✅ Checklist de validación

- [ ] El deploy agregó la función `techmoda-ai-aby-aby-EnrichLabels` (verificá en Lambda console).
- [ ] El `curl` devuelve una lista de `labels` con `confidence ≥ 80`.
- [ ] El producto en DynamoDB ahora tiene el atributo `aiLabels`.
- [ ] En CloudWatch Logs de `EnrichLabels` ves el `Event` y, si falla, el detalle del error.
- [ ] Probá con `MinConfidence` distinto (editá el env var y redeploy): cambia la cantidad de etiquetas.

---

## 📝 Qué entra en el examen (D1)

- **Identificar el servicio de IA correcto** para un caso: *clasificar/etiquetar imágenes → Amazon Rekognition*.
- Diferencia **entrenamiento vs. inferencia**; aquí solo inferimos con un modelo administrado.
- Concepto de **confianza/score** y umbrales como mecanismo de control de calidad.
- Rekognition como ejemplo de **AI service administrado** (vs. SageMaker, que es para entrenar modelos propios — no lo usamos).
- Casos de uso típicos de Rekognition que el examen menciona: etiquetado, moderación, detección de texto/rostros, búsqueda de rostros.

---

## 💸 Costo + 🧹 Cleanup

**Costo:** Rekognition `DetectLabels` se cobra **por imagen procesada**. Etiquetar unas decenas de fotos en
práctica son **centavos**. *Verificar la cifra exacta en la página de precios de Amazon Rekognition.*

**Cleanup de S1 (opcional, si querés revertir solo esta sesión):**
- Quitá `EnrichLabelsFunction` y la ruta `/products/{id}/labels` del `template.yaml` → `sam deploy`.
- No hay recursos persistentes extra (Rekognition no almacena nada en modo Detect).

> No borres el stack todavía: S2 reusa la misma imagen.
