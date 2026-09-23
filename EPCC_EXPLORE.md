# Exploración: ¿puede un estudiante seguir el capstone hoy?

**Fecha**: 2026-08-18 · **Alcance**: Deep · **Estado**: ✅ Completa
**Rama**: `feat/migrate-region-us-east-1` · **HEAD**: `401872c` · **Working tree**: sucio (30 modificados + 3 sin trackear)

> Reemplaza la exploración del 2026-08-17 (que mapeaba el codebase completo en `master`). Aquella
> sigue siendo válida como mapa de arquitectura; ésta responde una pregunta distinta: **¿los pasos
> documentados funcionan tal como están escritos?**

---

## 1. Lo último que hicimos (y por qué importa)

El repo tiene **dos capas de cambio**, y sólo una está commiteada:

| Capa | Estado | Qué hizo |
|---|---|---|
| Migración de región | ✅ commiteada (`23fe2f5`, `401872c`) | `us-west-2` → `us-east-1` en 50 archivos |
| **Refactor de IAM + contrato de datos** | ⚠️ **sin commitear** (30 archivos + 3 nuevos) | LabRole → `Policies:` por función, snake_case → camelCase, devcontainer, `docs/IAM.md`, `scripts/validate-all.sh` |

La capa sin commitear es un cambio de **premisa del proyecto**, no un ajuste:

1. **IAM invertido.** Antes: `Role: !Ref LabRoleArn` sin `Policies:` (rol preexistente, amplio, del
   sandbox Vocareum). Ahora: cada Lambda declara `Policies:` acotadas y **SAM le crea su rol**.
   Consecuencia dura: **el proyecto ya no despliega en el sandbox re/Start**, porque el `LabRole`
   deniega `iam:CreateRole`. Requiere una cuenta con ese permiso.
2. **Desaparece la Pista B.** Con roles propios, S04 (Translate) y S06–S09 (Bedrock) dejan de estar
   bloqueados por IAM. El único requisito externo que queda es habilitar **Bedrock → Model access**
   en la consola de la región del deploy.
3. **Contrato de datos alineado.** `types.ts` pasó a camelCase (`productId`, `imageUrl`, `createdAt`),
   se borró el tipo `Database` residuo de Supabase, se agregaron los campos `ai*` de las sesiones, y
   `stock` ahora **se persiste** (`create-item/index.js:48`, `update-item/index.js:92-97`). Los 117
   tests del frontend pasan (antes 36 fallaban).
4. **Nueva herramienta de validación.** `scripts/validate-all.sh` (~200 líneas) corre 25 checks
   estáticos + pruebas E2E contra el stack, con salida PASS/FAIL pensada para el estudiante.

`docs/IAM.md` (nuevo, 156 líneas) es ahora la guía permanente de IAM y reemplaza a
`docs/SANDBOX-COMPAT.md` como autoridad — pero **nadie se lo dijo a los otros 39 archivos**.

---

## 2. Verificación ejecutada (qué probé de verdad)

**Toolchain**: SAM 1.165.0 · aws-cli 2.36.24 · node 22.23.2 · npm 10.9.8 · python 3.12.14 — todo
coincide con los `Runtime` declarados.

| Gate | Resultado |
|---|---|
| `bash scripts/validate-all.sh --static` | ✅ **25 OK / 0 fallos** |
| `sam validate --lint` ×3 templates | ✅ |
| Splice de los 8 `template-snippet.yaml` en `template.yaml` + lint | ✅ (reproduce el paso del estudiante) |
| `sam build -t template.sandbox.yaml` | ✅ Build Succeeded (5 funciones) |
| `sam build -t template.full.yaml` | ✅ Build Succeeded |
| `npm run lint` / `typecheck` / `vitest run` | ✅ · ✅ · ✅ **117 tests** |
| `bash -n` en 18 scripts, `py_compile` en 9 Lambdas, `node --check` en 6 handlers | ✅ |
| Todo script `scripts/*.sh` referenciado en docs existe en disco | ✅ 14/14 |

**Lo que NO pude verificar**: nada contra AWS. No hay credenciales en este entorno
(`aws sts get-caller-identity` → `Partial credentials found in env, missing: AWS_SECRET_ACCESS_KEY`).
Las secciones 7–10 de `validate-all.sh` (CRUD E2E + las 9 features de IA) quedan sin correr, y con
ellas la afirmación central del refactor: que los roles generados por SAM alcanzan en runtime.

