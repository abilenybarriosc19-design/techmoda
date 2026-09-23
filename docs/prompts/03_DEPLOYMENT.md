# Plantillas de Prompts: Despliegue

Estos prompts le guían a través de la construcción y el despliegue de su aplicación serverless de TechModa usando AWS SAM.

> 🔌 **Importante:** este capstone **no usa API Gateway**. La API se expone con una **Lambda Function
> URL** (router CRUD) y **SAM le crea a cada Lambda un rol de mínimo privilegio** a partir de sus
> `Policies:` (por eso `CAPABILITY_IAM` es obligatoria). Por eso:
> - El comando real de deploy es:
>   `sam deploy --stack-name techmoda-ai-aby --region us-east-1 --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND --resolve-s3 --no-confirm-changeset`
>   (atajo: `bash scripts/deploy.sh`). **No** uses `--guided` interactivo.
> - El output `ApiUrl` es una Function URL `https://<id>.lambda-url.us-east-1.on.aws/` (sin `/Prod`).
> - Donde abajo veas "API Gateway", "TechModaApi", "execute-api", "/Prod" o
>   "techmoda-capstone", interpretá Function URL / `ApiUrl` / `techmoda-ai-aby`.
>
> Las 3 restricciones y el patrón están en [`../SANDBOX-COMPAT.md`](../SANDBOX-COMPAT.md).

## Prompt 3.1: Construir Aplicación SAM

```
I have implemented all Lambda functions and need to build the SAM application before deployment.

Project structure:
- template.yaml (SAM template)
- functions/list-items/index.js
- functions/create-item/index.js
- functions/get-item/index.js
- functions/update-item/index.js
- functions/delete-item/index.js

Please provide:
1. Command to build SAM application (sam build)
2. What happens during build process
3. Expected output and success indicators
4. Common build errors and solutions
```

## Prompt 3.2: Desplegar Aplicación SAM (Guiado)

```
I have built my SAM application (sam build completed) and need to deploy it to AWS.

This is my first deployment and I want to use guided mode.

Requirements:
- Stack name: techmoda-capstone
- Region: us-east-1
- Capabilities: CAPABILITY_IAM (for IAM role creation)
- Save configuration to samconfig.toml

Please provide:
1. Command for guided deployment (sam deploy --guided)
2. Prompts I'll see and recommended answers
3. How to confirm deployment succeeded
4. How to retrieve API Gateway URL after deployment
```

## Prompt 3.3: Desplegar Aplicación SAM (Despliegues Subsecuentes)

```
I have already deployed my SAM application once and need to redeploy after code changes.

I have samconfig.toml from previous deployment.

Please provide:
1. Command for quick redeployment (sam deploy)
2. What gets updated vs recreated
3. How to verify deployment succeeded
4. How to rollback if deployment fails
```

## Resultados Esperados

### Después de sam build

✅ Directorio `.aws-sam/build/` creado
✅ Funciones Lambda compiladas y empaquetadas
✅ Dependencias resueltas
✅ Artefactos de construcción listos para el despliegue
✅ Mensaje de éxito mostrado

### Después de sam deploy

✅ Stack de CloudFormation creado/actualizado
✅ Funciones Lambda desplegadas (con Function URLs)
✅ Tabla de DynamoDB creada
✅ Un rol de ejecución de mínimo privilegio por función, creado por el stack
✅ Outputs mostrados (incluyendo `ApiUrl` = Function URL del router)

## Guía Detallada

### Proceso de Construcción

**Comando**:
```bash
sam build
```

**Qué Sucede**:
1. SAM lee `template.yaml`
2. Valida la sintaxis de la plantilla
3. Empaqueta cada función Lambda
4. Resuelve las dependencias (si existe package.json)
5. Crea artefactos de construcción en `.aws-sam/build/`

**Salida de Éxito**:
```
Building codeuri: functions/list-items runtime: nodejs18.x ...
Running NodejsNpmBuilder:NpmPack
...
Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml
```

### Despliegue Guiado

**Comando**:
```bash
sam deploy --guided
```

**Prompts y Respuestas Recomendadas**:

```
Stack Name [sam-app]: techmoda-capstone
AWS Region [us-east-1]: us-east-1
#Shows you resources changes to be deployed and require a 'Y' to initiate deploy
Confirm changes before deploy [y/N]: y
#SAM needs permission to be able to create roles to connect to the resources in your template
Allow SAM CLI IAM role creation [Y/n]: Y
#Preserves the state of previously provisioned resources when an operation fails
Disable rollback [y/N]: N
ListItemsFunction may not have authorization defined, Is this okay? [y/N]: y
CreateItemFunction may not have authorization defined, Is this okay? [y/N]: y
GetItemFunction may not have authorization defined, Is this okay? [y/N]: y
UpdateItemFunction may not have authorization defined, Is this okay? [y/N]: y
DeleteItemFunction may not have authorization defined, Is this okay? [y/N]: y
Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]: samconfig.toml
SAM configuration environment [default]: default
```

**Progreso del Despliegue**:
```
Deploying with following values
===============================
Stack name                   : techmoda-capstone
Region                       : us-east-1
...

Initiating deployment
=====================
...

CloudFormation stack changeset
-------------------------------------------------------------------------------------------------
Operation                     LogicalResourceId             ResourceType
-------------------------------------------------------------------------------------------------
+ Add                         CreateItemFunction            AWS::Lambda::Function
+ Add                         DeleteItemFunction            AWS::Lambda::Function
+ Add                         GetItemFunction               AWS::Lambda::Function
+ Add                         ListItemsFunction             AWS::Lambda::Function
+ Add                         UpdateItemFunction            AWS::Lambda::Function
+ Add                         ProductsTable                 AWS::DynamoDB::Table
+ Add                         TechModaApi                   AWS::ApiGateway::RestApi
...
-------------------------------------------------------------------------------------------------

Changeset created successfully. ...

Deploy this changeset? [y/N]: y

2025-10-30 12:00:00 - Waiting for stack create/update to complete
...

Successfully created/updated stack - techmoda-capstone in us-east-1
```

