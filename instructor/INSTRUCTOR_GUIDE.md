# TechModa Capstone - Guía para el Instructor

## Descripción General

Esta guía ayuda a los instructores a facilitar la Sesión 10 (la sesión del capstone), apoyar a los estudiantes durante la implementación, evaluar las entregas y solucionar problemas comunes.

> 🔌 **Lo que realmente se despliega:** el CRUD se expone con **una Lambda Function URL** + **router**
> (no API Gateway), y cada función lleva sus `Policies:` para que **SAM le cree un rol de mínimo
> privilegio**. Stack **`techmoda-ai-aby`**, región **us-east-1**. Requiere una cuenta con `iam:CreateRole`.
> Donde esta guía menciona API Gateway, es material didáctico del patrón clásico. Ver
> [../docs/SANDBOX-COMPAT.md](../docs/SANDBOX-COMPAT.md) y [../docs/IAM.md](../docs/IAM.md).

## Cronograma de la Sesión 10 (120 minutos)

### 0-15 min: Introducción y Configuración

**Actividades del Instructor**:
- Presentar el proyecto capstone y el contexto empresarial (TechModa e-commerce de moda)
- Revisar la rúbrica de evaluación (60% de la calificación del bootcamp)
- Explicar los entregables (URL del repositorio GitHub)
- Enfatizar las restricciones de costos (menos de $1 USD, AWS Free Tier)

**Actividades del Estudiante**:
- Clonar el repositorio inicial
- Verificar las instalaciones de AWS CLI y SAM CLI
- Confirmar que las credenciales de AWS están configuradas
- Probar `aws sts get-caller-identity` y `sam --version`

**Problemas Comunes**:
- AWS CLI/SAM CLI no instalados → Dirigir a [docs/prompts/01_ENVIRONMENT_SETUP.md](../docs/prompts/01_ENVIRONMENT_SETUP.md)
- Credenciales no configuradas → Ayudar con `aws configure`
- Errores de permisos → Verificar que el usuario IAM tiene las políticas necesarias

### 15-30 min: Revisión de la Arquitectura

