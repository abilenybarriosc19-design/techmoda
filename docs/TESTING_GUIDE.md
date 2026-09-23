# Guía de Pruebas del API

## Descripción General

Esta guía proporciona instrucciones completas para probar manualmente tu API de Catálogo de Productos TechModa usando comandos curl. Aprenderás cómo obtener tu **Lambda Function URL**, ejecutar pruebas para las 5 operaciones CRUD e interpretar las respuestas.

> 🏖️ **Sandbox AWS re/Start:** la URL base es una **Lambda Function URL** (no API Gateway), servida
> por un **router**. Formato `https://<id>.lambda-url.us-east-1.on.aws/` — termina en `/` y **no** lleva
> `/Prod`. Usa `${API_URL%/}` para quitar la barra final al concatenar rutas. Ver
> [SANDBOX-COMPAT.md](SANDBOX-COMPAT.md).

## Prerequisitos

- Stack SAM desplegado (ejecuta `sam build && sam deploy` primero)
- curl instalado (pre-instalado en macOS/Linux, disponible via Git Bash en Windows)
- Acceso a terminal o línea de comandos

## Paso 1: Obtener tu Lambda Function URL (router)

Después de desplegar tu aplicación SAM, necesitas la Function URL del router (output `ApiUrl`).

### Método 1: Desde la Salida del Despliegue

Cuando `sam deploy` termine, busca la sección Outputs:

```
CloudFormation outputs from deployed stack
-------------------------------------------------
Outputs
-------------------------------------------------
Key                 ApiUrl
Description         Lambda Function URL (router CRUD)
Value               https://abc123xyzabc123xyzabc123xyz0000.lambda-url.us-east-1.on.aws/
-------------------------------------------------
```

Copia la URL del campo `Value`.

### Método 2: Comando AWS CLI

```bash
aws cloudformation describe-stacks \
  --stack-name techmoda-ai-aby \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text
```

### Método 3: Consola de AWS

1. Ve a la consola de AWS CloudFormation
2. Selecciona tu stack (ej., `techmoda-ai-aby`)
3. Haz clic en la pestaña "Outputs"
4. Copia el valor de `ApiUrl`

### Configurar Variable de Entorno (Recomendado)

Para facilitar las pruebas, guarda tu Function URL como una variable de entorno (sin la barra final):

**macOS/Linux**:
```bash
export API_URL="https://abc123xyzabc123xyzabc123xyz0000.lambda-url.us-east-1.on.aws"
```

**Windows (PowerShell)**:
```powershell
$env:API_URL = "https://abc123xyzabc123xyzabc123xyz0000.lambda-url.us-east-1.on.aws"
```

**Windows (CMD)**:
```cmd
set API_URL=https://abc123xyzabc123xyzabc123xyz0000.lambda-url.us-east-1.on.aws
```

Ahora puedes usar `$API_URL` (o `%API_URL%` en Windows CMD) en los comandos curl.

## Paso 2: Flujo de Pruebas

Sigue esta secuencia de pruebas recomendada para verificar todas las operaciones CRUD:

1. **Crear Producto** - Agregar un producto a la base de datos
2. **Listar Productos** - Verificar que el producto aparezca en la lista
3. **Obtener Producto** - Recuperar el producto específico por ID
4. **Actualizar Producto** - Modificar detalles del producto
5. **Eliminar Producto** - Remover el producto del catálogo

## Prueba 1: Crear Producto (POST)

### Propósito
Crear un nuevo producto de moda en el catálogo.

### Comando Curl

```bash
curl -X POST $API_URL/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Classic Denim Jacket",
    "description": "Timeless denim jacket for all seasons",
    "price": 79.99,
    "category": "Jackets",
    "imageUrl": "https://example.com/denim-jacket.jpg"
  }'
```

### Respuesta de Éxito Esperada (201 Created)

