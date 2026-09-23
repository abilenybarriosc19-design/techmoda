# Plantillas de Prompts: Depuración

Estos prompts le ayudan a solucionar problemas de ejecución de Lambda, problemas de permisos de DynamoDB y problemas comunes de serverless.

> 🏖️ **Sandbox AWS re/Start:** el frente HTTP es una **Lambda Function URL** + router (no API
> Gateway). El evento es Function URL payload v2.0 (`event.requestContext.http.method`, `event.rawPath`);
> el router reconstruye `event.pathParameters.id`. El formato de respuesta sigue siendo
> `{ statusCode, headers, body }`. Ver [../SANDBOX-COMPAT.md](../SANDBOX-COMPAT.md).

## Prompt 5.1: Analizar CloudWatch Logs

```
My Lambda function is failing and I need to analyze CloudWatch Logs.

Function name: [ListItems/CreateItem/GetItem/UpdateItem/DeleteItem]

Error seen in API response:
[paste error]

Please provide:
1. AWS CLI command to retrieve recent logs for this function
2. How to filter logs for errors
3. Common error patterns to look for
4. How to interpret stack traces
```

## Prompt 5.2: Corregir Error de Permisos de DynamoDB

```
My Lambda function is failing with a DynamoDB permission error:

Error: AccessDeniedException: User is not authorized to perform dynamodb:Scan/PutItem/GetItem/UpdateItem/DeleteItem

Function: [function name]
Operation: [Scan/PutItem/etc]
Table: TechModa-Products

I am using SAM template with DynamoDB policies.

Please help:
1. Check if SAM policy is correct
2. Verify IAM role has necessary permissions
3. Commands to check current IAM role permissions
4. How to fix permission issue
```

## Prompt 5.3: Depurar Timeout de Lambda

```
My Lambda function is timing out after 30 seconds.

Function: [function name]
Operation: [what it's doing]

Please help:
1. Where to check current timeout setting
2. How to increase timeout in SAM template
3. Why function might be slow (DynamoDB connection, large scans)
4. How to add logging to measure execution time
5. Redeploy steps after changing timeout
```

## Prompt 5.4: Corregir Error de Análisis JSON

```
My Lambda function is failing to parse JSON body from the Lambda Function URL.

Error: SyntaxError: Unexpected token in JSON at position X

Function: CreateItem or UpdateItem

Please help:
1. How the Lambda Function URL passes body to Lambda (event.body is a string; may be base64 if isBase64Encoded)
2. Proper way to parse JSON in Node.js (JSON.parse)
3. How to handle invalid JSON (try/catch)
4. Return proper 400 Bad Request response
5. Sample code for safe JSON parsing
```

## Flujos de Trabajo de Depuración Detallados

### Flujo de Trabajo 1: La Función Lambda se Bloquea

**Síntomas**:
- 500 Internal Server Error desde la API
- Sin respuesta o timeout
- CloudWatch Logs muestra error

**Prompt de Depuración**:
```
My Lambda function is crashing with this error in CloudWatch Logs:

[Paste error and stack trace from CloudWatch]

Function: [function name]
Timestamp: [when error occurred]

Please help me:
1. Identify the root cause of the crash
2. Locate the exact line causing the error
3. Suggest a fix
4. Explain how to prevent similar errors
```

### Flujo de Trabajo 2: La Operación de DynamoDB Falla

**Síntomas**:
- Error 500 mencionando DynamoDB
- AccessDeniedException o ValidationException
- La función se ejecuta pero no puede acceder a la base de datos

**Prompt de Depuración**:
```
My Lambda function can execute but DynamoDB operations are failing.

Error from CloudWatch:
[Paste DynamoDB error]

Function: [function name]
DynamoDB operation: [Scan/PutItem/GetItem/UpdateItem/DeleteItem]

Please help me:
1. Verify DynamoDB table exists
2. Check Lambda has correct permissions
3. Validate operation parameters
4. Check table name environment variable
5. Fix the issue
```

### Flujo de Trabajo 3: Formato de Respuesta Incorrecto

**Síntomas**:
- 502 Bad Gateway desde la Lambda Function URL
- Lambda se ejecuta exitosamente
- CloudWatch no muestra errores

**Prompt de Depuración**:
```
My Lambda function completes successfully but the Lambda Function URL returns 502 Bad Gateway.

CloudWatch Logs show the function returned:
[Paste return value from logs]

Please help me:
1. Verify Lambda Function URL response format requirements (statusCode, headers, body)
2. Check statusCode is a number, not a string
3. Confirm body is JSON.stringify(), not an object
4. Verify headers object is correct
5. Fix the response format
```

### Flujo de Trabajo 4: Parámetro de Ruta No Encontrado

**Síntomas**:
- GetItem/UpdateItem/DeleteItem devuelven errores
- "Cannot read property 'id' of undefined"
- Las funciones funcionan en ListItems pero no en otras

**Prompt de Depuración**:
```
My Lambda function is failing to read path parameters.

Error: Cannot read property 'id' of undefined

Function: [GetItem/UpdateItem/DeleteItem]

CloudWatch Logs show:
[Paste relevant logs]

Please help me:
1. Verify event.pathParameters exists (the router rebuilds it from event.rawPath)
2. Check the router's path parsing / route configuration
3. Show correct way to extract path parameters (from rawPath when invoked directly)
4. Add safety checks for missing parameters
```

## Patrones de Errores Comunes

### Patrón 1: Errores de Importación de AWS SDK

