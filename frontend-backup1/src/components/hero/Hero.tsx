import { Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface HeroProps { onSearch?: (query: string) => void; loading?: boolean; }
export function Hero({ onSearch, loading = false }: HeroProps) {
  const [query, setQuery] = useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (query.trim() && !loading) onSearch?.(query.trim()); };
  return (
    <section id="top" className="bg-[#f7f5ff] border-b border-[#ebe7ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[#5c3ee6] text-xs font-semibold mb-4"><Sparkles size={15}/> COMPRA CON INTELIGENCIA ARTIFICIAL</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">Encuentra tu próximo look.</h1>
          <p className="mt-3 text-neutral-600 text-sm sm:text-base">Describe lo que buscas con tus propias palabras y TechModa encuentra los productos más relacionados.</p>
        </div>
        <form onSubmit={submit} className="mt-7 max-w-4xl bg-white rounded-2xl p-2 sm:p-2.5 shadow-sm border border-neutral-200 flex items-center gap-2">
          <Search className="ml-2 text-neutral-400 shrink-0" size={21}/>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej. algo abrigado para el frío" className="min-w-0 flex-1 px-2 py-3 bg-transparent outline-none text-sm sm:text-base" />
          <button disabled={!query.trim() || loading} className="shrink-0 rounded-xl bg-[#6d4aff] text-white px-4 sm:px-6 py-3 text-sm font-semibold disabled:opacity-50">
            {loading ? 'Buscando…' : 'Buscar con IA'}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
          <span>Prueba:</span>
          {['ropa para clima frío', 'algo cómodo y blanco', 'un look casual'].map((x) => <button key={x} onClick={() => { setQuery(x); onSearch?.(x); }} className="hover:text-[#6d4aff]">“{x}”</button>)}
        </div>
      </div>
    </section>
  );
}
