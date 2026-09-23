> ⚡ **Paso 0 — Bootstrap del entorno.** Si el stack no está desplegado (cuenta nueva,
> sandbox reciclado, o venís de un cleanup), corré `bash scripts/bootstrap.sh` (~2-3 min)
> para dejar el entorno listo. Es idempotente y seguro de correr siempre: si ya está
> desplegado termina en segundos. Detalle en `SESSION-PLAN.md`.

# S3 · Sentimiento de reseñas (Amazon Comprehend)

**Duración:** ~60 min · **Servicio:** Amazon Comprehend · **Dominio AIF-C01:** **D1 — Fundamentals of AI and ML (20%)**

> 🔌 **Cómo se expone:** esta función tiene su propia **Lambda Function URL** (no API Gateway) y un
> **rol de mínimo privilegio que SAM le crea** a partir de sus `Policies:` — ver
> [`docs/IAM.md`](../../docs/IAM.md). Su URL es el output **`AnalyzeSentimentUrl`** del stack.

---

## 🎯 Objetivo

Que TechModa **entienda cómo se sienten sus clientes** leyendo automáticamente las reseñas. Cada reseña se
clasifica como `POSITIVE`, `NEGATIVE`, `NEUTRAL` o `MIXED`, y se calcula el sentimiento **agregado** del
producto. Con eso el equipo puede priorizar qué productos necesitan atención (muchos `NEGATIVE`) sin leer
miles de comentarios.

---

## 🧩 Prerequisitos

- **S0 desplegado.** (No depende de imágenes, así que no requiere S1/S2.)
- Los productos sembrados traen un campo `reviews` de ejemplo en `ai/seed/seed-products.json`.

---

## 🧠 El concepto: NLP preentrenado

Amazon Comprehend es un servicio de **Procesamiento de Lenguaje Natural (NLP)** preentrenado. Le pasás
texto y te devuelve **sentimiento, idioma, entidades, frases clave, PII**, etc. — sin entrenar nada.

Flujo de esta sesión (y por qué importa para el examen):

1. **`DetectDominantLanguage`** primero: el cliente puede escribir en español o inglés. Comprehend necesita
   saber el idioma para analizar bien el sentimiento. → *La IA a veces se compone de varios pasos (pipeline).*
2. **`DetectSentiment`** después, en el idioma detectado. Devuelve la etiqueta + **scores** (probabilidad
   de cada clase). El score es clave: `MIXED` con 0.6 no es lo mismo que `NEGATIVE` con 0.98.

> 🧠 **Sentimiento ≠ opinión literal.** "No está nada mal" es `POSITIVE` aunque tenga un "no". El modelo
> capta el matiz; reglas con palabras prohibidas no lo lograrían. Ese es el valor del ML sobre el if/else.

### Caso de uso correcto (lo que evalúa el examen)
- **Texto → Comprehend.** Imagen → Rekognition, voz → Transcribe, generación → Bedrock.
- Comprehend también detecta **PII** (`DetectPiiEntities`): útil para **privacidad** (lo mencionamos en S9).

---

## 🚶 Paso a paso

1. Pegá `AnalyzeSentimentFunction` (trae sus `Policies:` + su `FunctionUrlConfig`) y el output `AnalyzeSentimentUrl` desde `template-snippet.yaml`.
2. `sam build && sam deploy`.
3. Obtené la Function URL de esta función y probá un texto suelto:
```bash
URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='AnalyzeSentimentUrl'].OutputValue" --output text)
curl -s -X POST "${URL%/}/sentiment" \
  -H "Content-Type: application/json" \
  -d '{"text":"Me encantó la tela y el corte, llegó rapidísimo. Lo volvería a comprar."}' \
  | python3 -m json.tool
```
4. Probá varias reseñas y guardalas en un producto:
```bash
curl -s -X POST "${URL%/}/sentiment" \
  -H "Content-Type: application/json" \
  -d '{"productId":"PRODUCT_ID","reviews":[
        "Excelente calidad, súper recomendada.",
        "Buena pero el envío tardó tres semanas."]}' \
  | python3 -m json.tool
```
Respuesta esperada:
```json
{
  "count": 2,
  "overallSentiment": "POSITIVE",
  "distribution": {"POSITIVE": 1, "NEGATIVE": 1},
  "results": [
    {"text":"Excelente calidad...","language":"es","sentiment":"POSITIVE","scores":{"Positive":0.99,...}},
    {"text":"Buena pero el envío...","language":"es","sentiment":"NEGATIVE","scores":{...}}
  ]
}
```
5. Verificá en DynamoDB que el producto tiene `reviewSentiment` y `reviewSentimentCounts`.

---

## 🔐 Mínimo privilegio

Solo `comprehend:DetectSentiment` y `comprehend:DetectDominantLanguage` (Resource `*`, porque las APIs
Detect no admiten ARN), más CRUD en la tabla de productos. **Nada de `comprehend:*`.**

---

## ✅ Checklist de validación

- [ ] Un texto positivo devuelve `sentiment: POSITIVE` con score alto.
- [ ] Una reseña en inglés también funciona (el idioma se detecta solo).
- [ ] El `overallSentiment` agregado refleja la mezcla de reseñas.
- [ ] El producto en DynamoDB guardó `reviewSentiment`.

---

## 📝 Qué entra en el examen (D1)

- **Comprehend = NLP administrado**: sentimiento, idioma, entidades, frases clave, PII.
- Elegir servicio por **modalidad del dato** (texto→Comprehend).
- **Scores/probabilidades** y clases (`POSITIVE/NEGATIVE/NEUTRAL/MIXED`).
- Un caso de IA puede ser un **pipeline de varios servicios/pasos** (detectar idioma → sentimiento).
- Comprehend para **detección de PII** como control de privacidad (puente a D4/D5).

---

## 💸 Costo + 🧹 Cleanup

**Costo:** Comprehend se cobra **por unidad de 100 caracteres** (mínimo por request). Analizar decenas de
reseñas cortas son **centavos**. *Verificar en la página de precios de Amazon Comprehend.*

**Cleanup de S3:** quitar `AnalyzeSentimentFunction` + ruta del `template.yaml` y `sam deploy`.
