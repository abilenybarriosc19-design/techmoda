import { ArrowDown, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface HeroProps { onSearch?: (query: string) => void; loading?: boolean; }
export function Hero({ onSearch, loading = false }: HeroProps) {
  const [query, setQuery] = useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (query.trim() && !loading) onSearch?.(query.trim()); };
  return (
    <section id="top" className="hero-shell border-b border-[#e6dfd9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 grid lg:grid-cols-[1.1fr_.9fr] gap-10 items-center">
        <div className="max-w-3xl relative z-10">
          <div className="eyebrow"><Sparkles size={14}/> TECHMODA · NUEVA COLECCIÓN</div>
          <h1 className="display-title mt-5">Tu estilo,<br/><em>mejor entendido.</em></h1>
          <p className="mt-5 text-neutral-600 text-base sm:text-lg max-w-xl leading-7">Cuéntanos la ocasión, el color o cómo quieres sentirte. Descubre piezas que combinan contigo y encuentra tu próximo look.</p>
          <div className="mt-6 flex items-center gap-3 text-xs text-neutral-500"><span className="w-8 h-px bg-[#8d71a9]"/> Una selección pensada para ti</div>
        </div>
        <div className="hero-photo hidden lg:block"><img src="/products/cream-coat.png" alt="Abrigo color crema de la colección TechModa"/></div>
        <form onSubmit={submit} className="lg:col-span-2 max-w-4xl bg-white/95 rounded-2xl p-2 sm:p-2.5 shadow-[0_14px_35px_rgba(79,54,75,.10)] border border-[#e6dfd9] flex items-center gap-2">
          <Search className="ml-2 text-neutral-400 shrink-0" size={21}/>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej. algo abrigado para el frío" className="min-w-0 flex-1 px-2 py-3 bg-transparent outline-none text-sm sm:text-base" />
          <button disabled={!query.trim() || loading} className="shrink-0 rounded-xl bg-[#4d315d] text-white px-4 sm:px-6 py-3 text-sm font-semibold disabled:opacity-50">
            {loading ? 'Buscando…' : 'Buscar con IA'}
          </button>
        </form>
        <div className="lg:col-span-2 mt-[-1.3rem] flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span>Prueba:</span>
          {['ropa para clima frío', 'algo cómodo y blanco', 'un look casual'].map((x) => <button key={x} onClick={() => { setQuery(x); onSearch?.(x); }} className="hover:text-[#6d4aff]">“{x}”</button>)}
        </div><a href="#catalogo" className="lg:col-span-2 mt-[-.4rem] inline-flex items-center gap-2 text-sm font-semibold text-[#4d315d] hover:text-black">Explorar colección <ArrowDown size={16}/></a>
      </div>
    </section>
  );
}
