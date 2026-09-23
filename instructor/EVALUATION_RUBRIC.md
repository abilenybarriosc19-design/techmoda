# TechModa Capstone - Rúbrica de Evaluación

## Descripción General

Esta rúbrica evalúa las entregas de los estudiantes en tres dimensiones: **Excelencia Técnica (30%)**, **Documentación (15%)** y **Relevancia Empresarial (15%)**, totalizando **60% de la calificación general del bootcamp**.

> 🔌 **Al evaluar:** el CRUD se expone con **una Lambda Function URL** + **router**, y cada función
> declara sus `Policies:` para que SAM le cree un rol de mínimo privilegio. Stack **`techmoda-ai-aby`**,
> región **us-east-1**. **No** penalizar la ausencia de API Gateway — es lo correcto en este diseño.
> **Sí** esperar `Policies:` acotadas: un `Role:` compartido, un `servicio:*` o un `Resource: "*"`
> evitable son hallazgos válidos. Ver [../docs/SANDBOX-COMPAT.md](../docs/SANDBOX-COMPAT.md) y
> [../docs/IAM.md](../docs/IAM.md).

## Requisitos de Entrega

**Entregable**: URL del repositorio GitHub que contenga:
- Template SAM completo (template.yaml)
- Las 5 implementaciones de funciones Lambda
- README.md con arquitectura e instrucciones de despliegue
- Documentación del enfoque de pruebas

## Criterios de Evaluación

### Excelencia Técnica (30%)

#### Criterio 1: Las 5 Operaciones CRUD Funcionales (10%)

**Crédito Completo (10%)**:
- ✅ **ListItems** (GET /products): Retorna array de productos (o array vacío) con 200 OK
- ✅ **CreateItem** (POST /products): Crea producto con UUID autogenerado y timestamps, retorna 201 Created
- ✅ **GetItem** (GET /products/{id}): Retorna producto con 200 OK o 404 Not Found para no existente
- ✅ **UpdateItem** (PUT /products/{id}): Actualiza producto con 200 OK, retorna 404 para no existente, timestamp updatedAt cambia
- ✅ **DeleteItem** (DELETE /products/{id}): Elimina producto con 200 OK, GET subsiguiente retorna 404

**Crédito Parcial (5-9%)**:
- 4 de 5 funciones funcionan correctamente (8%)
- 3 de 5 funciones funcionan correctamente (6%)
- 2 de 5 funciones funcionan correctamente (4%)

**Sin Crédito (0%)**:
- Menos de 2 funciones funcionan
- El despliegue falla
- Template.yaml inválido

**Método de Prueba**:
1. Clonar repositorio
2. Desplegar: `sam build && sam deploy --guided`
3. Probar cada endpoint con curl
4. Verificar que las respuestas coinciden con las especificaciones

#### Criterio 2: Manejo Apropiado de Errores (5%)

**Crédito Completo (5%)**:
- ✅ Bloques try/catch presentes en todas las funciones Lambda
- ✅ Respuestas 404 para recursos no existentes (GetItem, UpdateItem, opcionalmente DeleteItem)
- ✅ Respuestas 400 para errores de validación (CreateItem falta name/price, JSON inválido)
- ✅ Respuestas 500 para errores de DynamoDB con mensajes de error
- ✅ Las respuestas de error incluyen campos `error` y `message`

**Crédito Parcial (2-4%)**:
- Try/catch básico presente pero respuestas de error inconsistentes (3%)
- Algún manejo de errores pero faltan casos 404 o 400 (2%)

**Sin Crédito (0%)**:
- Sin manejo de errores
- Las funciones fallan sin respuestas elegantes
- Respuestas de error faltantes o mal formadas

**Consejos de Evaluación**:
- Probar con productId no existente para verificar 404
- Enviar solicitud POST sin campos requeridos para verificar 400
- Buscar try/catch en el código

#### Criterio 3: Calidad y Legibilidad del Código (5%)