**Outputs**:
```
CloudFormation outputs from deployed stack
-------------------------------------------------
Outputs
-------------------------------------------------
Key                 ApiUrl
Description         Base API URL (Lambda Function URL del router CRUD)
Value               https://abc123xyz.lambda-url.us-east-1.on.aws/
-------------------------------------------------
```

**IMPORTANTE**: ¡Copie la `ApiUrl` (Function URL) de los outputs!

### Despliegues Subsecuentes

Después del primer despliegue, use un comando más simple:

**Comando**:
```bash
sam build && sam deploy
```

Sin prompts - usa la configuración guardada de `samconfig.toml`.

## Prompts de Solución de Problemas

### Fallos de Construcción

```
My sam build command is failing with this error:

[Paste error message]

Please help me:
1. Identify the cause of the build failure
2. Check if template.yaml has syntax errors
3. Verify function paths are correct
4. Suggest fixes
```

### Fallos de Despliegue

```
My sam deploy command is failing.

Error message:
[Paste error from CloudFormation]

Stack status: [CREATE_FAILED/UPDATE_FAILED/ROLLBACK_COMPLETE]

Please help me:
1. Interpret the CloudFormation error
2. Identify which resource failed to create
3. Suggest solutions (IAM permissions, resource limits, etc.)
4. How to delete failed stack and retry
```

### URL de API Faltante

```
My deployment succeeded but I don't see the API Gateway URL in the outputs.

Please help me:
1. Show me how to retrieve the API URL from CloudFormation
2. AWS CLI command to get stack outputs
3. How to find API Gateway URL in AWS Console
```

### Errores de Permisos

```
I'm getting permission errors during deployment:

Error: User is not authorized to perform: cloudformation:CreateStack

Please help me:
1. List required IAM permissions for SAM deployment
2. Verify my IAM user has necessary permissions
3. Contact bootcamp instructor if needed
```

## Validación Después del Despliegue

### Verificar Estado del Stack

```bash
aws cloudformation describe-stacks \
  --stack-name techmoda-ai-aby \
  --query "Stacks[0].StackStatus" \
  --output text
```

**Esperado**: `CREATE_COMPLETE` o `UPDATE_COMPLETE`

### Listar Recursos del Stack

```bash
aws cloudformation list-stack-resources \
  --stack-name techmoda-ai-aby
```

**Debería Ver** (base S0):
- 1 función Lambda (router) + su `AWS::Lambda::Url`
- 1 tabla DynamoDB
- S3 + CloudFront (frontend)
- Grupos de CloudWatch Logs
- Los roles IAM de ejecución (uno por función, creados por el stack)
- (NO hay API Gateway)

### Obtener URL de API

```bash
aws cloudformation describe-stacks \
  --stack-name techmoda-ai-aby \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text
```

### Probar Endpoint de API

```bash
API_URL=$(aws cloudformation describe-stacks --stack-name techmoda-ai-aby \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
curl "${API_URL%/}/products"
```

**Esperado**: 200 OK con `{"products": []}`

## Problemas Comunes y Soluciones

### Problema: "Stack already exists"

**Síntoma**: Error durante el primer despliegue

**Prompt de Solución**:
```
I'm getting "Stack techmoda-capstone already exists" error but this is my first deployment.

Please help me:
1. Check if a stack with this name exists in my account
2. Delete the existing stack if needed
3. Choose a different stack name
4. Retry deployment
```

### Problema: "CAPABILITY_IAM not provided"

**Síntoma**: Despliegue rechazado

**Solución**: Responda "Y" al prompt "Allow SAM CLI IAM role creation"

### Problema: "No changes to deploy"

**Síntoma**: SAM dice que no se detectaron cambios

**Prompt de Solución**:
```
SAM deploy says "No changes to deploy" but I modified my Lambda function code.

Please help me:
1. Verify I ran sam build before sam deploy
2. Check if code changes are in the right location
3. Force redeployment if needed
```

### Problema: Tiempo de despliegue largo

**Normal**: El primer despliegue toma 3-5 minutos
**Preocupación**: Si >10 minutos, verifique los Eventos de CloudFormation

**Prompt**:
```
My deployment has been running for over 10 minutes.

Please help me:
1. Check CloudFormation Events for stuck resources
2. Identify what's taking long
3. Determine if I should cancel and retry
```

## Mejores Prácticas

✅ Siempre ejecute `sam build` antes de `sam deploy`
✅ Guarde la URL de API Gateway inmediatamente después del despliegue
✅ Verifique la consola de CloudFormation si el despliegue parece atascado
✅ Mantenga `samconfig.toml` en control de versiones
✅ Use el mismo nombre de stack para despliegues subsecuentes
✅ Verifique el despliegue con una prueba simple de curl

## Próximos Pasos

Después de un despliegue exitoso:

1. Guarde la URL de API Gateway
2. Pruebe todos los endpoints con curl
3. Verifique que los CloudWatch Logs estén capturando la ejecución
4. Revise los traces de X-Ray
5. Proceda a [Prompts de Pruebas](04_TESTING.md)