**Error**: `Cannot find module '@aws-sdk/client-dynamodb'`

**Prompt de Depuración**:
```
I'm getting module not found errors for AWS SDK.

Error: Cannot find module '@aws-sdk/client-dynamodb'

Runtime: Node.js 18.x

Please help:
1. Confirm AWS SDK v3 is included in Node.js 18.x Lambda runtime
2. Verify import syntax is correct
3. Check if I need package.json
4. Show correct import statements
```

### Patrón 2: Variable de Entorno Indefinida

**Error**: El nombre de la tabla es indefinido

**Prompt de Depuración**:
```
My Lambda function can't access environment variables.

Error: Cannot read property 'PRODUCTS_TABLE' of undefined

or

Table name is undefined

Please help:
1. Show correct way to read process.env.PRODUCTS_TABLE
2. Verify SAM template injects environment variables
3. Check template.yaml Environment section
4. Debug why variable isn't available
```

### Patrón 3: DynamoDB SDK v2 vs v3

**Error**: `docClient.scan is not a function`

**Prompt de Depuración**:
```
I'm getting errors with DynamoDB SDK methods.

Error: docClient.scan is not a function

I think I might be mixing SDK v2 and v3 syntax.

Please help:
1. Show correct AWS SDK v3 syntax
2. Explain difference between SDK v2 and v3
3. Provide v3 examples for all operations (Scan, PutItem, GetItem, UpdateItem, DeleteItem)
4. Fix my code
```

### Patrón 4: Problemas con Async/Await

**Error**: Lambda devuelve undefined o no espera a DynamoDB

**Prompt de Depuración**:
```
My Lambda function is returning undefined or not waiting for DynamoDB operations.

Function code:
[Paste relevant code]

Please help:
1. Verify I'm using async/await correctly
2. Check if I'm awaiting DynamoDB calls
3. Confirm handler function is async
4. Fix async flow
```

## Análisis de CloudWatch Logs

### Ver Logs Recientes

**Prompt**:
```
I need to view the most recent logs for my Lambda function.

Function name: techmoda-ai-aby-[FunctionName]

Please provide:
1. AWS CLI command to tail logs in real-time
2. Command to view last 50 log events
3. How to filter for ERROR level logs
4. How to search logs for specific text
```

### Interpretar Entradas de Log

**Prompt**:
```
I'm looking at CloudWatch Logs but don't understand the output.

Log entries:
[Paste several log lines]

Please explain:
1. What START/END/REPORT lines mean
2. How to find my console.log() output
3. What the REPORT line metrics indicate (Duration, Billed Duration, Memory)
4. How to identify errors in the logs
```

## Depuración de Rendimiento

### Ejecución Lenta de Función

**Prompt**:
```
My Lambda function is taking a long time to execute.

Function: [function name]
Average duration: [X seconds]
Expected duration: [Y seconds]

CloudWatch REPORT line:
[Paste REPORT line]

Please help:
1. Identify what's causing slowness
2. Check if it's a cold start issue
3. Optimize DynamoDB operations
4. Add timing logs to isolate slow sections
```

### Problemas de Memoria

**Prompt**:
```
My Lambda function is running out of memory or using more than expected.

Memory Size: 1024 MB
Max Memory Used: [X MB]

CloudWatch REPORT shows:
[Paste REPORT line]

Please help:
1. Identify what's consuming memory
2. Check for memory leaks
3. Optimize memory usage
4. Determine if I need more memory
```

## Validación y Pruebas

### Validar Código Lambda Localmente

**Prompt**:
```
I want to test my Lambda function locally before deploying.

Function: [function name]

Please show me:
1. How to use sam local invoke
2. How to create test events
3. How to debug locally with breakpoints
4. How to test with local DynamoDB
```

### Validar Integración de la Function URL / router

**Prompt**:
```
My Lambda function works locally but fails when invoked via the Lambda Function URL (through the router).

Please help:
1. Understand how the Lambda Function URL (payload v2.0) shapes the event (event.requestContext.http.method, event.rawPath, event.body)
2. Verify the event structure the router passes to each CRUD handler (it rebuilds pathParameters.id)
3. Test the Function URL / router integration with curl
4. Debug integration issues
```

## Corregir y Re-desplegar

**Prompt**:
```
I've identified and fixed the issue in my Lambda function.

Changes made:
[Describe changes]

Please provide:
1. Commands to rebuild and redeploy (sam build && sam deploy)
2. How to verify the fix worked
3. How to test the updated function
4. What to check in CloudWatch Logs after redeployment
```

## Mejores Prácticas de Prevención

**Prompt**:
```
I want to add better error handling and logging to prevent future issues.

Please show me:
1. How to add comprehensive try/catch blocks
2. Best practices for console.log() statements
3. How to log request/response for debugging
4. Error handling patterns for Lambda functions
5. Input validation techniques
```

## Rollback de Emergencia

**Prompt**:
```
My latest deployment broke the application and I need to rollback quickly.

Stack name: techmoda-ai-aby

Please help:
1. How to rollback to previous version
2. AWS CLI commands to revert stack
3. How to identify previous working version
4. Steps to quickly restore service
```

## Próximos Pasos

Después de depurar y corregir problemas:

1. Re-despliegue con las correcciones
2. Verifique que todas las pruebas pasen
3. Documente los problemas y soluciones
4. Agregue medidas preventivas (mejor manejo de errores, logging)
5. Proceda a [Prompts de Operaciones](06_OPERATIONS.md)
