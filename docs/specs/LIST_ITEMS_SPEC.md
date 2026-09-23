# Especificación de Función Lambda: ListItems

> 🏖️ **Sandbox AWS re/Start:** se invoca vía la **Lambda Function URL del router** (no API Gateway).
> El evento es **Function URL payload v2.0** y la función lleva sus **`Policies:` acotadas** (SAM le crea el rol).
> Ver [../SANDBOX-COMPAT.md](../SANDBOX-COMPAT.md).

## Propósito

Retornar todos los productos en el catálogo de moda TechModa realizando una operación Scan de DynamoDB.

## Endpoint API

**Método**: `GET`

**Ruta**: `/products`

**Trigger**: Lambda Function URL (vía router) — payload v2.0

## Esquema de Entrada

### Parámetros de Ruta
Ninguno

### Parámetros de Consulta
Ninguno

### Encabezados de Solicitud
Ninguno requerido

### Cuerpo de Solicitud
Ninguno

### Estructura de Evento (Lambda Function URL, payload v2.0)
```javascript
{
  "rawPath": "/products",
  "requestContext": { "http": { "method": "GET" } },
  "headers": { ... },
  "body": null
}
```

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
  "products": [
    {
      "productId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Classic Denim Jacket",
      "description": "Timeless denim jacket for all seasons",
      "price": 79.99,
      "category": "Jackets",
      "imageUrl": "https://example.com/jacket.jpg",
      "createdAt": "2025-10-30T12:00:00.000Z",
      "updatedAt": "2025-10-30T12:00:00.000Z"
    },
    {
      "productId": "987e6543-e21b-45d6-b789-123456789abc",
      "name": "Summer Floral Dress",
      "description": "Lightweight dress perfect for warm weather",
      "price": 59.99,
      "category": "Dresses",
      "imageUrl": "https://example.com/dress.jpg",
      "createdAt": "2025-10-30T13:00:00.000Z",
      "updatedAt": "2025-10-30T13:00:00.000Z"
    }
  ]
}
```

**Respuesta de Base de Datos Vacía**:
```json
{
  "products": []
}
```

### Respuesta de Error (500 Internal Server Error)

**Código de Estado HTTP**: 500

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
  "error": "Internal server error",
  "message": "Failed to retrieve products"
}
```

## Operaciones DynamoDB

### Operación: Scan

**Propósito**: Recuperar todos los items de la tabla TechModa-Products

**Comando AWS SDK v3**: `ScanCommand`

**Parámetros**:
```javascript
{
  TableName: process.env.PRODUCTS_TABLE
}
```

**Respuesta**:
```javascript
{
  Items: [
    {
      productId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Classic Denim Jacket",
      // ... otros atributos
    }
  ],
  Count: 2,
  ScannedCount: 2
}
```

**Nota de Rendimiento**: Scan lee toda la tabla. Para aplicaciones de producción con conjuntos de datos grandes, considera usar Query con un Global Secondary Index. Para el alcance de este capstone (< 50 productos), Scan es aceptable.

## Pasos de Implementación (Pseudocódigo)

```
1. Inicializar cliente DynamoDB y document client
   - Importar DynamoDBClient desde @aws-sdk/client-dynamodb
   - Importar DynamoDBDocumentClient y ScanCommand desde @aws-sdk/lib-dynamodb
   - Crear instancia de cliente
   - Envolver con DocumentClient para manejo simplificado de JSON

2. Definir función handler de Lambda
   - Función async: exports.handler = async (event)

3. Preparar parámetros de Scan de DynamoDB
   - TableName: process.env.PRODUCTS_TABLE

4. Ejecutar operación Scan
   - Usar try/catch para manejo de errores
   - Enviar ScanCommand a DynamoDB
   - Extraer array Items de la respuesta

5. Manejar caso exitoso
   - Envolver Items en objeto de respuesta: { products: Items }
   - Retornar respuesta HTTP (Lambda Function URL):
     * statusCode: 200
     * headers: Content-Type y CORS
     * body: JSON.stringify({ products: Items })

6. Manejar caso de error
   - Registrar error en CloudWatch (console.error)
   - Retornar respuesta de error HTTP (Lambda Function URL):
     * statusCode: 500
     * headers: Content-Type y CORS
     * body: JSON.stringify({ error: "...", message: "..." })
```

## Comando Curl de Prueba

### Obtener la Function URL (router)

Después de desplegar tu stack SAM, obtén la Function URL del router desde los outputs de CloudFormation
(output `ApiUrl`):

```bash
API_URL=$(aws cloudformation describe-stacks \
  --stack-name techmoda-ai-aby \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)
```

### Comando de Prueba

```bash
curl -X GET "${API_URL%/}/products"
```

### Respuesta Exitosa Esperada

```json
{
  "products": [
    {
      "productId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Classic Denim Jacket",
      "description": "Timeless denim jacket for all seasons",
      "price": 79.99,
      "category": "Jackets",
      "imageUrl": "https://example.com/jacket.jpg",
      "createdAt": "2025-10-30T12:00:00.000Z",
      "updatedAt": "2025-10-30T12:00:00.000Z"
    }
  ]
}
```

