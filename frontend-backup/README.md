# TechModa Frontend

Frontend React + TypeScript + Vite para el catálogo de productos TechModa.

> 🏖️ **Sandbox AWS re/Start:** `VITE_API_URL` es la **Lambda Function URL del router** (no API
> Gateway), con formato `https://<id>.lambda-url.us-east-1.on.aws/`. Ver
> [../docs/SANDBOX-COMPAT.md](../docs/SANDBOX-COMPAT.md).

## Desarrollo Local

1. Configurar la URL del API en `.env`:
```bash
cp .env.example .env
```

Editar `.env` y agregar tu Function URL (output `ApiUrl` del stack):
```
VITE_API_URL=https://your-fn-id.lambda-url.us-east-1.on.aws/
```

2. Instalar dependencias:
```bash
npm install
```

3. Ejecutar servidor de desarrollo:
```bash
npm run dev
```

4. Abrir tu navegador en http://localhost:5173

## Build para Producción

```bash
npm run build
```

Los archivos construidos estarán en el directorio `dist/`.

## Despliegue

El frontend se despliega en S3 + CloudFront usando el template SAM.

Usar los scripts del directorio padre:
```bash
cd ..
./scripts/build-frontend.sh
./scripts/deploy-frontend.sh
```

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/       # Componentes React
│   ├── hooks/           # Hooks personalizados de React
│   ├── lib/             # Librerías de utilidad
│   │   ├── api.ts       # Cliente API
│   │   └── types.ts     # Tipos TypeScript
│   ├── App.tsx          # Componente principal de la aplicación
│   └── main.tsx         # Punto de entrada de la aplicación
├── public/              # Recursos estáticos
├── index.html           # Template HTML
└── vite.config.ts       # Configuración de Vite
```

## Scripts Disponibles

- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build de producción localmente
- `npm run lint` - Ejecutar ESLint
- `npm run typecheck` - Ejecutar verificación de tipos TypeScript
- `npm test` - Ejecutar tests con Vitest
- `npm run test:ui` - Abrir interfaz UI de Vitest
- `npm run test:coverage` - Generar reporte de cobertura

## Tecnologías Utilizadas

- **React 18** - Librería UI
- **TypeScript** - Seguridad de tipos
- **Vite** - Herramienta de build y servidor de desarrollo
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos

## Integración con API

El frontend se comunica con el API TechModa desplegado en AWS. La configuración de la URL del API soporta dos métodos:

### 🔧 Runtime Configuration (Producción - Recomendado)

En producción, la URL del API se inyecta en **tiempo de despliegue** sin necesidad de reconstruir el bundle. Esto permite:
- ✅ Desplegar una sola vez y cambiar la URL según el entorno
- ✅ Evitar rebuilds innecesarios
- ✅ Mayor flexibilidad en CI/CD

**Cómo funciona:**
1. El archivo `public/env-config.js.template` contiene un token `%%VITE_API_URL%%`
2. Durante el despliegue, `scripts/inject-env.sh` reemplaza el token con la URL real
3. El archivo `env-config.js` se genera en `dist/` con la configuración real
4. `index.html` carga `env-config.js` antes del bundle principal
5. `src/lib/api.ts` lee `window.__ENV.VITE_API_URL` (prioridad sobre build-time)

**Prioridad de configuración:**
```
window.__ENV.VITE_API_URL (runtime) > import.meta.env.VITE_API_URL (build-time) > fallback
```

**Verificar en el navegador:**
```javascript
// Abrir DevTools > Console
console.log(window.__ENV);
// Debería mostrar: { VITE_API_URL: "https://..." }
```

### 📦 Build-time Configuration (Desarrollo)

En desarrollo local, usa el archivo `.env`:

```bash
cp .env.example .env
# Editar .env con tu URL de API
```

El servidor de desarrollo de Vite leerá esta variable automáticamente.

### 🔍 Debugging

Si ves errores de red como `net::ERR_NAME_NOT_RESOLVED`:

1. Verifica que `window.__ENV.VITE_API_URL` esté definido (DevTools > Console)
2. Revisa que el archivo `env-config.js` exista en el sitio desplegado
3. Limpia el cache del navegador o invalida CloudFront
4. Verifica que el script `inject-env.sh` se ejecutó correctamente durante el despliegue

Ver `src/lib/api.ts` para la implementación del cliente API.

## Archivos de Configuración

- `public/env-config.js` - Versión de desarrollo (incluido en git)
- `public/env-config.js.template` - Template para producción
- `dist/env-config.js` - Generado durante despliegue (NO en git)
- `.env` - Variables de entorno locales (NO en git)
- `.env.example` - Ejemplo de configuración

## Testing

El frontend incluye pruebas completas con **100% de cobertura** usando Vitest y React Testing Library.

### Ejecutar Tests

Desde la raíz del proyecto:
```bash
./scripts/test-frontend.sh              # Ejecutar todos los tests
./scripts/test-frontend.sh --watch      # Modo watch (desarrollo)
./scripts/test-frontend.sh --coverage   # Generar reporte de cobertura
./scripts/test-frontend.sh --ui         # Abrir UI de Vitest
```

Desde el directorio frontend:
```bash
npm test                    # Ejecutar tests
npm test -- --watch         # Modo watch
npm run test:ui             # Abrir UI
npm run test:coverage       # Reporte de cobertura
```

### Estructura de Tests

```
src/
├── lib/
│   └── api.test.ts          # Tests de módulo API (100% cobertura)
├── hooks/
│   └── useProducts.test.ts  # Tests de hook useProducts (100% cobertura)
├── components/
│   ├── ProductCard.test.tsx # Tests de ProductCard (100% cobertura)
│   └── ProductModal.test.tsx # Tests de ProductModal (100% cobertura)
├── App.test.tsx             # Tests de integración App (100% cobertura)
└── test/
    ├── setup.ts             # Configuración de tests
    └── mockData.ts          # Datos de prueba