```json
{
  "productId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Classic Denim Jacket",
  "description": "Timeless denim jacket for all seasons",
  "price": 79.99,
  "category": "Jackets",
  "imageUrl": "https://example.com/denim-jacket.jpg",
  "createdAt": "2025-10-30T12:00:00.000Z",
  "updatedAt": "2025-10-30T12:00:00.000Z"
}
```

**Importante**: Guarda el `productId` de la respuesta - lo necesitarás para las pruebas de Obtener, Actualizar y Eliminar.

### Ejemplo: Guardar productId

**macOS/Linux/PowerShell**:
```bash
# Guardar respuesta completa en archivo
curl -X POST $API_URL/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Classic Denim Jacket", "price": 79.99}' \
  > product.json

# Extraer productId (requiere jq)
PRODUCT_ID=$(jq -r '.productId' product.json)
echo $PRODUCT_ID
```

### Respuestas de Error

**400 Bad Request** (campos requeridos faltantes):
```json
{
  "error": "Bad Request",
  "message": "Missing required field: name"
}
```

**500 Internal Server Error** (permisos de DynamoDB u otros problemas):
```json
{
  "error": "Internal server error",
  "message": "Failed to create product"
}
```

### Resolución de Problemas

| Error | Causa Probable | Solución |
|-------|--------------|----------|
| 400 Bad Request | Falta `name` o `price` | Agregar campos requeridos al cuerpo JSON |
| 403 Forbidden | Problema de permisos | Verificar las `Policies:` de la función (y que no tenga `Role:`, que las anula en silencio) — ver `docs/IAM.md` |
| 500 Internal Server Error | Error de ejecución Lambda | Revisar CloudWatch Logs |
| Connection refused | URL de API incorrecta | Verificar la Lambda Function URL (.lambda-url.<region>.on.aws/) |

## Prueba 2: Listar Productos (GET)

### Propósito
Recuperar todos los productos en el catálogo.

### Comando Curl

```bash
curl -X GET $API_URL/products
```

### Respuesta de Éxito Esperada (200 OK)

```json
{
  "products": [
    {
      "productId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Classic Denim Jacket",
      "description": "Timeless denim jacket for all seasons",
      "price": 79.99,
      "category": "Jackets",
      "imageUrl": "https://example.com/denim-jacket.jpg",
      "createdAt": "2025-10-30T12:00:00.000Z",
      "updatedAt": "2025-10-30T12:00:00.000Z"
    }
  ]
}
```

Si la base de datos está vacía:
```json
{
  "products": []
}
```

### Respuestas de Error

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "message": "Failed to retrieve products"
}
```

### Pasos de Verificación

1. Confirmar que el producto que creaste aparece en la lista
2. Verificar que todos los atributos estén presentes (productId, name, price, etc.)
3. Comprobar que los timestamps estén en formato ISO 8601

## Prueba 3: Obtener Producto por ID (GET)

### Propósito
Recuperar un solo producto usando su productId.

### Comando Curl

Reemplaza `{PRODUCT_ID}` con el UUID real de la respuesta de Crear Producto.

```bash
curl -X GET $API_URL/products/{PRODUCT_ID}
```

**Ejemplo con variable guardada**:
```bash
curl -X GET $API_URL/products/$PRODUCT_ID
```

**Ejemplo con UUID real**:
```bash
curl -X GET $API_URL/products/123e4567-e89b-12d3-a456-426614174000
```

### Respuesta de Éxito Esperada (200 OK)

```json
{
  "productId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Classic Denim Jacket",
  "description": "Timeless denim jacket for all seasons",
  "price": 79.99,
  "category": "Jackets",
  "imageUrl": "https://example.com/denim-jacket.jpg",
  "createdAt": "2025-10-30T12:00:00.000Z",
  "updatedAt": "2025-10-30T12:00:00.000Z"
}
```

### Respuestas de Error

**404 Not Found** (el producto no existe):
```json
{
  "error": "Not Found",
  "message": "Product not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "message": "Failed to retrieve product"
}
```

### Resolución de Problemas

| Error | Causa Probable | Solución |
|-------|--------------|----------|
| 404 Not Found | productId incorrecto o producto eliminado | Verificar productId desde Listar Productos |
| 500 Internal Server Error | Error de Lambda | Revisar CloudWatch Logs |

## Prueba 4: Actualizar Producto (PUT)

### Propósito
Actualizar detalles de un producto existente (actualización parcial).

### Comando Curl

Reemplaza `{PRODUCT_ID}` con el UUID real.

```bash
curl -X PUT $API_URL/products/{PRODUCT_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "price": 69.99,
    "description": "Updated: Timeless denim jacket now on sale!"
  }'