**Crédito Completo (5%)**:
- ✅ Formato de código limpio y consistente (indentación apropiada, espaciado)
- ✅ Nombres de variables significativos (`productId`, no `x` o `data`)
- ✅ Comentarios explicando la lógica clave (operaciones DynamoDB, validación, manejo de errores)
- ✅ Sin código comentado o logs de depuración excesivos
- ✅ Uso apropiado de async/await
- ✅ Principio DRY seguido (sin repetición excesiva)

**Crédito Parcial (2-4%)**:
- Funcional pero formato inconsistente (3%)
- Comentarios mínimos pero código legible (3%)
- Algunas convenciones de nomenclatura pobres (2%)

**Sin Crédito (0%)**:
- Código ilegible (sin formato, nombres sin sentido)
- Código comentado excesivo
- Flujo lógico difícil de entender

**Consejos de Evaluación**:
- Buscar comentarios explicando lógica no obvia
- Verificar consistencia en nomenclatura de variables
- Verificar que el código está formateado profesionalmente

#### Criterio 4: Corrección del Template SAM (5%)

**Crédito Completo (5%)**:
- ✅ Sintaxis YAML válida (sin errores de sintaxis)
- ✅ Las 5 funciones Lambda + router definidas con propiedades correctas (Handler, Runtime, CodeUri, Role)
- ✅ Function URL en el router con rutas CRUD funcionando (sin `AWS::Serverless::Api` ni `Events: Type: Api`)
- ✅ Tabla DynamoDB definida con esquema correcto (productId como clave)
- ✅ Cada función declara `Policies:` acotadas y **no** tiene `Role:` (excluyentes en SAM)
- ✅ Variables de entorno inyectan nombre de tabla (PRODUCTS_TABLE: !Ref ProductsTable)
- ✅ Sección Outputs incluye la Function URL (`ApiUrl`)

**Crédito Parcial (2-4%)**:
- Problemas menores pero despliega exitosamente (4%)
- Faltan algunas propiedades pero funcional (3%)
- Quedó algún `Policies:` junto a `Role:` o un `AWS::Serverless::Api` residual (2%)

**Sin Crédito (0%)**:
- YAML inválido (el despliegue falla)
- Faltan recursos críticos (funciones Lambda, Function URL/router, DynamoDB)
- El template no despliega

**Consejos de Evaluación**:
- Verificar que `sam build` y `sam deploy` tienen éxito
- Revisar consola de CloudFormation para recursos del stack
- Revisar políticas IAM para privilegios mínimos

#### Criterio 5: Mejores Prácticas de AWS (5%)

**Crédito Completo (5%)**:
- ✅ Los roles IAM siguen el principio de privilegios mínimos (políticas específicas por función)
- ✅ Rastreo X-Ray habilitado (`Tracing: Active` en template)
- ✅ CloudWatch Logs configurados (automático vía SAM)
- ✅ Headers CORS en todas las respuestas (`Access-Control-Allow-Origin: *`)
- ✅ Modo de facturación DynamoDB PAY_PER_REQUEST
- ✅ Variables de entorno usadas (no nombres de tablas hardcodeados)

**Crédito Parcial (2-4%)**:
- La mayoría de mejores prácticas seguidas, omisiones menores (4%)
- CORS faltante o X-Ray no habilitado (3%)
- Políticas IAM demasiado amplias pero funcionales (2%)

**Sin Crédito (0%)**:
- Credenciales hardcodeadas (problema mayor de seguridad)
- Sin variables de entorno
- CORS faltante (la API no funcionará desde navegadores)

**Consejos de Evaluación**:
- Revisar template para `Tracing: Active`
- Verificar headers CORS en respuestas Lambda
- Revisar políticas IAM para especificidad

### Documentación (15%)

#### Criterio 6: Completitud del README (5%)

**Crédito Completo (5%)**:
- ✅ Descripción general del proyecto (qué es, contexto empresarial)
- ✅ Descripción de la arquitectura (componentes y sus roles)
- ✅ Prerequisitos listados (AWS CLI, SAM CLI, credenciales AWS)
- ✅ Instrucciones de despliegue (comandos paso a paso)
- ✅ Ejemplos de pruebas (comandos curl para todos los endpoints)
- ✅ Instrucciones de limpieza (cómo eliminar recursos)
- ✅ Formato profesional (encabezados, bloques de código, listas)