**Actividades del Instructor**:
- Recorrer [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- Explicar el flujo Function URL → router → Lambda → DynamoDB (en el sandbox; sin API Gateway)
- Revisar la estructura del template SAM (template.yaml)
- Discutir la responsabilidad de cada función Lambda
- Mostrar el esquema de DynamoDB (productId, name, price, etc.)

**Actividades del Estudiante**:
- Leer ARCHITECTURE.md
- Examinar template.yaml
- Revisar las especificaciones de funciones en docs/specs/
- Hacer preguntas de aclaración

**Puntos Clave a Enfatizar**:
- Diseño de API RESTful (GET, POST, PUT, DELETE)
- Beneficios de la arquitectura serverless (sin servidores, auto-escalado, pago por uso)
- AWS SAM simplifica la infraestructura como código
- DynamoDB PAY_PER_REQUEST es rentable para volúmenes bajos

### 30-90 min: Implementación de Lambda

**Actividades del Instructor**:
- Demostrar usando una función Lambda (ej., ListItems)
- Mostrar cómo usar los prompts de [docs/prompts/02_LAMBDA_IMPLEMENTATION.md](../docs/prompts/02_LAMBDA_IMPLEMENTATION.md)
- Recorrer el flujo de trabajo de Claude Code:
  1. Copiar el prompt
  2. Pegar en Claude Code
  3. Revisar el código generado
  4. Guardar en la ubicación correcta
  5. Desplegar y probar
- Alentar a los estudiantes a comenzar con CreateItem (para poblar la base de datos)
- Circular para ayudar a estudiantes individuales

**Actividades del Estudiante**:
- Implementar las 5 funciones Lambda usando Claude Code
- Seguir las especificaciones de funciones en docs/specs/
- Usar plantillas de prompts para generar implementaciones
- Desplegar incrementalmente (probar cada función antes de pasar a la siguiente)

**Orden de Implementación Recomendado**:
1. **CreateItem** (POST /products) - Generar datos de prueba
2. **ListItems** (GET /products) - Verificar que existen datos
3. **GetItem** (GET /products/{id}) - Probar recuperación individual
4. **UpdateItem** (PUT /products/{id}) - Modificar datos
5. **DeleteItem** (DELETE /products/{id}) - Limpiar datos de prueba

**Estrategias de Apoyo**:
- Señalar las especificaciones relevantes para cada función
- Ayudar con la sintaxis de AWS SDK v3 si los estudiantes tienen dificultades
- Verificar que se están usando las variables de entorno (PRODUCTS_TABLE)
- Comprobar que se incluyen los headers CORS en las respuestas
- Recordar sobre el formato apropiado de respuesta HTTP ({ statusCode, headers, body }) para la Function URL

### 90-110 min: Despliegue y Pruebas

**Actividades del Instructor**:
- Demostrar `sam build && sam deploy` (con `--capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND --resolve-s3`)
- Mostrar cómo recuperar la **Function URL** (output `ApiUrl`) de los outputs
- Recorrer las pruebas con curl ([docs/TESTING_GUIDE.md](../docs/TESTING_GUIDE.md))
- Demostrar el acceso a CloudWatch Logs
- Mostrar trazas de X-Ray (opcional, si el tiempo lo permite)

**Actividades del Estudiante**:
- Construir y desplegar la aplicación SAM
- Probar los 5 endpoints con curl
- Verificar que las respuestas coinciden con los outputs esperados
- Revisar CloudWatch Logs para logs de ejecución
- Depurar cualquier prueba que falle

**Problemas Comunes de Despliegue**:
- CAPABILITY_IAM no permitida → Los estudiantes deben responder "Y" a los prompts de IAM
- El stack ya existe → Ayudar a eliminar el stack antiguo o elegir un nuevo nombre
- Timeout de despliegue → Revisar la consola de CloudFormation para recursos atascados

**Apoyo en Pruebas**:
- Proporcionar ejemplos de comandos curl
- Ayudar a capturar el productId de la respuesta de CreateItem para uso en otras pruebas
- Verificar códigos de estado HTTP (200, 201, 404, 500)
- Comprobar que las respuestas de error están correctamente formateadas

### 110-120 min: Solución de Problemas y Preguntas

**Actividades del Instructor**:
- Abordar errores comunes (ver sección de Solución de Problemas abajo)
- Responder preguntas de arquitectura
- Ayudar a los estudiantes a depurar funciones que fallan
- Discutir procedimientos de limpieza (sam delete)
- Recordar sobre la fecha límite de entrega y requisitos

**Actividades del Estudiante**:
- Arreglar cualquier problema restante
- Completar la verificación de pruebas
- Comenzar la documentación (actualizaciones del README)
- Hacer preguntas finales

**Checklist de Cierre**:
- ✅ Las 5 operaciones CRUD funcionando
- ✅ Lambda Function URL (output `ApiUrl`) accesible
- ✅ CloudWatch Logs mostrando ejecuciones
- ✅ Sin errores de permisos
- ✅ Los estudiantes entienden cómo eliminar recursos

## Objetivos de Aprendizaje

Al final de la Sesión 10, los estudiantes deben demostrar:

1. **Diseño de Arquitectura Serverless**
   - Diseñar sistemas orientados a eventos con Lambda, Lambda Function URLs, DynamoDB
   - Comprender arquitecturas serverless vs. tradicionales
   - Aplicar principios de AWS Well-Architected

2. **Implementación de API RESTful**
   - Implementar métodos HTTP apropiados (GET, POST, PUT, DELETE)
   - Retornar códigos de estado apropiados (200, 201, 404, 500)
   - Estructurar payloads de solicitud/respuesta JSON

3. **Infraestructura como Código**
   - Escribir y desplegar templates AWS SAM
   - Definir recursos declarativamente
   - Gestionar roles IAM con privilegios mínimos

4. **Pruebas Manuales de API**
   - Probar endpoints con curl
   - Interpretar respuestas HTTP
   - Verificar operaciones CRUD

5. **Depuración Serverless**
   - Analizar CloudWatch Logs
   - Interpretar trazas de X-Ray
   - Diagnosticar problemas de permisos

6. **Gestión de Costos de AWS**
   - Estimar costos serverless
   - Comprender los límites de Free Tier
   - Limpiar recursos correctamente

7. **Desarrollo Acelerado con IA**
   - Usar Claude Code para implementación
   - Escribir prompts efectivos
   - Depurar con asistencia de IA

8. **Documentación Técnica**
   - Crear diagramas de arquitectura
   - Escribir instrucciones de despliegue
   - Documentar APIs con ejemplos

9. **Mejores Prácticas de AWS**
   - Seguridad (privilegios mínimos en IAM)
   - Observabilidad (CloudWatch, X-Ray)
   - Optimización de costos

## Desafíos Comunes de los Estudiantes y Soluciones

### Desafío 1: Problemas de Configuración del Entorno

**Síntomas**:
- AWS CLI o SAM CLI no encontrados
- Credenciales inválidas
- Errores de permisos

**Soluciones**:
- Dirigir a [docs/prompts/01_ENVIRONMENT_SETUP.md](../docs/prompts/01_ENVIRONMENT_SETUP.md)
- Verificar que PATH incluye los binarios de AWS CLI/SAM CLI
- Probar credenciales: `aws sts get-caller-identity`
- Confirmar que la identidad del deploy puede crear roles (`iam:CreateRole`), además de CloudFormation, Lambda (incl. Function URLs) y DynamoDB

### Desafío 2: Errores en Funciones Lambda

**Síntomas**:
- 500 Internal Server Error de la API
- CloudWatch Logs muestra errores de JavaScript
- Errores de permisos de DynamoDB

**Soluciones**:
- Revisar CloudWatch Logs para el error específico
- Verificar que los imports de AWS SDK v3 son correctos
- Confirmar que se está leyendo la variable de entorno PRODUCTS_TABLE
- Verificar que la función declare `Policies:` acotadas y **no** un `Role:` (excluyentes en SAM)
- Verificar el formato de respuesta HTTP (statusCode, headers, body) — válido para la Function URL

**Problemas Comunes en el Código**:
```javascript
// INCORRECTO: body no es un string
return {
  statusCode: 200,
  body: { products: [] }  // ❌ Debería ser JSON.stringify()
};

// CORRECTO:
return {
  statusCode: 200,
  body: JSON.stringify({ products: [] })  // ✅
};
```

### Desafío 3: Problemas con Parámetros de Ruta (GetItem, UpdateItem, DeleteItem)

**Síntomas**:
- "Cannot read property 'id' of undefined"
- Las funciones fallan al extraer productId

**Soluciones**:
- Verificar que el **router** (`functions/router/index.js`) parsea `{id}` desde `event.rawPath` y reconstruye `event.pathParameters.id`
- Comprobar la extracción: `const productId = event.pathParameters.id`
- Agregar verificación de seguridad:
  ```javascript
  if (!event.pathParameters || !event.pathParameters.id) {
    return {
      statusCode: 400,
      headers: {...},
      body: JSON.stringify({ error: 'Missing product ID' })
    };
  }
  ```

### Desafío 4: Errores de Parseo JSON (CreateItem, UpdateItem)

**Síntomas**:
- SyntaxError: Unexpected token in JSON
- El body de la solicitud no se está parseando

**Soluciones**:
- Explicar que `event.body` es un string JSON, no un objeto
- Mostrar parseo seguro:
  ```javascript
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: {...},
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }
  ```

### Desafío 5: DynamoDB Scan Retorna Vacío (ListItems)

**Síntomas**:
- GET /products retorna un array vacío incluso después de crear productos

**Soluciones**:
- Verificar que la función CreateItem efectivamente creó productos (revisar CloudWatch Logs)
- Revisar la consola de DynamoDB para ver si existen items
- Verificar que el nombre de la tabla coincide: `process.env.PRODUCTS_TABLE`
- Probar GetItem con un productId conocido para aislar el problema

### Desafío 6: UpdateItem No Funciona

**Síntomas**:
- 404 Not Found incluso cuando el producto existe
- Las actualizaciones no persisten

**Soluciones**:
- Verificar que UpdateItem comprueba la existencia primero (GetItem antes de UpdateItem)
- Revisar la sintaxis de UpdateExpression:
  ```javascript
  UpdateExpression: 'SET price = :price, updatedAt = :updatedAt'
  ExpressionAttributeValues: {
    ':price': 69.99,
    ':updatedAt': new Date().toISOString()
  }
  ```
- Asegurar que `ReturnValues: 'ALL_NEW'` está configurado para retornar el item actualizado

### Desafío 7: Fallos de Despliegue

**Síntomas**:
- Stack de CloudFormation atascado o fallido
- Recursos no creados

**Soluciones**:
- Revisar la pestaña Events de la consola de CloudFormation para errores específicos
- Causas comunes (sandbox):
  - Falta `CAPABILITY_AUTO_EXPAND` (obligatorio para el Transform SAM)
  - Se dejó `Policies:` en una función junto con `Role:` (mutuamente excluyentes → falla)
  - Quedó un `AWS::Serverless::Api` o `Events: Type: Api` (el capstone no usa API Gateway)
  - Template inválido: Errores de sintaxis YAML
- Reintentar despliegue después de corregir el problema
- Eliminar stack fallido: `aws cloudformation delete-stack --stack-name techmoda-ai-aby --region us-east-1`

### Desafío 8: Confusión con las Pruebas

**Síntomas**:
- Los estudiantes no saben cómo probar
- No pueden encontrar la Function URL (output `ApiUrl`)
- Los comandos curl no funcionan

**Soluciones**:
- Mostrar cómo obtener la URL de la API: Outputs de CloudFormation o `aws cloudformation describe-stacks`
- Proporcionar ejemplos de curl de [docs/TESTING_GUIDE.md](../docs/TESTING_GUIDE.md)
- Demostrar la captura de productId:
  ```bash
  RESPONSE=$(curl -s -X POST $API_URL/products -H "Content-Type: application/json" -d '{"name":"Test","price":99.99}')
  PRODUCT_ID=$(echo $RESPONSE | jq -r '.productId')
  echo $PRODUCT_ID
  ```
- Nota: `jq` podría no estar instalado; que los estudiantes copien manualmente el productId si es necesario

## Cómo Apoyar a los Estudiantes

### Durante la Implementación

1. **Fomentar el desarrollo incremental**: Probar cada función antes de pasar a la siguiente
2. **Promover el uso de prompts**: Los estudiantes deben aprovechar Claude Code con las plantillas proporcionadas
3. **Enfatizar las especificaciones**: Dirigir a los estudiantes a docs/specs/ para requisitos detallados
4. **Mostrar CloudWatch Logs temprano**: La depuración comienza con los logs
5. **No dar soluciones completas**: Guiar a los estudiantes a descubrir problemas por sí mismos

### Cuando los Estudiantes Están Atascados

**Hacer**:
- ✅ Hacer preguntas diagnósticas ("¿Qué muestra CloudWatch Logs?")
- ✅ Señalar la documentación relevante (specs, prompts, guías)
- ✅ Mostrar cómo interpretar errores
- ✅ Demostrar el flujo de trabajo de depuración
- ✅ Fomentar la asistencia de IA (Claude Code)

**No Hacer**:
- ❌ Escribir código para los estudiantes
- ❌ Tomar control de su teclado
- ❌ Dar respuestas sin explicación
- ❌ Saltar pasos de depuración

### Gestión del Tiempo

- **Marca de 30 min**: Los estudiantes deben estar implementando funciones
- **Marca de 60 min**: Al menos 2-3 funciones implementadas
- **Marca de 90 min**: Todas las funciones implementadas, comenzando despliegue
- **Marca de 100 min**: Despliegue completo, pruebas en progreso
- **Marca de 110 min**: Todas las pruebas pasando, depurando casos extremos

**Si los Estudiantes se Atrasan**:
- Priorizar CreateItem, ListItems, GetItem (CRUD básico)
- UpdateItem y DeleteItem pueden ser tarea
- Asegurar que los estudiantes entienden los conceptos aunque la implementación esté incompleta
- Extender apoyo durante horas de tarea

## Cómo Evaluar las Entregas

### Entregable Requerido

Los estudiantes deben entregar:
- **URL del repositorio GitHub** con implementación completa y funcional

### Checklist de Evaluación

#### Excelencia Técnica (30%)

**Las 5 operaciones CRUD funcionales (10%)**:
- ✅ ListItems retorna array de productos (vacío o poblado)
- ✅ CreateItem retorna 201 con nuevo producto (incluyendo productId, timestamps)
- ✅ GetItem retorna 200 con producto o 404 para no existente
- ✅ UpdateItem retorna 200 con producto actualizado o 404
- ✅ DeleteItem retorna 200 con mensaje de éxito

**Probar mediante**:
1. Clonar el repositorio del estudiante
2. Desplegar en su cuenta AWS: `sam build && sam deploy --guided`
3. Ejecutar pruebas curl para todos los endpoints
4. Verificar que las respuestas coinciden con las expectativas

**Manejo apropiado de errores (5%)**:
- ✅ Bloques try/catch en las funciones Lambda
- ✅ 404 para recursos no existentes (GetItem, UpdateItem opcional para DeleteItem)
- ✅ 400 para errores de validación (CreateItem falta name/price)
- ✅ 500 para errores de DynamoDB con mensajes de error

**Calidad y legibilidad del código (5%)**:
- ✅ Formato limpio y consistente
- ✅ Nombres de variables significativos
- ✅ Comentarios explicando la lógica
- ✅ Sin código comentado o console.logs de depuración

**Corrección del template SAM (5%)**:
- ✅ Sintaxis YAML válida
- ✅ Las 5 funciones Lambda definidas + router
- ✅ Function URL en el router (sin `AWS::Serverless::Api`, sin `Events: Type: Api`)
- ✅ Tabla DynamoDB con esquema apropiado
- ✅ Cada función con sus `Policies:` acotadas y sin `Role:`
- ✅ Variables de entorno inyectadas

**Mejores prácticas de AWS (5%)**:
- ✅ Privilegio mínimo real: acotado por ARN donde el servicio lo admite, por acción donde no (ver `docs/IAM.md`)
- ✅ Rastreo X-Ray habilitado
- ✅ CloudWatch Logs configurados
- ✅ Headers CORS en respuestas
- ✅ Facturación PAY_PER_REQUEST para DynamoDB

#### Documentación (15%)

**Completitud del README (5%)**:
- ✅ Descripción general del proyecto y propósito
- ✅ Descripción de la arquitectura
- ✅ Instrucciones de despliegue (prerequisitos, comandos)
- ✅ Ejemplos de pruebas (comandos curl)
- ✅ Instrucciones de limpieza

**Diagrama de arquitectura (5%)**:
- ✅ Diagrama presente (basado en texto, diagrams.py, o draw.io)
- ✅ Muestra todos los componentes (Lambda Function URL + router, Lambda, DynamoDB)
- ✅ Flujo de solicitud indicado
- ✅ Claro y comprensible

**Ejemplos de pruebas (5%)**:
- ✅ Comandos curl para los 5 endpoints
- ✅ Cuerpos de solicitud de ejemplo
- ✅ Respuestas esperadas documentadas
- ✅ Instrucciones claras

#### Relevancia Empresarial (15%)

**Resuelve el problema del catálogo de moda (7%)**:
- ✅ Esquema de producto apropiado (name, price, description, category, imageUrl)
- ✅ Las operaciones CRUD apoyan el caso de uso de e-commerce
- ✅ La implementación se alinea con el contexto empresarial de TechModa

**Elecciones tecnológicas apropiadas (5%)**:
- ✅ Arquitectura serverless justificada para el caso de uso
- ✅ DynamoDB adecuado para catálogo de productos
- ✅ Lambda Function URL + router apropiado para exponer la API (compatible con el sandbox)
- ✅ Decisiones de diseño rentables

**Conciencia de costos (3%)**:
- ✅ Usa servicios de AWS Free Tier
- ✅ Modo de facturación PAY_PER_REQUEST
- ✅ Instrucciones de limpieza proporcionadas
- ✅ Evidencia de conciencia de costos en el diseño

### Rúbrica de Calificación

Ver [EVALUATION_RUBRIC.md](EVALUATION_RUBRIC.md) para criterios de puntuación detallados.

### Señales de Alerta

**Reducción automática de calificación**:
- ❌ Plagio (código idéntico de otro estudiante)
- ❌ No despliega (errores de CloudFormation, template inválido)
- ❌ Funciones principales no funcionan (< 3 de 5 operaciones CRUD)
- ❌ Sin documentación (README vacío o mínimo)
- ❌ Credenciales o secretos hardcodeados

**Deducciones menores**:
- ⚠️ Manejo de errores faltante
- ⚠️ Documentación incompleta
- ⚠️ Formato de código pobre
- ⚠️ Sin diagrama de arquitectura

## Qué Buscar en Implementaciones Funcionales

### Implementaciones Excelentes (90-100%)

- Las 5 operaciones CRUD funcionan impecablemente
- Manejo integral de errores (400, 404, 500)
- Código limpio y bien comentado
- Documentación completa con diagramas
- Mejores prácticas apropiadas de AWS (IAM, X-Ray, CORS)
- Evidencia de pruebas (scripts de prueba, capturas de pantalla)
- README profesional adecuado para portafolio

### Implementaciones Buenas (75-89%)

- Las 5 operaciones CRUD funcionan
- Manejo básico de errores (404 para no existente)
- Código legible con algunos comentarios
- Documentación adecuada
- Se siguen la mayoría de mejores prácticas de AWS
- Despliegue y pruebas exitosos

### Implementaciones Satisfactorias (60-74%)

- 4-5 operaciones CRUD funcionan
- Manejo mínimo de errores (try/catch presente)
- Código funcional pero menos pulido
- README básico con pasos de despliegue
- Despliega exitosamente
- Algunas mejores prácticas de AWS

### Necesita Mejora (<60%)

- Menos de 4 operaciones CRUD funcionan
- Manejo de errores pobre o faltante
- Código difícil de entender
- Documentación mínima o inexistente
- Problemas de despliegue
- Preocupaciones de seguridad (credenciales hardcodeadas)

## Consejos de Solución de Problemas para Instructores

### Diagnóstico Rápido

**Si el estudiante dice "no funciona"**:
1. Preguntar: "¿Qué error específico ves?"
2. Revisar: CloudWatch Logs para ejecución de Lambda
3. Verificar: El despliegue tuvo éxito (estado de CloudFormation)
4. Probar: Comando curl simple usted mismo

**Si el despliegue falla**:
1. Revisar: Pestaña Events de CloudFormation
2. Buscar: Mensajes de error específicos del recurso
3. Común: Problemas de permisos IAM, YAML inválido
4. Solución: Eliminar stack, corregir problema, redesplegar

**Si la función retorna 500**:
1. Revisar: CloudWatch Logs inmediatamente
2. Buscar: Errores de JavaScript, errores de DynamoDB
3. Común: Falta await, sintaxis SDK incorrecta, problemas de permisos
4. Solución: Corregir código, redesplegar

### Correcciones Rápidas Comunes

**Function URL faltante** (output `ApiUrl`):
```bash
aws cloudformation describe-stacks --stack-name techmoda-ai-aby --region us-east-1 --query "Stacks[0].Outputs"
```

**Revisar items de DynamoDB**:
```bash
aws dynamodb scan --table-name techmoda-ai-aby-Products
```

**Ver logs recientes de Lambda**:
```bash
aws logs tail /aws/lambda/techmoda-ai-aby-ListItems --since 5m
```

**Forzar eliminación de stack atascado**:
```bash
aws cloudformation delete-stack --stack-name techmoda-ai-aby --region us-east-1
```

## Seguimiento Post-Sesión

### Expectativas de Tarea

Los estudiantes deben completar:
- ✅ Las 5 funciones Lambda completamente implementadas y probadas
- ✅ Documentación completa del README
- ✅ Diagrama de arquitectura
- ✅ Evidencia de implementación funcional (capturas de pantalla opcional)
- ✅ Repositorio GitHub listo para entrega

### Apoyo en Horas de Oficina

Estar disponible para:
- Depuración de problemas complejos
- Preguntas de arquitectura
- Problemas de despliegue
- Revisión de documentación (opcional)

### Fecha Límite de Entrega

- Comunicar claramente la fecha límite
- Especificar el formato de entrega (URL de GitHub vía LMS/email)
- Recordar a los estudiantes que limpien recursos después de la entrega
- Proporcionar período de gracia para dificultades técnicas (1-2 días)

## Recursos para Instructores

### Implementación de Referencia

Ver [SOLUTION_NOTES.md](SOLUTION_NOTES.md) para patrones de implementación (no soluciones completas).

### Enlaces Rápidos

- [Especificaciones de Funciones](../docs/specs/)
- [Guía de Pruebas](../docs/TESTING_GUIDE.md)
- [Documentación de Arquitectura](../docs/ARCHITECTURE.md)
- [Costos y Limpieza](../docs/COST_AND_CLEANUP.md)
- [Plantillas de Prompts](../docs/prompts/)

### Enlaces de Consola AWS

- CloudFormation: https://console.aws.amazon.com/cloudformation
- Lambda (incl. Function URLs): https://console.aws.amazon.com/lambda
- DynamoDB: https://console.aws.amazon.com/dynamodb
- CloudWatch: https://console.aws.amazon.com/cloudwatch
- X-Ray: https://console.aws.amazon.com/xray

## Preguntas Frecuentes de los Estudiantes

**P: ¿Puedo usar Python en lugar de Node.js?**
R: No, el capstone requiere Node.js 18.x para consistencia en la evaluación.

**P: ¿Necesito escribir tests?**
R: No se requieren tests automatizados. Las pruebas manuales con curl son suficientes.

**P: ¿Puedo agregar características extra (autenticación, carga de imágenes)?**
R: Concéntrese primero en el CRUD básico. Las características extra son opcionales pero no requeridas para crédito completo.

**P: ¿Qué pasa si excedo $1 de costo?**
R: Poco probable con uso apropiado. Si le preocupa, monitoree el Panel de Facturación de AWS. Elimine recursos inmediatamente después de las pruebas.

**P: ¿Puedo reenviar si encuentro bugs?**
R: Depende de la política. Generalmente, se permite un reenvío dentro de las 24 horas de la fecha límite.

**P: ¿Necesito incluir evidencia (capturas de pantalla)?**
R: No es requerido pero recomendado para mostrar la implementación funcional.

## Contacto y Soporte

Para preguntas de instructores o problemas con esta guía:
- Revisar [CAPSTONE_OVERVIEW.md](../CAPSTONE_OVERVIEW.md)
- Consultar [Documentación de AWS SAM](https://docs.aws.amazon.com/serverless-application-model/)
- Comunidad de instructores de AWS Bootcamp/Slack

---

**¡Buena suerte facilitando una excelente experiencia de capstone!**
