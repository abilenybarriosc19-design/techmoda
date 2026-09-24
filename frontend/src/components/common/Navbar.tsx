import { Heart, Menu, Search, ShoppingBag, Sparkles } from 'lucide-react';

interface NavbarProps { cartCount?: number; onSearchClick?: () => void; onCartClick?: () => void; }
export function Navbar({ cartCount = 0, onSearchClick, onCartClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#fffdf9]/95 backdrop-blur border-b border-[#e8e1dc]">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-bold tracking-tight text-xl">
          <span className="w-8 h-8 rounded-full bg-[#4d315d] text-white grid place-items-center text-xs">TM</span>
          TechModa
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-600">
          <a href="#catalogo" className="hover:text-black">Catálogo</a>
          <a href="#asistente" className="hover:text-black flex items-center gap-1.5"><Sparkles size={15}/>Tu estilista</a>
          <a href="#tecnologia" className="hover:text-black">La experiencia</a>
        </nav>
        <div className="flex items-center gap-1">
          <button onClick={onSearchClick} className="p-2.5 rounded-full hover:bg-neutral-100" aria-label="Buscar"><Search size={20}/></button>
          <button className="hidden sm:block p-2.5 rounded-full hover:bg-neutral-100" aria-label="Favoritos"><Heart size={20}/></button>
          <button onClick={onCartClick} className="p-2.5 rounded-full hover:bg-neutral-100 relative" aria-label="Carrito">
            <ShoppingBag size={20}/>{cartCount > 0 && <span className="absolute top-0 right-0 min-w-4 h-4 px-1 rounded-full bg-[#6d4aff] text-white text-[10px] grid place-items-center">{cartCount}</span>}
          </button>
          <button className="md:hidden p-2.5 rounded-full hover:bg-neutral-100" aria-label="Menú"><Menu size={20}/></button>
        </div>
      </div>
    </header>
  );
}
