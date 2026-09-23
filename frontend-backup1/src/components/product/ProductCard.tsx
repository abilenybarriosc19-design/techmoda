import { Heart, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../../lib/types';

interface Props { product: Product; onClick?: (productId: string) => void; onAddToCart?: (product: Product) => void; }
export function ProductCard({ product, onClick, onAddToCart }: Props) {
  const [fav, setFav] = useState(false);
  return (
    <article className="group">
      <div className="relative bg-neutral-100 rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer" onClick={() => onClick?.(product.productId)}>
        <img src={product.imageUrl} alt={product.aiAltText || product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
        <button onClick={(e) => { e.stopPropagation(); setFav(!fav); }} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 grid place-items-center shadow-sm" aria-label="Favorito">
          <Heart size={18} fill={fav ? '#6d4aff' : 'none'} className={fav ? 'text-[#6d4aff]' : 'text-neutral-700'} />
        </button>
        {(product.aiDescription || product.aiLabels?.length) && <span className="absolute left-3 bottom-3 bg-white/92 text-[11px] font-semibold px-2.5 py-1 rounded-full">IA</span>}
      </div>
      <div className="pt-4 flex items-start justify-between gap-3">
        <button className="text-left min-w-0" onClick={() => onClick?.(product.productId)}>
          <h3 className="font-semibold text-sm sm:text-base truncate">{product.name}</h3>
          <p className="text-xs text-neutral-500 mt-1">{product.category}</p>
          <p className="font-semibold mt-2">${product.price.toFixed(2)}</p>
        </button>
        <button disabled={product.stock === 0} onClick={() => onAddToCart?.(product)} className="mt-1 w-9 h-9 rounded-full border border-neutral-300 grid place-items-center hover:border-[#6d4aff] hover:text-[#6d4aff] disabled:opacity-30" aria-label="Agregar al carrito"><Plus size={17}/></button>
      </div>
    </article>
  );
}
