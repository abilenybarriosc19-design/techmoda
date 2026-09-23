# Especificación de Función Lambda: CreateItem

> 🏖️ **Sandbox AWS re/Start:** se invoca vía la **Lambda Function URL del router** (no API Gateway).
> El evento es **Function URL payload v2.0**; el router reusa este handler. Ver
> [../SANDBOX-COMPAT.md](../SANDBOX-COMPAT.md).

## Propósito

Agregar un nuevo producto al catálogo de moda TechModa realizando una operación PutItem de DynamoDB con UUID generado automáticamente y timestamps.

## Endpoint API

**Método**: `POST`

**Ruta**: `/products`

**Trigger**: Lambda Function URL (vía router) con cuerpo JSON — payload v2.0

## Esquema de Entrada

### Parámetros de Ruta
Ninguno

### Parámetros de Consulta
Ninguno

### Encabezados de Solicitud
```
Content-Type: application/json
```

### Cuerpo de Solicitud

**Campos Requeridos**: `name`, `price`

**Campos Opcionales**: `description`, `category`, `imageUrl`

**Ejemplo**:
```json
{
  "name": "Classic Denim Jacket",
  "description": "Timeless denim jacket for all seasons",
  "price": 79.99,
  "category": "Jackets",
  "imageUrl": "https://example.com/denim-jacket.jpg"
}
```

**Ejemplo Mínimo**:
```json
{
  "name": "Summer Dress",
  "price": 49.99
}
```

### Estructura de Evento (Lambda Function URL, payload v2.0)
```javascript
{
  "rawPath": "/products",
  "requestContext": { "http": { "method": "POST" } },
  "headers": {
    "content-type": "application/json"
  },
  "body": "{\"name\":\"Classic Denim Jacket\",\"price\":79.99}",
  "isBase64Encoded": false
}
```
*(El router lee `event.requestContext.http.method` + `event.rawPath` y, si `isBase64Encoded` es
`true`, decodifica el body antes de pasarlo al handler.)*

**Importante**: `event.body` es una cadena JSON, no un objeto. Debe parsearlo con `JSON.parse(event.body)`.

## Esquema de Salida

### Respuesta Exitosa (201 Created)

**Código de Estado HTTP**: 201

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

#### 400 Bad Request (Campos Requeridos Faltantes)

**Código de Estado HTTP**: 400

**Cuerpo**:
```json
{
  "error": "Bad Request",
  "message": "Missing required field: name"
}
```

O:
```json
{
  "error": "Bad Request",
  "message": "Missing required field: price"
}
```

#### 400 Bad Request (JSON Inválido)

**Cuerpo**:
```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

#### 500 Internal Server Error

**Código de Estado HTTP**: 500

**Cuerpo**:
```json
{
  "error": "Internal server error",
  "message": "Failed to create product"
}
```

## Operaciones DynamoDB

### Operación: PutItem

**Propósito**: Crear nuevo item en la tabla TechModa-Products

**Comando AWS SDK v3**: `PutCommand`

**Parámetros**:
```javascript
{
  TableName: process.env.PRODUCTS_TABLE,
  Item: {
    productId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Classic Denim Jacket",
    description: "Timeless denim jacket for all seasons",
    price: 79.99,
    category: "Jackets",
    imageUrl: "https://example.com/jacket.jpg",
    createdAt: "2025-10-30T12:00:00.000Z",
    updatedAt: "2025-10-30T12:00:00.000Z"
  }
}
```

**Respuesta**:
PutItem retorna una respuesta vacía en caso de éxito. La función debe retornar el item creado.

## Pasos de Implementación (Pseudocódigo)

```
1. Inicializar cliente DynamoDB
   - Importar DynamoDBClient desde @aws-sdk/client-dynamodb
   - Importar DynamoDBDocumentClient y PutCommand desde @aws-sdk/lib-dynamodb
   - Crear y envolver cliente

2. Definir función handler de Lambda
   - Función async: exports.handler = async (event)

3. Parsear cuerpo de solicitud
   - Usar try/catch para JSON.parse(event.body)
   - Si falla el parseo, retornar 400 Bad Request

4. Validar campos requeridos
   - Verificar si body.name existe
   - Verificar si body.price existe
   - Si falta alguno, retornar 400 con mensaje de error específico

5. Generar objeto de producto
   - productId: crypto.randomUUID()
   - name: body.name
   - description: body.description (opcional)
   - price: body.price
   - category: body.category (opcional)
   - imageUrl: body.imageUrl (opcional)
   - createdAt: new Date().toISOString()
   - updatedAt: new Date().toISOString()

6. Ejecutar operación PutItem
   - Usar try/catch para manejo de errores
   - Enviar PutCommand a DynamoDB
   - Parámetros: TableName e Item

7. Manejar caso exitoso
   - Retornar respuesta HTTP (Lambda Function URL):
     * statusCode: 201
     * headers: Content-Type y CORS
     * body: JSON.stringify(product)

8. Manejar casos de error
   - Registrar error en CloudWatch (console.error)
   - Retornar respuesta 500 con detalles del error
```

## Comando Curl de Prueba

> `API_URL` = Function URL del router (output `ApiUrl`), p. ej.
> `https://<id>.lambda-url.us-east-1.on.aws`. `${API_URL%/}` quita la barra final.

### Crear Producto con Todos los Campos

```bash
curl -X POST "${API_URL%/}/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Classic Denim Jacket",
    "description": "Timeless denim jacket for all seasons",
    "price": 79.99,
    "category": "Jackets",
    "imageUrl": "https://example.com/denim-jacket.jpg"
  }'
```

