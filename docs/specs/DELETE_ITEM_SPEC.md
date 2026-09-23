# Especificación de Función Lambda: DeleteItem

> 🏖️ **Sandbox AWS re/Start:** se invoca vía la **Lambda Function URL del router** (no API Gateway).
> El evento es **Function URL payload v2.0**; el **router** reconstruye `event.pathParameters.id` desde
> `event.rawPath`. Ver [../SANDBOX-COMPAT.md](../SANDBOX-COMPAT.md).

## Propósito

Eliminar un producto del catálogo de moda TechModa usando la operación DeleteItem de DynamoDB.

## Endpoint API

**Método**: `DELETE`

**Ruta**: `/products/{id}`

**Trigger**: Lambda Function URL (vía router) con parámetro de ruta — payload v2.0

## Esquema de Entrada

### Parámetros de Ruta

**Requerido**: `id` (productId)

**Ejemplo**: `/products/123e4567-e89b-12d3-a456-426614174000`

### Parámetros de Consulta
Ninguno

### Encabezados de Solicitud
Ninguno requerido

### Cuerpo de Solicitud
Ninguno

### Estructura de Evento (Lambda Function URL, payload v2.0)
```javascript
{
  "rawPath": "/products/123e4567-e89b-12d3-a456-426614174000",
  "requestContext": { "http": { "method": "DELETE" } },
  "headers": { ... },
  "body": null
}
```
*(El router reconstruye `event.pathParameters.id` desde `rawPath` antes de invocar este handler.)*

## Esquema de Salida

### Respuesta Exitosa (200 OK)

**Código de Estado HTTP**: 200

**Encabezados**:
```javascript
{
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
}
```

