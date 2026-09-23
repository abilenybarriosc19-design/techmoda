# Scripts de Despliegue - TechModa

Este directorio contiene scripts para facilitar el despliegue y gestión de la aplicación TechModa.

> 🏖️ **Sandbox AWS re/Start:** el frente HTTP son **Lambda Function URLs** (no API Gateway), el stack
> se llama **`techmoda-ai-aby`** y la región es **us-east-1**. Las URLs de ejemplo de abajo tienen el
> formato `https://<id>.lambda-url.us-east-1.on.aws/`. Ver
> [../docs/SANDBOX-COMPAT.md](../docs/SANDBOX-COMPAT.md).

## 📋 Índice de Scripts

### 🚀 Scripts Simplificados (Recomendados para Alumnos)

| Script | Descripción | Uso |
|--------|-------------|-----|
| `deploy-all.sh` | **Despliega TODO** (backend + frontend) en un solo comando | `./scripts/deploy-all.sh` |
| `delete-all.sh` | **Elimina TODO** para evitar cargos de AWS | `./scripts/delete-all.sh` |
| `status.sh` | **Muestra el estado** actual del despliegue con URLs | `./scripts/status.sh` |
| `logs.sh` | **Ver logs de CloudWatch** en tiempo real o históricos | `./scripts/logs.sh [opciones]` |

### 🔧 Scripts Individuales (Para Control Detallado)

| Script | Descripción | Uso |
|--------|-------------|-----|
| `build.sh` | Construye solo el backend (SAM) | `./scripts/build.sh` |
| `deploy.sh` | Despliega solo el backend | `./scripts/deploy.sh` |
| `build-frontend.sh` | Construye solo el frontend (React) | `./scripts/build-frontend.sh` |
| `deploy-frontend.sh` | Despliega solo el frontend a S3 | `./scripts/deploy-frontend.sh` |
| `delete.sh` | Elimina el stack (equivalente a delete-all.sh) | `./scripts/delete.sh` |

### 🚨 Script de Recuperación

| Script | Descripción | Uso |
|--------|-------------|-----|
| `fix-failed-delete.sh` | **Recupera eliminaciones fallidas** debido a buckets S3 llenos | `./scripts/fix-failed-delete.sh` |

---

## 🎯 Guía de Uso

### Primer Despliegue

```bash
# Opción Simple (TODO EN UNO)
./scripts/deploy-all.sh

# Opción Paso a Paso
./scripts/build.sh           # 1. Construir backend
./scripts/deploy.sh          # 2. Desplegar backend
./scripts/build-frontend.sh  # 3. Construir frontend
./scripts/deploy-frontend.sh # 4. Desplegar frontend
```

### Verificar Estado

```bash
./scripts/status.sh
```

Esto muestra:
- ✅ Estado del stack de CloudFormation
- 🔗 URL de la API Backend
- 🌐 URL del Frontend (CloudFront)
- 🗄️ Nombre de la tabla DynamoDB y cantidad de productos
- 📝 Comandos útiles

### Eliminar Todo

```bash
./scripts/delete-all.sh
```

**⚠️ IMPORTANTE**: Este comando elimina TODOS los recursos de AWS:
- Lambda Function URLs (router CRUD + funciones de IA)
- 5 Funciones Lambda (+ router y funciones de IA)
- Tabla DynamoDB (con todos los datos)
- Bucket S3
- Distribución CloudFront
- Los roles IAM de ejecución (uno por Lambda, creados por SAM) — se borran con el stack.

### ¿Falló la Eliminación?

Si ves un error como `DELETE_FAILED` por buckets S3 llenos:

```bash
./scripts/fix-failed-delete.sh
```

Este script:
- Identifica los buckets problemáticos
- Los vacía automáticamente
- Reintenta la eliminación del stack

---

## 📖 Detalles de Scripts Simplificados

### `deploy-all.sh`

