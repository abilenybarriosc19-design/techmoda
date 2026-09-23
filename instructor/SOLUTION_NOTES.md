# TechModa Capstone - Notas de Solución

## Propósito

> 🔌 El frente HTTP es una **Lambda Function URL** + **router** (no API Gateway), cada función lleva
> sus `Policies:` acotadas y **SAM le crea el rol**, el stack es **`techmoda-ai-aby`** y la región
> **us-east-1**. Ver [../docs/SANDBOX-COMPAT.md](../docs/SANDBOX-COMPAT.md) y
> [../docs/IAM.md](../docs/IAM.md).

Este documento proporciona patrones de implementación y orientación para instructores. NO contiene soluciones completas para evitar la tentación de compartirlas con los estudiantes. En su lugar, ofrece:

- Patrones clave de implementación para cada función
- Errores comunes que cometen los estudiantes
- Ejemplos de mejores prácticas
- Consideraciones de seguridad y rendimiento

**NO comparta este archivo con los estudiantes**. Diríjalos a las especificaciones y plantillas de prompts en su lugar.

## Patrones Generales de Implementación

### Configuración de AWS SDK v3

Todas las funciones Lambda deben inicializar el cliente de DynamoDB de esta manera:

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
```

**¿Por qué DocumentClient?**: Simplifica el marshalling/unmarshalling de JSON (no es necesario especificar tipos como `{S: "value"}`).

### Formato de Respuesta HTTP (Lambda Function URL)

Cada Lambda debe retornar esta estructura (válida para la Function URL):

```javascript
return {
  statusCode: 200,  // Debe ser número, no string
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify({...})  // Debe ser string, no objeto
};
```

**Errores Comunes**:
- Retornar objeto en lugar de JSON stringificado
- Faltan headers CORS
- statusCode como string ("200" en lugar de 200)

### Variables de Entorno

Siempre usar variable de entorno para el nombre de la tabla:

```javascript
const tableName = process.env.PRODUCTS_TABLE;
```

**Nunca hardcodear**: `const tableName = "techmoda-ai-aby-Products";` (se rompe cuando se despliega en diferentes entornos)

## Patrones Específicos por Función

### ListItems (GET /products)

**Operaciones Clave**:
1. Realizar DynamoDB Scan
2. Retornar array de items envuelto en campo `products`
3. Manejar tabla vacía elegantemente

**Comando Scan**:
```javascript
const result = await docClient.send(new ScanCommand({
  TableName: process.env.PRODUCTS_TABLE
}));

// result.Items es un array (array vacío si no hay items)
```

**Respuesta de Éxito**:
```javascript
return {
  statusCode: 200,
  headers: {...},
  body: JSON.stringify({ products: result.Items || [] })
};
```

**Errores Comunes**:
- No manejar array Items vacío (debería retornar array de productos vacío, no error)
- Retornar `result` directamente en lugar de envolver en `{ products: [...] }`
- No incluir headers CORS

**Nota de Rendimiento**: Scan lee la tabla completa. Para el alcance del capstone (< 50 items), esto es aceptable. En producción, usar Query con GSI para conjuntos de datos grandes.

### CreateItem (POST /products)

**Operaciones Clave**:
1. Parsear body JSON de forma segura
2. Validar campos requeridos (name, price)
3. Generar UUID para productId
4. Agregar timestamps
5. Realizar DynamoDB PutItem
6. Retornar item creado con estado 201

**Parseo de JSON**:
```javascript
let body;
try {
  body = JSON.parse(event.body);
} catch (error) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON' })
  };
}
```

**Validación**:
```javascript
if (!body.name) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({ error: 'Bad Request', message: 'Missing required field: name' })
  };
}

