import { Search } from 'lucide-react';
import { useState } from 'react';
import { THEME, COPY } from '../../lib/constants';

interface HeroProps {
  onSearch?: (query: string) => void;
  loading?: boolean;
}

export function Hero({ onSearch, loading = false }: HeroProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !loading) {
      onSearch?.(searchQuery);
    }
  };

  return (
    <section
      className="relative w-full h-[500px] sm:h-[600px] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: THEME.colors.neutral.bg }}
    >
      {/* Imagen editorial de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80)',
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-6">
        <div className="text-center mb-12">
          {/* Título */}
          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-light mb-6 leading-tight"
            style={{
              color: THEME.colors.neutral.text,
              fontFamily: THEME.typography.fontSerif,
            }}
          >
            {COPY.hero.title}
          </h1>

          {/* Subtítulo */}
          <p
            className="text-sm sm:text-base mb-10"
            style={{ color: THEME.colors.neutral.textLight }}
          >
            {COPY.hero.subtitle}
          </p>
        </div>

        {/* Búsqueda semántica integrada */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative bg-white rounded-sm flex items-center px-4 py-3 sm:py-4">
            <Search
              className="w-5 h-5 flex-shrink-0"
              style={{ color: THEME.colors.neutral.textLight }}
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca algo, por ejemplo: abrigo beige para invierno…"
              disabled={loading}
              className="w-full ml-3 text-sm sm:text-base focus:outline-none bg-transparent"
              style={{ color: THEME.colors.neutral.text }}
            />
          </div>

          {/* CTA Button */}
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="w-full py-3 sm:py-4 text-white text-sm sm:text-base font-light transition-all disabled:opacity-50"
            style={{
              backgroundColor: THEME.colors.primary,
            }}
          >
            {loading ? 'Buscando…' : COPY.hero.searchCTA}
          </button>
        </form>
      </div>
    </section>
  );
}
