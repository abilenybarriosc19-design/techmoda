# Plantillas de Prompts: Operaciones

Estos prompts le ayudan a monitorear traces de X-Ray, estimar costos de AWS, limpiar recursos y solucionar problemas de fallos de eliminación.

> 🏖️ **Sandbox AWS re/Start:** el stack se llama **`techmoda-ai-aby`** y el frente HTTP es **Lambda
> Function URLs** (no API Gateway). El cleanup elimina las Function URLs junto con las Lambdas. Ver
> [../SANDBOX-COMPAT.md](../SANDBOX-COMPAT.md).

## Prompt 6.1: Ver Traces de X-Ray

```
I want to analyze X-Ray traces for my API to understand request flow.

Stack: techmoda-ai-aby

Please provide:
1. Where to find X-Ray traces in AWS Console
2. How to interpret service map
3. How to identify slow operations
4. What to look for in trace details
```

## Prompt 6.2: Estimar Costos de AWS

```
I need to estimate costs for my TechModa capstone project.

Architecture:
- 5 Lambda functions (Node.js 18.x, 256 MB memory, avg 200ms execution)
- Lambda Function URLs (router CRUD + per-AI-function; no API Gateway)
- DynamoDB table (PAY_PER_REQUEST billing)
- CloudWatch Logs (7 days retention)
- X-Ray tracing

Usage estimate:
- 50 API requests during development/testing
- 10 products in database
- 100 Lambda invocations total
- 1 day of active use

Please provide:
1. Cost breakdown by service
2. Total estimated cost
3. Which costs are covered by AWS Free Tier
4. Confirmation this is under $1 USD
```

## Prompt 6.3: Limpiar Recursos

```
I have finished testing my TechModa capstone and need to delete all resources to avoid charges.

Stack name: techmoda-ai-aby

Please provide:
1. Command to delete SAM stack (sam delete)
2. Confirmation prompts I'll see
3. What resources get deleted (Lambda + Function URLs, DynamoDB, and the per-function IAM execution roles the stack created)
4. How to verify deletion completed
5. How to check AWS CloudFormation console for DELETE_COMPLETE status
6. Estimated time for full deletion
```

## Prompt 6.4: Solucionar Problema de Fallo de Eliminación de Stack

```
I tried to delete my SAM stack but it failed.

Error: [paste error if shown]

Stack status: DELETE_FAILED

Please help:
1. Common reasons for deletion failure
2. How to check which resources failed to delete
3. Manual cleanup steps if needed
4. How to retry deletion
5. How to force delete if necessary
```

## Flujos de Trabajo de Operaciones Detallados

### Flujo de Trabajo 1: Monitoreo de X-Ray

**Objetivo**: Entender el flujo de solicitudes y el rendimiento

**Prompt**:
```
I want to use X-Ray to analyze my API's performance and identify bottlenecks.

Stack: techmoda-ai-aby
Endpoint tested: [POST/GET/PUT/DELETE /products]

Please show me:
1. How to access X-Ray console
2. How to filter traces by time range
3. How to interpret the service map (Lambda Function URL → Lambda → DynamoDB)
4. What "cold start" looks like in traces
5. How to identify slow DynamoDB operations
6. What good vs bad performance looks like
```

### Flujo de Trabajo 2: Análisis de Service Map

**Prompt**:
```
I'm looking at the X-Ray service map but don't understand what I'm seeing.

Please explain:
1. What each node represents (Lambda Function URL, Lambda, DynamoDB)
2. What the connections/edges mean
3. What the colors indicate (green=healthy, red=errors, orange=warnings)
4. How to click into individual services for details
5. What metrics are shown (latency, request count, error rate)
```

### Flujo de Trabajo 3: Detalles de Trace

**Prompt**:
```
I clicked on a specific trace in X-Ray and want to understand the details.

Trace details show:
- Total duration: [X ms]
- Multiple segments

Please explain:
1. What each segment represents
2. How to identify which Lambda function was called
3. How to see DynamoDB operation details
4. What "overhead" vs actual execution time means
5. How to identify performance optimization opportunities
```