**Crédito Parcial (2-4%)**:
- Instrucciones básicas pero faltan algunas secciones (3%)
- Adecuado pero no pulido (2%)

**Sin Crédito (0%)**:
- Sin README o contenido mínimo
- Las instrucciones no funcionan

**Consejos de Evaluación**:
- ¿Puede desplegar siguiendo su README?
- ¿Son suficientes los ejemplos de pruebas para verificar funcionalidad?

#### Criterio 7: Diagrama de Arquitectura (5%)

**Crédito Completo (5%)**:
- ✅ Diagrama presente (arte ASCII basado en texto, diagrams.py, draw.io, o imagen)
- ✅ Muestra todos los componentes clave (Lambda Function URL + router, funciones Lambda, DynamoDB)
- ✅ Indica flujo de solicitud (flechas o similar)
- ✅ Claro y comprensible
- ✅ Etiquetado apropiadamente

**Crédito Parcial (2-4%)**:
- Diagrama simple pero efectivo (3%)
- Diagrama presente pero poco claro o incompleto (2%)

**Sin Crédito (0%)**:
- Sin diagrama
- Diagrama ilegible o incorrecto

**Consejos de Evaluación**:
- ¿Puede entender la arquitectura solo del diagrama?
- ¿Están representados todos los componentes?

#### Criterio 8: Ejemplos de Pruebas (5%)

**Crédito Completo (5%)**:
- ✅ Comandos curl para los 5 endpoints
- ✅ Cuerpos de solicitud de ejemplo incluidos
- ✅ Respuestas esperadas documentadas
- ✅ Instrucciones suficientemente claras para replicar pruebas
- ✅ Muestra cómo capturar productId para uso en otras pruebas

**Crédito Parcial (2-4%)**:
- Ejemplos curl básicos pero incompletos (3%)
- Ejemplos presentes pero no comprehensivos (2%)

**Sin Crédito (0%)**:
- Sin ejemplos de pruebas
- Los ejemplos no funcionan

**Consejos de Evaluación**:
- Intentar ejecutar sus comandos curl
- Verificar que los ejemplos coinciden con el comportamiento real de la API

### Relevancia Empresarial (15%)

#### Criterio 9: Resuelve el Problema del Catálogo de Moda (7%)

**Crédito Completo (7%)**:
- ✅ Esquema de producto apropiado para e-commerce de moda (name, description, price, category, imageUrl)
- ✅ Las operaciones CRUD apoyan flujos de trabajo típicos de e-commerce
- ✅ La implementación se alinea con el contexto empresarial de TechModa
- ✅ El diseño de la API facilita la gestión del catálogo de productos
- ✅ El modelo de datos es sensato para productos de moda

**Crédito Parcial (3-6%)**:
- Esquema adecuado pero faltan campos opcionales (5%)
- CRUD básico pero alineación empresarial limitada (4%)

**Sin Crédito (0%)**:
- El esquema no coincide con los requisitos
- La implementación no aborda la necesidad empresarial

**Consejos de Evaluación**:
- ¿El esquema de producto tiene sentido para moda?
- ¿Puede la API gestionar realísticamente un catálogo de productos?

#### Criterio 10: Elecciones Tecnológicas Apropiadas (5%)

**Crédito Completo (5%)**:
- ✅ Arquitectura serverless justificada para el caso de uso (escalabilidad, costo)
- ✅ DynamoDB adecuado para catálogo de productos (key-value simple, lecturas rápidas)
- ✅ Lambda Function URL + router apropiado para exponer la API (compatible con el sandbox)
- ✅ Runtime Node.js 18.x para Lambda
- ✅ Las decisiones de diseño demuestran comprensión de trade-offs

**Crédito Parcial (2-4%)**:
- Tecnologías usadas correctamente pero no óptimamente (3%)
- Elecciones adecuadas sin justificación fuerte (2%)

