# Especificación de Función Lambda: GetItem

> 🏖️ **Sandbox AWS re/Start:** se invoca vía la **Lambda Function URL del router** (no API Gateway).
> El evento es **Function URL payload v2.0**; el **router** extrae el `id` de `event.rawPath` y
> reconstruye `event.pathParameters.id` antes de llamar a este handler. Ver
> [../SANDBOX-COMPAT.md](../SANDBOX-COMPAT.md).

## Propósito

Recuperar un único producto por su productId del catálogo de moda TechModa usando la operación GetItem de DynamoDB.

## Endpoint API

**Método**: `GET`

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
  "requestContext": { "http": { "method": "GET" } },
  "headers": { ... },
  "body": null
}
```

El **router** parsea `rawPath` y reconstruye `event.pathParameters.id` antes de invocar este handler,
así el código del handler sigue leyendo:

**Acceso al Parámetro de Ruta**: `event.pathParameters.id`

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

#### 404 Not Found

**Código de Estado HTTP**: 404

**Cuerpo**:
```json
{
  "error": "Not Found",
  "message": "Product not found"
}
```

#### 500 Internal Server Error

**Código de Estado HTTP**: 500

**Cuerpo**:
```json
{
  "error": "Internal server error",
  "message": "Failed to retrieve product"
}
```

## Operaciones DynamoDB

### Operación: GetItem

**Propósito**: Recuperar un único item por clave primaria

**Comando AWS SDK v3**: `GetCommand`

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
  Item: {
    productId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Classic Denim Jacket",
    // ... otros atributos
  }
}
```

**Si No Se Encuentra**:
```javascript
{
  // La propiedad Item es undefined
}
```

## Pasos de Implementación (Pseudocódigo)

```
1. Inicializar cliente DynamoDB
   - Importar DynamoDBClient desde @aws-sdk/client-dynamodb
   - Importar DynamoDBDocumentClient y GetCommand desde @aws-sdk/lib-dynamodb
   - Crear y envolver cliente

2. Definir función handler de Lambda
   - Función async: exports.handler = async (event)

3. Extraer productId de parámetros de ruta
   - const productId = event.pathParameters.id

4. Preparar parámetros GetItem de DynamoDB
   - TableName: process.env.PRODUCTS_TABLE
   - Key: { productId }

5. Ejecutar operación GetItem
   - Usar try/catch para manejo de errores
   - Enviar GetCommand a DynamoDB
   - Extraer Item de la respuesta

6. Verificar si el item existe
   - Si Item es undefined/null: retornar 404 Not Found
   - Si Item existe: retornar 200 OK con producto

7. Manejar caso exitoso (item encontrado)
   - Retornar respuesta HTTP (Lambda Function URL):
     * statusCode: 200
     * headers: Content-Type y CORS
     * body: JSON.stringify(Item)

8. Manejar caso no encontrado
   - Retornar respuesta HTTP (Lambda Function URL):
     * statusCode: 404
     * headers: Content-Type y CORS
     * body: JSON.stringify({ error: "Not Found", message: "Product not found" })

9. Manejar caso de error
   - Registrar error en CloudWatch (console.error)
   - Retornar respuesta 500
```

## Comando Curl de Prueba

### Obtener Producto Existente

Primero, crea un producto y guarda su ID:

```bash
# API_URL = Function URL del router (output ApiUrl). ${API_URL%/} quita la barra final.

# Crear producto y guardar respuesta
RESPONSE=$(curl -s -X POST "${API_URL%/}/products" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Product", "price": 99.99}')

# Extraer productId (requiere jq)
PRODUCT_ID=$(echo $RESPONSE | jq -r '.productId')

# Obtener el producto
curl -X GET "${API_URL%/}/products/$PRODUCT_ID"
```

### Prueba Directa (con ID conocido)

```bash
curl -X GET "${API_URL%/}/products/123e4567-e89b-12d3-a456-426614174000"
```

### Probar 404 Not Found

```bash
curl -X GET "${API_URL%/}/products/nonexistent-id-12345"
```

**Esperado**: 404 Not Found

### Respuesta Exitosa Esperada

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

### Verificar en CloudWatch Logs

```bash
aws logs tail /aws/lambda/techmoda-ai-aby-GetItem --follow
```

## Prompt para Claude Code

