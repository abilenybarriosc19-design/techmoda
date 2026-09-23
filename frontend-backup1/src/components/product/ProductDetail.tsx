import { ChevronDown, Headphones, Languages, Loader2, ShieldCheck, Sparkles, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../lib/types';
import { api } from '../../lib/api';

interface Props { product: Product | null; onClose: () => void; onAdd: (p: Product) => void; }
export function ProductDetail({ product, onClose, onAdd }: Props) {
  const [details, setDetails] = useState(false);
  const [description, setDescription] = useState('');
  const [translated, setTranslated] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { setDescription(product?.aiDescription || product?.description || ''); setTranslated(''); setError(''); setDetails(false); }, [product]);
  const moderationText = useMemo(() => product?.aiModeration ? 'Contenido verificado' : 'Sin incidencias visibles', [product]);
  if (!product) return null;

  const run = async (key: string, action: () => Promise<void>) => { setBusy(key); setError(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'No fue posible completar esta acción.'); } finally { setBusy(null); } };

  return <div className="fixed inset-0 z-50 bg-black/35 p-0 sm:p-5 flex justify-end" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <aside className="w-full sm:max-w-3xl h-full bg-white sm:rounded-3xl overflow-y-auto store-scrollbar shadow-2xl">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-200 px-5 py-4 flex items-center justify-between">
        <span className="font-bold">Detalle del producto</span><button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100"><X size={20}/></button>
      </div>
      <div className="grid md:grid-cols-2">
        <div className="bg-neutral-100 min-h-[420px]"><img src={product.imageUrl} alt={product.aiAltText || product.name} className="w-full h-full object-cover"/></div>
        <div className="p-6 sm:p-8">
          <p className="text-xs uppercase tracking-wider text-neutral-500">{product.category}</p>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2">{product.name}</h2>
          <p className="text-xl font-semibold mt-3">${product.price.toFixed(2)}</p>
          <p className="text-sm text-neutral-600 leading-6 mt-5">{translated || description}</p>
          <p className="mt-4 text-xs text-neutral-400">{product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}</p>
          <button onClick={() => onAdd(product)} disabled={product.stock === 0} className="mt-6 w-full bg-black text-white py-3.5 rounded-xl font-semibold disabled:opacity-40">Agregar al carrito</button>

          <div className="mt-7 border-t border-neutral-200 pt-5">
            <button onClick={() => setDetails(!details)} className="w-full flex items-center justify-between font-semibold text-sm"><span className="flex items-center gap-2"><Sparkles size={17} className="text-[#6d4aff]"/>Detalles inteligentes</span><ChevronDown size={18} className={`transition ${details ? 'rotate-180' : ''}`}/></button>
            {details && <div className="pt-5 space-y-4 text-sm">
              <div className="flex gap-3"><Tag size={18} className="text-neutral-400 shrink-0"/><div><b>Etiquetas IA</b><p className="text-neutral-500 mt-1">{product.aiLabels?.join(' · ') || 'Disponibles después del enriquecimiento con Rekognition.'}</p></div></div>
              <div className="flex gap-3"><ShieldCheck size={18} className="text-neutral-400 shrink-0"/><div><b>Moderación</b><p className="text-neutral-500 mt-1">{moderationText}</p></div></div>
              <div className="flex gap-3"><Sparkles size={18} className="text-neutral-400 shrink-0"/><div className="flex-1"><b>Descripción con Bedrock</b><p className="text-neutral-500 mt-1">{product.aiDescription ? 'Descripción IA disponible.' : 'Puedes generarla bajo demanda.'}</p><button onClick={() => run('desc', async () => { const r = await api.generateDescription(product.productId); setDescription(r.description || description); })} className="mt-2 text-[#5c3ee6] font-semibold">{busy === 'desc' ? 'Generando…' : 'Generar descripción'}</button></div></div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button onClick={() => run('translate', async () => { const r = await api.translateProduct(product.productId, 'en'); setTranslated(r.description || r.translatedDescription || r.translation || description); })} className="border border-neutral-200 rounded-xl p-3 flex items-center justify-center gap-2 font-semibold"><Languages size={17}/>{busy === 'translate' ? 'Traduciendo…' : 'Traducir EN'}</button>
                <button onClick={() => run('voice', async () => { const r = await api.synthesizeVoice(product.productId); if (r.audioUrl) await new Audio(r.audioUrl).play(); })} className="border border-neutral-200 rounded-xl p-3 flex items-center justify-center gap-2 font-semibold"><Headphones size={17}/>{busy === 'voice' ? <Loader2 size={16} className="animate-spin"/> : 'Escuchar'}</button>
              </div>
              {product.aiAltText && <div className="rounded-xl bg-neutral-50 p-3"><b>Alt text</b><p className="text-neutral-500 mt-1">{product.aiAltText}</p></div>}
              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
            </div>}
          </div>
        </div>
      </div>
    </aside>
  </div>;
}
