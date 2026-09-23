# Guía de Estimación de Costos y Limpieza de AWS

## Desglose de Costos

Este proyecto capstone está diseñado para mantenerse **bajo $1 USD** durante todo el período de desarrollo, pruebas y demostración. Aquí está el desglose detallado de costos por servicio.

### DynamoDB

**Modelo de Precios**: PAY_PER_REQUEST (Bajo Demanda)

**Componentes de Costo**:
- **Solicitudes de escritura**: $1.25 por millón de unidades de solicitud de escritura
- **Solicitudes de lectura**: $0.25 por millón de unidades de solicitud de lectura
- **Almacenamiento**: $0.25 por GB-mes

**Uso Estimado**:
- 10 operaciones CreateItem (escrituras)
- 20 operaciones GetItem (lecturas)
- 10 operaciones UpdateItem (escrituras)
- 5 operaciones DeleteItem (escrituras)
- 20 operaciones ListItems (Scan lee ~10 items cada uno = 200 unidades de lectura)
- Almacenamiento: <1 MB para ~10 productos

**Cálculo**:
- Solicitudes de escritura: 25 escrituras × $1.25 / 1,000,000 = $0.00003
- Solicitudes de lectura: 220 lecturas × $0.25 / 1,000,000 = $0.00006
- Almacenamiento: 0.001 GB × $0.25 = $0.00025

**Total DynamoDB**: **~$0.00034** (efectivamente $0.00)

**Cobertura de AWS Free Tier**:
- 25 GB de almacenamiento (gratis)
- 2.5 millones de solicitudes de lectura por mes (gratis)
- 1 millón de solicitudes de escritura por mes (gratis)

Tu uso está **100% cubierto por Free Tier**.

### AWS Lambda

**Modelo de Precios**: Pago por invocación + tiempo de cómputo

**Componentes de Costo**:
- **Invocaciones**: $0.20 por millón de solicitudes
- **Tiempo de cómputo**: $0.0000166667 por GB-segundo
- **Free Tier**: Primer 1 millón de solicitudes + 400,000 GB-segundos por mes

**Uso Estimado**:
- 100 invocaciones totales de Lambda entre las 5 funciones
- Tiempo de ejecución promedio: 200ms por invocación
- Memoria: 1024 MB (1 GB) por función

**Cálculo**:
- Invocaciones: 100 × $0.20 / 1,000,000 = $0.00002
- Tiempo de cómputo: 100 invocaciones × 0.2 segundos × 1 GB × $0.0000166667 = $0.00033

**Total Lambda**: **~$0.00035** (efectivamente $0.00)

**Cobertura de AWS Free Tier**:
- 1 millón de solicitudes (gratis)
- 400,000 GB-segundos (gratis)
- Tu uso: 100 solicitudes + 20 GB-segundos

Tu uso está **100% cubierto por Free Tier**.

### Lambda Function URLs

> 🏖️ **Sandbox AWS re/Start:** el frente HTTP son **Lambda Function URLs**, no API Gateway.

**Modelo de Precios**: **sin costo adicional**. Las Function URLs no tienen cargo propio; cada petición
se factura como una **invocación de Lambda** (ya contabilizada arriba). No hay tarifa por millón de
solicitudes ni stage como en API Gateway.

**Componentes de Costo**:
- **Invocaciones**: incluidas en el cálculo de Lambda (ver sección anterior)
- **Transferencia de datos**: $0.09 por GB saliente (primer 1 GB gratis)

**Total Function URLs**: **$0.00** (solo se paga la invocación de Lambda, ya cubierta por Free Tier)

### CloudWatch Logs

**Modelo de Precios**: Pago por GB ingerido y almacenado

**Componentes de Costo**:
- **Ingesta**: $0.50 por GB
- **Almacenamiento**: $0.03 por GB por mes
- **Free Tier**: Primeros 5 GB de ingesta, 5 GB de almacenamiento por mes