**¿Qué hace?**
1. Construye el backend con SAM (`sam build`)
2. Despliega el backend a AWS (`sam deploy`)
3. Instala dependencias del frontend (`npm install`)
4. Construye el frontend (`npm run build`)
5. Despliega el frontend a S3/CloudFront
6. Muestra las URLs finales

**Ventajas:**
- ✅ Un solo comando para desplegar todo
- ✅ No necesitas recordar múltiples pasos
- ✅ Manejo automático de errores
- ✅ Feedback visual del progreso

**Uso:**
```bash
./scripts/deploy-all.sh
```

**Tiempo estimado:** 3-5 minutos

---

### `delete-all.sh`

**¿Qué hace?**
1. Verifica que el stack existe
2. Muestra una lista de recursos que serán eliminados
3. Pide confirmación explícita (debes escribir "si")
4. Elimina el stack completo con `sam delete`

**Ventajas:**
- ✅ Confirmación de seguridad
- ✅ Lista clara de lo que se eliminará
- ✅ Mensajes informativos
- ✅ Evita cargos no deseados

**Uso:**
```bash
./scripts/delete-all.sh
```

Cuando pregunte, escribe: `si` (o `SI` o `yes`)

**Tiempo estimado:** 2-3 minutos

---

### `status.sh`

**¿Qué hace?**
1. Busca el stack de CloudFormation
2. Obtiene el estado actual
3. Muestra todas las URLs y recursos
4. Cuenta los productos en DynamoDB
5. Sugiere comandos útiles

**Ventajas:**
- ✅ No necesitas entrar a la consola de AWS
- ✅ Toda la información en un solo lugar
- ✅ Útil para copiar URLs
- ✅ Verifica que todo esté funcionando

**Uso:**
```bash
./scripts/status.sh
```

**Salida ejemplo:**
```
==========================================
  TechModa - Estado del Despliegue
==========================================

🔍 Buscando stack: techmoda-ai-aby

📊 Estado del Stack
-------------------------------------------
Nombre: techmoda-ai-aby
Estado: CREATE_COMPLETE

📋 Información del Despliegue
-------------------------------------------
🔗 API Backend (Lambda Function URL del router):
   https://abc123abc123abc123abc123abc1230.lambda-url.us-east-1.on.aws/

   Endpoints disponibles:
   • GET    https://abc123abc123abc123abc123abc1230.lambda-url.us-east-1.on.aws/products
   • POST   https://abc123abc123abc123abc123abc1230.lambda-url.us-east-1.on.aws/products
   • GET    https://abc123abc123abc123abc123abc1230.lambda-url.us-east-1.on.aws/products/{id}
   • PUT    https://abc123abc123abc123abc123abc1230.lambda-url.us-east-1.on.aws/products/{id}
   • DELETE https://abc123abc123abc123abc123abc1230.lambda-url.us-east-1.on.aws/products/{id}

🌐 Frontend Web:
   https://d123abc.cloudfront.net

🗄️  Base de Datos:
   Tabla: techmoda-ai-aby-ProductsTable-ABC123
   Productos: 5

==========================================
```

---

### `fix-failed-delete.sh`

**¿Qué hace?**
1. Detecta si el stack está en estado `DELETE_FAILED`
2. Identifica todos los buckets S3 asociados al stack
3. Cuenta los objetos en cada bucket
4. Vacía todos los buckets automáticamente
5. Reintenta la eliminación del stack
6. Espera a que se complete

**Ventajas:**
- ✅ Recuperación automática de errores
- ✅ No requiere acceso a la consola de AWS
- ✅ Muestra progreso detallado
- ✅ Incluye wait automático

**Cuándo usarlo:**
- Cuando `delete-all.sh` falla con error `DELETE_FAILED`
- Cuando ves el mensaje: "The following resource(s) failed to delete: [FrontendBucket]"
- Cuando CloudFormation no puede eliminar buckets S3

**Uso:**
```bash
./scripts/fix-failed-delete.sh
```

**Tiempo estimado:** 2-3 minutos

