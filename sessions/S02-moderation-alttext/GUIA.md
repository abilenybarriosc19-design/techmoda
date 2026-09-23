> ⚡ **Paso 0 — Bootstrap del entorno.** Si el stack no está desplegado (cuenta nueva,
> sandbox reciclado, o venís de un cleanup), corré `bash scripts/bootstrap.sh` (~2-3 min)
> para dejar el entorno listo. Es idempotente y seguro de correr siempre: si ya está
> desplegado termina en segundos. Detalle en `SESSION-PLAN.md`.

# S2 · Moderación de imágenes + alt-text accesible (Rekognition DetectModerationLabels)

**Duración:** ~60 min · **Servicio:** Amazon Rekognition · **Dominio AIF-C01:** **D4 — Responsible AI (14%)**

> 🔌 **Cómo se expone:** esta función tiene su propia **Lambda Function URL** (no API Gateway) y un
> **rol de mínimo privilegio que SAM le crea** a partir de sus `Policies:` — ver
> [`docs/IAM.md`](../../docs/IAM.md). Su URL es el output **`ModerateImageUrl`** del stack.

---

## 🎯 Objetivo

Dos responsabilidades de **IA responsable** en una sola sesión:

1. **Moderación:** antes de publicar una foto en el catálogo, comprobar automáticamente que **no contiene
   contenido inapropiado** (`APPROVED` / `FLAGGED`). Una tienda no quiere publicar imágenes ofensivas por error.
2. **Accesibilidad:** generar un **texto alternativo (alt-text)** descriptivo para cada imagen, de modo que
   personas que usan lectores de pantalla entiendan qué muestra la foto.

Ambas son parte de **"Guidelines for Responsible AI"**: seguridad del contenido e inclusión.

---

## 🧩 Prerequisitos

- **S1 completada** (ya entendés el patrón Rekognition + cómo apuntar `imageUrl`).
- Un producto con imagen real (la misma de S1 sirve).

---

## 🧠 El concepto: IA responsable aplicada

### Moderación de contenido
`DetectModerationLabels` es un modelo preentrenado que clasifica imágenes en categorías sensibles
(violencia, contenido sugestivo, sustancias, etc.) con su jerarquía padre/hijo y un nivel de confianza.
Nosotros definimos una **política**: si aparece **cualquier** etiqueta de moderación por encima del umbral,
marcamos el producto como `FLAGGED` y **no lo publicamos automáticamente** → pasa a revisión humana.

> 🧠 **Human-in-the-loop:** la IA no decide sola; **filtra y eleva a una persona** los casos dudosos. El
> examen valora este patrón como buena práctica de IA responsable.

### Texto alternativo (accesibilidad)
Reutilizamos `DetectLabels` para construir una frase descriptiva (`altText`) a partir de lo que se ve en
la foto. Es un ejemplo de **IA que reduce barreras**: WCAG (pautas de accesibilidad) exige alt-text en
imágenes, y aquí lo automatizamos.

### Trade-off importante (entra en el examen)
- **Falsos positivos** (marcar como inapropiada una foto inocente) molestan al negocio.
- **Falsos negativos** (dejar pasar contenido real inapropiado) son peores reputacionalmente.
- Por eso el umbral de moderación (`MinConfidence=60`) es **más bajo** que el de etiquetado (80): preferimos
  pecar de cautelosos y mandar a revisión humana. Ajustar este umbral es una **decisión de gobernanza**, no técnica.

---

## 🚶 Paso a paso

1. Pegá `ModerateImageFunction` (trae sus `Policies:` + su `FunctionUrlConfig`) y el output `ModerateImageUrl` desde `template-snippet.yaml`.
2. `sam build && sam deploy`.
3. Ejecutá (usá la Function URL de esta función; el productId va en el path o en el body):
```bash
URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ModerateImageUrl'].OutputValue" --output text)
curl -s -X POST "${URL%/}/products/PRODUCT_ID/moderate" | python3 -m json.tool
```
Respuesta esperada para una foto de moda normal:
```json
{
  "productId": "a1b2...",
  "moderationStatus": "APPROVED",
  "moderationFlags": [],
  "altText": "Imagen de producto que muestra: Clothing, Dress, Person, Floral Design, Sleeve."
}
```
4. Verificá en DynamoDB que el producto tiene `moderationStatus` y `altText`.

---

## 🔐 Mínimo privilegio

Dos acciones de Rekognition (`DetectModerationLabels`, `DetectLabels`), CRUD solo sobre la tabla de
productos, y `s3:GetObject` acotado al bucket de assets. **Nada de `rekognition:*`.**

---

## ✅ Checklist de validación

- [ ] La respuesta trae `moderationStatus` (`APPROVED` o `FLAGGED`).
- [ ] El producto en DynamoDB tiene `altText` legible y descriptivo.
- [ ] (Opcional) Probá con una imagen que dispare moderación y verificá que pasa a `FLAGGED`.
- [ ] El frontend podría usar `altText` en el atributo `alt=""` de la imagen (idea de mejora).

---

## 📝 Qué entra en el examen (D4)

- **Responsible AI** dimensiones: seguridad/contenido dañino, **inclusión y accesibilidad**, transparencia, equidad.
- **Moderación de contenido** como caso de uso de Rekognition.
- **Human-in-the-loop** para decisiones sensibles; la IA filtra, la persona decide.
- Que un mismo servicio (Rekognition) sirve a **D1** (etiquetar, S1) y a **D4** (moderar, accesibilidad, S2): el dominio lo da **el uso**, no el servicio.
- Idea de **umbral como control de riesgo** (precision/recall en lenguaje del examen).

---

## 💸 Costo + 🧹 Cleanup

**Costo:** `DetectModerationLabels` y `DetectLabels` se cobran **por imagen** (esta sesión hace 2 llamadas
por producto). Centavos en práctica. *Verificar en la página de precios de Rekognition.*

**Cleanup de S2:** quitar `ModerateImageFunction` + su ruta del `template.yaml` y `sam deploy`. Sin recursos
persistentes adicionales.