### Crear Producto con Campos Mínimos

```bash
curl -X POST "${API_URL%/}/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Dress",
    "price": 49.99
  }'
```

### Probar Validación (Nombre Faltante)

```bash
curl -X POST "${API_URL%/}/products" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 49.99
  }'
```

**Esperado**: 400 Bad Request con "Missing required field: name"

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

**Importante**: Guarde el `productId` de la respuesta para usarlo en las pruebas de Get, Update y Delete.

### Verificar en DynamoDB

```bash
aws dynamodb scan \
  --table-name techmoda-ai-aby-Products \
  --query "Items[*].[productId.S, name.S, price.N]"
```

## Prompt para Claude Code

```
Necesito implementar una función Lambda en Node.js 18.x que cree un nuevo producto en DynamoDB.

Requisitos:
- Nombre de función: CreateItem
- Runtime: Node.js 18.x
- Trigger: Lambda Function URL vía router (POST /products con cuerpo JSON) — evento payload v2.0
- Base de datos: Tabla DynamoDB (nombre de variable de entorno PRODUCTS_TABLE)
- Validación de entrada: name y price son campos requeridos
- Generar UUID para productId usando crypto.randomUUID()
- Agregar timestamps: createdAt y updatedAt (formato ISO 8601)
- Respuesta: Objeto de producto creado con HTTP 201
- Manejo de errores: 400 para errores de validación, 500 para errores de DynamoDB
- CORS: Incluir encabezado Access-Control-Allow-Origin: *

Cuerpo JSON de entrada:
{
  "name": "Nombre del producto",
  "description": "Descripción",
  "price": 99.99,
  "category": "Categoría",
  "imageUrl": "https://..."
}

Por favor genera:
1. Archivo index.js completo con exports.handler
2. AWS SDK v3 para DynamoDB
3. Lógica de validación de entrada
4. Generación de UUID
5. Generación de timestamps
6. Operación PutItem de DynamoDB
7. Respuestas de error apropiadas (400/500)
8. Formato de respuesta HTTP (Lambda Function URL)
```

## Notas de Implementación

### Generación de UUID

Usa el módulo crypto integrado de Node.js:

```javascript
const crypto = require('crypto');

const productId = crypto.randomUUID();
// Ejemplo: "123e4567-e89b-12d3-a456-426614174000"
```

**Alternativa**: Importar paquete `uuid`, pero crypto es integrado y suficiente.

### Timestamps ISO 8601

Usa el objeto Date de JavaScript:

```javascript
const timestamp = new Date().toISOString();
// Ejemplo: "2025-10-30T12:00:00.000Z"
```

### Validación de Entrada

Verifica campos requeridos antes de la operación DynamoDB:

```javascript
if (!body.name) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({
      error: 'Bad Request',
      message: 'Missing required field: name'
    })
  };
}

if (!body.price) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({
      error: 'Bad Request',
      message: 'Missing required field: price'
    })
  };
}
```

### Seguridad en Parseo de JSON

Envuelve JSON.parse en try/catch:

```javascript
let body;
try {
  body = JSON.parse(event.body);
} catch (error) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({
      error: 'Bad Request',
      message: 'Invalid JSON in request body'
    })
  };
}
```

### Código de Estado 201 Created

Usa 201 (no 200) para indicar creación de recurso:

```javascript
return {
  statusCode: 201,
  headers: {...},
  body: JSON.stringify(product)
};
```

## Errores Comunes y Soluciones

### Error: "Missing required field: name"

**Causa**: El cuerpo de solicitud no incluye el campo `name`

**Solución**: Asegura que el comando curl incluya `"name": "..."` en el cuerpo JSON

### Error: "SyntaxError: Unexpected token..."

**Causa**: JSON malformado en el cuerpo de solicitud

**Solución**: Valida sintaxis JSON. Usa un validador JSON en línea o `jq` para verificar:
```bash
echo '{"name":"Test","price":99.99}' | jq .
```

### Error: "crypto.randomUUID is not a function"

**Causa**: Usando versión de Node.js < 14.17

**Solución**: Verifica que el runtime de Lambda sea Node.js 18.x en template.yaml:
```yaml
Runtime: nodejs18.x
```

### Error: "ConditionalCheckFailedException"

**Causa**: Intentando crear producto con productId existente (improbable con UUID)

**Solución**: Esto no debería ocurrir con UUIDs generados aleatoriamente

## Criterios de Validación

Tu función CreateItem está correctamente implementada cuando:

✅ POST /products con cuerpo válido retorna 201 Created
✅ La respuesta incluye `productId` generado automáticamente (formato UUID)
✅ La respuesta incluye timestamps `createdAt` y `updatedAt`
✅ `name` faltante retorna 400 con error apropiado
✅ `price` faltante retorna 400 con error apropiado
✅ JSON inválido retorna 400 con error de parseo
✅ El producto aparece en la tabla DynamoDB
✅ Subsecuente GET /products incluye el producto creado
✅ CloudWatch Logs muestra operación PutItem exitosa
✅ La traza X-Ray muestra segmento PutItem de DynamoDB

## Próximos Pasos

Después de implementar CreateItem:

1. Desplegar con `sam build && sam deploy`
2. Probar con comando curl
3. Guardar el `productId` retornado para pruebas posteriores
4. Verificar que el producto existe con GET /products
5. Revisar CloudWatch Logs para detalles de ejecución
6. Proceder a implementar la función GetItem