**Conclusión incómoda**: *los gates verdes no significan que el estudiante pueda seguir el proyecto.*
Todos los checks son sintácticos o de coherencia entre archivos que el refactor sí tocó. Lo que está
roto está en la **prosa** — y la prosa no tiene linter.

---

## 3. Hallazgos — el estudiante se choca con esto

### 🔴 P0-1 · Los `GUIA.md` mandan a pegar algo que ya no existe

Ocho sesiones dicen textualmente que el snippet trae `Role: !Ref LabRoleArn`:

| Archivo | Línea | Texto |
|---|---|---|
| `sessions/S01-rekognition-labels/GUIA.md` | 66 | "Copiá el recurso `EnrichLabelsFunction` … (incluye `Role: !Ref LabRoleArn` y su `FunctionUrlConfig`)" |
| `sessions/S02-moderation-alttext/GUIA.md` | 62 | "Pegá `ModerateImageFunction` (con `Role: !Ref LabRoleArn` …)" |
| `sessions/S03-comprehend-sentiment/GUIA.md` | 55 | idem |
| `sessions/S04-translate-multilang/GUIA.md` | 50 | idem |
| `sessions/S05-polly-voice/GUIA.md` | 53 | idem |
| `sessions/S06-bedrock-descripciones/GUIA.md` | 65 | idem |
| `sessions/S07-bedrock-rag-busqueda/GUIA.md` | 66 | "cada una con `Role: !Ref LabRoleArn`" |
| `sessions/S08-bedrock-chatbot/GUIA.md` | 63 | idem |

Los snippets ahora traen `Policies:`. El estudiante abre el archivo, busca la línea que la guía le
promete, no la encuentra, y no tiene forma de saber si le falta un paso o si la guía miente.
`sessions/S00-base/GUIA.md:73-76` va más lejos: explica **por qué** hay que usar `Role:` y **no**
`Policies:` — exactamente al revés de lo que hace el template que el estudiante acaba de desplegar.

### 🔴 P0-2 · El prerequisito cambió y nadie lo dice

`sessions/S00-base/GUIA.md:25-26` pide "Cuenta sandbox **AWS re/Start (vocareum)** activa" y
"autenticado como `LabRole`". Con `Policies:` en cada función, ese deploy **falla**: el LabRole
deniega `iam:CreateRole`. El estudiante que siga la guía al pie de la letra ve un `CREATE_FAILED`
con rollback del stack entero y ningún documento que explique la causa.

`docs/IAM.md:149-155` sí registra el cambio ("Nota histórica"), pero es el único lugar. Ninguna guía
de sesión, ni el `README`, ni el `QUICKSTART` mencionan el nuevo requisito.

### 🔴 P0-3 · Dos model IDs de Bedrock, los dos rotos

Las Lambdas de S06–S08 usan **boto3 `bedrock-runtime`** (`converse()` en S06/S08,
`invoke_model()` en S07/S08) — la integración legacy de Bedrock, que exige IDs versionados.

| Dónde | Valor actual | Problema |
|---|---|---|
| `template.full.yaml:239,327` | `anthropic.claude-haiku-4-5` | **No es un ID de Bedrock.** Es el *alias de la Claude API* con un prefijo `anthropic.` pegado. `bedrock-runtime` lo rechaza. |
| `sessions/S06-*/template-snippet.yaml:31`, `sessions/S08-*/template-snippet.yaml:33` | `anthropic.claude-3-haiku-20240307-v1:0` | Claude 3 Haiku **se retiró el 2026-04-19** — hace 4 meses. |
| `sessions/S06-*/functions/generate-description/app.py:27`, `sessions/S08-*/functions/shopping-assistant/app.py:29` | `anthropic.claude-3-haiku-20240307-v1:0` | idem (es el default si no hay env var) |

Verificado contra la documentación oficial: el ID de Bedrock de **Claude Haiku 4.5** es
`anthropic.claude-haiku-4-5-20251001-v1:0` (perfil de inferencia cross-region:
`us.anthropic.claude-haiku-4-5-20251001-v1:0`). Opus 5 / Sonnet 5 / Fable 5 **no** sirven acá: en
Bedrock se sirven por el endpoint Messages-API (Mantle), no por `bedrock-runtime`.