**Sin Crédito (0%)**:
- Elecciones arquitectónicas inapropiadas
- No aprovecha beneficios serverless

**Consejos de Evaluación**:
- ¿Es serverless un buen ajuste para este caso de uso?
- ¿Hay alternativas obviamente mejores no usadas?

#### Criterio 11: Conciencia de Costos (3%)

**Crédito Completo (3%)**:
- ✅ Usa servicios de AWS Free Tier
- ✅ DynamoDB PAY_PER_REQUEST (no provisionado)
- ✅ Instrucciones de limpieza proporcionadas
- ✅ Evidencia de conciencia de costos en el diseño (políticas de retención, timeouts)
- ✅ El proyecto se mantiene bajo $1 USD en pruebas

**Crédito Parcial (1-2%)**:
- Mayormente rentable pero algún desperdicio (2%)
- Conciencia básica de costos (1%)

**Sin Crédito (0%)**:
- Sin consideración de costos
- Usa alternativas costosas innecesariamente

**Consejos de Evaluación**:
- Revisar modo de facturación DynamoDB en template
- Verificar que existen instrucciones de limpieza
- Buscar configuraciones de retención de CloudWatch Logs

## Resumen de Puntuación

| Categoría | Puntos |
|----------|--------|
| **Excelencia Técnica** | **30%** |
| 1. Las 5 operaciones CRUD funcionales | 10% |
| 2. Manejo apropiado de errores | 5% |
| 3. Calidad y legibilidad del código | 5% |
| 4. Corrección del template SAM | 5% |
| 5. Mejores prácticas de AWS | 5% |
| **Documentación** | **15%** |
| 6. Completitud del README | 5% |
| 7. Diagrama de arquitectura | 5% |
| 8. Ejemplos de pruebas | 5% |
| **Relevancia Empresarial** | **15%** |
| 9. Resuelve el problema del catálogo de moda | 7% |
| 10. Elecciones tecnológicas apropiadas | 5% |
| 11. Conciencia de costos | 3% |
| **Puntuación Total del Capstone** | **60%** |

## Rangos de Calificación

- **Excelente (90-100% = 54-60 puntos)**: Excede expectativas, todos los criterios cumplidos, calidad profesional
- **Bueno (75-89% = 45-53 puntos)**: Cumple expectativas, problemas menores, implementación sólida
- **Satisfactorio (60-74% = 36-44 puntos)**: Cumple requisitos mínimos, algunos problemas, funcional
- **Necesita Mejora (<60% = <36 puntos)**: No cumple requisitos, problemas significativos

## Flujo de Trabajo de Evaluación

### Paso 1: Revisión Inicial
1. Clonar repositorio GitHub
2. Escanear código para problemas obvios (seguridad, calidad)
3. Revisar README y documentación
4. Revisar estructura de template.yaml

### Paso 2: Prueba de Despliegue
1. Ejecutar `sam build`
2. Ejecutar `sam deploy --stack-name techmoda-ai-aby --region us-east-1 --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND --resolve-s3`
3. Anotar éxito/fallo del despliegue
4. Capturar la Function URL (output `ApiUrl`)

### Paso 3: Pruebas Funcionales
1. Probar las 5 operaciones CRUD con curl
2. Verificar respuestas esperadas
3. Probar casos de error (404, 400)
4. Documentar resultados

### Paso 4: Revisión de Código
1. Examinar implementaciones de funciones Lambda
2. Revisar manejo de errores
3. Evaluar calidad del código
4. Revisar políticas IAM

### Paso 5: Puntuación
1. Usar esta rúbrica para asignar puntos
2. Documentar deducciones con razones específicas
3. Proporcionar retroalimentación constructiva

### Paso 6: Limpieza
1. Eliminar stack de prueba: `sam delete`
2. Verificar que se eliminaron todos los recursos

## Plantilla de Comentarios

