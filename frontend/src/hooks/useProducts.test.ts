import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from './useProducts';
import { api } from '../lib/api';
import { mockProduct, mockProducts, mockProductInput } from '../test/mockData';

vi.mock('../lib/api');

describe('useProducts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      vi.mocked(api.listProducts).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useProducts());

      expect(result.current.loading).toBe(true);
      expect(result.current.products).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('fetchProducts', () => {
    it('should load products on mount', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce(mockProducts);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.products).toEqual(mockProducts);
      expect(result.current.error).toBe(null);
      expect(api.listProducts).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching products fails', async () => {
      const errorMessage = 'Failed to fetch';
      vi.mocked(api.listProducts).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.products).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should be able to refetch products', async () => {
      vi.mocked(api.listProducts).mockResolvedValue(mockProducts);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear the products
      vi.mocked(api.listProducts).mockResolvedValueOnce([]);

      // Refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.listProducts).toHaveBeenCalledTimes(2);
    });
  });

  describe('createProduct', () => {
    it('should create a product and add it to the list', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce([]);
      vi.mocked(api.createProduct).mockResolvedValueOnce(mockProduct);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const response = await result.current.createProduct(mockProductInput);

      expect(response.success).toBe(true);
      await waitFor(() => {
        expect(result.current.products).toEqual([mockProduct]);
      });
      expect(api.createProduct).toHaveBeenCalledWith(mockProductInput);
    });

    it('should return error when creation fails', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce([]);
      const errorMessage = 'Creation failed';
      vi.mocked(api.createProduct).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const response = await result.current.createProduct(mockProductInput);

      expect(response.success).toBe(false);
      expect(response.error).toBe(errorMessage);
      expect(result.current.products).toEqual([]);
    });

    it('should add new product to the beginning of the list', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce(mockProducts);
      const newProduct = { ...mockProduct, productId: 'new-product' };
      vi.mocked(api.createProduct).mockResolvedValueOnce(newProduct);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.createProduct(mockProductInput);

      await waitFor(() => {
        expect(result.current.products[0]).toEqual(newProduct);
        expect(result.current.products.length).toBe(mockProducts.length + 1);
      });
    });
  });

  describe('updateProduct', () => {
    it('should update a product in the list', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce(mockProducts);
      const updates = { price: 59.99, stock: 30 };
      const updatedProduct = { ...mockProduct, ...updates };
      vi.mocked(api.updateProduct).mockResolvedValueOnce(updatedProduct);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const response = await result.current.updateProduct('test-product-123', updates);

      expect(response.success).toBe(true);
      await waitFor(() => {
        expect(result.current.products[0]).toEqual(updatedProduct);
      });
      expect(api.updateProduct).toHaveBeenCalledWith('test-product-123', updates);
    });

    it('should return error when update fails', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce(mockProducts);
      const errorMessage = 'Update failed';
      vi.mocked(api.updateProduct).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const response = await result.current.updateProduct('test-product-123', { price: 59.99 });

      expect(response.success).toBe(false);
      expect(response.error).toBe(errorMessage);
    });

    it('should only update the specific product', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce(mockProducts);
      const updatedProduct = { ...mockProducts[1], price: 99.99 };
      vi.mocked(api.updateProduct).mockResolvedValueOnce(updatedProduct);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.updateProduct('test-product-456', { price: 99.99 });

      await waitFor(() => {
        expect(result.current.products[0]).toEqual(mockProducts[0]); // Unchanged
        expect(result.current.products[1]).toEqual(updatedProduct); // Updated
        expect(result.current.products[2]).toEqual(mockProducts[2]); // Unchanged
      });
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product from the list', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce(mockProducts);
      vi.mocked(api.deleteProduct).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLength = result.current.products.length;
      const response = await result.current.deleteProduct('test-product-123');

      expect(response.success).toBe(true);
      await waitFor(() => {
        expect(result.current.products.length).toBe(initialLength - 1);
        expect(result.current.products.find(p => p.productId === 'test-product-123')).toBeUndefined();
      });
      expect(api.deleteProduct).toHaveBeenCalledWith('test-product-123');
    });

    it('should return error when deletion fails', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce(mockProducts);
      const errorMessage = 'Deletion failed';
      vi.mocked(api.deleteProduct).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const response = await result.current.deleteProduct('test-product-123');

      expect(response.success).toBe(false);
      expect(response.error).toBe(errorMessage);
      expect(result.current.products.length).toBe(mockProducts.length); // No change
    });

    it('should not affect other products when deleting', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce(mockProducts);
      vi.mocked(api.deleteProduct).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.deleteProduct('test-product-456');

      await waitFor(() => {
        expect(result.current.products).toContainEqual(mockProducts[0]);
        expect(result.current.products).toContainEqual(mockProducts[2]);
        expect(result.current.products).not.toContainEqual(mockProducts[1]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error exceptions in fetchProducts', async () => {
      vi.mocked(api.listProducts).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Error al cargar productos');
    });

    it('should handle non-Error exceptions in createProduct', async () => {
      vi.mocked(api.listProducts).mockResolvedValueOnce([]);
      vi.mocked(api.createProduct).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const response = await result.current.createProduct(mockProductInput);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Error al crear producto');
    });

    it('should clear previous error on successful fetch', async () => {
      vi.mocked(api.listProducts)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockProducts);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });

      expect(result.current.products).toEqual(mockProducts);
    });
  });
});
