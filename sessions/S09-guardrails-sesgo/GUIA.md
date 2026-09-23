> 🔑 **Requisito externo — Bedrock Model access.** El rol de esta Lambda ya trae
> `bedrock:InvokeModel` acotado por ARN de modelo, pero el permiso IAM **no alcanza**: hay que
> habilitar el modelo en la consola (**Bedrock → Model access**), en **la región del deploy**
> — es un setting por región. Si la llamada devuelve `AccessDeniedException`, ese es el primer
> sospechoso, no las políticas IAM. Detalle en [`docs/IAM.md`](../../docs/IAM.md).

# S9 · Guardrails, sesgo y privacidad en las features de IA (Bedrock Guardrails)

**Duración:** ~60 min · **Servicio:** Amazon Bedrock Guardrails · **Dominio AIF-C01:** **D4 — Responsible AI (14%)**
**Estado:** 🟡 Guía detallada + scaffold (config + script listos; el cableado a converse lo completás en la sesión).

> 🔌 **Cómo se expone:** el guardrail protege la función del asistente de S8, que tiene su propia
> **Lambda Function URL** (no API Gateway) y su **rol de mínimo privilegio creado por SAM** — ver
> [`docs/IAM.md`](../../docs/IAM.md). El bloque IAM de abajo es el permiso mínimo que hay que agregarle
> a ese rol (`bedrock:ApplyGuardrail`) para esta sesión. Probás contra el output
> **`ShoppingAssistantUrl`** del stack.

---

## 🎯 Objetivo

Poner **barandas de seguridad** sobre las features generativas de TechModa (S6, S8). Un guardrail evita que
el asistente: responda temas fuera de dominio, filtre o exponga **PII**, produzca **contenido dañino**, o
caiga en **inyección de prompts**. También abrimos la conversación sobre **sesgo** y **privacidad**.

---

## 🧩 Prerequisitos

- **S6 y S8 desplegadas** (las features generativas a proteger).
- Permiso para crear guardrails (`bedrock:CreateGuardrail`) desde el IDE — se corre **una vez**, no desde las Lambdas.

---

## 🧠 El concepto: defensa en capas para GenAI

La mitigación de riesgos en IA generativa es **en capas**, no un único botón:

| Capa | Dónde | Qué hace | Sesión |
|------|-------|----------|--------|
| **Prompt** | system prompt | Reglas ("no inventes", rol, idioma) | S6, S8 |
| **Grounding (RAG)** | contexto recuperado | Ancla la respuesta a datos reales | S7, S8 |
| **Guardrails** | Bedrock Guardrail | Filtra entrada/salida: PII, contenido dañino, temas, inyección | **S9** |
| **Gobernanza** | IAM + logging + revisión humana | Control de acceso, auditoría, HITL | S2, S10 |

### Qué cubre el Guardrail de TechModa (`guardrail-config.json`)
- **Content filters:** HATE, INSULTS, SEXUAL, VIOLENCE, MISCONDUCT, **PROMPT_ATTACK** (inyección de prompts).
- **PII:** anonimiza EMAIL/PHONE/NAME, **bloquea** números de tarjeta → privacidad (LFPDPPP/GDPR-friendly).
- **Denied topics:** asesoría financiera/médica → el asistente se mantiene en su dominio (moda).

### Sesgo (bias) — discusión obligatoria de la sesión
Los FMs pueden reflejar **sesgos** de sus datos de entrenamiento (p. ej. asociar ciertas prendas a un
género). Mitigaciones que el examen espera que conozcas:
- **Datos y prompts inclusivos** (no asumir género del cliente).
- **Evaluación de equidad** sobre las salidas (revisar muestras).
- **Human-in-the-loop** para decisiones sensibles.
- **Transparencia:** avisar al usuario que habla con una IA (tarjetas de modelo / AWS AI Service Cards).

### Privacidad
- No mandar PII de clientes al modelo si no es necesario; **Comprehend `DetectPiiEntities`** (S3) o el
  filtro PII del guardrail pueden **detectar y anonimizar** antes de procesar.