El refactor tocó `template.full.yaml` y se olvidó de los snippets y de los defaults del código, así
que además quedaron **desincronizados entre sí**.

### 🟠 P1-4 · `docs/SANDBOX-COMPAT.md` sigue siendo la autoridad citada

198 líneas que afirman lo contrario de `docs/IAM.md`, empezando por el TL;DR:
*"Cada `AWS::Serverless::Function` referencia el **LabRole** preexistente vía `Role:`. **Se elimina
`Policies:`**"*. Está enlazado desde **40 archivos** (incluidos 11 `GUIA.md`, `README.md`,
`QUICKSTART.md`, 4 `template-snippet.yaml` y `scripts/deploy.sh`). Es el documento al que el
estudiante va cuando la guía le dice "el porqué del diseño está acá".

### 🟠 P1-5 · La estructura de dos pistas quedó huérfana

`CLAUDE.md` declara "Las 12 sesiones corren todas — ya no hay una Pista B". Pero:

- `sessions/README.md` dedica su encabezado, su tabla de 12 filas y dos secciones enteras a explicar
  por qué la Pista B no corre (9 menciones).
- 5 `GUIA.md` (S04, S06, S07, S08, S09) abren con **"> NO corre en el sandbox AWS re/Start"** en la
  línea 2 — lo primero que lee el estudiante.
- `SESSION-PLAN.md` (6 menciones) y `scripts/bootstrap.sh` (2, una impresa en pantalla) organizan el
  plan por pistas.

### 🟠 P1-6 · Mensajes y configs que mienten en tiempo de ejecución

- `scripts/deploy-all.sh:22` **imprime** "(Function URLs + LabRole, sin API Gateway…)" durante el
  deploy del estudiante.
- `samconfig.us-east-1.example:13-20` dice "NO se necesita crear roles nuevos porque las funciones
  reusan el LabRole" y ofrece `parameter_overrides = "LabRoleArn=…"` — un parámetro que **ya no
  existe en ningún template**. Si el estudiante lo descomenta, `sam deploy` falla.
- `sessions/S10-*/enable-bedrock-logging.sh:13` tiene un **default funcional**
  `ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/LabRole"` — falla en cualquier cuenta sin LabRole.
- `scripts/deploy.sh:6` y `scripts/README.md:79` describen el modelo IAM viejo.

### 🟠 P1-7 · `CLAUDE.md` se contradice a sí mismo

§Arquitectura (líneas 50-56): "cada Lambda declara sus `Policies:` y SAM le crea su rol".
§Despliegue (línea 105): "`CAPABILITY_IAM` se mantiene por compatibilidad del changeset **aunque no
se creen roles** (las funciones reusan el `LabRole`)" — falso en ambas mitades: ahora **sí** se crean
roles, y `CAPABILITY_IAM` es **obligatoria** por eso. Línea 108 sigue recomendando
`--parameter-overrides LabRoleArn=…`; línea 80 dice que hay que autenticarse "como `LabRole`".

### 🟡 P2-8 · `validate-all.sh` no puede detectar nada de lo anterior

Su check de coherencia (§6) sólo mira `template*.yaml` y `sessions/*/template-snippet*.yaml`:

```bash
RESTO="$(grep -rIl 'LabRoleArn' template*.yaml sessions/*/template-snippet*.yaml 2>/dev/null)"
```

Da verde con ~130 menciones de `LabRole` vivas en 39 archivos de documentación. Es el hueco que
permitió que este pase quedara a medias: **el linter valida lo que el refactor tocó, no lo que el
refactor invalidó.**

### 🟢 Sin problemas (verificado, no asumido)

- Los 14 scripts que los docs mandan a correr **existen** (incluidos `build.sh` y `delete.sh`, que
  sospeché ausentes por no estar en `CLAUDE.md`).
- Los 8 snippets se pegan en `template.yaml` y validan — el flujo progresivo funciona.
- `requirements.txt` de las 9 Lambdas: sólo `boto3`, sin dependencias nativas → `sam build` limpio.
- El paquete de `functions/` sin `package.json` es correcto: el SDK v3 de AWS viene en el runtime
  `nodejs22.x`. (`sam build` avisa "package.json file not found"; es esperado, no un fallo.)

