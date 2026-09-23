import { SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { Hero } from '../hero/Hero';
import { ProductGrid } from '../product/ProductGrid';
import { ProductDetail } from '../product/ProductDetail';
import { ShoppingAssistant } from '../assistant/ShoppingAssistant';
import { useProducts } from '../../hooks/useProducts';
import { useSemanticSearch } from '../../hooks/useSemanticSearch';
import type { Product } from '../../lib/types';

export function HomePage() {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { results, loading: searchLoading, error: searchError, search, reset } = useSemanticSearch();
  const [searchMode, setSearchMode] = useState(false);
  const [cart, setCart] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState('Todos');
  const catalogRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))], [products]);
  const enrichedResults = useMemo(() => results.map((r) => ({ ...(products.find((p) => p.productId === r.productId) || r), ...r })), [results, products]);
  const source = searchMode ? enrichedResults : products;
  const displayed = category === 'Todos' ? source : source.filter((p) => p.category === category);

  const doSearch = async (query: string) => { await search(query); setSearchMode(true); setCategory('Todos'); setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40); };
  const clearSearch = () => { reset(); setSearchMode(false); setCategory('Todos'); };

  return <div className="min-h-screen bg-white">
    <Navbar cartCount={cart.length} onSearchClick={() => document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })}/>
    <main>
      <Hero onSearch={doSearch} loading={searchLoading}/>
      <div ref={catalogRef} id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div><h2 className="text-2xl font-bold tracking-tight">{searchMode ? 'Resultados para ti' : 'Catálogo'}</h2><p className="text-sm text-neutral-500 mt-1">{searchMode ? 'Resultados obtenidos con búsqueda semántica.' : 'Explora la colección TechModa.'}</p></div>
          {searchMode && <button onClick={clearSearch} className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c3ee6]"><X size={16}/>Limpiar búsqueda</button>}
        </div>
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2"><SlidersHorizontal size={16} className="text-neutral-400 shrink-0 mr-1"/>{categories.map((c) => <button key={c} onClick={() => setCategory(c)} className={`shrink-0 rounded-full px-4 py-2 text-sm border ${category === c ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-neutral-400'}`}>{c}</button>)}</div>
        {productsLoading ? <div className="py-20 text-center text-neutral-500">Cargando catálogo…</div> : productsError ? <div className="py-16 text-center text-red-600">{productsError}</div> : <ProductGrid products={displayed} onProductClick={(id) => setSelected(products.find(p => p.productId === id) || enrichedResults.find(p => p.productId === id) || null)} onAddToCart={(p) => setCart(prev => [...prev, p])}/>} 
        {searchError && <p className="mt-6 text-sm text-red-600 bg-red-50 p-3 rounded-xl">{searchError}</p>}
      </div>
      <section className="bg-neutral-50 border-y border-neutral-200"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid sm:grid-cols-3 gap-8"><div><div className="font-bold">Busca como hablas</div><p className="text-sm text-neutral-500 mt-2">Embeddings de Bedrock entienden intención, no solo palabras exactas.</p></div><div><div className="font-bold">Compra con contexto</div><p className="text-sm text-neutral-500 mt-2">El asistente RAG recomienda usando productos reales del catálogo.</p></div><div><div className="font-bold">IA responsable</div><p className="text-sm text-neutral-500 mt-2">Moderación, accesibilidad y Guardrails forman parte del capstone.</p></div></div></section>
    </main>
    <Footer/>
    <ShoppingAssistant/>
    <ProductDetail product={selected} onClose={() => setSelected(null)} onAdd={(p) => setCart(prev => [...prev, p])}/>
  </div>;
}
