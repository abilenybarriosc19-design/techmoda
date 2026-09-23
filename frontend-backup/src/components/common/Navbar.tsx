import { Search, Heart, ShoppingCart } from 'lucide-react';
import { THEME } from '../../lib/constants';

interface NavbarProps {
  onSearchClick?: () => void;
  cartCount?: number;
}

export function Navbar({ onSearchClick, cartCount = 0 }: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-50"
      style={{ backgroundColor: THEME.colors.neutral.white }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <a href="/" className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-white text-xs sm:text-sm font-light"
              style={{ backgroundColor: THEME.colors.primary }}
            >
              TM
            </div>
            <span
              className="text-lg sm:text-xl font-light hidden sm:inline"
              style={{ color: THEME.colors.neutral.text, fontFamily: THEME.typography.fontSerif }}
            >
              TechModa
            </span>
          </a>

          {/* Actions */}
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={onSearchClick}
              className="p-1.5 sm:p-2 transition-opacity hover:opacity-60"
              title="Buscar"
            >
              <Search
                className="w-5 h-5"
                style={{ color: THEME.colors.neutral.text }}
                strokeWidth={1.5}
              />
            </button>

            <button
              className="p-1.5 sm:p-2 transition-opacity hover:opacity-60"
              title="Favoritos"
            >
              <Heart
                className="w-5 h-5"
                style={{ color: THEME.colors.neutral.text }}
                strokeWidth={1.5}
              />
            </button>

            <button
              className="p-1.5 sm:p-2 transition-opacity hover:opacity-60 relative"
              title="Carrito"
            >
              <ShoppingCart
                className="w-5 h-5"
                style={{ color: THEME.colors.neutral.text }}
                strokeWidth={1.5}
              />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-light text-center"
                  style={{ backgroundColor: THEME.colors.primary, fontSize: '10px' }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px"
          style={{ backgroundColor: THEME.colors.neutral.border }}
        />
      </div>
    </header>
  );
}
