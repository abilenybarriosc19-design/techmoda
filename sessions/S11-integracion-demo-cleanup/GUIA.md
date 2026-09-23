# S11 · Integración final, demo, documentación y cleanup

**Duración:** ~60 min · **Servicio:** — (cierre) · **Dominio AIF-C01:** repaso de los 5 dominios
**Estado:** 🟡 Guía detallada + scripts (`demo.sh` listo; `scripts/delete-all.sh` ya existe en el repo).

> 🔌 **Cómo se expone todo:** cada feature tiene su **Lambda Function URL** (no API Gateway) y su propio
> **rol de mínimo privilegio creado por SAM** — ver [`docs/IAM.md`](../../docs/IAM.md). El CRUD usa la Function URL
> del **router** (output `ApiUrl`); cada función de IA tiene su propia Function URL (`EnrichLabelsUrl`,
> `ModerateImageUrl`, `AnalyzeSentimentUrl`, `TranslateCatalogUrl`, `SynthesizeVoiceUrl`,
> `GenerateDescriptionUrl`, `IndexEmbeddingsUrl`, `SemanticSearchUrl`, `ShoppingAssistantUrl`).

---

## 🎯 Objetivo

Cerrar el capstone: **ver todo TechModa AI funcionando de punta a punta**, preparar una **demo** presentable,
**documentar** el proyecto y hacer el **cleanup responsable** para no dejar costos corriendo. Esta sesión
también es tu **repaso integral** para el examen: cada feature mapea a un dominio.

---

## 🧩 Prerequisitos

- Idealmente **S1–S8 desplegadas** (y el índice de S7 construido). S9/S10 son deseables para la narrativa de gobernanza.

---

## 🧠 El concepto: del prototipo al producto responsable

Una solución de IA no es solo "que funcione el modelo". El examen evalúa que entiendas el **ciclo completo**:

1. **Capacidad** (D1–D3): el servicio correcto para cada tarea.
2. **Responsabilidad** (D4): moderación, accesibilidad, guardrails, sesgo, privacidad.
3. **Gobernanza** (D5): IAM, logging, costos, cumplimiento.
4. **Operación**: demo reproducible, documentación, y **apagar lo que no se usa** (FinOps).

### Mapa final feature ↔ dominio (úsalo como repaso)
| Feature | Servicio | Dominio |
|---------|----------|---------|
| Etiquetado de imágenes (S1) | Rekognition | D1 |
| Moderación + alt-text (S2) | Rekognition | D4 |
| Sentimiento (S3) | Comprehend | D1 |
| Traducción (S4) | Translate | D1 |
| Voz/accesibilidad (S5) | Polly | D1+D4 |
| Descripciones generadas (S6) | Bedrock | D2 |
| Búsqueda semántica/RAG (S7) | Bedrock embeddings | D3 |
| Asistente de compras (S8) | Bedrock RAG | D2+D3 |
| Guardrails/sesgo/privacidad (S9) | Bedrock Guardrails | D4 |
| IAM/logging/costos (S10) | gobernanza | D5 |

---

## 🚶 Paso a paso

### 1. Demo end-to-end
```bash
# API_URL = Function URL del router (output ApiUrl). demo.sh resuelve por su cuenta las
# Function URLs de cada feature de IA desde los outputs del stack techmoda-ai-aby (us-east-1).
API_URL=https://xxxx.lambda-url.us-east-1.on.aws/ \
  bash sessions/S11-integracion-demo-cleanup/demo.sh
```
Recorre las 8 features en orden e imprime cada resultado. Ideal para grabar o presentar.

### 2. (Opcional) Integración en el frontend
El frontend base (React) ya consume la API. Mejoras sugeridas para la demo visual (no obligatorias):
- **Barra de búsqueda semántica** que llame a `GET /search?q=`.
- **Widget de chat** que llame a `POST /assistant`.
- Mostrar `aiDescription`, `altText` (en el `alt=""` de la imagen) y un botón "🔊 escuchar" con `audioUrl`.

> El objetivo del capstone es la **integración de IA**, no el pulido visual: con la demo por API alcanza
> para evidenciar cada dominio.

### 3. Documentar
- Actualizá el `README.md` raíz con tu `ApiUrl`/`FrontendUrl` reales (en un doc privado, no commitees URLs sensibles).
- Anotá qué modelos de Bedrock habilitaste y por qué.
- Capturá los `usage` (tokens) de S6/S8 como evidencia de control de costos (D5).

### 4. 🔴 Cleanup responsable (OBLIGATORIO)
```bash
# 1) Deshabilitar logging de Bedrock (si lo activaste en S10)
aws bedrock delete-model-invocation-logging-configuration --region us-east-1 || true

# 2) Borrar el guardrail (si lo creaste en S9)
# aws bedrock delete-guardrail --guardrail-identifier <id> --region us-east-1

# 3) Vaciar buckets (frontend + audio) y borrar el stack completo
bash scripts/delete-all.sh
```
`scripts/delete-all.sh` vacía los buckets S3 antes de eliminar el stack (CloudFormation no borra buckets
con objetos). Verificá al final que el stack ya no aparece:
```bash
aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 2>&1 | grep -q "does not exist" \
  && echo "✓ Stack eliminado" || echo "⚠ Revisá el estado del stack"
```

---

## ✅ Checklist de validación (cierre del capstone)

- [ ] `demo.sh` corre las 8 features sin errores de permisos.
- [ ] Cada dominio AIF-C01 (D1–D5) tiene al menos una feature que lo evidencia.
- [ ] El logging de Bedrock y el guardrail fueron eliminados (si se crearon).
- [ ] `scripts/delete-all.sh` dejó la cuenta sin recursos del capstone.
- [ ] No quedan buckets (`frontend`, `audio`) ni Lambdas `techmoda-ai-aby-*`.

---

## 📝 Qué entra en el examen (repaso integral)

- **Elegir el servicio correcto** por modalidad (imagen/texto/voz/generación).
- **Generativa (52%)**: FMs, prompt engineering, RAG, embeddings, alucinaciones, fine-tuning vs. RAG.
- **Responsible AI**: sesgo, seguridad, privacidad, transparencia, accesibilidad, HITL, guardrails.
- **Gobernanza**: IAM mínimo privilegio, logging, costos, cumplimiento, responsabilidad compartida.

---

## 💸 Costo + 🧹 Cleanup

**Costo:** $0 tras el cleanup. Mientras el stack vive, el costo en reposo es mínimo (Lambda/DynamoDB
on-demand no cobran sin tráfico); el costo real es **por invocación** de los servicios de IA.
*Verificar el costo final en Cost Explorer filtrando por el tag `Project=techmoda-ai-aby-capstone`.*

**Cleanup:** `bash scripts/delete-all.sh` — **hacelo siempre al terminar.**