**Salida ejemplo:**
```
==========================================
  TechModa - Recuperación de Eliminación
==========================================

🔧 Intentando recuperar del error DELETE_FAILED
Stack: techmoda-ai-aby

📊 Estado actual del stack: DELETE_FAILED

🔍 Paso 1: Identificando buckets S3 problemáticos...
-------------------------------------------
📦 Buckets encontrados:
   • techmoda-ai-aby-frontend-abc123
   • aws-sam-cli-managed-default-samclisourcebucket-xyz789

🗑️  Paso 2: Vaciando buckets S3...
-------------------------------------------
🧹 Vaciando: techmoda-ai-aby-frontend-abc123
   Eliminando 5 objetos...
   ✅ Bucket vaciado
🧹 Vaciando: aws-sam-cli-managed-default-samclisourcebucket-xyz789
   Eliminando 10 objetos...
   ✅ Bucket vaciado

🔄 Paso 3: Reintentando eliminación del stack...
-------------------------------------------
⏳ Esperando a que el stack se elimine...
   (Esto puede tardar 2-3 minutos)

==========================================
  ✅ ¡RECUPERACIÓN EXITOSA!
==========================================

💰 El stack fue eliminado correctamente.
   No se generarán más cargos.
```

---

### `logs.sh`

**¿Qué hace?**
1. Conecta con CloudWatch Logs
2. Muestra logs de funciones Lambda específicas o todas
3. Permite seguir logs en tiempo real (tail)
4. Filtra por patrones o errores
5. Configura el rango de tiempo

**Ventajas:**
- ✅ No necesitas acceder a la consola de AWS
- ✅ Tail en tiempo real para debugging
- ✅ Filtrado rápido de errores
- ✅ Múltiples funciones simultáneamente
- ✅ Configuración de tiempo flexible

**Uso básico:**

Ver todos los logs (últimos 10 minutos):
```bash
./scripts/logs.sh
```

Ver logs de una función específica:
```bash
./scripts/logs.sh list      # ListItemsFunction
./scripts/logs.sh create    # CreateItemFunction
./scripts/logs.sh get       # GetItemFunction
./scripts/logs.sh update    # UpdateItemFunction
./scripts/logs.sh delete    # DeleteItemFunction
```

**Opciones avanzadas:**

Live tail (seguir en tiempo real):
```bash
./scripts/logs.sh --tail                # Todas las funciones
./scripts/logs.sh list --tail           # Solo list-items
./scripts/logs.sh create --tail         # Solo create-item
```

Ver solo errores:
```bash
./scripts/logs.sh --errors              # Errores de todas las funciones
./scripts/logs.sh list --errors         # Solo errores de list
./scripts/logs.sh --since 1h --errors   # Errores de la última hora
```

Filtrar por texto:
```bash
./scripts/logs.sh --filter "product"    # Logs que contengan "product"
./scripts/logs.sh list --filter "404"   # Errores 404 en list
```

Cambiar rango de tiempo:
```bash
./scripts/logs.sh --since 30m           # Últimos 30 minutos
./scripts/logs.sh --since 1h            # Última hora
./scripts/logs.sh --since 1d            # Último día
./scripts/logs.sh --since 2h --errors   # Errores de últimas 2 horas
```

**Combinaciones útiles:**

```bash
# Debug en tiempo real de una función específica
./scripts/logs.sh create --tail

# Ver todos los errores recientes
./scripts/logs.sh --errors --since 1h

# Buscar un producto específico en los logs
./scripts/logs.sh --filter "productId: abc-123"

# Monitorear todas las funciones en vivo
./scripts/logs.sh --tail
```

