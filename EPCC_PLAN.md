# Plan: Migrar la región del capstone de `us-west-2` a `us-east-1`

**Creado**: 2026-08-17 · **Complejidad**: Medium
**Estado**: ✅ **APROBADO** con alcance reducido
**Alcance de este pase**: Fases 2 y 3 (~3.5 h) — rename completo en el repo, **sin tocar AWS**
**Diferido**: Fases 0, 1 y 4 (gate de región, borrado del stack viejo, deploy y verificación)

---

## 1. Objetivo

**Meta**: que todo el capstone (código, scripts, templates, docs y guías) opere en `us-east-1` en lugar
de `us-west-2`, dentro del **mismo sandbox AWS re/Start** (cuenta `879652687082`).

**Por qué**: unificar la región de trabajo. Efecto secundario deseable: el capstone base ya usaba
`us-east-1` (`samconfig.toml.example:12`, `AWS_CREDENTIALS_SETUP.md`, `docs/prompts/*`), así que la
migración **elimina la inconsistencia** que introdujo la versión IA en lugar de agregar una nueva.

**Éxito** (medible):
1. `grep -rI 'us-west-2'` sobre el repo (excluyendo `.git`, `.aws-sam`, `node_modules`) → **0 resultados**
2. `bash scripts/bootstrap.sh` deja el stack `techmoda-ai-aby` en `us-east-1` y `curl "${API%/}/products"`
   devuelve los 4 productos sembrados
3. `sam validate --lint` pasa en los 3 templates; `npm run lint && npm run typecheck && npx vitest run`
   pasa en `frontend/` (88 casos)

---

## 2. Approach

**Estrategia: validar primero, borrar después, renombrar al final.** El orden importa más que la
mecánica — el rename son 149 ocurrencias en 50 archivos y es trivial de hacer, pero **caro de revertir**
si resulta que el sandbox no permite `us-east-1`.

Tres decisiones que definen el plan:

| Decisión | Elección | Razón |
|---|---|---|
| Validar la región antes de editar | Sí, tarea #1 | Un probe de 15 min evita 50 archivos editados y revertidos si un SCP de Vocareum fija la región |
| Stack viejo en `us-west-2` | Borrarlo antes de migrar | Los buckets `${StackName}-frontend` / `-audio` son de **nombre global**: coexistir con el mismo `stack_name` da `BucketAlreadyExists` → `CREATE_FAILED` → rollback |
| `LabRoleArn` | **No se toca** | `arn:aws:iam::879652687082:role/LabRole` no lleva región (IAM es global). Misma cuenta → mismo ARN |

**Del `EPCC_EXPLORE.md`**: no hay ninguna región hardcodeada en propiedades de CloudFormation ni en ARNs
de recursos; los templates solo la mencionan en comentarios y exponen `!Ref AWS::Region` como output
(se resuelve solo). La región vive en (a) defaults de scripts bash, (b) `samconfig`, (c) fixtures y
placeholder del frontend, (d) prosa de documentación. Eso es lo que hace la migración mecánica y de
bajo riesgo técnico — el riesgo real es de **entorno**, no de código.

**Layering del rename** (de lo que rompe a lo que no):
`funcional` (scripts, samconfig, frontend) → `tests` → `templates/comentarios` → `docs` → `casos especiales`.

**Commit atómico como estrategia de reversión.** Con el alcance elegido (repo sí, AWS no), el gate T1
queda diferido: el rename se hace **sin haber probado** que el sandbox permita `us-east-1`. La
mitigación es de control de versiones, no de proceso — todo el rename va en **una rama y un solo
commit**. Si más adelante T1 descubre que un SCP fija `us-west-2`, revertir es `git revert <sha>`,
no deshacer 50 archivos a mano. Requisito: no mezclar en ese commit ningún otro cambio.

⚠️ **Lo que esta migración NO arregla**: la Pista B seguirá bloqueada. El `LabRole` deniega
`bedrock:InvokeModel` y `translate:TranslateText` **por acción, no por región** — cambiar a `us-east-1`
no altera eso. La estructura de dos pistas sobrevive intacta.

---

## 3. Tasks

### Fase 0: Validación del entorno (~0.25 h) — 🚦 GATE · ⏸️ DIFERIDA

> Requiere credenciales del sandbox (no disponibles en este entorno). **Correr antes del primer deploy
> a `us-east-1`.** Si falla, revertir el commit del rename (ver §2).