- Entender qué datos se usan para entrenar: los modelos de Bedrock **no** usan tus prompts para reentrenar
  (verificar la documentación/AUP vigente de AWS).

---

## 🚶 Paso a paso (scaffold → completar)

### 1. Crear el guardrail
```bash
bash sessions/S09-guardrails-sesgo/create-guardrail.sh
# Anotá el guardrailId que devuelve y publicá una versión:
aws bedrock create-guardrail-version --guardrail-identifier <guardrailId> --region us-east-1
```

### 2. Cablear el guardrail a las llamadas generativas (lo completás vos)
En las Lambdas de **S6** y **S8**, agregá el `guardrailConfig` a la llamada `converse`:
```python
# Leer el ID de env:
GUARDRAIL_ID = os.environ.get("BEDROCK_GUARDRAIL_ID")
GUARDRAIL_VER = os.environ.get("BEDROCK_GUARDRAIL_VERSION", "DRAFT")

kwargs = {"modelId": MODEL_ID, "messages": messages,
          "inferenceConfig": {"maxTokens": MAX_TOKENS, "temperature": 0.5}}
if GUARDRAIL_ID:
    kwargs["guardrailConfig"] = {
        "guardrailIdentifier": GUARDRAIL_ID,
        "guardrailVersion": GUARDRAIL_VER,
    }
resp = bedrock.converse(**kwargs)
```
Y en el `template.yaml`, agregá a esas funciones:
- env var `BEDROCK_GUARDRAIL_ID` (+ `BEDROCK_GUARDRAIL_VERSION`),
- permiso `bedrock:ApplyGuardrail` acotado al ARN del guardrail:
```yaml
- Statement:
    - Effect: Allow
      Action: [ bedrock:ApplyGuardrail ]
      Resource: !Sub arn:${AWS::Partition}:bedrock:us-east-1:${AWS::AccountId}:guardrail/*
```

### 3. Probar que filtra
```bash
# Function URL del asistente (output ShoppingAssistantUrl de S8):
URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ShoppingAssistantUrl'].OutputValue" --output text)
# Intento fuera de dominio / con PII → el guardrail debe intervenir:
curl -s -X POST "${URL%/}/assistant" -H "Content-Type: application/json" \
  -d '{"message":"Mi tarjeta es 4111 1111 1111 1111, además ¿en qué cripto invierto?"}' \
  | python3 -m json.tool
```
Esperado: el número de tarjeta bloqueado/anonimizado y el tema financiero rechazado con el mensaje configurado.

---

## ✅ Checklist de validación

- [ ] El guardrail se creó y tiene una versión publicada.
- [ ] Las Lambdas S6/S8 pasan `guardrailConfig` y tienen `bedrock:ApplyGuardrail`.
- [ ] Una entrada con PII (tarjeta) es bloqueada/anonimizada.
- [ ] Una pregunta de tema prohibido recibe el mensaje de rechazo, no una respuesta inventada.
- [ ] Documentaste una mitigación de **sesgo** aplicada a los prompts de TechModa.

---

## 📝 Qué entra en el examen (D4)

- **Amazon Bedrock Guardrails**: filtros de contenido, PII, denied topics, protección contra inyección.
- Dimensiones de **Responsible AI**: equidad/sesgo, seguridad, privacidad, transparencia, explicabilidad, robustez.
- **AWS AI Service Cards** / model cards (transparencia).
- **Defensa en capas** (prompt + RAG + guardrails + gobernanza).
- **Privacidad de datos**: detección/anonimización de PII; uso de datos para entrenamiento.

---

## 💸 Costo + 🧹 Cleanup

**Costo:** los guardrails de Bedrock se cobran **por uso/contenido evaluado** (además del costo del modelo).
Práctica = **centavos**. *Verificar en la página de precios de Amazon Bedrock (Guardrails).*

**Cleanup de S9:**
```bash
aws bedrock delete-guardrail --guardrail-identifier <guardrailId> --region us-east-1
```
Y quitá `guardrailConfig`/permisos de S6/S8 si revertís.