if (body.price === undefined || body.price === null) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({ error: 'Bad Request', message: 'Missing required field: price' })
  };
}
```

**Generación de UUID**:
```javascript
const crypto = require('crypto');
const productId = crypto.randomUUID();
```

**Timestamps**:
```javascript
const now = new Date().toISOString();
const product = {
  productId,
  name: body.name,
  description: body.description || '',
  price: body.price,
  category: body.category || '',
  imageUrl: body.imageUrl || '',
  createdAt: now,
  updatedAt: now
};
```

**Comando PutItem**:
```javascript
await docClient.send(new PutCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Item: product
}));
```

**Respuesta de Éxito** (nota 201, no 200):
```javascript
return {
  statusCode: 201,
  headers: {...},
  body: JSON.stringify(product)
};
```

**Errores Comunes**:
- No parsear event.body (tratarlo como objeto en lugar de string)
- No validar campos requeridos
- Retornar 200 en lugar de 201
- No generar UUID (esperando que el cliente lo proporcione)
- Faltan timestamps

### GetItem (GET /products/{id})

**Operaciones Clave**:
1. Extraer productId de parámetros de ruta
2. Realizar DynamoDB GetItem
3. Retornar 200 si se encuentra, 404 si no se encuentra

**Extracción de Parámetro de Ruta**:
```javascript
const productId = event.pathParameters.id;

// Verificación de seguridad opcional:
if (!productId) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({ error: 'Bad Request', message: 'Missing product ID' })
  };
}
```

**Comando GetItem**:
```javascript
const result = await docClient.send(new GetCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId }
}));
```

**Verificar Existencia**:
```javascript
if (!result.Item) {
  return {
    statusCode: 404,
    headers: {...},
    body: JSON.stringify({ error: 'Not Found', message: 'Product not found' })
  };
}

return {
  statusCode: 200,
  headers: {...},
  body: JSON.stringify(result.Item)
};
```

**Errores Comunes**:
- No verificar si Item existe (retornar undefined en lugar de 404)
- Intentar acceder a event.pathParameters sin verificar si existe
- Fallar cuando productId es inválido

**Rendimiento**: GetItem es la operación más rápida de DynamoDB (milisegundos de un dígito).

### UpdateItem (PUT /products/{id})

**Operaciones Clave**:
1. Extraer productId de parámetros de ruta
2. Parsear campos de actualización del body
3. Verificar si el producto existe (opcional pero recomendado)
4. Construir UpdateExpression dinámico
5. Actualizar timestamp updatedAt
6. Realizar DynamoDB UpdateItem
7. Retornar item actualizado

**Verificación de Existencia** (recomendado):
```javascript
const getResult = await docClient.send(new GetCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId }
}));

if (!getResult.Item) {
  return {
    statusCode: 404,
    headers: {...},
    body: JSON.stringify({ error: 'Not Found', message: 'Product not found' })
  };
}
```

**Construcción Dinámica de UpdateExpression**:
```javascript
const updates = [];
const values = {};

if (body.name !== undefined) {
  updates.push('name = :name');
  values[':name'] = body.name;
}

if (body.price !== undefined) {
  updates.push('price = :price');
  values[':price'] = body.price;
}

if (body.description !== undefined) {
  updates.push('description = :description');
  values[':description'] = body.description;
}

if (body.category !== undefined) {
  updates.push('category = :category');
  values[':category'] = body.category;
}

if (body.imageUrl !== undefined) {
  updates.push('imageUrl = :imageUrl');
  values[':imageUrl'] = body.imageUrl;
}

// Siempre actualizar timestamp
updates.push('updatedAt = :updatedAt');
values[':updatedAt'] = new Date().toISOString();

const updateExpression = 'SET ' + updates.join(', ');
```

**Comando UpdateItem**:
```javascript
const result = await docClient.send(new UpdateCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId },
  UpdateExpression: updateExpression,
  ExpressionAttributeValues: values,
  ReturnValues: 'ALL_NEW'
}));

return {
  statusCode: 200,
  headers: {...},
  body: JSON.stringify(result.Attributes)
};
```

**Errores Comunes**:
- No construir UpdateExpression dinámicamente (fallar en actualizaciones parciales)
- Hardcodear nombres de campos en lugar de usar ExpressionAttributeValues
- No actualizar timestamp updatedAt
- Olvidar `ReturnValues: 'ALL_NEW'` (no obtendrá el item actualizado de vuelta)
- Permitir actualizaciones a productId o createdAt (deberían ser inmutables)

**Alternativa (Más Simple pero Menos Flexible)**:
Actualizar todos los campos incluso si no se proporcionan. Menos código pero sobrescribe con undefined/null.

### DeleteItem (DELETE /products/{id})

**Operaciones Clave**:
1. Extraer productId de parámetros de ruta
2. Opcionalmente verificar existencia primero
3. Realizar DynamoDB DeleteItem
4. Retornar mensaje de éxito

**Implementación Simple** (sin verificación de existencia):
```javascript
await docClient.send(new DeleteCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId }
}));