**Uso Estimado**:
- 100 invocaciones Lambda × 5 líneas de log por invocación × 200 bytes por línea = 0.1 MB
- Retención: 7 días (predeterminado)

**Cálculo**:
- Ingesta: 0.0001 GB × $0.50 = $0.00005
- Almacenamiento: 0.0001 GB × $0.03 × (7/30) = $0.0000007

**Total CloudWatch Logs**: **~$0.00006** (efectivamente $0.00)

**Cobertura de AWS Free Tier**:
- 5 GB de ingesta por mes (gratis)
- 5 GB de almacenamiento por mes (gratis)

Tu uso está **100% cubierto por Free Tier**.

### AWS X-Ray

**Modelo de Precios**: Pago por traza grabada y recuperada

**Componentes de Costo**:
- **Trazas grabadas**: $5.00 por millón de trazas
- **Trazas recuperadas**: $0.50 por millón de trazas
- **Free Tier**: Primeras 100,000 trazas grabadas por mes (gratis)

**Uso Estimado**:
- 50 solicitudes API = 50 trazas grabadas
- 10 recuperaciones de trazas (viendo en la consola)

**Cálculo**:
- Trazas grabadas: 50 × $5.00 / 1,000,000 = $0.00025
- Trazas recuperadas: 10 × $0.50 / 1,000,000 = $0.000005

**Total X-Ray**: **~$0.00026** (efectivamente $0.00)

**Cobertura de AWS Free Tier**:
- 100,000 trazas por mes (gratis)
- 1 millón de trazas recuperadas por mes (gratis)

Tu uso está **100% cubierto por Free Tier**.

### CloudFormation

**Costo**: **$0.00** - El servicio CloudFormation en sí es gratis. Solo pagas por los recursos que crea (Lambda, DynamoDB, etc.).

### IAM

**Costo**: **$0.00** - IAM siempre es gratis. No hay cargos por usuarios, grupos, roles o políticas.

## Costo Total Estimado

| Servicio | Costo Estimado | Cobertura Free Tier |
|---------|----------------|-------------------|
| DynamoDB | $0.00034 | ✅ Totalmente cubierto |
| Lambda | $0.00035 | ✅ Totalmente cubierto |
| Lambda Function URLs | $0.00 | ✅ Sin costo adicional (se factura como invocación de Lambda) |
| CloudWatch Logs | $0.00006 | ✅ Totalmente cubierto |
| X-Ray | $0.00026 | ✅ Totalmente cubierto |
| CloudFormation | $0.00 | ✅ Siempre gratis |
| IAM | $0.00 | ✅ Siempre gratis |

**Total**: **~$0.0012** (menos de **$0.01**)

**Cargo real**: **$0.00** si estás dentro de los límites de Free Tier

## Supuestos de Uso

Las estimaciones anteriores asumen:

- **Período de desarrollo**: 1-2 días
- **Intensidad de pruebas**: 50 solicitudes API en total
- **Tamaño de base de datos**: ~10 productos (< 1 MB)
- **Monitoreo activo**: Uso mínimo de consola CloudWatch/X-Ray
- **Invocaciones Lambda**: ~100 en total entre todas las funciones
- **Sin tráfico de producción**: Solo pruebas manuales con curl

## Mejores Prácticas de Optimización de Costos

### 1. Eliminar Recursos Inmediatamente Después de Probar

Ejecuta la limpieza tan pronto hayas demostrado tu API funcionando:

```bash
sam delete --stack-name techmoda-ai-aby --region us-east-1
```

Esto previene cualquier cargo continuo, aunque serían mínimos.

### 2. Usar PAY_PER_REQUEST para DynamoDB

✅ **Ya configurado en template.yaml**

PAY_PER_REQUEST es más rentable que la capacidad provisionada para:
- Volúmenes de tráfico bajos
- Patrones de uso impredecibles
- Cargas de trabajo de desarrollo/pruebas

