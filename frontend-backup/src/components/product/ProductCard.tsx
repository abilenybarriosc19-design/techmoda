import { Heart } from 'lucide-react';
import { useState } from 'react';
import { THEME } from '../../lib/constants';
import type { Product } from '../../lib/types';

interface ProductCardProps {
  product: Product;
  onClick?: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onClick, onAddToCart }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(product.productId)}
    >
      {/* Imagen */}
      <div
        className="relative aspect-square overflow-hidden mb-4"
        style={{ backgroundColor: THEME.colors.neutral.bgAlt }}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-90"
        />

        {/* Favorito - siempre visible */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 p-2 transition-opacity hover:opacity-60"
          title="Agregar a favoritos"
        >
          <Heart
            className="w-5 h-5"
            fill={isFavorite ? THEME.colors.primary : 'none'}
            style={{ color: isFavorite ? THEME.colors.primary : THEME.colors.neutral.text }}
            strokeWidth={1.5}
          />
        </button>

        {/* Agregar al carrito - solo en hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <button
              onClick={handleAddToCart}
              className="px-6 py-2 text-white text-sm font-light transition-opacity hover:opacity-80"
              style={{ backgroundColor: THEME.colors.primary }}
            >
              Agregar
            </button>
          </div>
        )}
      </div>

      {/* Info: Solo nombre + precio */}
      <div className="space-y-2">
        <h3
          className="text-base font-light line-clamp-2"
          style={{
            color: THEME.colors.neutral.text,
            fontFamily: THEME.typography.fontSans,
          }}
        >
          {product.name}
        </h3>

        <p
          className="text-base font-light"
          style={{ color: THEME.colors.neutral.text }}
        >
          ${product.price.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
