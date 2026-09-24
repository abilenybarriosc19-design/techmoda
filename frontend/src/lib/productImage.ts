import type { Product } from './types';

const FALLBACKS = [
  '/products/cream-coat.png',
  '/products/plum-dress.png',
  '/products/indigo-overshirt.png',
];

export function fallbackProductImage(product: Pick<Product, 'productId' | 'category' | 'name'>) {
  const text = `${product.category} ${product.name}`.toLowerCase();
  if (text.includes('vestido') || text.includes('dress')) return FALLBACKS[1];
  if (text.includes('chaqueta') || text.includes('camisa') || text.includes('denim')) return FALLBACKS[2];
  if (text.includes('abrigo') || text.includes('coat') || text.includes('ropa')) return FALLBACKS[0];
  const total = [...product.productId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACKS[total % FALLBACKS.length];
}

export function productImage(product: Product) {
  return product.imageUrl?.trim() || fallbackProductImage(product);
}
