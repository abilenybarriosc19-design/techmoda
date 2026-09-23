import { useState } from 'react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';

export function useSemanticSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const products = await api.semanticSearch(query);
      setResults(products);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en búsqueda semántica';
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults([]);
    setError(null);
  };

  return {
    results,
    loading,
    error,
    search,
    reset,
  };
}
