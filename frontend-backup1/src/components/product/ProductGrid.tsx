import type { Product } from '../../lib/types';
import { ProductCard } from './ProductCard';
interface Props { products: Product[]; onProductClick?: (id: string) => void; onAddToCart?: (p: Product) => void; title?: string; subtitle?: string; }
export function ProductGrid({ products, onProductClick, onAddToCart, title, subtitle }: Props) {
  return <section>
    {(title || subtitle) && <div className="mb-7"><div className="flex items-end justify-between gap-4"><div>{title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}{subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}</div><span className="text-xs text-neutral-400">{products.length} productos</span></div></div>}
    {products.length === 0 ? <div className="py-20 text-center text-neutral-500">No encontramos productos para esta búsqueda.</div> :
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">{products.map((p) => <ProductCard key={p.productId} product={p} onClick={onProductClick} onAddToCart={onAddToCart}/>)}</div>}
  </section>;
}
