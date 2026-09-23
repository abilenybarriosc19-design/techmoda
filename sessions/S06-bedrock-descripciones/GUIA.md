> 🔑 **Requisito externo — Bedrock Model access.** El rol de esta Lambda ya trae
> `bedrock:InvokeModel` acotado por ARN de modelo, pero el permiso IAM **no alcanza**: hay que
> habilitar el modelo en la consola (**Bedrock → Model access**), en **la región del deploy**
> — es un setting por región. Si la llamada devuelve `AccessDeniedException`, ese es el primer
> sospechoso, no las políticas IAM. Detalle en [`docs/IAM.md`](../../docs/IAM.md).

# S6 · Generar descripciones de producto desde atributos (Amazon Bedrock)

**Duración:** ~60 min · **Servicio:** Amazon Bedrock · **Dominio AIF-C01:** **D2 — Fundamentals of Generative AI (24%)**

> 🔥 **Sesión clave.** D2 + D3 (generativa) = **52%** del examen. Acá entrás de lleno a foundation models.

> 🔌 **Cómo se expone:** esta función tiene su propia **Lambda Function URL** (no API Gateway) y un
> **rol de mínimo privilegio que SAM le crea** a partir de sus `Policies:` — ver
> [`docs/IAM.md`](../../docs/IAM.md). Su URL es el output **`GenerateDescriptionUrl`** del stack.

---

## 🎯 Objetivo

Que TechModa **escriba sus propias descripciones de producto** con IA generativa. A partir de los atributos
(`name`, `category`, `price` y las etiquetas visuales de S1) un **foundation model** redacta una descripción
de marketing en español, con el tono que pidamos. Es el primer contacto con **generación de texto**.

---

## 🧩 Prerequisitos

- **S0 desplegado.** Ideal haber corrido **S1** antes (las `aiLabels` enriquecen el prompt).
- 🔑 **Acceso al modelo habilitado:** Consola → **Amazon Bedrock → Model access** → habilitar
  *Anthropic Claude Haiku 4.5* (o el modelo que uses) en **us-east-1**. Sin esto, la llamada falla con AccessDenied.

---

## 🧠 El concepto: foundation models e IA generativa

Un **foundation model (FM)** es un modelo grande preentrenado con enormes cantidades de texto, capaz de
**generar** lenguaje. **Amazon Bedrock** es el servicio administrado que te da acceso a FMs de varios
proveedores (Anthropic, Amazon, Meta, Mistral, etc.) por una **misma API**, sin administrar infraestructura.

Conceptos que el examen evalúa (y que viste en código):

- **Prompt:** la instrucción que le das al modelo. La calidad de la salida depende del prompt
  (*prompt engineering*). En nuestro prompt: rol ("redactor de moda"), formato ("2-3 frases"), restricciones
  ("no inventes materiales", "sin emojis"). Eso reduce alucinaciones.
- **Tokens:** el modelo procesa texto en *tokens* (~fragmentos de palabra). `maxTokens` limita la salida;
  la respuesta trae `usage.inputTokens/outputTokens` → **así se calcula el costo** (lo retomamos en S10).
- **Temperatura:** controla la aleatoriedad. `0.7` = creativo pero coherente; `0.0` = determinista. Para
  descripciones de marketing queremos algo de variedad; para datos exactos, baja temperatura.
- **Alucinación:** el FM puede inventar datos plausibles pero falsos (un material que el producto no tiene).
  Lo mitigamos **anclando el prompt a los atributos reales** y pidiendo honestidad. (En S7 lo llevamos más
  lejos con RAG; en S9 con Guardrails.)
- **Converse API:** usamos `bedrock-runtime.converse`, una API **agnóstica al modelo**. Cambiar
  `BEDROCK_MODEL_ID` cambia el proveedor **sin tocar código** → muestra el valor de una capa unificada.

### ¿Bedrock o SageMaker?
El examen distingue: **Bedrock = consumir FMs administrados** (lo que hacemos). **SageMaker = construir/
entrenar/alojar tus propios modelos**. Para "generar texto sin entrenar nada" → Bedrock.