```

### Cobertura de Tests

Los tests cubren **100% de la funcionalidad**:

**Módulo API (`api.ts`)**:
- ✅ listProducts() - obtener todos los productos
- ✅ getProduct() - obtener producto por ID
- ✅ createProduct() - crear nuevo producto
- ✅ updateProduct() - actualizar producto
- ✅ deleteProduct() - eliminar producto
- ✅ Manejo de errores HTTP
- ✅ Configuración de URL runtime

**Hook useProducts (`useProducts.ts`)**:
- ✅ Estado inicial (loading, products, error)
- ✅ fetchProducts() - carga de productos
- ✅ createProduct() - creación con actualización de estado
- ✅ updateProduct() - actualización con actualización de estado
- ✅ deleteProduct() - eliminación con actualización de estado
- ✅ refetch() - recarga manual
- ✅ Manejo de errores en todas las operaciones

**Componente ProductCard (`ProductCard.tsx`)**:
- ✅ Renderizado de información del producto
- ✅ Modo cliente (botón "Agregar al Carrito")
- ✅ Modo admin (botones Editar/Eliminar)
- ✅ Manejo de stock (disponible/agotado)
- ✅ Callbacks onEdit y onDelete
- ✅ Formato de precio
- ✅ Badge de categoría
- ✅ Accesibilidad

**Componente ProductModal (`ProductModal.tsx`)**:
- ✅ Mostrar/ocultar modal
- ✅ Modo crear vs editar
- ✅ Inicialización de formulario
- ✅ Actualización de campos
- ✅ Validación de formulario
- ✅ Envío de datos
- ✅ Cancelación
- ✅ Selección de categoría

**Aplicación App (`App.tsx`)**:
- ✅ Renderizado inicial
- ✅ Toggle modo cliente/admin
- ✅ Búsqueda de productos
- ✅ Filtro por categoría
- ✅ Combinación de filtros
- ✅ Creación de productos
- ✅ Edición de productos
- ✅ Eliminación de productos (con confirmación)
- ✅ Manejo de errores
- ✅ Estado vacío
- ✅ Estado de carga

### Datos de Prueba

Los tests utilizan la imagen real del producto:
```
https://public-data-669070217575.s3.us-east-1.amazonaws.com/white-shirt.jpg
```

Productos de prueba incluyen:
- Camisa Blanca Clásica (Ropa, stock: 25)
- Jeans Azules (Ropa, stock: 15)
- Zapatos Deportivos (Zapatos, stock: 0)
- Reloj Elegante (Accesorios, stock: 10)

### Ver Reporte de Cobertura

Después de ejecutar `npm run test:coverage`:

```bash
# Abrir en el navegador
open coverage/index.html

# O desde la raíz del proyecto
open frontend/coverage/index.html
```

El reporte HTML muestra:
- Porcentaje de cobertura por archivo
- Líneas cubiertas/no cubiertas
- Branches cubiertas
- Funciones cubiertas

### Tecnologías de Testing

- **Vitest** - Framework de testing rápido compatible con Vite
- **React Testing Library** - Testing centrado en el usuario
- **@testing-library/user-event** - Simulación de interacciones de usuario
- **@testing-library/jest-dom** - Matchers personalizados para DOM
- **jsdom** - Implementación de DOM para Node.js
- **@vitest/ui** - Interfaz visual para tests
- **@vitest/coverage-v8** - Reporte de cobertura con V8