```
# Evaluación del Capstone TechModa

Estudiante: [Nombre]
Repositorio GitHub: [URL]
Fecha de Evaluación: [Fecha]

## Excelencia Técnica (30%)
- Las 5 operaciones CRUD funcionales: [X/10] - [comentarios]
- Manejo apropiado de errores: [X/5] - [comentarios]
- Calidad y legibilidad del código: [X/5] - [comentarios]
- Corrección del template SAM: [X/5] - [comentarios]
- Mejores prácticas de AWS: [X/5] - [comentarios]

**Subtotal**: [X/30]

## Documentación (15%)
- Completitud del README: [X/5] - [comentarios]
- Diagrama de arquitectura: [X/5] - [comentarios]
- Ejemplos de pruebas: [X/5] - [comentarios]

**Subtotal**: [X/15]

## Relevancia Empresarial (15%)
- Resuelve el problema del catálogo de moda: [X/7] - [comentarios]
- Elecciones tecnológicas apropiadas: [X/5] - [comentarios]
- Conciencia de costos: [X/3] - [comentarios]

**Subtotal**: [X/15]

## Puntuación Total: [X/60] ([X]%)

## Fortalezas:
- [Fortaleza 1]
- [Fortaleza 2]
- [Fortaleza 3]

## Áreas de Mejora:
- [Mejora 1]
- [Mejora 2]
- [Mejora 3]

## Comentarios Generales:
[Retroalimentación detallada sobre la implementación, qué funcionó bien, qué podría mejorarse, preparación para portafolio]
```

## Deducciones Comunes

### Técnicas
- **-2 puntos**: Manejo de errores faltante en una o más funciones
- **-3 puntos**: Una operación CRUD no funciona
- **-2 puntos**: Formato de código pobre o sin comentarios
- **-1 punto**: Headers CORS faltantes
- **-2 puntos**: Políticas IAM demasiado amplias (no privilegios mínimos)

### Documentación
- **-2 puntos**: README incompleto (faltan pasos de despliegue)
- **-3 puntos**: Sin diagrama de arquitectura
- **-2 puntos**: Sin ejemplos de pruebas
- **-1 punto**: Formato pobre o instrucciones poco claras

### Relevancia Empresarial
- **-2 puntos**: Esquema de producto falta campos importantes
- **-1 punto**: Sin instrucciones de limpieza
- **-1 punto**: El diseño no demuestra conciencia de costos

## Integridad Académica

### Verificación de Plagio

Comparar entregas para:
- Código idéntico (más allá del boilerplate generado)
- Mismos nombres de variables y comentarios
- Contenido idéntico de README

**Si se sospecha plagio**:
1. Documentar evidencia
2. Seguir la política de integridad académica de la institución
3. Considerar entrevista para evaluar comprensión

### Colaboración Aceptable

Los estudiantes pueden:
- Discutir enfoques de arquitectura
- Compartir estrategias de depuración
- Usar plantillas de prompts proporcionadas
- Aprovechar Claude Code para generación

Los estudiantes NO pueden:
- Copiar código de funciones Lambda entre sí
- Compartir implementaciones completas
- Entregar el trabajo de otra persona

## Preguntas y Casos Extremos

**P: El estudiante agregó características extra más allá de los requisitos**
R: Otorgue crédito completo por las características requeridas. Las características extra no suman puntos pero demuestran iniciativa (anotar en comentarios).

**P: El despliegue funciona pero los costos exceden $1**
R: Verifique que están usando servicios de Free Tier. Deduzca 1-2 puntos si usa alternativas innecesariamente costosas.

**P: El estudiante usó Python en lugar de Node.js**
R: El requisito era Node.js 18.x. Deducción significativa (-10 puntos) a menos que se aprobara explícitamente.

**P: El README es mínimo pero el código es excelente**
R: Califique según la rúbrica. Tanto la documentación como la excelencia técnica son requeridas.

**P: Una función tiene un bug menor pero generalmente funciona**
R: Crédito parcial. Deduzca basado en severidad (1-2 puntos para problemas menores).

## Contacto

Para preguntas sobre calificación o aclaraciones de la rúbrica, contacte a [Coordinador de Bootcamp/Nombre del Instructor].