### Verificar en CloudWatch Logs

```bash
aws logs tail /aws/lambda/techmoda-ai-aby-ListItems --follow
```

Buscar:
- Línea START RequestId
- Salida de Console.log() mostrando resultados de Scan
- Línea END RequestId
- Línea REPORT mostrando duración y uso de memoria

## Prompt para Claude Code

Usa este prompt para generar la implementación:

```
Necesito implementar una función Lambda en Node.js 18.x que liste todos los productos de una tabla DynamoDB.

Requisitos:
- Nombre de función: ListItems
- Runtime: Node.js 18.x
- Trigger: Lambda Function URL vía router (GET /products) — evento payload v2.0
- Base de datos: Tabla DynamoDB (nombre de variable de entorno PRODUCTS_TABLE)
- Operación: Scan de todos los items
- Respuesta: Array JSON de productos con HTTP 200
- Manejo de errores: Retornar HTTP 500 si falla la operación DynamoDB
- CORS: Incluir encabezado Access-Control-Allow-Origin: *

Esquema DynamoDB:
- productId (String, clave primaria)
- name (String)
- description (String)
- price (Number)
- category (String)
- imageUrl (String)
- createdAt (String)
- updatedAt (String)

Por favor genera:
1. Archivo index.js completo con función exports.handler
2. Imports de AWS SDK v3 para DynamoDB
3. Manejo de errores con try/catch
4. Formato de respuesta HTTP (Lambda Function URL): statusCode, headers, body
5. Comentarios explicando cada sección
```

## Notas de Implementación

### Variables de Entorno

La función Lambda recibe el nombre de la tabla DynamoDB vía variable de entorno:

```javascript
const tableName = process.env.PRODUCTS_TABLE;
```

Esto es inyectado por el template SAM:

```yaml
Environment:
  Variables:
    PRODUCTS_TABLE: !Ref ProductsTable
```

### Uso de AWS SDK v3

Usa el AWS SDK v3 modular para tamaños de bundle más pequeños:

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
```

### Encabezados CORS

Incluye encabezados CORS en todas las respuestas para permitir clientes basados en navegador:

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};
```

### Registro de Errores

Siempre registra errores en CloudWatch para depuración:

```javascript
catch (error) {
  console.error('Error scanning products:', error);
  // Retornar respuesta 500
}
```

### Formato de Respuesta HTTP (Lambda Function URL)

Lambda debe retornar respuestas en esta estructura (válida para Function URL):

```javascript
{
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify({ products: [...] })
}
```

**Importante**: `body` debe ser una cadena JSON, no un objeto.

## Errores Comunes y Soluciones

### Error: "Cannot find module '@aws-sdk/client-dynamodb'"

**Causa**: AWS SDK no instalado en el directorio de la función Lambda

**Solución**: Asegura que exista `package.json` en `functions/list-items/` con dependencias del SDK, o confía en el SDK integrado de Lambda (disponible en runtime Node.js 18.x)

### Error: "PRODUCTS_TABLE is not defined"

**Causa**: Variable de entorno no configurada en template SAM

**Solución**: Verifica que `template.yaml` incluya:
```yaml
Environment:
  Variables:
    PRODUCTS_TABLE: !Ref ProductsTable
```

### Error: "AccessDeniedException: User is not authorized to perform: dynamodb:Scan"

**Causa**: El rol de ejecución de Lambda carece de permisos DynamoDB

**Solución:** confirma que la función declare `DynamoDBCrudPolicy`/`DynamoDBReadPolicy` sobre la tabla
y que **no** tenga además un `Role:` — son mutuamente excluyentes en SAM y con `Role` las `Policies`
se ignoran **en silencio**. Ver `docs/IAM.md`.

> 📚 **Material didáctico (cuenta propia):** en una cuenta sin las restricciones del sandbox, SAM crea
> un rol por función y se agrega la política de mínimo privilegio:
> ```yaml
> Policies:
>   - DynamoDBReadPolicy:
>       TableName: !Ref ProductsTable
> ```
> Ver [../SANDBOX-COMPAT.md](../SANDBOX-COMPAT.md) §2.

### Error: "undefined is not a function"

**Causa**: Import incorrecto de AWS SDK v3

**Solución**: Usa DocumentClient para manejo simplificado de JSON:
```javascript
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
```

## Criterios de Validación

Tu función ListItems está correctamente implementada cuando:

✅ GET /products retorna 200 OK
✅ La respuesta incluye array `products`
✅ Base de datos vacía retorna `{ "products": [] }`
✅ Todos los atributos del producto están presentes (productId, name, price, etc.)
✅ Los encabezados CORS están incluidos
✅ Los errores de Scan de DynamoDB retornan 500 con mensaje de error
✅ CloudWatch Logs muestra ejecución exitosa
✅ La traza X-Ray muestra segmento DynamoDB

## Próximos Pasos

Después de implementar ListItems:

1. Desplegar con `sam build && sam deploy`
2. Probar con comando curl
3. Verificar respuesta en terminal
4. Revisar CloudWatch Logs para logs de ejecución
5. Proceder a implementar la función CreateItem