1. **Probe de región** (0.25 h) · Deps: ninguna · Riesgo: **Alto** (es el gate del plan)
   Con credenciales del sandbox activas, verificar que `us-east-1` no esté bloqueada por SCP/IAM:
   `aws dynamodb list-tables`, `aws lambda list-functions`, `aws s3 ls` y
   `aws cloudformation list-stacks`, todos con `--region us-east-1`.
   **Si cualquiera devuelve `AccessDenied` / `UnauthorizedOperation` con condición
   `aws:RequestedRegion` → DETENER el plan.** El sandbox fija la región y la migración es inviable
   para la Pista A; habría que reconsiderar el destino (cuenta propia o Bootcamp).

### Fase 1: Liberar `us-west-2` (~0.5 h) · ⏸️ DIFERIDA

> Requiere credenciales. Bloquea el deploy: sin `DELETE_COMPLETE` del stack viejo, los nombres de
> bucket no se liberan.

2. **Borrar el stack viejo** (0.25 h) · Deps: T1 · Riesgo: Bajo
   `AWS_REGION=us-west-2 bash scripts/delete-all.sh`. Si queda en `DELETE_FAILED` por buckets con
   objetos → `scripts/fix-failed-delete.sh`. **Confirmar `DELETE_COMPLETE`** antes de seguir: los
   nombres de bucket no se liberan hasta que el borrado termina.
3. **Limpiar artefactos de build** (0.25 h) · Deps: T2 · Riesgo: Bajo
   `rm -rf .aws-sam` — el build cacheado tiene metadata de la región anterior y confunde el próximo
   `sam deploy`.

### Fase 2: Rename funcional (~1.5 h) · ▶️ EN ESTE PASE

4. **Defaults de región en scripts** (0.5 h) · Deps: T1 · Riesgo: Bajo
   6 archivos con `REGION="${AWS_REGION:-us-west-2}"`: `scripts/deploy.sh:14`,
   `scripts/bootstrap.sh:18`, `ai/seed/seed-products.sh:12`, `sessions/S11-*/demo.sh:13`,
   `sessions/S10-*/enable-bedrock-logging.sh:10`, `sessions/S09-*/create-guardrail.sh:10`.
5. **Renombrar `samconfig`** (0.5 h) · Deps: T1 · Riesgo: Medio (se rompen refs si se olvida alguna)
   `git mv samconfig.us-west-2.example samconfig.us-east-1.example` + su contenido (3 ocurrencias) +
   las **8 referencias al nombre del archivo** en 7 archivos: `CLAUDE.md:77`, `README.md:141,201`,
   `README-BASE-SERVERLESS.md:223`, `sessions/S00-base/GUIA.md:54,71`, `docs/SANDBOX-COMPAT.md:136`.
6. **Frontend: placeholder, env y fixtures** (0.5 h) · Deps: T1 · Riesgo: Bajo
   `frontend/src/lib/api.ts:22` (fallback), `frontend/.env.example` (3), `frontend/src/test/setup.ts:15`,
   `frontend/src/lib/api.test.ts:193,207`. Los tests **assertan la URL literal**, así que fallan si se
   cambia `setup.ts` sin `api.test.ts` — cambiarlos juntos.

### Fase 3: Rename de documentación (~2 h) · ▶️ EN ESTE PASE

7. **Sed masivo + revisión** (1.5 h) · Deps: T4–T6 · Riesgo: Medio
   `grep -rIl 'us-west-2' --exclude-dir={.git,.aws-sam,node_modules,dist} | xargs sed -i 's/us-west-2/us-east-1/g'`
   sobre las ~110 ocurrencias restantes en docs (README, `docs/*`, 11 `GUIA.md`, `instructor/*`,
   `QUICKSTART.md`, `scripts/README.md`, `CLAUDE.md`). Después **leer el diff**, no confiar en el sed:
   hay prosa donde la región va acompañada de contexto que también cambia.