**Alternativa (provisionada)**: Requeriría pagar por capacidad mínima incluso cuando esté inactivo.

### 3. Configurar Retención de CloudWatch Logs

✅ **Ya configurado en template.yaml (7 días)**

Previene la acumulación indefinida de logs. Después de 7 días, los logs se eliminan automáticamente.

### 4. Evitar Pruebas Innecesarias

- Prueba cada función 2-3 veces, no 100+ veces
- No dejes scripts de prueba automatizados ejecutándose en bucles
- Elimina productos de prueba después de la verificación

### 5. Monitorear el Panel de Facturación de AWS

Revisa tus costos reales:
1. AWS Console → Billing Dashboard
2. Ver "Month-to-Date Costs by Service"
3. Verificar que los cargos se alineen con las expectativas (debe ser $0.00)

## Instrucciones de Limpieza

### Por Qué Importa la Limpieza

Aunque este proyecto cuesta casi $0 durante el uso activo, los recursos de AWS pueden acumular cargos si se dejan ejecutándose indefinidamente:

- La tabla DynamoDB continúa existiendo (costos mínimos de almacenamiento)
- Los CloudWatch Logs continúan almacenando datos (costos mínimos de almacenamiento)
- Las funciones Lambda permanecen desplegadas (sin costo a menos que se invoquen)
- Las Lambda Function URLs permanecen activas (sin costo a menos que se invoquen)

**Mejor Práctica**: Elimina todos los recursos inmediatamente después de completar tu capstone para mantener una higiene limpia de AWS.

### Método 1: Comando SAM Delete (Recomendado)

La forma más rápida y segura de eliminar todos los recursos:

```bash
sam delete --stack-name techmoda-ai-aby --region us-east-1
```

**Prompts interactivos**:
```
Are you sure you want to delete the stack techmoda-ai-aby in the region us-east-1 ? [y/N]: y
Are you sure you want to delete the folder techmoda-ai-aby in S3 which contains the artifacts? [y/N]: y
```

**Qué se elimina**:
- Todas las 5 funciones Lambda (y la función router + funciones de IA)
- Las Lambda Function URLs (se eliminan junto con sus funciones)
- Tabla DynamoDB (incluyendo todos los datos)
- Grupos de Log de CloudWatch
- Metadatos del stack CloudFormation
- Bucket S3 de despliegue (artefactos)
- Los roles IAM de ejecución (uno por Lambda) — los creó el stack, se borran con el stack.

**Duración**: 2-5 minutos

### Método 2: Script de Eliminación (Alternativa)

Usa el script de conveniencia proporcionado:

```bash
./scripts/delete.sh
```

Este script ejecuta el mismo comando `sam delete` con prompts de confirmación.

### Método 3: Consola de AWS (Respaldo Manual)

Si `sam delete` falla, elimina manualmente vía consola CloudFormation:

1. Ve a la consola de AWS CloudFormation
2. Selecciona tu stack (ej., `techmoda-ai-aby`)
3. Haz clic en el botón "Delete"
4. Confirma la eliminación
5. Espera a que el estado muestre `DELETE_COMPLETE`

**Nota**: La eliminación manual vía consola es menos confiable porque requiere que entiendas las dependencias de recursos.

## Pasos de Verificación

Después de ejecutar `sam delete`, verifica que todos los recursos se hayan eliminado:

### 1. Verificar CloudFormation

```bash
aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1
```

**Salida esperada**: Mensaje de error indicando que el stack no existe:
```
An error occurred (ValidationError) when calling the DescribeStacks operation:
Stack with id techmoda-ai-aby does not exist
```

### 2. Verificar Funciones Lambda Eliminadas

```bash
aws lambda list-functions --query "Functions[?contains(FunctionName, 'techmoda-ai-aby')]"
```

**Salida esperada**: Array vacío `[]` (las Function URLs se eliminan con sus funciones).

### 3. Verificar Tabla DynamoDB Eliminada