**Cuerpo**:
```json
{
  "message": "Product deleted successfully",
  "productId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Respuestas de Error

#### 404 Not Found (Opcional)

**Código de Estado HTTP**: 404

**Cuerpo**:
```json
{
  "error": "Not Found",
  "message": "Product not found"
}
```

**Nota**: Esto solo se retorna si implementas una verificación de existencia. DeleteItem de DynamoDB es idempotente y tiene éxito incluso si el item no existe.

#### 500 Internal Server Error

**Código de Estado HTTP**: 500

**Cuerpo**:
```json
{
  "error": "Internal server error",
  "message": "Failed to delete product"
}
```

## Operaciones DynamoDB

### Operación: DeleteItem

**Propósito**: Eliminar item de la tabla por clave primaria

**Comando AWS SDK v3**: `DeleteCommand`

**Parámetros**:
```javascript
{
  TableName: process.env.PRODUCTS_TABLE,
  Key: {
    productId: "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**Respuesta**:
```javascript
{
  // Respuesta vacía en caso de éxito
  // DeleteItem de DynamoDB no retorna el item eliminado por defecto
}
```

**Comportamiento Idempotente**: DeleteItem tiene éxito incluso si el item no existe. Esto es por diseño para operaciones idempotentes.

### Opcional: ReturnValues para Verificación

Si deseas verificar que el item existía antes de la eliminación:

```javascript
{
  TableName: process.env.PRODUCTS_TABLE,
  Key: {
    productId: "123e4567-e89b-12d3-a456-426614174000"
  },
  ReturnValues: "ALL_OLD"
}
```

**Respuesta si el item existía**:
```javascript
{
  Attributes: {
    productId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Classic Denim Jacket",
    // ... todos los atributos antes de la eliminación
  }
}
```

**Respuesta si el item no existía**:
```javascript
{
  // La propiedad Attributes es undefined
}
```

## Pasos de Implementación (Pseudocódigo)

### Implementación Básica (Sin Verificación de Existencia)

```
1. Inicializar cliente DynamoDB
   - Importar DynamoDBClient desde @aws-sdk/client-dynamodb
   - Importar DynamoDBDocumentClient y DeleteCommand desde @aws-sdk/lib-dynamodb
   - Crear y envolver cliente

2. Definir función handler de Lambda
   - Función async: exports.handler = async (event)

3. Extraer productId de parámetros de ruta
   - const productId = event.pathParameters.id

4. Preparar parámetros DeleteItem de DynamoDB
   - TableName: process.env.PRODUCTS_TABLE
   - Key: { productId }

5. Ejecutar operación DeleteItem
   - Usar try/catch para manejo de errores
   - Enviar DeleteCommand a DynamoDB

6. Manejar caso exitoso
   - Retornar respuesta HTTP (Lambda Function URL):
     * statusCode: 200
     * headers: Content-Type y CORS
     * body: JSON.stringify({ message: "Product deleted successfully", productId })

7. Manejar caso de error
   - Registrar error en CloudWatch (console.error)
   - Retornar respuesta 500
```

### Implementación Avanzada (Con Verificación de Existencia)

```
1-3. Igual que implementación básica

4. Verificar si el producto existe
   - Ejecutar GetItem con productId
   - Si Item es undefined, retornar 404 Not Found

5. Ejecutar operación DeleteItem
   - Usar try/catch para manejo de errores
   - Enviar DeleteCommand a DynamoDB

6-7. Igual que implementación básica
```

## Comando Curl de Prueba

### Eliminar Producto Existente

Primero, crea un producto:

```bash
# API_URL = Function URL del router (output ApiUrl). ${API_URL%/} quita la barra final.

# Crear producto
RESPONSE=$(curl -s -X POST "${API_URL%/}/products" \
  -H "Content-Type: application/json" \
  -d '{"name": "Product To Delete", "price": 99.99}')

# Extraer productId
PRODUCT_ID=$(echo $RESPONSE | jq -r '.productId')
echo "Created product: $PRODUCT_ID"

# Eliminar el producto
curl -X DELETE "${API_URL%/}/products/$PRODUCT_ID"
```

### Prueba Directa (con ID conocido)

```bash
curl -X DELETE "${API_URL%/}/products/123e4567-e89b-12d3-a456-426614174000"
```

### Verificar Eliminación

```bash
# Intentar obtener el producto eliminado (debería retornar 404)
curl -X GET "${API_URL%/}/products/$PRODUCT_ID"
```

### Probar Idempotencia (Eliminar Dos Veces)

```bash
# Eliminar una vez
curl -X DELETE "${API_URL%/}/products/$PRODUCT_ID"

# Eliminar nuevamente (debería retornar 200 si no hay verificación de existencia)
curl -X DELETE "${API_URL%/}/products/$PRODUCT_ID"
```

### Flujo de Prueba Completo

```bash
#!/bin/bash

# 1. Crear producto
echo "1. Creating product..."
RESPONSE=$(curl -s -X POST "${API_URL%/}/products" \
  -H "Content-Type: application/json" \
  -d '{"name": "Temporary Product", "price": 49.99}')
PRODUCT_ID=$(echo $RESPONSE | jq -r '.productId')
echo "Created: $PRODUCT_ID"

# 2. Verificar que el producto existe
echo "2. Verifying product exists..."
curl -s -X GET "${API_URL%/}/products/$PRODUCT_ID" | jq .

# 3. Eliminar producto
echo "3. Deleting product..."
curl -s -X DELETE "${API_URL%/}/products/$PRODUCT_ID" | jq .

# 4. Verificar eliminación (debería retornar 404)
echo "4. Verifying deletion..."
curl -s -X GET "${API_URL%/}/products/$PRODUCT_ID" | jq .

# 5. Listar productos (el producto eliminado no debería aparecer)
echo "5. Listing products..."
curl -s -X GET "${API_URL%/}/products" | jq .
```

### Respuesta Exitosa Esperada

```json
{
  "message": "Product deleted successfully",
  "productId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Prompt para Claude Code

```
Necesito implementar una función Lambda en Node.js 18.x que elimine un producto de DynamoDB.

Requisitos:
- Nombre de función: DeleteItem
- Runtime: Node.js 18.x
- Trigger: Lambda Function URL vía router (DELETE /products/{id}) — el router reconstruye event.pathParameters.id
- Parámetro de ruta: id (productId)
- Base de datos: Tabla DynamoDB (nombre de variable de entorno PRODUCTS_TABLE)
- Operación: DeleteItem por productId
- Respuesta: Mensaje de éxito con HTTP 200
- Nota: DeleteItem de DynamoDB es idempotente (tiene éxito incluso si el item no existe)
- Opcional: Verificar existencia primero para retornar 404 preciso
- Manejo de errores: 500 para errores de DynamoDB
- CORS: Incluir encabezado Access-Control-Allow-Origin: *

Por favor genera:
1. Archivo index.js completo con exports.handler
2. Extraer productId desde parámetros de ruta
3. DeleteItem de DynamoDB con AWS SDK v3
4. Respuesta de éxito con mensaje de confirmación
5. Manejo de errores con try/catch
6. Formato de respuesta HTTP (Lambda Function URL)
```

## Notas de Implementación

### Operaciones Idempotentes

DeleteItem de DynamoDB siempre tiene éxito, incluso si el item no existe. Esto es intencional:

**Beneficio**: Simplifica el manejo de errores y soporta reintentos
**Compensación**: No puede distinguir entre "eliminó item existente" e "item ya no existe"

**Decisión**: Para este capstone, la implementación simple sin verificación de existencia es aceptable.

### Verificación de Existencia Opcional

Si deseas retornar 404 para productos no existentes:

```javascript
// Verificar si el producto existe
const getResult = await docClient.send(new GetCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId }
}));

