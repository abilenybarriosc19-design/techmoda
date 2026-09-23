> ⚡ **Paso 0 — Bootstrap del entorno.** Si el stack no está desplegado (cuenta nueva,
> sandbox reciclado, o venís de un cleanup), corré `bash scripts/bootstrap.sh` (~2-3 min)
> para dejar el entorno listo. Es idempotente y seguro de correr siempre: si ya está
> desplegado termina en segundos. Detalle en `SESSION-PLAN.md`.

# S10 · IAM mínimo privilegio para IA, logging de invocación y control de costos

**Duración:** ~60 min · **Servicio:** — (gobernanza transversal) · **Dominio AIF-C01:** **D5 — Security, Compliance & Governance (14%)**
**Estado:** 🟡 Guía detallada + scaffold (snippet de gobernanza + scripts listos).

---

## 🎯 Objetivo

Cerrar el círculo de **gobernanza** sobre todo lo que construimos: revisar que cada Lambda de IA tenga
**IAM de mínimo privilegio**, habilitar **logging de invocación de modelos** (auditoría), y poner
**control de costos** (tags de atribución + alarma de billing). Es el dominio D5 puro.

---

## 🧩 Prerequisitos

- Sesiones S1–S8 desplegadas (hay permisos y costos reales que gobernar).

---

## 🧠 El concepto: seguridad, cumplimiento y gobernanza de IA

### 1. IAM de mínimo privilegio — repaso de patrones del capstone
A lo largo del proyecto aplicamos un patrón consistente. Repasalo, porque **es exactamente lo que evalúa D5**:

| Servicio | ¿ARN a nivel de recurso? | Cómo acotamos |
|----------|--------------------------|---------------|
| Rekognition (S1,S2) | ❌ No (APIs Detect) | Por **acción única** (`DetectLabels`), `Resource:"*"` |
| Comprehend (S3) | ❌ No (APIs Detect) | Por **acción** (`DetectSentiment`) |
| Translate (S4) | ❌ No | Por **acción** (`TranslateText`) |
| Polly (S5) | ❌ No | Por **acción** (`SynthesizeSpeech`) + S3 acotado al bucket |
| **Bedrock (S6,S7,S8)** | ✅ **Sí** | Por **ARN del modelo** + region wildcard `us-*` |
| DynamoDB | ✅ Sí | `DynamoDBReadPolicy`/`CrudPolicy` por **tabla** |
| S3 | ✅ Sí | Por **ARN del bucket** del stack |

> 🧠 **Regla de oro (entra en el examen):** "mínimo privilegio" = la **acción mínima** sobre el **recurso
> más específico posible**. Si el servicio no soporta recurso específico, acotás la **acción**. **Nunca**
> `servicio:*` ni `Resource:"*"` por comodidad.

> ⚠️ **`StringLike`/`ArnLike` para comodines (bug silencioso):** si usás condiciones con `*` (p. ej.
> `us-*`), usá `StringLike`/`ArnLike`, **nunca** `StringEquals`/`ArnEquals` — estos tratan el `*` como
> literal y **rechazan todo** sin error al crear la policy.

> 🔐 **Por qué este capstone no usa un rol compartido.** Una alternativa habitual —y lo que hacían las
> versiones anteriores de este repo, ver [`docs/SANDBOX-COMPAT.md`](../../docs/SANDBOX-COMPAT.md) §3— es
> asignar a todas las funciones **un mismo rol preexistente y amplio** con `Role:`. Despliega en cuentas
> que no permiten `iam:CreateRole`, pero **se pierde el mínimo privilegio**: cualquier Lambda del stack
> puede hacer todo lo que el rol permite. Si algún día te toca ese escenario, documentá igual la política
> mínima que *deberías* tener (los `Statement` de cada snippet **son** ese artefacto) como evidencia para
> D5 — y recordá que `Role` y `Policies` son excluyentes en SAM: poner los dos ignora `Policies` **en
> silencio**.

### 2. Logging de invocación (auditoría)
- **CloudTrail** registra las **llamadas a la API** (quién invocó qué, cuándo) — gobernanza/seguridad.
- **Bedrock model invocation logging** registra **el contenido** de cada invocación (prompt, respuesta,
  tokens) a CloudWatch/S3 — útil para auditoría de calidad, costos y detección de abuso.
- Nuestras Lambdas además loguean `usage` (tokens) en CloudWatch.

### 3. Control de costos (FinOps)
- **Cost allocation tags** (`Project`, `Module`) en todos los recursos → atribución en Cost Explorer.
- **Alarma de billing** / **AWS Budgets** → alerta proactiva **desde el día 0** (no esperar la factura).
- **Elección de modelo** como palanca de costo: Haiku ≪ Sonnet ≪ Opus; embeddings ≪ generación.

---

## 🚶 Paso a paso (scaffold)

1. **Auditar IAM:** revisá cada `template-snippet.yaml` y confirmá que ninguna policy usa `*` de servicio.
   ```bash
   grep -rn "Resource: \"\\*\"" sessions/*/template-snippet.yaml   # solo APIs Detect deben aparecer
   grep -rn "bedrock:\\*\\|rekognition:\\*\\|comprehend:\\*" sessions/   # NO debe haber hits
   ```
2. **Tags + alarma:** pegá `template-snippet-governance.yaml` y agregá los `Tags` a `Globals.Function`. `sam deploy`.
3. **Logging de Bedrock:**
   ```bash
   bash sessions/S10-iam-logging-costos/enable-bedrock-logging.sh
   aws bedrock get-model-invocation-logging-configuration --region us-east-1
   ```
4. **Ver costos atribuidos:** activá los cost allocation tags en Billing → Cost Allocation Tags y revisá
   Cost Explorer filtrando por `Project=techmoda-ai-aby-capstone`.

---

## ✅ Checklist de validación

- [ ] Ningún snippet usa `servicio:*` ni `Resource:"*"` salvo APIs Detect que no admiten ARN (justificado).
- [ ] Las funciones tienen los tags `Project`/`Module`.
- [ ] `get-model-invocation-logging-configuration` muestra el logging habilitado.
- [ ] Existe una alarma de billing (o un AWS Budget) con umbral.
- [ ] Verificaste el rol que SAM le generó a una función: `aws lambda get-function-configuration --function-name techmoda-ai-aby-EnrichLabels --query Role --output text` y después `aws iam list-role-policies --role-name <ese-rol>`.

---

## 📝 Qué entra en el examen (D5)

- **IAM de mínimo privilegio** para servicios de IA; acotar acción y recurso.
- **Modelo de responsabilidad compartida** aplicado a IA (datos/permisos = tuyos).
- **CloudTrail vs. Bedrock invocation logging** (auditoría de API vs. de contenido).
- **Gobernanza de datos**: dónde viven los datos, cifrado, retención, residencia.
- **FinOps de IA**: costo por token/imagen/carácter, tags de atribución, budgets/alarmas, elección de modelo.
- **Cumplimiento**: AUP de AWS, privacidad (LFPDPPP/GDPR), AI Service Cards.

---

## 💸 Costo + 🧹 Cleanup

**Costo:** logging y alarmas tienen costo mínimo (almacenamiento de logs, métricas). La retención de 30 días
en el log group evita acumulación. *Verificar precios de CloudWatch Logs/Alarms.*

**Cleanup de S10:**
```bash
aws bedrock delete-model-invocation-logging-configuration --region us-east-1
```
Y quitá los recursos de gobernanza del `template.yaml` si revertís (o dejalos hasta S11).