```
Necesito implementar una función Lambda en Node.js 18.x que recupere un único producto por ID desde DynamoDB.

Requisitos:
- Nombre de función: GetItem
- Runtime: Node.js 18.x
- Trigger: Lambda Function URL vía router (GET /products/{id}) — el router reconstruye event.pathParameters.id
- Parámetro de ruta: id (productId)
- Base de datos: Tabla DynamoDB (nombre de variable de entorno PRODUCTS_TABLE)
- Operación: GetItem por productId
- Respuesta: Objeto de producto con HTTP 200 si se encuentra
- Respuesta: Mensaje de error con HTTP 404 si no se encuentra
- Manejo de errores: 500 para errores de DynamoDB
- CORS: Incluir encabezado Access-Control-Allow-Origin: *

Por favor genera:
1. Archivo index.js completo con exports.handler
2. Extraer productId desde event.pathParameters.id
3. GetItem de DynamoDB con AWS SDK v3
4. Verificar si el item existe
5. Retornar 404 si no se encuentra, 200 si se encuentra
6. Manejo de errores con try/catch
7. Formato de respuesta HTTP (Lambda Function URL)
```

## Notas de Implementación

### Extracción de Parámetros de Ruta

El **router** pasa los parámetros de ruta en `event.pathParameters` (los reconstruye desde
`event.rawPath`), por lo que el handler los lee igual que con API Gateway:

```javascript
const productId = event.pathParameters.id;
```

**Verificación de Seguridad** (opcional):
```javascript
if (!event.pathParameters || !event.pathParameters.id) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({
      error: 'Bad Request',
      message: 'Missing product ID'
    })
  };
}
```

### Verificación de Existencia del Item

DynamoDB GetItem retorna `undefined` para Item si no se encuentra:

```javascript
const result = await docClient.send(new GetCommand({...}));

if (!result.Item) {
  // Item no encontrado, retornar 404
  return {
    statusCode: 404,
    headers: {...},
    body: JSON.stringify({
      error: 'Not Found',
      message: 'Product not found'
    })
  };
}

// Item encontrado, retornar 200
return {
  statusCode: 200,
  headers: {...},
  body: JSON.stringify(result.Item)
};
```

### Rendimiento

GetItem es la operación DynamoDB más rápida:
- Búsqueda directa por clave
- Latencia de un dígito en milisegundos
- Fuertemente consistente por defecto

### Encabezados CORS

Incluir en todas las respuestas (200, 404, 500):

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
(`functions/router/index.js`) esté parseando `/products/{id}` desde `event.rawPath` y reconstruyendo
`event.pathParameters.id`. Si invocas el handler directamente (sin router), agrega tú mismo
`pathParameters` al evento de prueba.

### Error: "Product not found" (pero el producto existe)

**Causa**: productId incorrecto o problema de sensibilidad a mayúsculas

**Solución**:
- Copia el productId exacto de la respuesta de CreateItem
- Las claves de DynamoDB son sensibles a mayúsculas
- Verifica que la tabla tiene el item con `aws dynamodb get-item`

### Error: "ValidationException: One or more parameter values were invalid"

**Causa**: Key faltante o inválido en parámetros GetItem

**Solución**: Asegura que el objeto Key coincida con el esquema de la tabla:
```javascript
Key: {
  productId: "the-actual-uuid"
}
```

## Criterios de Validación

Tu función GetItem está correctamente implementada cuando:

✅ GET /products/{id} con ID válido retorna 200 OK
✅ La respuesta contiene objeto de producto completo
✅ GET /products/{invalid-id} retorna 404 Not Found
✅ La respuesta 404 incluye mensaje de error
✅ Los encabezados CORS están presentes en todas las respuestas
✅ CloudWatch Logs muestra operación GetItem
✅ La traza X-Ray muestra segmento GetItem de DynamoDB (rápido, <50ms)
✅ La función funciona para productos creados vía CreateItem

## Próximos Pasos

Después de implementar GetItem:

1. Desplegar con `sam build && sam deploy`
2. Crear un producto con POST /products
3. Copiar el productId retornado
4. Probar GET /products/{id} con ese ID
5. Verificar respuesta 200 con detalles del producto
6. Probar con ID no existente para verificar 404
7. Revisar CloudWatch Logs
8. Proceder a implementar la función UpdateItem