---

## 🚶 Paso a paso

1. Habilitá el acceso al modelo en la consola de Bedrock (ver prerequisitos).
2. Pegá `GenerateDescriptionFunction` (trae sus `Policies:` — `bedrock:InvokeModel` acotado por ARN de modelo — + su `FunctionUrlConfig`) + el output `GenerateDescriptionUrl` desde el snippet.
3. `sam build && sam deploy`.
4. Generá una descripción (Function URL de esta función; el productId va en path o body):
```bash
URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='GenerateDescriptionUrl'].OutputValue" --output text)
curl -s -X POST "${URL%/}/products/PRODUCT_ID/describe" \
  -H "Content-Type: application/json" \
  -d '{"tone":"elegante y aspiracional","save":true}' | python3 -m json.tool
```
Respuesta esperada:
```json
{
  "productId": "a1b2...",
  "model": "anthropic.claude-haiku-4-5-20251001-v1:0",
  "tone": "elegante y aspiracional",
  "saved": true,
  "description": "Este vestido midi de gasa floral une fluidez y delicadeza...",
  "usage": {"inputTokens": 95, "outputTokens": 64, "totalTokens": 159}
}
```
5. Probá **distintos tonos** ("divertido y juvenil", "minimalista") y compará. Cambiá `temperature` (env) y observá la variación.

---

## 🔐 Mínimo privilegio (Bedrock SÍ soporta ARN de recurso)

A diferencia de Rekognition/Comprehend, Bedrock permite acotar por **modelo específico**:

```yaml
- bedrock:InvokeModel sobre:
    arn:...:bedrock:us-*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0
    arn:...:bedrock:us-*:ACCOUNT:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0
```
- **No** damos `bedrock:*` ni `Resource: "*"`. Solo InvokeModel sobre el modelo que usamos.
- **Region wildcard `us-*`** porque los *inference profiles* cross-region pueden ejecutar en varias
  regiones de EE.UU. (patrón documentado por AWS). Esto es `ArnLike` implícito — si lo escribís como
  condición usá `ArnLike`/`StringLike`, **nunca** `StringEquals`/`ArnEquals` con comodines.

---

## ✅ Checklist de validación

- [ ] La descripción generada es coherente con los atributos del producto.
- [ ] Cambiar `tone` cambia el estilo del texto.
- [ ] `save:true` guarda `aiDescription` en DynamoDB.
- [ ] La respuesta incluye `usage` con conteo de tokens.
- [ ] Si quitás el acceso al modelo, la llamada falla con un error claro (probalo para entender el control de acceso).

---

## 📝 Qué entra en el examen (D2)

- **Foundation models** y **Amazon Bedrock** como servicio para consumirlos.
- **Prompt engineering**: rol, formato, restricciones; *zero-shot* vs *few-shot*.
- **Tokens, temperatura, maxTokens** y su efecto en salida y costo.
- **Alucinaciones** y cómo mitigarlas (anclar al contexto, restricciones, RAG).
- **Bedrock vs. SageMaker** (consumir FMs vs. entrenar modelos propios).
- Casos de uso de GenAI: generación de texto/imágenes, resumen, extracción, chat.

---

## 💸 Costo + 🧹 Cleanup

**Costo:** Bedrock cobra **por token** (input + output), y el precio varía **por modelo** (Haiku es de los
más baratos; Sonnet/Opus cuestan más). Decenas de generaciones cortas son **centavos**, pero **el costo
escala con el tamaño del prompt y de la salida**. *Verificar en la página de precios de Amazon Bedrock por modelo.*
👉 Usá `maxTokens` y modelos pequeños (Haiku) para práctica.

**Cleanup de S6:** quitar `GenerateDescriptionFunction` + ruta del `template.yaml` y `sam deploy`. Bedrock
no deja recursos persistentes. (No hace falta deshabilitar el acceso al modelo, no genera costo si no se invoca.)
