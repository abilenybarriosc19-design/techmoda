import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api';
import { mockProduct, mockProducts, mockProductInput } from '../test/mockData';

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listProducts', () => {
    it('should fetch all products successfully', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: mockProducts }),
      });
      globalThis.fetch = mockFetch;

      const result = await api.listProducts();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products')
      );
      expect(result).toEqual(mockProducts);
    });

    it('should return empty array if no products key in response', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      globalThis.fetch = mockFetch;

      const result = await api.listProducts();

      expect(result).toEqual([]);
    });

    it('should throw error when request fails', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      globalThis.fetch = mockFetch;

      await expect(api.listProducts()).rejects.toThrow(
        'Error 500: Internal Server Error'
      );
    });
  });

  describe('getProduct', () => {
    it('should fetch a single product by ID', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });
      globalThis.fetch = mockFetch;

      const result = await api.getProduct('test-product-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/test-product-123')
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when product not found', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      globalThis.fetch = mockFetch;

      await expect(api.getProduct('nonexistent')).rejects.toThrow(
        'Error 404: Not Found'
      );
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });
      globalThis.fetch = mockFetch;

      const result = await api.createProduct(mockProductInput);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockProductInput),
        })
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when creation fails', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });
      globalThis.fetch = mockFetch;

      await expect(api.createProduct(mockProductInput)).rejects.toThrow(
        'Error 400: Bad Request'
      );
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const updates = { price: 59.99, stock: 30 };
      const updatedProduct = { ...mockProduct, ...updates };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProduct,
      });
      globalThis.fetch = mockFetch;

      const result = await api.updateProduct('test-product-123', updates);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/test-product-123'),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })
      );
      expect(result).toEqual(updatedProduct);
    });

    it('should throw error when update fails', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      globalThis.fetch = mockFetch;

      await expect(
        api.updateProduct('nonexistent', { price: 59.99 })
      ).rejects.toThrow('Error 404: Not Found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      });
      globalThis.fetch = mockFetch;

      await api.deleteProduct('test-product-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/test-product-123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw error when deletion fails', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      globalThis.fetch = mockFetch;

      await expect(api.deleteProduct('nonexistent')).rejects.toThrow(
        'Error 404: Not Found'
      );
    });
  });

  describe('API URL Configuration', () => {
    it('should use runtime config URL if available', () => {
      // window.__ENV is already set in setup.ts (Function URL con slash final)
      expect(window.__ENV?.VITE_API_URL).toBe('https://test-api.lambda-url.us-east-1.on.aws/');
    });

    it('should construct correct API endpoints', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: [] }),
      });
      globalThis.fetch = mockFetch;

      await api.listProducts();

      // El slash final de la Function URL se normaliza -> sin doble slash.
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.lambda-url.us-east-1.on.aws/products'
      );
    });
  });
});