---

## 4. Volumen del arreglo

| Categoría | Archivos | Menciones |
|---|---|---|
| `LabRole` en docs y scripts | 39 | ~130 |
| `Pista A` / `Pista B` | 11 | ~25 |
| Model ID de Bedrock | 6 | 8 |
| Enlaces a `docs/SANDBOX-COMPAT.md` | 40 | ~50 |

Los enlaces son el dato que decide la estrategia: con 40 referentes, **borrar
`docs/SANDBOX-COMPAT.md` rompe más de lo que arregla**. Reescribirlo (mismo path, contenido correcto,
apuntando a `docs/IAM.md`) mantiene los 40 enlaces vivos y elimina la contradicción de una sola vez.

---

## 5. Restricciones a respetar

- **Idioma**: docs, guías y mensajes de scripts en **español**; código e identificadores en inglés
  (`CLAUDE.md`).
- **Sin `Role:` junto a `Policies:`** — mutuamente excluyentes en SAM, y `Policies` se ignora en
  silencio (`docs/IAM.md:65-66`).
- **Sin API Gateway**: `FunctionUrlConfig`, nunca `Events: Type: Api`.
- **DynamoDB no acepta `float`** vía el resource de boto3 → `Decimal(str(v))`.
- Los handlers leen sus parámetros de `rawPath` / query / body, no de `pathParameters`.
- **Estructura fija de cada `GUIA.md`**: objetivo → concepto → qué entra en el examen → paso a paso →
  checklist → costo + cleanup. Cualquier edición la preserva.
- **Cada `GUIA.md` cierra con costo** (marcado *verificar contra precios oficiales*) y cleanup.

---

## 6. Handoff

**Para PLAN/CODE** — orden sugerido, de lo que rompe el deploy a lo cosmético:

1. Model IDs de Bedrock (P0-3): 6 archivos, unificar en `anthropic.claude-haiku-4-5-20251001-v1:0`.
2. Reescribir `docs/SANDBOX-COMPAT.md` (P1-4) — desbloquea los 40 enlaces de una vez.
3. Los 8 pasos "pegá … `Role: !Ref LabRoleArn`" + el bloque IAM de `sessions/S00-base/GUIA.md`
   (P0-1) y el prerequisito de cuenta (P0-2).
4. Retirar la estructura de dos pistas (P1-5): `sessions/README.md`, 5 encabezados de `GUIA.md`,
   `SESSION-PLAN.md`, `scripts/bootstrap.sh`, `QUICKSTART.md`.
5. Configs y mensajes ejecutables (P1-6) — `deploy-all.sh`, `samconfig.us-east-1.example`,
   `enable-bedrock-logging.sh`, `deploy.sh`, `scripts/README.md`.
6. `CLAUDE.md` §Despliegue (P1-7) + `README.md`, `CAPSTONE_OVERVIEW.md`,
   `README-BASE-SERVERLESS.md`, `docs/ARCHITECTURE.md`, `docs/TESTING_GUIDE.md`, `docs/COST_AND_CLEANUP.md`,
   `docs/prompts/*`, `docs/specs/LIST_ITEMS_SPEC.md`, `instructor/*`.
7. **Cerrar el hueco del linter (P2-8)**: extender §6 de `validate-all.sh` a docs y agregar un check
   de model IDs. Sin esto, el próximo refactor repite exactamente este pase.

**Para COMMIT**: `bash scripts/validate-all.sh --static` debe seguir en 25+/0. La rama es
`feat/migrate-region-us-east-1` con trabajo sin commitear de **dos** temas distintos (región ya
commiteada; IAM + contrato sin commitear) — conviene rama nueva desde `master` o commits separados.
`gh` **no está instalado**; el PR va por la API REST de GitHub con `$GITHUB_TOKEN` (permiso `push`
verificado en `gabanox/techmoda-ai-aby-capstone`).

**Gap que ningún arreglo de docs cierra**: sin credenciales AWS, nadie ha probado que los roles que
SAM genera alcancen en runtime. Las 9 features de IA y el CRUD E2E siguen sin verificar contra la
nube. Es el primer paso del próximo pase con credenciales:
`bash scripts/validate-all.sh` (modo completo).
