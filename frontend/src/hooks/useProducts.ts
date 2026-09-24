import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.listProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct = await api.createProduct(product);
      setProducts((prev) => [newProduct, ...prev]);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al crear producto'
      };
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updatedProduct = await api.updateProduct(productId, updates);
      setProducts((prev) =>
        prev.map((p) => (p.productId === productId ? updatedProduct : p))
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al actualizar producto'
      };
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.productId !== productId));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al eliminar producto'
      };
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}
