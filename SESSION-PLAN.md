# Plan de sesiones y continuidad — TechModa AI Capstone (AIF-C01)

Cómo se imparte el capstone día por día, y **cómo se resuelve que el entorno puede no ser
persistente** (un sandbox que se recicla, o un cleanup entre sesiones).

## El problema de continuidad (y su solución)

Si trabajás en un entorno efímero, entre un día y otro el stack `techmoda-ai-aby`, los
productos sembrados y todos los enriquecimientos (labels, sentimiento, audio)
**desaparecen**. Por eso una sesión NO puede asumir el estado de la anterior.

**Solución — bootstrap idempotente (paso 0 de cada sesión):**

```bash
bash scripts/bootstrap.sh
```

Eso reconstruye TODO el entorno base en **~2-3 min**:
1. `sam build && sam deploy` de `template.sandbox.yaml` (base + S1/S2/S3/S5, **sin
   CloudFront** para que levante rápido).
2. Re-siembra los 4 productos (`ai/seed/seed-products.sh`).
3. Imprime las Function URLs listas para usar.

Es **seguro de correr siempre**: si el stack ya está desplegado, `sam deploy` no detecta
cambios y termina en segundos.

Como **todo está en código** (template + seed + git), el entorno efímero deja de ser un
problema — y es, de hecho, la lección cloud-native correcta: *cattle, not pets*. El
estudiante conserva su código (en git); los datos se re-siembran. Las sesiones son
independientes entre sí (cada una agrega una capacidad sobre los productos base), así que
el bootstrap basta — no hay que re-correr enriquecimientos previos.

## División por día (jornada 2 h · L–J · 5–7 p.m. hora Colombia)

Las 12 sesiones son **hands-on del estudiante**: con roles de mínimo privilegio creados por
SAM, ninguna queda bloqueada por permisos (ver `sessions/README.md`).

| Día | Sesiones | Paso 0 | Requisito extra |
|----|----------|--------|-----------------|
| **D1** | S00 base · S01 Rekognition labels | `bash scripts/bootstrap.sh` | — |
| **D2** | S02 moderación · S03 Comprehend | `bash scripts/bootstrap.sh` | — |
| **D3** | S05 Polly · S04 Translate | `bash scripts/bootstrap.sh` | — |
| **D4** | S06 Bedrock descripciones · S10 gobernanza | `bash scripts/bootstrap.sh` | **Bedrock Model access** |
| **D5** | S07 RAG/embeddings · S08 chatbot | `bash scripts/bootstrap.sh` | **Bedrock Model access** |
| **D6** | S09 guardrails · S11 integración + demo + cleanup | `bash scripts/bootstrap.sh` | **Bedrock Model access** |

- **Bedrock Model access** (D4–D6): habilitalo **una vez** en la consola
  (Bedrock → Model access), en la región del deploy — es un setting **por región**. Los
  modelos que usa el capstone: Anthropic **Claude Haiku 4.5** y Amazon **Titan Embeddings v2**.
  Hacelo antes de D4, no en el momento: la habilitación puede tardar.
- **S07 → S08**: el índice de embeddings que arma S07 vive en DynamoDB. Si el entorno se
  recicló entre D5 y D6, re-corré el endpoint de indexado de S07 antes de S08 (está en la
  `GUIA.md` de S07) — el `bootstrap.sh` re-siembra los productos, pero no los embeddings.

## Día típico (2 h)

1. **Paso 0 — Bootstrap (~3 min):** `bash scripts/bootstrap.sh`. Deja el entorno
   como debe estar (aunque ayer se haya reciclado).
2. **Sesión 1 (~50 min):** seguir la `GUIA.md` de la sesión — concepto + agregar/probar
   la feature por su Function URL.
3. **Sesión 2 (~50 min):** la siguiente `GUIA.md`.
4. **Cierre:** el código en git; los datos se restituyen mañana con `bootstrap.sh`.

## Verificación rápida del entorno

```bash
bash scripts/validate-all.sh        # PASS/FAIL de todo: estático + CRUD + features de IA
```

O a mano, sólo el catálogo:

```bash
API=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 \
       --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
curl -s "${API%/}/products" | python3 -m json.tool   # debe listar los 4 productos
```
