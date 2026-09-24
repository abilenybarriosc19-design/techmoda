import { LockKeyhole, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { Hero } from '../hero/Hero';
import { ProductGrid } from '../product/ProductGrid';
import { ProductDetail } from '../product/ProductDetail';
import { ProductModal } from '../ProductModal';
import { CartDrawer, type CartLine } from '../common/CartDrawer';
import { ShoppingAssistant } from '../assistant/ShoppingAssistant';
import { useProducts } from '../../hooks/useProducts';
import { useSemanticSearch } from '../../hooks/useSemanticSearch';
import type { Product } from '../../lib/types';

export function HomePage() {
  const { products, loading: productsLoading, error: productsError, createProduct, updateProduct, deleteProduct } = useProducts();
  const { results, loading: searchLoading, error: searchError, search, reset } = useSemanticSearch();
  const [searchMode, setSearchMode] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();
  const [actionError, setActionError] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState('Todos');
  const catalogRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))], [products]);
  const enrichedResults = useMemo(() => results.map((r) => ({ ...(products.find((p) => p.productId === r.productId) || r), ...r })), [results, products]);
  const source = searchMode ? enrichedResults : products;
  const displayed = (category === 'Todos' ? source : source.filter((p) => p.category === category)).filter((p) => !showFavorites || favorites.includes(p.productId));

  const doSearch = async (query: string) => { await search(query); setSearchMode(true); setCategory('Todos'); setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40); };
  const clearSearch = () => { reset(); setSearchMode(false); setCategory('Todos'); };
  const addToCart = (product: Product, size = 'M') => { if (/\b(bolso|bolsa|tote)\b/i.test(product.name)) size = ''; setCart((items) => { const match = items.find((item) => item.product.productId === product.productId && item.size === size); return match ? items.map((item) => item === match ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { product, size, quantity: 1 }]; }); setCartOpen(true); };
  const changeQuantity = (id: string, size: string, amount: number) => setCart((items) => items.flatMap((item) => item.product.productId === id && item.size === size ? (item.quantity + amount <= 0 ? [] : [{ ...item, quantity: item.quantity + amount }]) : [item]));
  const removeFromCart = (id: string, size: string) => setCart((items) => items.filter((item) => item.product.productId !== id || item.size !== size));
  const toggleFavorite = (id: string) => setFavorites((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const saveProduct = async (draft: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>) => { setActionError(''); const result = editing ? await updateProduct(editing.productId, draft) : await createProduct(draft); if (!result.success) setActionError(result.error || 'No se pudo guardar el producto.'); };
  const removeProduct = async (product: Product) => { if (!window.confirm(`¿Eliminar “${product.name}”?`)) return; setActionError(''); const result = await deleteProduct(product.productId); if (!result.success) setActionError(result.error || 'No se pudo eliminar el producto.'); };

  return <div className="min-h-screen bg-[#fffdf9]">
    <Navbar cartCount={cart.reduce((total, line) => total + line.quantity, 0)} onCartClick={() => setCartOpen(true)} onSearchClick={() => document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })}/>
    <main>
      <Hero onSearch={doSearch} loading={searchLoading}/>
      <div ref={catalogRef} id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div><p className="eyebrow">{searchMode ? 'SELECCIÓN PARA TI' : 'COLECCIÓN TECHMODA'}</p><h2 className="section-title mt-2">{searchMode ? 'Resultados para ti' : 'Piezas que hablan por ti.'}</h2><p className="text-sm text-neutral-500 mt-2">{searchMode ? 'Elegimos piezas cercanas a lo que buscas.' : 'Una colección curada para cada momento.'}</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={() => setShowFavorites(!showFavorites)} className={`rounded-full px-3 py-2 text-xs font-semibold border ${showFavorites ? 'bg-[#4d315d] text-white border-[#4d315d]' : 'border-neutral-200'}`}>{showFavorites ? 'Viendo favoritos' : `Favoritos (${favorites.length})`}</button><button onClick={() => setAdmin(!admin)} className={`rounded-full px-3 py-2 text-xs font-semibold border inline-flex items-center gap-1 ${admin ? 'bg-black text-white border-black' : 'border-neutral-200'}`}><LockKeyhole size={13}/>{admin ? 'Salir de Admin' : 'Modo Admin'}</button>{admin && <button onClick={() => { setEditing(undefined); setModalOpen(true); }} className="rounded-full px-3 py-2 text-xs font-semibold bg-[#4d315d] text-white inline-flex items-center gap-1"><Plus size={13}/>Agregar producto</button>}</div>
          {searchMode && <button onClick={clearSearch} className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c3ee6]"><X size={16}/>Limpiar búsqueda</button>}
        </div>
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2"><SlidersHorizontal size={16} className="text-neutral-400 shrink-0 mr-1"/>{categories.map((c) => <button key={c} onClick={() => setCategory(c)} className={`shrink-0 rounded-full px-4 py-2 text-sm border ${category === c ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-neutral-400'}`}>{c === 'Todos' ? 'Todas las categorías' : c}</button>)}</div>
        {productsLoading ? <div className="py-20 text-center text-neutral-500"><span className="sr-only">Cargando</span>Cargando catálogo…</div> : productsError ? <div className="py-16 text-center text-red-600">{productsError}</div> : <ProductGrid products={displayed} favoriteIds={favorites} onToggleFavorite={toggleFavorite} admin={admin} onEdit={(product) => { setEditing(product); setModalOpen(true); }} onDelete={removeProduct} onProductClick={(id) => setSelected(products.find(p => p.productId === id) || enrichedResults.find(p => p.productId === id) || null)} onAddToCart={(p) => addToCart(p)}/>} 
        {searchError && <p className="mt-6 text-sm text-red-600 bg-red-50 p-3 rounded-xl">{searchError}</p>}
        {actionError && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl">{actionError}</p>}
      </div>
      <section id="tecnologia" className="bg-[#3d2949] text-white"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid md:grid-cols-[.85fr_2fr] gap-10"><div><p className="eyebrow text-[#d7bfef]">LA EXPERIENCIA TECHMODA</p><h2 className="section-title text-white mt-3">Moda que se adapta a ti.</h2></div><div className="grid sm:grid-cols-3 gap-7"><div><div className="font-bold">Descubre con libertad</div><p className="text-sm text-white/65 mt-2 leading-6">Explora según tus planes, colores favoritos y estilo personal.</p></div><div><div className="font-bold">Elige con confianza</div><p className="text-sm text-white/65 mt-2 leading-6">Conoce cada pieza antes de añadirla a tu selección.</p></div><div><div className="font-bold">Una compra más cercana</div><p className="text-sm text-white/65 mt-2 leading-6">Encuentra descripciones, traducciones y opciones de lectura a tu ritmo.</p></div></div></div></section>
    </main>
    <Footer/>
    <ShoppingAssistant/>
    <ProductDetail product={selected} onClose={() => setSelected(null)} onAdd={addToCart}/>
    <CartDrawer open={cartOpen} lines={cart} onClose={() => setCartOpen(false)} onChangeQuantity={changeQuantity} onRemove={removeFromCart}/>
    <ProductModal isOpen={modalOpen} product={editing} onClose={() => setModalOpen(false)} onSave={saveProduct}/>
  </div>;
}
