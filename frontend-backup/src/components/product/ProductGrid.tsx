import { THEME } from '../../lib/constants';
import { ProductCard } from './ProductCard';
import type { Product } from '../../lib/types';

interface ProductGridProps {
  products: Product[];
  onProductClick?: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
  title?: string;
  subtitle?: string;
}

export function ProductGrid({
  products,
  onProductClick,
  onAddToCart,
  title,
  subtitle,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p style={{ color: THEME.colors.neutral.textLight }}>
          No se encontraron productos
        </p>
      </div>
    );
  }

  return (
    <section className="py-16 sm:py-20">
      {title && (
        <div className="mb-12 sm:mb-16">
          <h2
            className="text-2xl sm:text-3xl font-light mb-2"
            style={{
              color: THEME.colors.neutral.text,
              fontFamily: THEME.typography.fontSerif,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-sm sm:text-base"
              style={{ color: THEME.colors.neutral.textLight }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.productId}
            product={product}
            onClick={onProductClick}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}