**Salida ejemplo:**
```
==========================================
  TechModa - CloudWatch Logs Viewer
==========================================

📊 Configuration:
   Stack:    techmoda-ai-aby
   Function: All functions
   Since:    10m ago
   Mode:     Historical

==========================================

2024/11/09/[$LATEST]abc123 2024-11-09T10:15:23.456Z START RequestId: abc-123
2024/11/09/[$LATEST]abc123 2024-11-09T10:15:23.789Z INFO Listing products
2024/11/09/[$LATEST]abc123 2024-11-09T10:15:24.012Z INFO Found 5 products
2024/11/09/[$LATEST]abc123 2024-11-09T10:15:24.234Z END RequestId: abc-123

==========================================

💡 Useful commands:
   Live tail:      ./scripts/logs.sh --tail
   Show errors:    ./scripts/logs.sh --errors
   Specific func:  ./scripts/logs.sh list --tail
   Longer period:  ./scripts/logs.sh --since 1h
```

**Atajos de teclado:**
- `Ctrl+C` - Detener tail mode
- Las flechas funcionan normalmente para navegar historial

**Troubleshooting:**

Si no ves logs:
1. Verifica que el stack esté desplegado: `./scripts/status.sh`
2. Asegúrate de que las funciones hayan sido invocadas
3. Amplía el rango de tiempo: `--since 1h`
4. Verifica permisos de CloudWatch en tu cuenta AWS

Si ves errores de permisos:
```bash
# Verificar credenciales
aws sts get-caller-identity

# Tu usuario/rol debe tener estos permisos:
# - logs:FilterLogEvents
# - logs:DescribeLogGroups
# - logs:DescribeLogStreams
```

---

## 🔧 Scripts Individuales (Avanzado)

Si necesitas más control sobre el proceso, puedes usar los scripts individuales:

### Backend

```bash
# Construir backend
./scripts/build.sh

# Desplegar backend
./scripts/deploy.sh
```

### Frontend

```bash
# Construir frontend
./scripts/build-frontend.sh

# Desplegar frontend
./scripts/deploy-frontend.sh
```

**Nota**: `deploy-frontend.sh` automáticamente obtiene la Function URL del backend (output `ApiUrl`) y la inyecta en el frontend.

---

## ❓ Preguntas Frecuentes

### ¿Cuánto cuesta ejecutar estos scripts?

**Respuesta**: Menos de $1 USD si lo usas por 1-2 días y luego eliminas los recursos con `delete-all.sh`. Todos los servicios están dentro del Free Tier de AWS.

### ¿Puedo desplegar múltiples veces?

**Sí**. Puedes ejecutar `deploy-all.sh` múltiples veces. El segundo despliegue actualizará los recursos existentes.

### ¿Qué pasa si falla el despliegue?

1. Lee el mensaje de error
2. Verifica tus credenciales de AWS: `aws sts get-caller-identity`
3. Revisa los logs en CloudWatch
4. Consulta [docs/prompts/05_DEBUGGING.md](../docs/prompts/05_DEBUGGING.md)

### ¿Cómo cambio el nombre del stack?

Edita el archivo `samconfig.toml` y cambia el valor de `stack_name`.

### ¿Puedo usar estos scripts en mi máquina local?

**Sí**, siempre que tengas instalado:
- AWS CLI v2
- SAM CLI
- Node.js 18.x+
- Credenciales de AWS configuradas

### ¿CloudFront tarda mucho?

Sí, la primera vez puede tardar 15-20 minutos. Mientras tanto, puedes probar tu API directamente con curl.

---

## 💡 Mejores Prácticas

1. **Siempre ejecuta `status.sh`** después de desplegar para verificar las URLs
2. **Guarda las URLs** en algún lugar para hacer pruebas
3. **Ejecuta `delete-all.sh`** cuando termines de trabajar para evitar cargos
4. **Lee los mensajes** de error cuidadosamente - suelen indicar el problema exacto
5. **Verifica tus credenciales de AWS** antes de desplegar

---

## 📚 Recursos Adicionales

- [README principal](../README.md)
- [Guía de pruebas con curl](../docs/TESTING_GUIDE.md)
- [Guía de costos y limpieza](../docs/COST_AND_CLEANUP.md)
- [Documentación de SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)

---

**¿Problemas?** Consulta tu instructor o revisa los CloudWatch Logs para más detalles.