```bash
aws dynamodb list-tables --query "TableNames[?contains(@, 'techmoda-ai-aby')]"
```

**Salida esperada**: Array vacío `[]`

### 4. Verificar que no quedan Function URLs

```bash
# Las Function URLs viven sobre las funciones Lambda: si no hay funciones techmoda-ai-aby,
# tampoco quedan Function URLs. (No hay API Gateway que verificar en el sandbox.)
aws lambda list-functions --query "Functions[?contains(FunctionName, 'techmoda-ai-aby')].FunctionName"
```

**Salida esperada**: Array vacío `[]`

### 5. Revisar Panel de Facturación

1. Ve a AWS Console → Billing Dashboard
2. Ver "Month-to-Date Costs by Service"
3. Verificar que no aparezcan nuevos cargos después de la eliminación
4. Revisar el seguimiento de uso de "Free Tier"

## Resolución de Problemas de Fallas de Eliminación

### Problema: Stack atascado en DELETE_IN_PROGRESS

**Causa**: CloudFormation esperando dependencias de recursos

**Solución**: Espera 5-10 minutos. Algunos recursos (como las Function URLs o la tabla DynamoDB) tardan en eliminarse.

### Problema: Estado DELETE_FAILED

**Causa**: Algunos recursos fallaron al eliminarse (ej., tabla DynamoDB con DeletionProtection habilitado)

**Solución**:

1. Revisa la pestaña Events de CloudFormation para el error específico
2. Elimina manualmente el recurso problemático en la Consola de AWS
3. Reintenta la eliminación:
   ```bash
   sam delete --stack-name techmoda-ai-aby --region us-east-1 --no-prompts
   ```

### Problema: "Stack cannot be deleted while in status DELETE_FAILED"

**Solución**: Forzar eliminación saltando recursos fallidos

```bash
aws cloudformation delete-stack \
  --stack-name techmoda-ai-aby --region us-east-1 \
  --retain-resources [ResourceLogicalId]
```

Reemplaza `[ResourceLogicalId]` con el recurso que falló al eliminarse (de la pestaña Events).

### Problema: Bucket S3 no está vacío

**Causa**: Los artefactos de despliegue SAM permanecen en S3

**Solución**: Vaciar el bucket primero

```bash
# Encontrar el nombre del bucket
aws cloudformation describe-stacks \
  --stack-name techmoda-ai-aby --region us-east-1 \
  --query "Stacks[0].Parameters[?ParameterKey=='SAMDeploymentBucket'].ParameterValue" \
  --output text

# Vaciar el bucket (reemplaza YOUR_BUCKET_NAME)
aws s3 rm s3://YOUR_BUCKET_NAME --recursive

# Reintentar eliminación
sam delete --stack-name techmoda-ai-aby --region us-east-1
```

### Problema: Error de permisos durante la eliminación

**Causa**: El rol de ejecución carece de permisos necesarios

**Solución:** tu identidad de deploy/cleanup necesita permitir
`cloudformation:DeleteStack`, `lambda:DeleteFunction` (incl. `lambda:DeleteFunctionUrlConfig`) y
`dynamodb:DeleteTable`, más `iam:DeleteRole`/`iam:DeleteRolePolicy` para los roles que creó el stack.
Si ves un error de permisos, confirmá con `aws sts get-caller-identity` qué identidad estás usando.

## Lista de Verificación Post-Limpieza

Después de eliminar exitosamente tu stack:

✅ Verificar que el stack CloudFormation se haya eliminado
✅ Confirmar que no quedan funciones Lambda
✅ Revisar que la lista de tablas DynamoDB esté vacía
✅ Verificar que no quedan funciones Lambda con Function URLs (techmoda-ai-aby)
✅ Revisar el Panel de Facturación (debe mostrar $0.00 en nuevos cargos)
✅ Guardar URL del repositorio GitHub para la entrega
✅ Conservar capturas de pantalla del API funcionando (si es requerido)

