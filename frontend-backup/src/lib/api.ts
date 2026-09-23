import type { Product } from './types';

// Runtime environment configuration (injected at deployment time)
declare global {
  interface Window {
    __ENV?: {
      VITE_API_URL?: string;
      VITE_SEMANTIC_SEARCH_URL?: string;
      VITE_SHOPPING_ASSISTANT_URL?: string;
      VITE_GENERATE_DESCRIPTION_URL?: string;
      VITE_SYNTHESIZE_VOICE_URL?: string;
      VITE_TRANSLATE_CATALOG_URL?: string;
      VITE_ANALYZE_SENTIMENT_URL?: string;
    };
  }
}

// Get API URL from runtime config (priority) or build-time env variable
// Priority: window.__ENV (runtime) > import.meta.env (build-time) > fallback
//
// En el sandbox AWS re/Start NO hay API Gateway: la base es una Lambda Function
// URL (https://<id>.lambda-url.<region>.on.aws/). Esa URL termina en '/', así que
// la normalizamos quitando el slash final para que `${API_URL}/products` no genere
// un doble slash. (El router tolera el doble slash igual, pero mantenemos URLs limpias.)
const RAW_API_URL =
  window.__ENV?.VITE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'https://your-function-url-id.lambda-url.us-east-1.on.aws';

const API_URL = RAW_API_URL.replace(/\/+$/, '');

// Log the API URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL);
  console.log('Runtime config:', window.__ENV);
  console.log('Build-time config:', import.meta.env.VITE_API_URL);
}

export const api = {
  // List all products
  async listProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    // API returns {products: [...]}
    return data.products || [];
  },

  // Get a single product
  async getProduct(productId: string): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${productId}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  // Create a new product
  async createProduct(product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Update a product
  async updateProduct(
    productId: string,
    updates: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete a product
  async deleteProduct(productId: string): Promise<void> {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========================================================================
  // IA Endpoints (Function URLs separadas — cada sesión S01-S08)
  // ========================================================================

  // S7: Búsqueda semántica (embeddings)
  async semanticSearch(query: string): Promise<Product[]> {
    const semanticSearchUrl = window.__ENV?.VITE_SEMANTIC_SEARCH_URL ||
      import.meta.env.VITE_SEMANTIC_SEARCH_URL || '';

    if (!semanticSearchUrl) {
      throw new Error('Semantic Search URL no configurada. Verifica VITE_SEMANTIC_SEARCH_URL.');
    }

    const response = await fetch(semanticSearchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Búsqueda semántica falló: ${response.status}`);
    }

    const data = await response.json();
    return data.products || [];
  },

  // S8: Chat RAG (asistente de compras)
  async chatAssistant(
    message: string,
    history?: Array<{ role: 'user' | 'assistant'; text: string }>
  ): Promise<{ response: string; products?: Product[] }> {
    const assistantUrl = window.__ENV?.VITE_SHOPPING_ASSISTANT_URL ||
      import.meta.env.VITE_SHOPPING_ASSISTANT_URL || '';

    if (!assistantUrl) {
      throw new Error('Shopping Assistant URL no configurada. Verifica VITE_SHOPPING_ASSISTANT_URL.');
    }

    const response = await fetch(assistantUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: history || [] }),
    });

    if (!response.ok) {
      throw new Error(`Chat Assistant falló: ${response.status}`);
    }

    return response.json();
  },

  // S6: Generar descripción con Bedrock
  async generateDescription(productId: string, tone?: string): Promise<{ description: string }> {
    const genDescUrl = window.__ENV?.VITE_GENERATE_DESCRIPTION_URL ||
      import.meta.env.VITE_GENERATE_DESCRIPTION_URL || '';

    if (!genDescUrl) {
      throw new Error('Generate Description URL no configurada.');
    }

    const response = await fetch(`${genDescUrl}?id=${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone: tone || 'elegante y cercano', save: false }),
    });

    if (!response.ok) {
      throw new Error(`Generación de descripción falló: ${response.status}`);
    }

    return response.json();
  },

  // S5: Síntesis de voz (Polly)
  async synthesizeVoice(productId: string): Promise<{ audioUrl: string }> {
    const voiceUrl = window.__ENV?.VITE_SYNTHESIZE_VOICE_URL ||
      import.meta.env.VITE_SYNTHESIZE_VOICE_URL || '';

    if (!voiceUrl) {
      throw new Error('Synthesize Voice URL no configurada.');
    }

    const response = await fetch(`${voiceUrl}?id=${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Síntesis de voz falló: ${response.status}`);
    }

    return response.json();
  },

  // S4: Traducción (Translate)
  async translateText(text: string, targetLanguage: string): Promise<{ translatedText: string }> {
    const translateUrl = window.__ENV?.VITE_TRANSLATE_CATALOG_URL ||
      import.meta.env.VITE_TRANSLATE_CATALOG_URL || '';

    if (!translateUrl) {
      throw new Error('Translate URL no configurada.');
    }

    const response = await fetch(translateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage }),
    });

    if (!response.ok) {
      throw new Error(`Traducción falló: ${response.status}`);
    }

    return response.json();
  },

  // S3: Análisis de sentimiento (Comprehend)
  async analyzeSentiment(text: string): Promise<{ sentiment: string; scores: Record<string, number> }> {
    const sentimentUrl = window.__ENV?.VITE_ANALYZE_SENTIMENT_URL ||
      import.meta.env.VITE_ANALYZE_SENTIMENT_URL || '';

    if (!sentimentUrl) {
      throw new Error('Analyze Sentiment URL no configurada.');
    }

    const response = await fetch(sentimentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Análisis de sentimiento falló: ${response.status}`);
    }

    return response.json();
  },
};
