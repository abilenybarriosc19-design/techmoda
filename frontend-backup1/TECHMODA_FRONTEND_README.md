# TechModa frontend — versión tienda minimalista

Esta versión cambia solo el frontend. No requiere cambios en `template.yaml`, Lambdas ni infraestructura.

## Antes de compilar
Desde la carpeta `frontend`:

```bash
bash setup-env-from-stack.sh techmoda-ai-aby
npm install
npm run build
```

El script `setup-env-from-stack.sh` solo **lee** los Outputs de CloudFormation y escribe `public/env-config.js` con las Function URLs del capstone.

## Qué incluye
- Catálogo visible desde el inicio (sin portada editorial).
- Buscador semántico como elemento principal.
- Filtros por categoría.
- Cards de producto minimalistas.
- Detalle de producto con "Detalles inteligentes".
- Bedrock descriptions bajo demanda.
- Translate y Polly bajo demanda.
- Etiquetas, alt text y moderación cuando ya existen en el producto.
- Asistente RAG flotante.
- Carrito visual/local (sin checkout).
- Sección discreta de tecnologías S01–S10.

## Despliegue
Usa el flujo existente del repositorio para desplegar solo el frontend. No hace falta `sam deploy` si no cambiaste backend/infraestructura.
