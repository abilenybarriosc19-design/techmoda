import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Product } from '../../lib/types';

export interface CartLine { product: Product; quantity: number; size: string; }

interface Props { open: boolean; lines: CartLine[]; onClose: () => void; onChangeQuantity: (id: string, size: string, amount: number) => void; onRemove: (id: string, size: string) => void; }

export function CartDrawer({ open, lines, onClose, onChangeQuantity, onRemove }: Props) {
  if (!open) return null;
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return <div className="fixed inset-0 z-50 bg-black/30" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-[#fffdf9] shadow-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between border-b border-[#e8e1dc] pb-5"><div className="flex items-center gap-2 font-bold"><ShoppingBag size={19}/> Tu selección</div><button onClick={onClose} className="p-2 rounded-full hover:bg-black/5"><X size={19}/></button></div>
      {lines.length === 0 ? <div className="flex-1 grid place-items-center text-center text-neutral-500"><div><ShoppingBag className="mx-auto mb-3"/><p className="font-semibold text-neutral-800">Tu carrito está vacío</p><p className="text-sm mt-1">Agrega las piezas que más te gusten.</p></div></div> : <div className="flex-1 overflow-y-auto py-5 space-y-5">{lines.map(({ product, quantity, size }) => <div className="flex gap-3" key={`${product.productId}-${size}`}><img src={product.imageUrl || '/products/cream-coat.png'} className="w-16 h-20 object-cover rounded-xl bg-neutral-100" alt=""/><div className="flex-1 min-w-0"><div className="flex justify-between gap-3"><div><p className="font-semibold text-sm truncate">{product.name}</p><p className="text-xs text-neutral-500 mt-1">{size ? `Talla ${size}` : ''}</p></div><button onClick={() => onRemove(product.productId, size)} className="text-neutral-400 hover:text-red-600"><Trash2 size={16}/></button></div><div className="flex items-center justify-between mt-3"><div className="flex items-center border border-neutral-200 rounded-lg"><button onClick={() => onChangeQuantity(product.productId, size, -1)} className="p-1.5"><Minus size={14}/></button><span className="w-6 text-center text-sm">{quantity}</span><button onClick={() => onChangeQuantity(product.productId, size, 1)} className="p-1.5"><Plus size={14}/></button></div><span className="font-semibold text-sm">${(product.price * quantity).toFixed(2)}</span></div></div></div>)}</div>}
      <div className="border-t border-[#e8e1dc] pt-5"><div className="flex justify-between font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div><p className="text-xs text-neutral-500 mt-2">Carrito demostrativo · no hay pagos reales.</p><button onClick={onClose} className="w-full mt-4 py-3 rounded-xl bg-[#4d315d] text-white font-semibold">Seguir explorando</button></div>
    </aside>
  </div>;
}
