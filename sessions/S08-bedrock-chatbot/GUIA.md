> 🔑 **Requisito externo — Bedrock Model access.** El rol de esta Lambda ya trae
> `bedrock:InvokeModel` acotado por ARN de modelo, pero el permiso IAM **no alcanza**: hay que
> habilitar el modelo en la consola (**Bedrock → Model access**), en **la región del deploy**
> — es un setting por región. Si la llamada devuelve `AccessDeniedException`, ese es el primer
> sospechoso, no las políticas IAM. Detalle en [`docs/IAM.md`](../../docs/IAM.md).

# S8 · Asistente de compras (chatbot RAG + prompt engineering)

**Duración:** ~60 min · **Servicio:** Amazon Bedrock · **Dominio AIF-C01:** **D2 (24%) + D3 (28%)**

> 🔥 **Sesión cumbre.** Junta todo lo generativo: prompt engineering (D2) + RAG (D3) = el **52%** del examen en una sola feature.

> 🔌 **Cómo se expone:** esta función tiene su propia **Lambda Function URL** (no API Gateway) y un
> **rol de mínimo privilegio que SAM le crea** a partir de sus `Policies:` — ver
> [`docs/IAM.md`](../../docs/IAM.md). Su URL es el output **`ShoppingAssistantUrl`** del stack.

---

## 🎯 Objetivo

Construir el **asistente de compras conversacional** de TechModa. El cliente escribe en lenguaje natural
("busco algo para una boda de día, presupuesto medio") y el asistente recomienda productos **reales del
catálogo**, conversando con memoria del historial. Lo clave: **no inventa** — sus respuestas están ancladas
(grounded) en los productos recuperados por embeddings.

Este es el patrón **RAG completo**: *Retrieval* (S7) + *Augmented Generation* (S6).

---

## 🧩 Prerequisitos

- **S7 completada y el índice construido** (`POST /search/index`). El asistente recupera sobre esos embeddings.
- 🔑 **Acceso a dos modelos** en Bedrock (us-east-1): el de **embeddings** (Titan) y el de **generación** (Claude Haiku).

---

## 🧠 El concepto: RAG y por qué evita alucinaciones

Un FM por sí solo "sabe" lo que vio en su entrenamiento — **no conoce el catálogo de TechModa** ni los
precios de hoy. Si le preguntás por productos, **alucinaría**. RAG resuelve esto en tres pasos:

1. **Retrieval (recuperar):** embebemos la consulta y traemos los `TOP_K` productos más relevantes (S7).
2. **Augment (aumentar):** inyectamos esos productos como **contexto** en el prompt.
3. **Generation (generar):** el FM responde **usando solo ese contexto**, guiado por un *system prompt*
   estricto ("recomendá ÚNICAMENTE productos del catálogo; no inventes").

### Piezas de prompt engineering que vas a ver en el código
- **System prompt:** define rol, idioma, tono y **reglas duras** (no inventar). Es la barrera principal
  contra alucinaciones a nivel de prompt.
- **Grounding/contexto:** el bloque "CATÁLOGO RELEVANTE" con los productos recuperados.
- **Historial de conversación:** se pasan los turnos previos a la **Converse API** → memoria multivuelta.
- **Temperatura baja (0.5):** queremos respuestas fieles al contexto, no demasiado creativas.

> 🧠 **RAG vs. fine-tuning (entra en el examen):** para "que el modelo conozca MIS datos actuales", **RAG**
> es preferible a *fine-tuning* cuando los datos cambian seguido (catálogo): no reentrenás, solo actualizás
> el índice. *Fine-tuning* sirve para enseñar **estilo/formato/tarea**, no para datos frescos.

---

## 🚶 Paso a paso

1. Asegurate de tener el índice de S7 (`POST /search/index` vía la Function URL de `IndexEmbeddings`).
2. Pegá `ShoppingAssistantFunction` (trae sus `Policies:` — `DynamoDBReadPolicy`, porque sólo consulta — + su `FunctionUrlConfig`) + el output `ShoppingAssistantUrl` desde el snippet.
3. `sam build && sam deploy`.
4. Conversá (Function URL de esta función):
```bash
URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ShoppingAssistantUrl'].OutputValue" --output text)
curl -s -X POST "${URL%/}/assistant" \
  -H "Content-Type: application/json" \
  -d '{"message":"Busco algo cómodo y blanco para caminar todo el día"}' | python3 -m json.tool
```
Respuesta esperada:
```json
{
  "reply": "Para caminar cómodo te recomiendo los Tenis blancos minimalistas ($74.50): suela de goma y diseño limpio que combina con todo. ¿Querés que te muestre opciones para clima frío también?",
  "retrieved": [{"productId":"...","name":"Tenis blancos minimalistas"}],
  "model": "anthropic.claude-haiku-4-5-20251001-v1:0",
  "usage": {"inputTokens": 210, "outputTokens": 58, "totalTokens": 268}
}
```
5. **Probá el grounding:** preguntá por algo que NO está en el catálogo ("¿venden relojes?"). El asistente
   debería decir honestamente que no, **sin inventar** un reloj.
6. **Probá memoria:** mandá un segundo turno con `history` incluyendo el intercambio previo.

---

## 🔐 Mínimo privilegio

- **Solo lectura** de la tabla (`DynamoDBReadPolicy`) — el asistente no escribe.
- `bedrock:InvokeModel` acotado a **los modelos exactos** (embeddings + generación + inference profile),
  region wildcard `us-*`. **Nada de `bedrock:*` ni `Resource:"*"`.**

---

## ✅ Checklist de validación

- [ ] El asistente recomienda un producto **real** del catálogo y cita su precio correcto.
- [ ] `retrieved` muestra los productos que se usaron como contexto.
- [ ] Ante una consulta fuera de catálogo, **no inventa** y lo dice.
- [ ] Pasar `history` mantiene el hilo de la conversación.
- [ ] `usage` reporta tokens (entrada crece con el contexto recuperado → relación RAG↔costo).

---

## 📝 Qué entra en el examen (D2 + D3)

- **RAG**: definición, los 3 pasos, y por qué reduce alucinaciones.
- **RAG vs. fine-tuning vs. prompt engineering**: cuándo cada uno (datos frescos → RAG; estilo/tarea → fine-tuning; ajuste rápido → prompting).
- **System prompt, grounding, contexto, temperatura, multivuelta**.
- **Converse API** y mensajes con roles user/assistant.
- **Costo de RAG**: más contexto recuperado = más tokens de entrada = más costo/latencia. Trade-off `TOP_K`.
- **Agentes / chatbots** como aplicación estrella de foundation models.

---

## 💸 Costo + 🧹 Cleanup

**Costo:** cada turno hace **1 embedding (barato) + 1 generación (según modelo)**. El contexto recuperado
suma tokens de **entrada**: a mayor `TOP_K`, mayor costo. Conversaciones de práctica = **centavos**, pero un
chatbot en bucle puede acumular. *Verificar precios por modelo en Amazon Bedrock.*
👉 Mantené `TOP_K=3`, `maxTokens` acotado y un modelo pequeño (Haiku) para practicar.

**Cleanup de S8:** quitar `ShoppingAssistantFunction` + ruta del `template.yaml` y `sam deploy`.