## Gestión de Costos

### Estimación Detallada de Costos

**Prompt**:
```
I want a detailed breakdown of my capstone project costs.

Usage data:
- Lambda invocations: [count]
- DynamoDB read operations: [count]
- DynamoDB write operations: [count]
- Lambda Function URL requests: [count] (billed as Lambda invocations, no extra API Gateway cost)
- Data transfer: [estimated MB]
- CloudWatch Logs: [estimated MB]
- X-Ray traces: [count]

Please provide:
1. Cost per service with calculations
2. Free Tier coverage for each service
3. Out-of-pocket costs (if any)
4. Total estimated bill
```

### Monitorear Costos Actuales

**Prompt**:
```
I want to check my actual AWS costs for the capstone project.

Please show me:
1. How to access AWS Billing Dashboard
2. Where to see Month-to-Date costs
3. How to filter by service (Lambda, DynamoDB)
4. How to set up billing alerts
5. How to track Free Tier usage
```

### Optimización de Costos

**Prompt**:
```
I want to optimize costs for my capstone project.

Current configuration:
- Lambda memory: 1024 MB
- Lambda timeout: 30 seconds
- DynamoDB: PAY_PER_REQUEST
- CloudWatch Logs retention: 7 days

Please suggest:
1. Which settings can be optimized
2. Trade-offs of each optimization
3. What changes would save the most cost
4. What should NOT be changed (functionality impact)
```

## Limpieza de Recursos

### Limpieza Completa

**Prompt**:
```
I need to delete ALL resources created for my TechModa capstone.

Stack name: techmoda-ai-aby
Region: us-east-1

Please provide step-by-step:
1. Command to delete stack
2. Expected prompts and answers
3. How long deletion takes
4. How to verify everything is deleted
5. What to check in AWS console
6. Confirmation that I won't incur future charges
```

### Verificar Eliminación

**Prompt**:
```
I ran sam delete and it says it completed, but I want to verify everything is gone.

Please provide commands to check:
1. CloudFormation stack status
2. Lambda functions (should be none)
3. Lambda Function URLs (deleted with their functions)
4. DynamoDB tables (should be none)
5. CloudWatch Log Groups (may remain temporarily)
6. Note: each Lambda's execution role was created by the stack, so it is deleted with the stack
```

### Problemas de Eliminación Parcial

**Prompt**:
```
Some resources were deleted but others remain.

Deleted:
- Lambda functions
- Lambda Function URLs

Still exist:
- DynamoDB table
- CloudWatch Log Groups
- [other resources]

Please help:
1. Understand why some resources weren't deleted
2. Manually delete remaining resources
3. Verify no charges will accrue
4. Clean up completely
```

## Solución de Problemas de Eliminación

### Estado DELETE_FAILED

**Prompt**:
```
My stack deletion failed and is now in DELETE_FAILED status.

Stack name: techmoda-ai-aby

CloudFormation Events show:
[Paste error from Events tab]

Please help:
1. Identify which resource failed to delete
2. Understand why it failed
3. Manually delete the problematic resource
4. Retry stack deletion
5. Force deletion if necessary
```

### Bucket S3 No Vacío

**Prompt**:
```
Stack deletion failed because S3 bucket is not empty.

Error: Cannot delete S3 bucket: bucket not empty

Please help:
1. Find the S3 bucket name
2. Empty the bucket (delete all objects)
3. Retry stack deletion
4. Automate bucket cleanup
```

### Protección de Tabla DynamoDB

**Prompt**:
```
DynamoDB table failed to delete due to deletion protection.

Error: Cannot delete table: deletion protection is enabled

Please help:
1. Disable deletion protection
2. Retry table deletion
3. Verify table is fully deleted
```

### Stack de CloudFormation Atascado

