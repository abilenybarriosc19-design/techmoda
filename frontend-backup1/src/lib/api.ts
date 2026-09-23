import type { Product } from './types';

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

const clean = (value?: string) => (value || '').replace(/\/+$/, '');
const API_URL = clean(window.__ENV?.VITE_API_URL || import.meta.env.VITE_API_URL || '');
const endpoint = (runtimeKey: keyof NonNullable<Window['__ENV']>, buildKey: string) => {
  const runtime = window.__ENV?.[runtimeKey];
  const build = (import.meta.env as Record<string, string | undefined>)[buildKey];
  return clean(runtime || build || '');
};

function requireUrl(url: string, label: string) {
  if (!url) throw new Error(`${label} no configurada.`);
  return url;
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { throw new Error('La API devolvió una respuesta no válida.'); }
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await parseJson(response);
  if (!response.ok) {
    const message = data?.message || data?.error || `Error ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  async listProducts(): Promise<Product[]> {
    requireUrl(API_URL, 'API URL');
    const data = await fetchJson(`${API_URL}/products`);
    return Array.isArray(data) ? data : (data.products || data.items || []);
  },

  async getProduct(productId: string): Promise<Product> {
    requireUrl(API_URL, 'API URL');
    const data = await fetchJson(`${API_URL}/products/${productId}`);
    return data.product || data.item || data;
  },

  async createProduct(product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    requireUrl(API_URL, 'API URL');
    return fetchJson(`${API_URL}/products`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product),
    });
  },

  async updateProduct(productId: string, updates: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    requireUrl(API_URL, 'API URL');
    return fetchJson(`${API_URL}/products/${productId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    });
  },

  async deleteProduct(productId: string): Promise<void> {
    requireUrl(API_URL, 'API URL');
    await fetchJson(`${API_URL}/products/${productId}`, { method: 'DELETE' });
  },

  async semanticSearch(query: string): Promise<Product[]> {
    const url = requireUrl(endpoint('VITE_SEMANTIC_SEARCH_URL', 'VITE_SEMANTIC_SEARCH_URL'), 'Semantic Search URL');
    // El endpoint real del capstone acepta GET /search?q=...
    const data = await fetchJson(`${url}/search?q=${encodeURIComponent(query)}`);
    return data.results || data.products || [];
  },

  async chatAssistant(message: string, history: Array<{ role: 'user' | 'assistant'; text: string }> = []) {
    const url = requireUrl(endpoint('VITE_SHOPPING_ASSISTANT_URL', 'VITE_SHOPPING_ASSISTANT_URL'), 'Shopping Assistant URL');
    const data = await fetchJson(`${url}/assistant`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, history }),
    });
    return {
      response: data.reply || data.response || '',
      productRefs: data.retrieved || [],
      usage: data.usage,
    };
  },

  async generateDescription(productId: string, tone = 'elegante') {
    const url = requireUrl(endpoint('VITE_GENERATE_DESCRIPTION_URL', 'VITE_GENERATE_DESCRIPTION_URL'), 'Generate Description URL');
    const data = await fetchJson(`${url}/products/${productId}/description`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tone, save: false }),
    });
    return { description: data.description || '' };
  },

  async synthesizeVoice(productId: string, lang = 'es') {
    const url = requireUrl(endpoint('VITE_SYNTHESIZE_VOICE_URL', 'VITE_SYNTHESIZE_VOICE_URL'), 'Synthesize Voice URL');
    const data = await fetchJson(`${url}/products/${productId}/voice`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang }),
    });
    return { audioUrl: data.audioUrl || '' };
  },

  async translateProduct(productId: string, targetLang = 'en') {
    const url = requireUrl(endpoint('VITE_TRANSLATE_CATALOG_URL', 'VITE_TRANSLATE_CATALOG_URL'), 'Translate URL');
    const data = await fetchJson(`${url}/products/${productId}/translate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetLang }),
    });
    return data;
  },

  async translateText(text: string, targetLanguage: string) {
    const url = requireUrl(endpoint('VITE_TRANSLATE_CATALOG_URL', 'VITE_TRANSLATE_CATALOG_URL'), 'Translate URL');
    const data = await fetchJson(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, targetLanguage }),
    });
    return { translatedText: data.translatedText || data.translation || text };
  },

  async analyzeSentiment(text: string) {
    const url = requireUrl(endpoint('VITE_ANALYZE_SENTIMENT_URL', 'VITE_ANALYZE_SENTIMENT_URL'), 'Analyze Sentiment URL');
    return fetchJson(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
    });
  },
};