8. **Casos que el sed no resuelve** (0.5 h) · Deps: T7 · Riesgo: Medio
   - **`Oregón` → `Norte de Virginia`**: `README.md:123` y `samconfig.*.example:6`. Un sed ciego deja
     el absurdo `us-east-1 (Oregón)`.
   - **Comentarios de Bedrock Model access**: `sessions/S06-*/app.py:25,118`,
     `sessions/S06,S07/template-snippet.yaml`. El acceso a modelos es **por región**: hay que
     habilitarlo de nuevo en la consola de `us-east-1` para las demos de Pista B.
   - **Notas de la alarma de billing**: `template.sandbox.yaml:150`, `template.full.yaml:255`,
     `sessions/S10-*/GUIA.md`. Dicen "va en us-east-1, crear a mano" — ahora el stack **ya está** ahí.
     En esta tarea solo corregir la nota; convertirla en recurso real está fuera de alcance (§5).
   - **`docs/prompts/03_DEPLOYMENT.md`**: ya mezcla ambas regiones (herencia del capstone base).
     Revisar a mano que quede coherente, no solo sustituido.
   - **`EPCC_EXPLORE.md`**: actualizar el dato de región en Foundation. Mantener el hallazgo de la
     cuenta Bootcamp (`281248178297, us-east-1`) — ese sigue siendo correcto y ahora coincide.

### Fase 4: Despliegue y verificación (~1.75 h) · ⏸️ DIFERIDA

> Requiere credenciales. Deps adicionales: T1 (gate) y T2 (stack viejo borrado).

9. **Deploy en `us-east-1`** (0.5 h) · Deps: T2, T3, T4, T5 · Riesgo: Medio
   `cp samconfig.us-east-1.example samconfig.toml` → `bash scripts/bootstrap.sh`.
10. **Verificación E2E de Pista A** (0.75 h) · Deps: T9 · Riesgo: Medio
    `scripts/status.sh`; `curl "${API%/}/products"` → 4 productos; smoke de S01/S02/S03/S05 con los
    `curl` de cada `GUIA.md`. Requiere subir una imagen real a
    `s3://techmoda-ai-aby-frontend/assets/` para las de visión.
11. **Frontend y CloudFront** (0.5 h) · Deps: T9 · Riesgo: Bajo
    `bash scripts/deploy-frontend.sh` (re-inyecta `env-config.js` con la Function URL nueva de
    `us-east-1`). CloudFront tarda 15–20 min en propagar la distribución nueva.

**Total del plan completo**: ~6 h · **Camino crítico**: T1 → T2 → T9 → T10
**Este pase (fases 2 + 3)**: ~3.5 h → T4, T5, T6, T7, T8
**Diferido a un pase con credenciales**: ~2.5 h → T1, T2, T3, T9, T10, T11

---

## 4. Quality Strategy