## Monitoreo de Costos Durante el Desarrollo

### Configurar Alertas de Facturación (Opcional)

Recibe notificaciones por email si los costos exceden umbrales:

1. AWS Console → Billing → Billing Preferences
2. Habilitar "Receive Billing Alerts"
3. Ir a CloudWatch → Alarms → Billing
4. Crear alarma:
   - Métrica: Estimated Charges
   - Umbral: $1.00 USD
   - Notificación: Tu email

Esto asegura que seas notificado si los costos exceden inesperadamente el presupuesto del capstone.

### Revisar Uso de Free Tier

Monitorea cuánto Free Tier has consumido:

1. AWS Console → Billing → Free Tier
2. Revisar uso para:
   - Lambda (invocaciones y tiempo de cómputo; incluye las llamadas vía Function URL)
   - DynamoDB (capacidad de lectura/escritura)
   - CloudWatch Logs (ingesta)

**Señales de alarma**:
- Invocaciones Lambda > 900,000/mes (acercándose al límite)
- Escrituras DynamoDB > 900,000/mes (acercándose al límite)
- Cualquier servicio mostrando >80% de consumo de Free Tier

Para este capstone, deberías ver <0.01% de uso de Free Tier.

## Costos Estimados Más Allá de Free Tier

Si excedes los límites de AWS Free Tier (improbable para este capstone), aquí están los cargos:

### Escenario: 10,000 Solicitudes API (Pruebas Intensivas)

| Servicio | Costo |
|---------|------|
| Lambda Function URLs | $0.00 (sin costo propio; se factura como invocación de Lambda) |
| Lambda | 10,000 × $0.20/1M = $0.002 |
| DynamoDB | Escrituras: $0.003, Lecturas: $0.001 |
| CloudWatch | $0.001 |
| X-Ray | $0.05 |

**Total**: **~$0.06** (aún bajo $0.10; sin el cargo de API Gateway, las Function URLs no añaden costo)

### Escenario: 1 Semana de Uso Activo

| Servicio | Costo |
|---------|------|
| Almacenamiento DynamoDB | 0.001 GB × $0.25 = $0.00025 |
| Almacenamiento CloudWatch | 0.01 GB × $0.03 = $0.0003 |
| Lambda (inactivo) | $0.00 |
| Lambda Function URLs (inactivo) | $0.00 |

**Total**: **~$0.0006** (menos de $0.001)

Incluso con uso extendido, los costos permanecen insignificantes.

## Resumen

- **Costo esperado**: **$0.00** (totalmente cubierto por AWS Free Tier)
- **Costo en el peor caso**: **Bajo $0.10** (si se agota Free Tier)
- **Presupuesto capstone**: **Bajo $1.00 USD** ✅ Logrado
- **Tiempo de limpieza**: **2-5 minutos**
- **Costo después de limpieza**: **$0.00** (sin cargos continuos)

## Recursos Adicionales

- [AWS Pricing Calculator](https://calculator.aws/) - Estimar costos para otras arquitecturas
- [Detalles de AWS Free Tier](https://aws.amazon.com/free/) - Lista completa de servicios Free Tier
- [Precios de DynamoDB](https://aws.amazon.com/dynamodb/pricing/) - Costos detallados de PAY_PER_REQUEST
- [Precios de Lambda](https://aws.amazon.com/lambda/pricing/) - Precios de solicitudes y cómputo
- [Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html) - Sin costo adicional sobre Lambda

## ¿Preguntas?

Si ves cargos inesperados o tienes preguntas de facturación:

1. Revisa el Panel de Facturación de AWS para un desglose detallado
2. Revisa CloudWatch Logs para actividad inusual
3. Pregunta a tu instructor del bootcamp para asistencia
4. Contacta AWS Support (si está disponible en tu nivel de cuenta)

**Recuerda**: Elimina tu stack inmediatamente después de la demostración para evitar cualquier cargo más allá del alcance del capstone.