```

**Ejemplo con variable guardada**:
```bash
curl -X PUT $API_URL/products/$PRODUCT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "price": 69.99,
    "description": "Updated: Timeless denim jacket now on sale!"
  }'
```

### Respuesta de Éxito Esperada (200 OK)

```json
{
  "productId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Classic Denim Jacket",
  "description": "Updated: Timeless denim jacket now on sale!",
  "price": 69.99,
  "category": "Jackets",
  "imageUrl": "https://example.com/denim-jacket.jpg",
  "createdAt": "2025-10-30T12:00:00.000Z",
  "updatedAt": "2025-10-30T14:30:00.000Z"
}
```

**Nota**: El timestamp `updatedAt` debe cambiar, `createdAt` debe permanecer igual.

### Respuestas de Error

**404 Not Found**:
```json
{
  "error": "Not Found",
  "message": "Product not found"
}
```

**400 Bad Request** (datos inválidos):
```json
{
  "error": "Bad Request",
  "message": "Invalid update data"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "message": "Failed to update product"
}
```

### Pasos de Verificación

1. Confirmar que los campos actualizados cambiaron (price, description)
2. Verificar que los campos no modificados permanecen igual (name, category)
3. Comprobar que el timestamp `updatedAt` es más reciente que `createdAt`
4. Ejecutar Obtener Producto nuevamente para verificar que los cambios persistieron

## Prueba 5: Eliminar Producto (DELETE)

### Propósito
Remover un producto del catálogo.

### Comando Curl

Reemplaza `{PRODUCT_ID}` con el UUID real.

```bash
curl -X DELETE $API_URL/products/{PRODUCT_ID}
```

**Ejemplo con variable guardada**:
```bash
curl -X DELETE $API_URL/products/$PRODUCT_ID
```

### Respuesta de Éxito Esperada (200 OK)

```json
{
  "message": "Product deleted successfully",
  "productId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Respuestas de Error

**404 Not Found** (si se implementa verificación de existencia):
```json
{
  "error": "Not Found",
  "message": "Product not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "message": "Failed to delete product"
}
```

### Pasos de Verificación

1. Ejecutar Listar Productos nuevamente - el producto eliminado no debe aparecer
2. Intentar Obtener Producto con el mismo ID - debe retornar 404 Not Found
3. Intentar Eliminar nuevamente - debe seguir retornando éxito (DynamoDB DeleteItem es idempotente)

## Script de Prueba Completo

Aquí hay un script bash completo para probar todos los endpoints en secuencia:

```bash
#!/bin/bash

# Configuración — Lambda Function URL del router (sin barra final)
API_URL="https://your-fn-id.lambda-url.us-east-1.on.aws"

echo "=== TechModa API Test Suite ==="
echo ""

# Prueba 1: Crear Producto
echo "1. Creating product..."
CREATE_RESPONSE=$(curl -s -X POST $API_URL/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Classic Denim Jacket",
    "description": "Timeless denim jacket for all seasons",
    "price": 79.99,
    "category": "Jackets",
    "imageUrl": "https://example.com/jacket.jpg"
  }')

echo $CREATE_RESPONSE | jq .
PRODUCT_ID=$(echo $CREATE_RESPONSE | jq -r '.productId')
echo "Product ID: $PRODUCT_ID"
echo ""

# Prueba 2: Listar Productos
echo "2. Listing all products..."
curl -s -X GET $API_URL/products | jq .
echo ""

# Prueba 3: Obtener Producto
echo "3. Getting product by ID..."
curl -s -X GET $API_URL/products/$PRODUCT_ID | jq .
echo ""

# Prueba 4: Actualizar Producto
echo "4. Updating product..."
curl -s -X PUT $API_URL/products/$PRODUCT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "price": 69.99,
    "description": "Updated: Now on sale!"
  }' | jq .
echo ""

# Prueba 5: Verificar Actualización
echo "5. Verifying update..."
curl -s -X GET $API_URL/products/$PRODUCT_ID | jq .
echo ""

# Prueba 6: Eliminar Producto
echo "6. Deleting product..."
curl -s -X DELETE $API_URL/products/$PRODUCT_ID | jq .
echo ""

# Prueba 7: Verificar Eliminación
echo "7. Verifying deletion (should return 404)..."
curl -s -X GET $API_URL/products/$PRODUCT_ID | jq .
echo ""

echo "=== Test Suite Complete ==="
```

**Uso**:
1. Guardar como `test-api.sh`
2. Actualizar `API_URL` con tu endpoint real
3. Hacer ejecutable: `chmod +x test-api.sh`
4. Ejecutar: `./test-api.sh`

**Nota**: Requiere `jq` para formateo JSON. Instalar con:
- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt-get install jq`
- Windows: Descargar desde https://stedolan.github.io/jq/

## Pruebas Avanzadas

### Formateo Bonito de Respuestas JSON

Agregar `| jq .` a cualquier comando curl:

```bash
curl -X GET $API_URL/products | jq .
```

### Incluir Encabezados HTTP en la Respuesta

Agregar flag `-i` para ver códigos de estado y encabezados:

```bash
curl -i -X GET $API_URL/products
```

### Salida Detallada para Depuración

Agregar flag `-v` para ver detalles completos de solicitud/respuesta:

```bash
curl -v -X GET $API_URL/products
```

### Probar Escenarios de Error

**Campo requerido faltante**:
```bash
curl -X POST $API_URL/products \
  -H "Content-Type: application/json" \
  -d '{"description": "No name or price"}'
```

**ID de producto inválido**:
```bash
curl -X GET $API_URL/products/invalid-id
```

**JSON malformado**:
```bash
curl -X POST $API_URL/products \
  -H "Content-Type: application/json" \
  -d '{invalid json}'
```

## Análisis de CloudWatch Logs

Después de ejecutar las pruebas, revisa los logs de ejecución de Lambda para depuración:

### Ver Logs (AWS CLI)

**Listar streams de logs recientes**:
```bash
aws logs tail /aws/lambda/techmoda-ai-aby-CreateItem --follow
```

**Obtener últimos 50 eventos de log**:
```bash
aws logs tail /aws/lambda/techmoda-ai-aby-CreateItem --since 5m
```

### Ver Logs (Consola de AWS)

1. Ve a CloudWatch → Log groups
2. Selecciona `/aws/lambda/{StackName}-{FunctionName}`
3. Haz clic en el stream de log más reciente
4. Busca:
   - Líneas START/END (límites de ejecución)
   - Salida de Console.log()
   - Mensajes ERROR con stack traces
   - Línea REPORT (duración, uso de memoria)

### Ejemplo de Entrada de Log

```
START RequestId: abc-123-def Version: $LATEST
2025-10-30T12:00:00.000Z  abc-123-def  INFO  Received event: {"body": "{...}"}
2025-10-30T12:00:00.100Z  abc-123-def  INFO  Created product: 123e4567...
END RequestId: abc-123-def
REPORT RequestId: abc-123-def  Duration: 150.00 ms  Billed Duration: 150 ms  Memory Size: 1024 MB  Max Memory Used: 85 MB
```

## Análisis de Trazas X-Ray

### Ver Trazas (Consola de AWS)

1. Ve a X-Ray → Traces
2. Filtra por rango de tiempo (últimos 5 minutos)
3. Haz clic en una traza para ver detalles:
   - Segmento de la Lambda Function URL / router (enrutamiento de solicitudes)
   - Segmento Lambda (ejecución de función)
   - Segmento DynamoDB (operaciones de base de datos)
4. Revisa el Service Map para vista general visual

### Qué Buscar

- **Cold starts**: Primera invocación después del despliegue (más lenta)
- **Latencia de DynamoDB**: Debe ser <50ms para GetItem
- **Duración total**: Comparar con tiempo de ejecución de Lambda
- **Errores**: Segmentos rojos indican fallas

## Problemas Comunes y Soluciones

### Problema: "curl: command not found"

**Solución**: Instalar curl
- macOS: Pre-instalado
- Windows: Usar Git Bash o instalar desde https://curl.se/
- Linux: `sudo apt-get install curl` o `sudo yum install curl`

### Problema: "Connection refused" o "Could not resolve host"

**Solución**: Verificar la Lambda Function URL
- Revisar el output `ApiUrl` de CloudFormation
- Asegurar que la URL incluya `https://` y termine en `.lambda-url.<region>.on.aws/` (sin `/Prod`)
- Quitar la barra final con `${API_URL%/}` antes de concatenar rutas

### Problema: 403 Forbidden

**Solución**: Problema de permisos
- Verificar que la función declare `Policies:` y **no** un `Role:` (son excluyentes en SAM: con `Role`,
  tus `Policies` se ignoran **en silencio**)
- Confirmar que la política apunte a la tabla correcta (`DynamoDBCrudPolicy` vs `DynamoDBReadPolicy`)
- Ver el rol que SAM generó: `aws lambda get-function-configuration --function-name <fn> --query Role`
- Re-desplegar con `sam build && sam deploy`

### Problema: 500 Internal Server Error

**Solución**: Error de ejecución de Lambda
1. Revisar CloudWatch Logs para la función específica
2. Buscar errores de JavaScript (TypeError, ReferenceError)
3. Verificar que la variable de entorno `PRODUCTS_TABLE` esté configurada
4. Comprobar que la tabla DynamoDB existe y es accesible

### Problema: 404 Not Found (razón incorrecta)

**Solución**: Problema de enrutamiento del router (Function URL)
- Verificar que el router (`functions/router/index.js`) parsee correctamente `event.rawPath`
- Revisar método HTTP (GET vs POST vs PUT vs DELETE) en `event.requestContext.http.method`
- Asegurar que el router maneje las rutas `/products` y `/products/{id}`

### Problema: Respuesta vacía o timeout

**Solución**: Timeout o error de inicialización de Lambda
- Aumentar timeout en template.yaml (predeterminado 30s)
- Verificar que la función Lambda tenga imports del AWS SDK
- Verificar compatibilidad con runtime Node.js 18.x

## Mejores Prácticas

1. **Probar incrementalmente**: No esperes a probar todas las funciones a la vez
2. **Guardar productIds**: Mantén registro de productos creados para pruebas
3. **Revisar logs inmediatamente**: Si una prueba falla, revisa CloudWatch de inmediato
4. **Usar variables de entorno**: Almacenar API_URL para facilitar las pruebas
5. **Probar casos de error**: Verificar que el manejo de errores funcione correctamente
6. **Limpiar datos de prueba**: Eliminar productos después de probar para evitar desorden

## Próximos Pasos

- Revisar [Guía de Depuración](prompts/05_DEBUGGING.md) si las pruebas fallan
- Verificar [CloudWatch Logs](prompts/05_DEBUGGING.md#prompt-51-analyze-cloudwatch-logs) para errores
- Explorar [Trazas X-Ray](prompts/06_OPERATIONS.md#prompt-61-view-x-ray-traces) para insights de rendimiento
- Ver [Estimación de Costos](COST_AND_CLEANUP.md) para detalles de precios