**Verificable en este pase** (todo lo de abajo corre sin credenciales AWS):
- `grep -rI 'us-west-2' . --exclude-dir={.git,.aws-sam,node_modules,dist}` → **0 resultados** (criterio de éxito #1)
- `grep -rIn 'Oreg'` → 0 resultados
- `sam validate --lint` en `template.yaml`, `template.sandbox.yaml`, `template.full.yaml`
- En `frontend/`: `npm run lint && npm run typecheck && npx vitest run` (88 casos)
- Que ningún `.sh` quede con `AWS_REGION:-us-west-2`: `grep -rn 'AWS_REGION:-' --include='*.sh'`

`sam validate --lint` no necesita credenciales (valida sintaxis y el Transform SAM localmente), así que
también entra en este pase.

**Diferido al pase con credenciales**:
- Los `curl` de cada `GUIA.md` de Pista A (S01, S02, S03, S05)
- Frontend en la URL de CloudFront: el catálogo carga y el CRUD funciona

**Límite honesto de este pase**: al terminar, el repo estará coherente en `us-east-1` y los tests
pasarán, pero **nada habrá probado que el sandbox permita esa región**. El criterio de éxito #1
(`grep` → 0) se cumple; los #2 y #3 quedan parcialmente pendientes (#3 solo en su parte local).

⚠️ Los 88 tests **no** validan el contrato real con la API (usan `mockData.ts` con snake_case, ver
🔴 en `EPCC_EXPLORE.md` §5). Que pasen no significa que el frontend funcione contra el backend nuevo —
eso solo lo prueba T11 en el navegador. Ese defecto es **preexistente y ortogonal** a esta migración.

---

## 5. Risks

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Un SCP de Vocareum fija `us-west-2` → migración inviable | **Alto** | ⚠️ **Riesgo aceptado en este pase**: T1 quedó diferido, así que el rename se hace sin validar. Mitigación: rename en **un commit atómico** → `git revert <sha>` si T1 falla (ver §2) |
| Colisión de nombres de bucket S3 (global, no regional) | **Alto** | T2 borra el stack viejo y **confirma `DELETE_COMPLETE`** antes de desplegar. No aplica en este pase (no se despliega) |
| Sed ciego corrompe prosa (`us-east-1 (Oregón)`) | Medio | T8 dedicada + revisión del diff en T7, no solo el `grep` de residuos |
| Tests del frontend rompen por assert de URL literal | Bajo | T6 cambia `setup.ts` y `api.test.ts` en el mismo paso |
| Acceso a modelos Bedrock no habilitado en `us-east-1` | Medio | Es setting **por región**: rehabilitar en consola. Solo afecta demos de Pista B, no bloquea Pista A |
| Model ID de Bedrock ya vencido (`claude-3-haiku-20240307`, retiro 2026-04-19) | Medio | Preexistente, ver `EPCC_EXPLORE.md` §5. Conviene resolverlo en el mismo pase por S06/S08, pero es decisión aparte |
| Frontend sirviendo `env-config.js` viejo | Bajo | T11 re-inyecta; si hay caché, invalidar la distribución |

**Supuestos críticos**:
- El sandbox permite `us-east-1` (T1 lo valida; no pude verificarlo: no hay credenciales en este entorno)
- La cuenta sigue siendo `879652687082` → `LabRoleArn` no cambia
- Se acepta perder los datos del stack viejo (se re-siembran con `bootstrap.sh`)

**Fuera de alcance** (oportunidades que habilita, no parte de este cambio):
- ✅ **Decidido (2026-08-17): la alarma de billing queda FUERA.** En `us-east-1` las métricas
  `AWS/Billing` son locales, así que `AiCostAlarm` de
  `sessions/S10-*/template-snippet-governance.yaml` *podría* desplegarse dentro del stack en vez de
  crearse a mano — pero no es parte de esta migración. T8 solo corrige la **nota** en
  `template.sandbox.yaml:150`, `template.full.yaml:255` y `sessions/S10-*/GUIA.md` para que no
  contradiga la región nueva; el recurso no se agrega y el workaround manual (consola / AWS Budgets)
  sigue siendo el camino documentado.
- Arreglar el contrato snake_case ↔ camelCase (🔴 de `EPCC_EXPLORE.md`)
- Actualizar el model ID de Bedrock
- Cualquier replanteo de la estructura de dos pistas

---

## Aprobación

### Decisiones registradas

| # | Decisión | Estado |
|---|---|---|
| Entorno destino | Sandbox re/Start, misma cuenta `879652687082`, región `us-east-1`. `LabRoleArn` sin cambios | ✅ Confirmado |
| Stack en `us-west-2` | Borrarlo antes de migrar (`delete-all.sh`), reusando `stack_name` `techmoda-ai-aby` | ✅ Confirmado |
| Alarma de billing | **Fuera de alcance.** Solo se corrige la nota, no se agrega el recurso | ✅ Confirmado |
| Orden con gate T1 | Validar `us-east-1` antes de editar cualquier archivo | ✅ Sin objeciones |

| Alcance de ejecución | **Solo repo, sin tocar AWS**: fases 2 y 3 (~3.5 h). Fases 0, 1 y 4 diferidas a un pase con credenciales | ✅ Confirmado |

### Listo para CODE

Plan **aprobado** para las fases 2 y 3. Siguiente paso:

```
/epcc-workflow:epcc-code migrar us-west-2 → us-east-1 (fases 2 y 3: repo, sin AWS)
```

**Condiciones de ejecución acordadas**:
- Rama nueva + **un solo commit atómico** con todo el rename (nada más mezclado en él)
- No se ejecuta ningún comando `aws`; no se despliega
- Cierre del pase: `grep -rI 'us-west-2'` → 0, `grep -rIn 'Oreg'` → 0,
  `sam validate --lint` en los 3 templates, y en `frontend/`
  `npm run lint && npm run typecheck && npx vitest run`

**Deuda registrada para el próximo pase** (T1, T2, T3, T9, T10, T11, ~2.5 h): correr el gate de región
**antes** del primer deploy, borrar el stack de `us-west-2` hasta `DELETE_COMPLETE`, `rm -rf .aws-sam`,
desplegar, verificar Pista A end-to-end y re-inyectar el frontend. Rehabilitar Model access de Bedrock
en `us-east-1` si se van a demostrar S06–S09.