return {
  statusCode: 200,
  headers: {...},
  body: JSON.stringify({
    message: 'Product deleted successfully',
    productId
  })
};
```

**Implementación Avanzada** (con verificación de existencia):
```javascript
// Verificar existencia primero
const getResult = await docClient.send(new GetCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId }
}));

if (!getResult.Item) {
  return {
    statusCode: 404,
    headers: {...},
    body: JSON.stringify({ error: 'Not Found', message: 'Product not found' })
  };
}

// Eliminar si existe
await docClient.send(new DeleteCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId }
}));

return {
  statusCode: 200,
  headers: {...},
  body: JSON.stringify({
    message: 'Product deleted successfully',
    productId
  })
};
```

**Usando ReturnValues** (enfoque alternativo):
```javascript
const result = await docClient.send(new DeleteCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId },
  ReturnValues: 'ALL_OLD'
}));

if (!result.Attributes) {
  return {
    statusCode: 404,
    headers: {...},
    body: JSON.stringify({ error: 'Not Found', message: 'Product not found' })
  };
}

return {
  statusCode: 200,
  headers: {...},
  body: JSON.stringify({
    message: 'Product deleted successfully',
    deletedProduct: result.Attributes
  })
};
```

**Errores Comunes**:
- No entender que DeleteItem es idempotente (tiene éxito incluso si el item no existe)
- Confusión sobre si verificar existencia primero (ambos enfoques son válidos)

**Decisión de Diseño**: La implementación simple (sin verificación de existencia) es aceptable para el capstone. La implementación avanzada (con verificación) demuestra mejor manejo de errores.

## Errores Comunes que Cometen los Estudiantes

### 1. Problemas de Formato de Respuesta HTTP (Lambda Function URL)

**Error**:
```javascript
return { products: [...] };  // ❌ Incorrecto
```

**Correcto**:
```javascript
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify({ products: [...] })
};
```

### 2. Tratar event.body como Objeto

**Error**:
```javascript
const name = event.body.name;  // ❌ event.body es un string
```

**Correcto**:
```javascript
const body = JSON.parse(event.body);
const name = body.name;
```

### 3. No Esperar Operaciones Asíncronas

**Error**:
```javascript
docClient.send(new GetCommand({...}));  // ❌ No esperado
return { statusCode: 200, ... };
```

**Correcto**:
```javascript
const result = await docClient.send(new GetCommand({...}));
return { statusCode: 200, body: JSON.stringify(result.Item) };
```

### 4. Nombres de Tabla Hardcodeados

**Error**:
```javascript
const tableName = "TechModa-Products";  // ❌ Se rompe en otros entornos
```

**Correcto**:
```javascript
const tableName = process.env.PRODUCTS_TABLE;
```

### 5. Manejo de Errores Faltante

**Error**:
```javascript
exports.handler = async (event) => {
  const result = await docClient.send(...);  // ❌ Sin try/catch
  return { statusCode: 200, ... };
};
```

**Correcto**:
```javascript
exports.handler = async (event) => {
  try {
    const result = await docClient.send(...);
    return { statusCode: 200, ... };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {...},
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
```

### 6. Sintaxis Incorrecta de SDK de DynamoDB

**Error** (sintaxis SDK v2 en Node.js 18):
```javascript
const result = await docClient.scan({ TableName: tableName }).promise();  // ❌ SDK v2
```

**Correcto** (SDK v3):
```javascript
const result = await docClient.send(new ScanCommand({ TableName: tableName }));
```

### 7. Headers CORS Faltantes

**Síntoma**: La API funciona en curl pero falla en el navegador

**Corrección**: Agregar a todas las respuestas:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
}
```

### 8. Códigos de Estado Incorrectos

**Errores**:
- CreateItem retornando 200 (debería ser 201)
- GetItem retornando 500 cuando el item no se encuentra (debería ser 404)
- statusCode como string: `statusCode: "200"` (debería ser número)

## Características Avanzadas (Fuera del Alcance)

Los estudiantes pueden preguntar sobre estas. NO son requeridas pero demuestran iniciativa:

### Sanitización de Entrada

```javascript
// Prevenir XSS, inyección SQL (aunque DynamoDB no es SQL)
const sanitize = (str) => str.trim().substring(0, 1000);

const product = {
  productId,
  name: sanitize(body.name),
  description: sanitize(body.description || ''),
  // ...
};
```

### Paginación (ListItems)

```javascript
// Para conjuntos de datos grandes, usar paginación
const params = {
  TableName: process.env.PRODUCTS_TABLE,
  Limit: 20
};

if (event.queryStringParameters && event.queryStringParameters.lastKey) {
  params.ExclusiveStartKey = JSON.parse(event.queryStringParameters.lastKey);
}

const result = await docClient.send(new ScanCommand(params));

return {
  statusCode: 200,
  headers: {...},
  body: JSON.stringify({
    products: result.Items,
    lastKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : null
  })
};
```

### Validación a Nivel de Campo

```javascript
// Validar que price es un número positivo
if (typeof body.price !== 'number' || body.price <= 0) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({ error: 'Bad Request', message: 'Price must be a positive number' })
  };
}

// Validar formato de URL
const urlRegex = /^https?:\/\/.+/;
if (body.imageUrl && !urlRegex.test(body.imageUrl)) {
  return {
    statusCode: 400,
    headers: {...},
    body: JSON.stringify({ error: 'Bad Request', message: 'Invalid image URL format' })
  };
}
```

### Actualizaciones Condicionales

```javascript
// Solo actualizar si el item no ha cambiado (bloqueo optimista)
const updateCommand = new UpdateCommand({
  TableName: process.env.PRODUCTS_TABLE,
  Key: { productId },
  UpdateExpression: 'SET price = :price, updatedAt = :updatedAt',
  ConditionExpression: 'updatedAt = :oldUpdatedAt',
  ExpressionAttributeValues: {
    ':price': body.price,
    ':updatedAt': new Date().toISOString(),
    ':oldUpdatedAt': body.expectedUpdatedAt  // Cliente proporciona timestamp esperado
  },
  ReturnValues: 'ALL_NEW'
});
```

## Consideraciones de Seguridad

### Lo que los Estudiantes DEBEN Hacer

✅ Usar variables de entorno para configuración
✅ Implementar políticas IAM de privilegios mínimos
✅ Incluir headers CORS para compatibilidad con navegadores
✅ Validar datos de entrada
✅ Registrar errores (pero no datos sensibles)
✅ Retornar mensajes de error apropiados (no stack traces a clientes)

### Lo que los Estudiantes NO DEBEN Hacer

❌ Hardcodear credenciales de AWS en el código
❌ Usar políticas IAM con wildcard (`"Resource": "*"`)
❌ Retornar stack traces detallados en respuestas de API
❌ Registrar datos sensibles (tarjetas de crédito, contraseñas)
❌ Permitir inyección SQL (no aplicable con DynamoDB pero buen hábito)

### Consideraciones de Producción (Más Allá del Capstone)

- Agregar autenticación (Cognito, claves API)
- Implementar limitación de tasa
- Agregar validación de solicitudes (en una cuenta propia, p. ej. validadores de API Gateway o validación en el handler)
- Usar AWS WAF para seguridad adicional
- Cifrar datos sensibles en reposo
- Habilitar CloudTrail para auditoría

## Optimización de Rendimiento

### Lo que Importa para el Capstone

- Usar GetItem sobre Scan cuando sea posible (GetItem para recuperación de un solo item)
- Mantener el código de la función Lambda pequeño (menos dependencias = arranques en frío más rápidos)
- Establecer timeout apropiado (30s está bien para el capstone, pero algunas funciones podrían necesitar menos)

### Lo que No Importa para el Capstone

- Concurrencia provisionada de Lambda (innecesaria para tráfico bajo)
- Capacidad provisionada de DynamoDB (PAY_PER_REQUEST es más simple y económico para esta escala)
- Configuración de VPC (no necesaria para acceso simple a DynamoDB)
- Capas de Lambda (excesivo para este proyecto)

### Optimización de Arranque en Frío (Avanzado)

Los estudiantes pueden notar que la primera solicitud después del despliegue es lenta (~1-2 segundos). Esto es **arranque en frío**.

**Explicación**: Lambda inicializa el runtime, carga el código, crea el cliente de DynamoDB
**Mitigación (producción)**: Concurrencia provisionada, Lambda SnapStart
**Para el capstone**: Aceptar arranques en frío (ocurre una vez por ~15 minutos de inactividad)

## Guía de Solución de Problemas para Instructores

### Diagnóstico Rápido

**El estudiante dice "no funciona"**:
1. Preguntar: "¿Qué error específico ves?"
2. Revisar: CloudWatch Logs (la mayoría de los problemas se muestran aquí)
3. Verificar: El despliegue tuvo éxito
4. Probar: Comando curl simple

**Errores de CloudWatch Log a Buscar**:
- `Cannot find module`: Falta import de SDK
- `is not a function`: Sintaxis SDK incorrecta (v2 vs v3)
- `AccessDeniedException`: Problema de permisos IAM
- `SyntaxError`: Error de parseo JSON
- `Cannot read property 'X' of undefined`: Falta parámetro de ruta o body

### Correcciones Comunes

**Error 500 → Revisar Código Lambda**:
```bash
aws logs tail /aws/lambda/techmoda-ai-aby-[FunctionName] --follow
```

**403 Forbidden → Revisar los permisos de la función**:
Verificar que declare la política correcta sobre la tabla correcta, y que **no** tenga además un
`Role:` (con `Role`, SAM ignora `Policies` **en silencio**):
```yaml
Policies:
  - DynamoDBCrudPolicy:        # ReadPolicy si la función sólo consulta
      TableName: !Ref ProductsTable
```
> 🔍 Para ver el rol que SAM generó:
> `aws lambda get-function-configuration --function-name <fn> --query Role --output text`
> y después `aws iam list-role-policies --role-name <ese-rol>`.

**502 Bad Gateway → Revisar Formato de Respuesta**:
Asegurar que Lambda retorna:
- statusCode (número)
- headers (objeto)
- body (string)

## Referencia de Pruebas

### Prueba Funcional Mínima

```bash
# Establecer la Function URL del router (output ApiUrl; sin barra final)
export API_URL="https://[fn-id].lambda-url.us-east-1.on.aws"

# Crear producto
curl -X POST "${API_URL%/}/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":99.99}'

# Listar productos
curl -X GET "${API_URL%/}/products"

# Esperado: { "products": [ {...} ] }
```

Si esto funciona, la infraestructura básica es funcional.

## Mejores Prácticas para Revisión de Código

Al revisar el código de los estudiantes, buscar:

1. **Manejo de Errores**: Bloques try/catch presentes
2. **Validación de Entrada**: Campos requeridos verificados
3. **CORS**: Headers en todas las respuestas
4. **Async/Await**: Uso apropiado con operaciones DynamoDB
5. **Variables de Entorno**: No hardcodeadas
6. **Comentarios**: Lógica clave explicada
7. **Formato**: Indentación consistente
8. **Sin Código Muerto**: Sin secciones comentadas

## Recursos para Instructores

### Documentación de AWS

- [Guía del Desarrollador de AWS SAM](https://docs.aws.amazon.com/serverless-application-model/)
- [SDK v3 de DynamoDB (JavaScript)](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/)
- [Runtime de Lambda Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)

### Comandos Útiles

```bash
# Ver recursos del stack
aws cloudformation list-stack-resources --stack-name techmoda-ai-aby --region us-east-1

# Obtener la Function URL (output ApiUrl)
aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 --query "Stacks[0].Outputs"

# Escanear tabla DynamoDB
aws dynamodb scan --table-name techmoda-ai-aby-Products

# Ver logs de Lambda
aws logs tail /aws/lambda/techmoda-ai-aby-ListItems --follow

# Eliminar stack
sam delete --stack-name techmoda-ai-aby --region us-east-1
```

---

**Recuerde**: Guíe a los estudiantes a descubrir soluciones por sí mismos. Use prompts y especificaciones para apoyar el aprendizaje, no para proporcionar respuestas completas.
