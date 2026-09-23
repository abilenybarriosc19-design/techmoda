> 🔑 **Requisito externo — Bedrock Model access.** El rol de esta Lambda ya trae
> `bedrock:InvokeModel` acotado por ARN de modelo, pero el permiso IAM **no alcanza**: hay que
> habilitar el modelo en la consola (**Bedrock → Model access**), en **la región del deploy**
> — es un setting por región. Si la llamada devuelve `AccessDeniedException`, ese es el primer
> sospechoso, no las políticas IAM. Detalle en [`docs/IAM.md`](../../docs/IAM.md).

# S7 · Búsqueda semántica / RAG sobre el catálogo (Bedrock embeddings)

**Duración:** ~60 min · **Servicio:** Amazon Bedrock (embeddings) · **Dominio AIF-C01:** **D3 — Applications of Foundation Models (28%)**

> 🔥 **El dominio más pesado del examen (28%).** Embeddings + recuperación semántica son la base del RAG.

> 🔌 **Cómo se exponen:** cada función tiene su propia **Lambda Function URL** (no API Gateway) y su
> **rol de mínimo privilegio creado por SAM** a partir de sus `Policies:` — ver
> [`docs/IAM.md`](../../docs/IAM.md). Sus URLs son los outputs **`IndexEmbeddingsUrl`** (indexar) y
> **`SemanticSearchUrl`** (buscar) del stack.

---

## 🎯 Objetivo

Darle a TechModa una **búsqueda que entiende significado**. Si un cliente busca *"algo abrigado para el
frío"*, queremos devolver la **chaqueta de mezclilla** aunque esa frase no contenga la palabra "chaqueta".
Esto se logra con **embeddings**: convertimos textos en vectores numéricos y medimos qué tan cerca está la
consulta de cada producto.

Es además el **mecanismo de recuperación del patrón RAG** (Retrieval-Augmented Generation) que usaremos en
el chatbot de S8.

---

## 🧩 Prerequisitos

- **S0 desplegado** con productos cargados. Ideal **S1** corrido (las `aiLabels` enriquecen el texto a indexar).
- 🔑 **Acceso al modelo de embeddings** en Bedrock → Model access → *Amazon Titan Text Embeddings V2* (us-east-1).

---

## 🧠 El concepto: embeddings y similitud

Un **embedding** es un vector (lista de números, p. ej. 1024 dimensiones) que representa el **significado**
de un texto. La propiedad mágica: **textos con significado parecido producen vectores cercanos**. La cercanía
se mide con **similitud coseno** (1 = idénticos en dirección, 0 = sin relación).

El flujo de esta sesión:

1. **Indexar (una vez):** `POST /search/index` calcula el embedding de cada producto y lo guarda en DynamoDB.
2. **Buscar (cada consulta):** `GET /search?q=...` embebe la consulta y la compara contra todos los
   productos por coseno, devolviendo los más cercanos.

### Por qué esto importa para el examen (D3)
- **RAG = Retrieval (recuperar contexto relevante) + Generation (que el FM responda usando ese contexto).**
  S7 es la parte *Retrieval*; S8 le suma *Generation*.
- **Vector database / vector store:** acá usamos DynamoDB + coseno en Lambda por simplicidad pedagógica.
  En producción se usa un **vector DB** (OpenSearch, Aurora pgvector, Bedrock Knowledge Bases). El examen
  espera que sepas **que los embeddings se guardan en un almacén vectorial**.
- **Búsqueda semántica vs. léxica (keyword):** la semántica entiende sinónimos y contexto; la léxica solo
  coincidencia de palabras. RAG usa la semántica para traer el contexto correcto.
- **Embeddings ≠ generación:** el modelo de embeddings **no escribe texto**, solo vectoriza. Es un FM con
  otra finalidad. (Titan Embeddings para vectorizar; Claude/Titan Text para generar.)

---

## 🚶 Paso a paso

1. Habilitá el modelo de embeddings en la consola de Bedrock.
2. Pegá las **dos** funciones (`IndexEmbeddings`, `SemanticSearch`), cada una con sus `Policies:` + su `FunctionUrlConfig`, y sus outputs `IndexEmbeddingsUrl` y `SemanticSearchUrl`. Fijate que `SemanticSearch` lleva `DynamoDBReadPolicy` y no `Crud`: sólo lee el catálogo.
3. `sam build && sam deploy`.
4. **Indexar** el catálogo (Function URL de `IndexEmbeddings`):
```bash
INDEX_URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='IndexEmbeddingsUrl'].OutputValue" --output text)
curl -s -X POST "${INDEX_URL%/}/search/index" | python3 -m json.tool
# {"indexed": 4, "skipped": 0, "total": 4, "model": "amazon.titan-embed-text-v2:0"}
```
5. **Buscar** semánticamente (Function URL de `SemanticSearch`):
```bash
SEARCH_URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='SemanticSearchUrl'].OutputValue" --output text)
curl -s "${SEARCH_URL%/}/search?q=algo%20abrigado%20para%20el%20invierno" | python3 -m json.tool
```
Resultado esperado (la chaqueta primero, aunque la consulta no diga "chaqueta"):
```json
{
  "query": "algo abrigado para el invierno",
  "results": [
    {"productId":"...","name":"Chaqueta de mezclilla oversize","category":"Chaquetas","price":89.0,"score":0.62},
    {"productId":"...","name":"Vestido midi floral","category":"Vestidos","price":59.9,"score":0.41}
  ]
}
```
6. Probá consultas variadas: *"zapatos para caminar"*, *"regalo elegante"*. Observá el ranking por `score`.

---

## 🔐 Mínimo privilegio

- **Indexer:** `bedrock:InvokeModel` solo sobre el modelo de embeddings + CRUD de la tabla.
- **Search:** `bedrock:InvokeModel` solo sobre el modelo de embeddings + **solo lectura** de la tabla
  (`DynamoDBReadPolicy`). El buscador no necesita escribir → privilegio aún más acotado.

---

## ✅ Checklist de validación

- [ ] `POST /search/index` reporta `indexed > 0`.
- [ ] Los productos en DynamoDB tienen el atributo `embedding` (JSON string) y `embeddingDim`.
- [ ] Una consulta semántica devuelve resultados ordenados por `score` descendente.
- [ ] Una consulta con sinónimos (sin la palabra exacta) igual encuentra el producto correcto.
- [ ] Buscar **sin** haber indexado devuelve `results: []` + el hint.

---

## 📝 Qué entra en el examen (D3)

- **Embeddings**: vectorización del significado; **similitud coseno**.
- **RAG**: retrieval (embeddings + vector store) + generación; reduce alucinaciones aportando contexto.
- **Vector databases / Bedrock Knowledge Bases** como almacén de embeddings en producción.
- **Búsqueda semántica vs. keyword**.
- Distintos **tipos de FM** según la tarea (embeddings vs. generación de texto).
- Casos de uso de foundation models: búsqueda, recomendación, resumen, Q&A sobre documentos.

---

## 💸 Costo + 🧹 Cleanup

**Costo:** los modelos de embeddings de Bedrock cobran **por token de entrada** y son **mucho más baratos**
que los de generación. Indexar un catálogo pequeño + decenas de búsquedas son **centavos**. *Verificar en la
página de precios de Amazon Bedrock (Titan Embeddings).*
👉 **Indexá una sola vez**; re-indexá solo si cambian los productos (no en cada búsqueda).

**Cleanup de S7:** quitar las dos funciones + sus rutas del `template.yaml` y `sam deploy`. Opcional: borrar
el atributo `embedding` de los productos (no es necesario; no genera costo).