if (!getResult.Item) {
  return {
    statusCode: 404,
    headers: {...},
    body: JSON.stringify({
      error: 'Not Found',
      message: 'Product not found'
    })
  };
}

// Proceder con la eliminación
await docClient.send(new DeleteCommand({...}));
```

**Compensación**: Agrega latencia (llamada extra a DynamoDB) pero proporciona mejor reporte de errores.

### ReturnValues

Usa `ReturnValues: "ALL_OLD"` para obtener datos del item eliminado:

```javascript
const result = await docClient.send(new DeleteCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId },
  ReturnValues: 'ALL_OLD'
}));

if (!result.Attributes) {
  // El item no existía
  return { statusCode: 404, ... };
}

// El item fue eliminado, retornarlo
return {
  statusCode: 200,
  headers: {...},
  body: JSON.stringify({
    message: 'Product deleted successfully',
    deletedProduct: result.Attributes
  })
};
```

### Encabezados CORS

Incluir en todas las respuestas:

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};
```

## Errores Comunes y Soluciones

### Error: "Cannot read property 'id' of undefined"

**Causa**: Parámetro de ruta no pasado correctamente

**Solución**: en el sandbox no hay rutas de API Gateway — verifica que el **router**
(`functions/router/index.js`) parsee `/products/{id}` desde `event.rawPath` y reconstruya
`event.pathParameters.id`. Si invocas el handler directamente, agrega `pathParameters` al evento de prueba.

### Error: "ValidationException: One or more parameter values were invalid"

**Causa**: Key faltante o inválido

**Solución**: Asegura que Key coincida con el esquema de la tabla:
```javascript
Key: {
  productId: "the-uuid"
}
```

### Sin Error, Pero el Item Aún Existe

**Causa**: productId incorrecto u operación DynamoDB falló silenciosamente

**Solución**:
- Verifica que productId coincida exactamente
- Revisa CloudWatch Logs para errores
- Usa AWS CLI para verificar eliminación:
```bash
aws dynamodb get-item \
  --table-name techmoda-ai-aby-Products \
  --key '{"productId": {"S": "the-uuid"}}'
```

## Criterios de Validación

Tu función DeleteItem está correctamente implementada cuando:

✅ DELETE /products/{id} retorna 200 OK
✅ La respuesta incluye mensaje de éxito y productId
✅ El producto eliminado ya no aparece en GET /products
✅ GET /products/{id} para producto eliminado retorna 404
✅ Los encabezados CORS están presentes en la respuesta
✅ CloudWatch Logs muestra operación DeleteItem
✅ La traza X-Ray muestra segmento DeleteItem de DynamoDB
✅ Eliminar ID no existente retorna 200 (o 404 si se implementó verificación de existencia)

### Verificación Adicional

**Verificar en DynamoDB**:
```bash
aws dynamodb scan \
  --table-name techmoda-ai-aby-Products \
  --filter-expression "productId = :id" \
  --expression-attribute-values '{":id": {"S": "the-uuid"}}'
```

**Esperado**: Array Items vacío

## Próximos Pasos

Después de implementar DeleteItem:

1. Desplegar con `sam build && sam deploy`
2. Crear un producto de prueba con POST /products
3. Guardar el productId
4. Eliminar con DELETE /products/{id}
5. Verificar respuesta 200
6. Intentar GET /products/{id} (debería retornar 404)
7. Intentar GET /products (el producto eliminado no debería aparecer)
8. Probar eliminar ID no existente
9. Revisar CloudWatch Logs
10. ¡Celebrar haber completado las 5 operaciones CRUD!

## ¡Felicitaciones!

Con DeleteItem implementado, ahora tienes un API REST serverless completo con:

✅ Listar todos los productos (GET /products)
✅ Crear producto (POST /products)
✅ Obtener producto por ID (GET /products/{id})
✅ Actualizar producto (PUT /products/{id})
✅ Eliminar producto (DELETE /products/{id})

**Siguiente**: Probar el flujo de extremo a extremo, documentar en README, ¡y prepararse para la entrega!
