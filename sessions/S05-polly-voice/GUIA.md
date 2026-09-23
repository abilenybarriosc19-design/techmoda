> ⚡ **Paso 0 — Bootstrap del entorno.** Si el stack no está desplegado (cuenta nueva,
> sandbox reciclado, o venís de un cleanup), corré `bash scripts/bootstrap.sh` (~2-3 min)
> para dejar el entorno listo. Es idempotente y seguro de correr siempre: si ya está
> desplegado termina en segundos. Detalle en `SESSION-PLAN.md`.

# S5 · Descripción por voz / accesibilidad (Amazon Polly)

**Duración:** ~60 min · **Servicio:** Amazon Polly · **Dominio AIF-C01:** **D1 (capacidad) + D4 (accesibilidad)**

> 🔌 **Cómo se expone:** esta función tiene su propia **Lambda Function URL** (no API Gateway) y un
> **rol de mínimo privilegio que SAM le crea** a partir de sus `Policies:` — ver
> [`docs/IAM.md`](../../docs/IAM.md). Su URL es el output **`SynthesizeVoiceUrl`** del stack.

---

## 🎯 Objetivo

Que cada producto se pueda **escuchar**: convertimos la descripción en un audio MP3 con una voz neuronal
natural. Esto ayuda a personas con discapacidad visual y a quienes prefieren audio — accesibilidad real,
no decorativa. El audio se guarda en S3 y se entrega por **URL prefirmada**.

---

## 🧩 Prerequisitos

- **S0 desplegado.** Si querés audio en inglés, hacé primero **S4** (traducción) sobre ese producto.

---

## 🧠 El concepto: texto a voz (TTS) neuronal

Amazon Polly convierte texto en voz. Las **voces neuronales** (`Engine="neural"`) suenan mucho más
naturales que las estándar. Elegimos la voz por idioma (`Lupe` para ES, `Joanna` para EN).

Conceptos que el examen evalúa:

- **TTS vs. STT.** Polly = texto→voz (synthesis). Transcribe = voz→texto. No confundirlos.
- **Capacidad real:** Polly **no entiende** el texto, lo **pronuncia**. La "inteligencia" está en la
  naturalidad de la voz, no en comprensión semántica.
- **Accesibilidad como IA responsable (D4):** generar audio/alt-text amplía el acceso → dimensión de
  inclusión de Responsible AI.
- **SSML** (lenguaje de marcado para voz) permite controlar pausas, énfasis, pronunciación — mejora opcional.

### Decisión de diseño: URL prefirmada en vez de bucket público
El bucket de audio está **completamente privado**. La Lambda sube el MP3 y genera una **URL prefirmada
válida 1 hora**. Es el patrón seguro: el contenido no queda expuesto permanentemente. Además hay una regla
de ciclo de vida que **borra el audio a los 7 días** (FinOps).

---

## 🚶 Paso a paso

1. Pegá `AudioBucket` + `SynthesizeVoiceFunction` (trae sus `Policies:` — incluido el `S3CrudPolicy` sobre el bucket nuevo — + su `FunctionUrlConfig`) + el output `SynthesizeVoiceUrl` desde el snippet.
2. `sam build && sam deploy`.
3. Generá audio en español (Function URL de esta función; el productId va en path o body):
```bash
URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='SynthesizeVoiceUrl'].OutputValue" --output text)
curl -s -X POST "${URL%/}/products/PRODUCT_ID/voice" \
  -H "Content-Type: application/json" -d '{"lang":"es"}' | python3 -m json.tool
```
Respuesta:
```json
{
  "productId": "a1b2...",
  "lang": "es",
  "voice": "Lupe",
  "audioUrl": "https://techmoda-ai-aby-audio.s3.amazonaws.com/audio/a1b2-es.mp3?X-Amz-...",
  "expiresIn": 3600
}
```
4. Abrí el `audioUrl` en el navegador → debería **reproducir** la descripción.

---

## 🔐 Mínimo privilegio

`polly:SynthesizeSpeech` (Resource `*`), `S3CrudPolicy` **acotado al bucket de audio del stack**, y CRUD de
la tabla. El bucket bloquea todo acceso público; el acceso es por URL firmada temporal.

---

## ✅ Checklist de validación

- [ ] El `audioUrl` reproduce la descripción con voz natural.
- [ ] El bucket `techmoda-ai-aby-audio` existe y **no** es público.
- [ ] El objeto `audio/PRODUCT_ID-es.mp3` está en el bucket.
- [ ] (Si hiciste S4) `{"lang":"en"}` usa la traducción y la voz Joanna.

---

## 📝 Qué entra en el examen

- **Polly = TTS**, **Transcribe = STT** (no confundir).
- Voces **neuronales vs. estándar**; **SSML** para control fino.
- **Accesibilidad** como dimensión de Responsible AI (D4).
- Patrón de **entrega segura de artefactos** generados por IA (URL prefirmada, bucket privado) → toca D5.

---

## 💸 Costo + 🧹 Cleanup

**Costo:** Polly se cobra **por carácter sintetizado** (las voces neuronales cuestan más que las estándar),
con **capa gratuita** los primeros meses (verificar vigencia). Generar audios de práctica son **centavos**.
*Verificar en la página de precios de Amazon Polly.*

**Cleanup de S5:**
```bash
aws s3 rm s3://techmoda-ai-aby-audio --recursive   # vaciar antes de borrar
```
Luego quitar `AudioBucket` + `SynthesizeVoiceFunction` + ruta del `template.yaml` y `sam deploy`.
La regla de ciclo de vida ya expira el audio a los 7 días aunque te olvides.
