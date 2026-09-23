/**
 * Constantes globales: colores, endpoints, configuración.
 * Paleta minimalista/editorial: blanco, beige, morado muy sutil.
 */

// ============================================================================
// Tema: Editorial minimalista premium
// ============================================================================
export const THEME = {
  colors: {
    primary: '#6b5b95',       // Morado grisáceo sutil
    accent: '#f3f1f5',        // Lavanda casi blanca para hover
    neutral: {
      white: '#ffffff',
      bg: '#faf9f7',          // Beige muy claro (off-white cálido)
      bgAlt: '#f5f3f1',       // Beige ligeramente más oscuro
      border: '#e8e6e1',      // Gris muy claro
      text: '#2a2824',        // Gris oscuro casi negro
      textLight: '#8b8680',   // Gris medio
      textLighter: '#b5afa8', // Gris claro
    },
    success: '#6b8e23',       // Verde suave
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    xxl: '4rem',
  },
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  typography: {
    fontSerif: "'Georgia', 'Garamond', serif",
    fontSans: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif",
  },
};

// ============================================================================
// Categorías y opciones de productos
// ============================================================================
export const PRODUCT_CATEGORIES = ['Ropa', 'Zapatos', 'Accesorios'];

export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

// ============================================================================
// Funcionalidades de IA disponibles (para mostrar badges/tags)
// ============================================================================
export const AI_FEATURES = {
  labels: {
    name: 'Etiquetas IA',
    icon: '🏷️',
    description: 'Detectadas con Rekognition',
  },
  moderation: {
    name: 'Moderación',
    icon: '🛡️',
    description: 'Contenido seguro',
  },
  altText: {
    name: 'Alt Text',
    icon: '♿',
    description: 'Accesibilidad',
  },
  sentiment: {
    name: 'Sentimiento',
    icon: '💬',
    description: 'Análisis de opiniones',
  },
  translation: {
    name: 'Traducción',
    icon: '🌍',
    description: 'Multilenguaje',
  },
  voice: {
    name: 'Voz',
    icon: '🔊',
    description: 'Síntesis de voz',
  },
  description: {
    name: 'Descripción IA',
    icon: '✨',
    description: 'Generada con Bedrock',
  },
  semantic: {
    name: 'Búsqueda semántica',
    icon: '🔍',
    description: 'Búsqueda inteligente',
  },
  rag: {
    name: 'RAG',
    icon: '🤖',
    description: 'Asistente inteligente',
  },
  guardrails: {
    name: 'Guardrails',
    icon: '✅',
    description: 'IA responsable',
  },
};

// ============================================================================
// Secciones de contenido (para textos estáticos)
// ============================================================================
export const COPY = {
  hero: {
    title: 'Moda inteligente para cada estilo',
    subtitle: 'Descubre prendas únicas, recomendaciones personalizadas y una experiencia de compra impulsada por inteligencia artificial.',
    searchPlaceholder: 'Busca algo, por ejemplo: abrigo beige para invierno…',
    searchCTA: 'Buscar con IA',
  },
  recommendations: {
    title: 'Recomendaciones para ti',
    subtitle: 'Productos seleccionados especialmente',
  },
  assistant: {
    title: 'Asistente de compras',
    subtitle: '¿Qué estás buscando hoy?',
    greeting: 'Hola, ¿qué estás buscando hoy?',
    suggestions: [
      'Look para oficina',
      'Ropa para invierno',
      'Algo casual',
      'Recomendaciones personalizadas',
    ],
  },
  technology: {
    title: 'Tecnología e IA en cada paso',
    subtitle: 'Todas las capacidades de AWS integradas naturalmente',
  },
  trust: {
    title: 'IA responsable',
    items: [
      'Contenido moderado y seguro',
      'Respuestas protegidas por Guardrails',
      'Experiencia transparente y confiable',
      'Privacidad y uso responsable de IA',
    ],
  },
};

// ============================================================================
// Endpoints y Function URLs
// ============================================================================
// Nota: El backend usa un router centralizado en Lambda Function URL.
// Cada sesión de IA (S01-S08) tiene su propia Function URL que se debe
// obtener del stack de CloudFormation (outputs) o configurar aquí.

export const API_ENDPOINTS = {
  router: {
    // Base URL: configurada en lib/api.ts como API_URL
    // Ejemplo: https://xxxxx.lambda-url.us-east-1.on.aws
    products: '/products',
    product: (id: string) => `/products/${id}`,
  },
  ai: {
    // Estos son endpoints separados (Function URLs propias)
    // Se deben obtener de CloudFormation outputs o variables de entorno (en runtime via window.__ENV)
    // En desarrollo se puede usar import.meta.env.VITE_* pero en producción se inyecta via env-config.js
  },
};
