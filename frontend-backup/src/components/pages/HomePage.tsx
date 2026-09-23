import { useState } from 'react';
import { THEME } from '../../lib/constants';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { Hero } from '../hero/Hero';
import { ProductGrid } from '../product/ProductGrid';
import { ShoppingAssistant } from '../assistant/ShoppingAssistant';
import { useProducts } from '../../hooks/useProducts';
import { useSemanticSearch } from '../../hooks/useSemanticSearch';
import type { Product } from '../../lib/types';

export function HomePage() {
  const { products } = useProducts();
  const { results: searchResults, loading: searchLoading, search: semanticSearch, reset: resetSearch } = useSemanticSearch();
  const [cart, setCart] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSemanticSearch = async (query: string) => {
    await semanticSearch(query);
    setShowSearchResults(true);
  };

  const handleResetSearch = () => {
    resetSearch();
    setShowSearchResults(false);
  };

  const handleProductClick = () => {
    // TODO: Navigate to product detail page
  };

  const handleAddToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
  };

  const displayedProducts = showSearchResults ? searchResults : products;
  const featuredCount = 4;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: THEME.colors.neutral.white }}
    >
      {/* Navbar */}
      <Navbar cartCount={cart.length} />

      {/* Main Content */}
      <main className="flex-1">
        {showSearchResults ? (
          // Resultados de búsqueda
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4">
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-light"
                  style={{
                    color: THEME.colors.neutral.text,
                    fontFamily: THEME.typography.fontSerif,
                  }}
                >
                  Resultados de búsqueda
                </h1>
                <p className="text-sm mt-1" style={{ color: THEME.colors.neutral.textLight }}>
                  {searchResults.length} productos encontrados
                </p>
              </div>
              <button
                onClick={handleResetSearch}
                className="px-4 py-2 text-sm font-light transition-opacity hover:opacity-60"
                style={{
                  color: THEME.colors.primary,
                  borderBottom: `1px solid ${THEME.colors.neutral.border}`,
                }}
              >
                Volver al inicio
              </button>
            </div>

            <ProductGrid
              products={displayedProducts}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
            />
          </div>
        ) : (
          <>
            {/* Hero */}
            <Hero
              onSearch={handleSemanticSearch}
              loading={searchLoading}
            />

            {/* Contenido principal */}
            <div style={{ backgroundColor: THEME.colors.neutral.white }}>
              {/* Featured Products */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                <ProductGrid
                  products={products.slice(0, featuredCount)}
                  onProductClick={handleProductClick}
                  onAddToCart={handleAddToCart}
                  title="Selección Destacada"
                />
              </section>

              {/* Divider */}
              <div
                className="h-px mx-4 sm:mx-6 lg:mx-8"
                style={{ backgroundColor: THEME.colors.neutral.border }}
              />

              {/* Shopping Assistant */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                <ShoppingAssistant
                  isOpen={true}
                  onProductClick={handleProductClick}
                />
              </section>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