**Prompt**:
```
My CloudFormation stack is stuck in DELETE_IN_PROGRESS for over 10 minutes.

Status: DELETE_IN_PROGRESS
Time: [X minutes]

Please help:
1. Check if this is normal or stuck
2. Identify which resource is blocking
3. How long to wait before taking action
4. How to manually intervene if needed
```

## Monitoreo y Alertas

### Configurar Alertas de Facturación

**Prompt**:
```
I want to set up billing alerts to warn me if costs exceed $1.

Please show me:
1. How to enable billing alerts in AWS
2. How to create CloudWatch alarm for billing
3. Set threshold to $1 USD
4. Configure email notification
5. Test the alert
```

### Monitorear Rendimiento de Lambda

**Prompt**:
```
I want to monitor my Lambda functions' performance over time.

Metrics I care about:
- Invocation count
- Duration
- Errors
- Throttles

Please show me:
1. Where to find Lambda metrics in CloudWatch
2. How to create custom dashboards
3. How to set up alarms for errors
4. Best practices for Lambda monitoring
```

### Monitoreo de DynamoDB

**Prompt**:
```
I want to monitor my DynamoDB table usage.

Metrics I need:
- Read/Write capacity consumption
- Item count
- Table size
- Throttled requests

Please show me:
1. Where to find DynamoDB metrics
2. How to interpret PAY_PER_REQUEST metrics
3. How to monitor for unexpected spikes
4. Cost implications of metrics
```

## Documentación y Reportes

### Generar Reporte de Costos

**Prompt**:
```
I need to document my AWS costs for the capstone submission.

Please help me create:
1. Cost breakdown table (service, estimated cost, actual cost)
2. Proof of Free Tier usage
3. Total cost summary
4. Screenshot recommendations from AWS Console
```

### Documentar Análisis de X-Ray

**Prompt**:
```
I want to document X-Ray traces for my capstone report.

Please suggest:
1. Which traces to capture (screenshots)
2. How to show service map
3. What metrics to highlight
4. How to demonstrate observability
```

## Mejores Prácticas

**Prompt**:
```
What are best practices for operating a serverless application in production?

Please provide:
1. Monitoring recommendations
2. Alerting strategies
3. Cost optimization techniques
4. Performance tuning tips
5. Security considerations
6. Disaster recovery planning
```

## Procedimientos de Emergencia

### Costos Inesperadamente Altos

**Prompt**:
```
I'm seeing unexpectedly high costs in my AWS billing.

Current charges: $[amount]
Expected: Under $1

Please help immediately:
1. Identify what's causing high costs
2. Stop the bleeding (disable/delete expensive resources)
3. Review billing details
4. Prevent future occurrences
```

### Incidente de Seguridad

**Prompt**:
```
I suspect my AWS credentials may have been compromised.

Please provide immediate steps:
1. Disable current access keys
2. Review CloudTrail for unauthorized activity
3. Check for unexpected resources
4. Secure my account
5. Create new credentials
```

## Operaciones Post-Capstone

### Mantener Recursos en Ejecución

**Prompt**:
```
I want to keep my capstone running for portfolio purposes but minimize costs.

Please advise:
1. What's the minimum cost to keep it running
2. How to monitor for unexpected usage
3. Set up budget alerts
4. Cost optimization strategies
5. When to eventually shut it down
```

### Archivar y Documentar

**Prompt**:
```
I want to archive my capstone project before deleting resources.

Please help me:
1. Export DynamoDB table data
2. Save CloudWatch Logs
3. Capture X-Ray traces
4. Screenshot the Lambda Function URL configuration (and stack outputs)
5. Document architecture for portfolio
6. Then safely delete everything
```

## Próximos Pasos

Después de las operaciones y limpieza:

✅ Verificar que todos los recursos estén eliminados
✅ Confirmar $0 de cargos futuros
✅ Documentar costos y aprendizajes
✅ Guardar URL del repositorio GitHub
✅ Enviar proyecto capstone
✅ Agregar a portfolio/LinkedIn
