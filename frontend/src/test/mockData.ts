import type { Product } from '../lib/types';

export const mockProduct: Product = {
  productId: 'test-product-123',
  name: 'Camisa Blanca Clásica',
  description: 'Camisa blanca elegante perfecta para cualquier ocasión',
  price: 49.99,
  category: 'Ropa',
  stock: 25,
  imageUrl: 'https://public-data-669070217575.s3.us-east-1.amazonaws.com/white-shirt.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockProducts: Product[] = [
  mockProduct,
  {
    productId: 'test-product-456',
    name: 'Jeans Azules',
    description: 'Jeans cómodos de mezclilla azul',
    price: 79.99,
    category: 'Ropa',
    stock: 15,
    imageUrl: 'https://public-data-669070217575.s3.us-east-1.amazonaws.com/white-shirt.jpg',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    productId: 'test-product-789',
    name: 'Zapatos Deportivos',
    description: 'Zapatillas deportivas para correr',
    price: 129.99,
    category: 'Zapatos',
    stock: 0,
    imageUrl: 'https://public-data-669070217575.s3.us-east-1.amazonaws.com/white-shirt.jpg',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    productId: 'test-product-101',
    name: 'Reloj Elegante',
    description: 'Reloj de pulsera elegante',
    price: 199.99,
    category: 'Accesorios',
    stock: 10,
    imageUrl: 'https://public-data-669070217575.s3.us-east-1.amazonaws.com/white-shirt.jpg',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
];

export const mockProductInput = {
  name: 'Camisa Blanca Clásica',
  description: 'Camisa blanca elegante perfecta para cualquier ocasión',
  price: 49.99,
  category: 'Ropa',
  stock: 25,
  imageUrl: 'https://public-data-669070217575.s3.us-east-1.amazonaws.com/white-shirt.jpg',
};
