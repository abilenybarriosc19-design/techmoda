# S0 · Desplegar TechModa base (CRUD serverless)

**Duración:** ~60 min · **Servicio de IA:** ninguno (cimiento) · **Dominio AIF-C01:** base para todo

---

## 🎯 Objetivo

Dejar corriendo, en tu cuenta AWS **us-east-1**, la tienda TechModa serverless **sin IA todavía**:
un **router CRUD** (Node.js) expuesto con **una Lambda Function URL** + DynamoDB + frontend React en
S3/CloudFront. Este es el lienzo sobre el que las 11 sesiones siguientes irán pegando capacidades de
IA, una por hora.

> 🔌 **Dos decisiones de arquitectura** que vas a ver en todo el capstone: la API **no usa API
> Gateway** sino **Lambda Function URLs** (más simple de desplegar y de explicar), y cada Lambda
> declara sus **`Policies:` acotadas** para que **SAM le cree un rol de mínimo privilegio**. El porqué
> del diseño está en [`docs/SANDBOX-COMPAT.md`](../../docs/SANDBOX-COMPAT.md); el modelo de permisos,
> en [`docs/IAM.md`](../../docs/IAM.md).

Al terminar S0 vas a poder **crear, listar, ver, editar y borrar productos** desde el navegador.

---

## 🧩 Prerequisitos

- Una **cuenta AWS donde puedas crear roles IAM** (`iam:CreateRole`). El stack crea un rol de mínimo
  privilegio por Lambda, así que una cuenta con IAM restringido **no puede desplegarlo** — ver
  ⚠️ abajo.
- `aws sts get-caller-identity` responde (estás autenticado).
- `sam --version`, `aws --version`, `node --version` (≥22), `python3 --version` (**3.12**, tiene que
  coincidir con el `Runtime` de las Lambdas de IA) responden.
- Chequeo de un comando, antes de tocar AWS: `bash scripts/validate-all.sh --static`.

> ⚠️ **Si tu cuenta no permite crear roles** (caso típico: el `LabRole` del sandbox AWS re/Start /
> Vocareum, que deniega `iam:CreateRole`), el deploy falla con
> `is not authorized to perform: iam:CreateRole` y CloudFormation revierte el stack entero. No es un
> error del template: es la cuenta. El contexto histórico y la variante que sí corría con `LabRole`
> están en [`docs/SANDBOX-COMPAT.md`](../../docs/SANDBOX-COMPAT.md) §3.

---

## 🧠 El concepto (qué es "serverless" y por qué importa para IA)

"Serverless" no significa "sin servidores": significa que **vos no administrás servidores**. AWS ejecuta
tu código (Lambda) solo cuando llega una petición y te cobra por milisegundo de ejecución. Para un
proyecto de IA esto es ideal porque:

- **Pagás por uso, igual que los servicios de IA.** Una Lambda que llama a Rekognition solo cuesta cuando alguien sube una foto.
- **Escala solo.** Si 1.000 clientes piden traducciones a la vez, Lambda crea 1.000 ejecuciones; no aprovisionás nada.
- **Aísla cada capacidad.** Cada feature de IA será **su propia Lambda** con su propia Function URL.

Esa última idea es el patrón central del capstone: **una Lambda = un servicio de IA**. Y como cada
función es su propia unidad de despliegue, también es su propia unidad de **permisos**: cada una lleva
un **rol de mínimo privilegio** con lo justo para su tarea (leer la tabla, invocar *un* servicio). Eso
es lo que evalúa el dominio D5 del examen, y lo vas a ver sesión por sesión.

---

## 🚶 Paso a paso

### 1. Clonar y configurar
```bash
git clone <este-repo> techmoda-ai-aby-capstone && cd techmoda-ai-aby-capstone
cp samconfig.us-east-1.example samconfig.toml
```

### 2. Construir
```bash
sam build
```
SAM empaqueta el router CRUD (Node.js) y valida el `template.yaml`.

### 3. Desplegar
```bash
# atajo: bash scripts/deploy.sh
sam deploy --stack-name techmoda-ai-aby --region us-east-1 \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --resolve-s3 --no-confirm-changeset
```
`CAPABILITY_AUTO_EXPAND` es obligatorio (Transform SAM). En despliegues posteriores podés repetir el
mismo comando (o `sam deploy` a secas si copiaste `samconfig.us-east-1.example` → `samconfig.toml`).

> 🔐 **Sobre IAM:** `CAPABILITY_IAM` no es decorativa — el stack **crea un rol por Lambda**. Abrí
> `template.yaml` y mirá el bloque `Policies:` del `RouterFunction`: dice `DynamoDBCrudPolicy` sobre
> `!Ref ProductsTable` y nada más. El router no puede tocar ninguna otra tabla ni ningún otro
> servicio. **Nunca agregues `Role:` al lado de `Policies:`**: son mutuamente excluyentes en SAM y tus
> `Policies` se ignoran **en silencio** (el deploy no falla, el permiso simplemente no queda).
> Detalle y patrón a copiar: [`docs/IAM.md`](../../docs/IAM.md).

### 4. Anotar las salidas
Al final del deploy, CloudFormation imprime:
- `ApiUrl` → la URL base de tu API: una **Lambda Function URL** (`https://<id>.lambda-url.us-east-1.on.aws/`)
- `FrontendUrl` → la URL de CloudFront del catálogo
- `ProductsTableName` → la tabla DynamoDB

### 5. Cargar datos de ejemplo
```bash
bash ai/seed/seed-products.sh
```

### 6. Publicar el frontend
```bash
bash scripts/deploy-frontend.sh
```

### 7. Ver funcionar
Abrí `FrontendUrl` en el navegador → deberías ver el catálogo con los 4 productos sembrados.

---

## ✅ Checklist de validación

- [ ] `sam deploy` terminó en estado `CREATE_COMPLETE` / `UPDATE_COMPLETE`.
- [ ] `curl "${ApiUrl%/}/products"` devuelve un JSON con `products: [...]`.
- [ ] La `FrontendUrl` carga y muestra los productos.
- [ ] Podés crear un producto desde la UI y aparece al refrescar.
- [ ] En CloudWatch Logs ves el log group `/aws/lambda/techmoda-ai-aby-Router`.

```bash
# Prueba rápida desde la terminal del IDE (ApiUrl es la Function URL del router):
ApiUrl=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby \
          --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
curl -s "${ApiUrl%/}/products" | python3 -m json.tool
```

---

## 📝 Qué entra en el examen (de este cimiento)

S0 no cubre un dominio de IA, pero fija el **vocabulario de arquitectura** que el examen asume:

- **Servicios administrados vs. autoadministrados.** AIF-C01 premia elegir el servicio administrado (Lambda, Rekognition, Bedrock) en vez de montar infra propia.
- **Modelo de responsabilidad compartida.** AWS opera el servicio; vos sos responsable de **datos, permisos (IAM) y configuración**. Lo veremos a fondo en S10 (D5).
- **Pago por uso / elasticidad** como ventaja de la nube para cargas de IA.

---

## 💸 Costo + 🧹 Cleanup

**Costo de S0:** prácticamente **$0** en sandbox (Lambda + Function URL + DynamoDB on-demand entran en
volúmenes mínimos; CloudFront/S3 centavos). *Verificar contra los precios oficiales de AWS.*

**Cleanup:** no borres todavía — las sesiones siguientes construyen sobre este stack. El cleanup total
está en S11:
```bash
bash scripts/delete-all.sh   # SOLO cuando termines TODO el capstone
```
