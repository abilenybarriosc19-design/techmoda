import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAssistant } from '../../hooks/useAssistant';
import { COPY } from '../../lib/constants';

export function ShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const { messages, loading, error, sendMessage } = useAssistant();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (value.trim()) { sendMessage(value.trim()); setValue(''); } };
  return <>
    <button id="asistente" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-30 rounded-full bg-[#6d4aff] text-white shadow-xl px-4 py-3 flex items-center gap-2 font-semibold text-sm"><MessageCircle size={19}/> <span className="hidden sm:inline">Tu estilista</span></button>
    {open && <div className="fixed inset-0 z-50 bg-black/25 sm:bg-transparent pointer-events-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="absolute bottom-0 right-0 sm:bottom-5 sm:right-5 w-full sm:w-[390px] h-[78vh] sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between"><div><div className="flex items-center gap-2 font-bold"><Sparkles size={17} className="text-[#6d4aff]"/>Tu estilista TechModa</div><p className="text-xs text-neutral-500 mt-1">Cuéntanos qué tienes en mente</p></div><button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-neutral-100"><X size={18}/></button></div>
        <div className="flex-1 overflow-y-auto store-scrollbar p-5 space-y-4">
          {messages.length === 0 && <div><div className="w-10 h-10 rounded-full bg-[#f4f1ff] text-[#6d4aff] grid place-items-center"><Bot size={19}/></div><p className="mt-4 font-semibold">¿Qué estás buscando hoy?</p><p className="text-sm text-neutral-500 mt-1">Cuéntame la ocasión, color, clima o estilo.</p><div className="mt-5 space-y-2">{COPY.assistant.suggestions.map((s) => <button key={s} onClick={() => sendMessage(s)} className="w-full text-left border border-neutral-200 hover:border-[#c8bcff] rounded-xl px-3 py-2.5 text-sm">{s}</button>)}</div></div>}
          {messages.map((m, i) => <div key={i} className={m.role === 'user' ? 'ml-8' : 'mr-5'}><div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === 'user' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-800'}`}>{m.text}</div>{m.productRefs?.length ? <div className="mt-2 flex flex-wrap gap-1.5">{m.productRefs.map((p) => <span key={p.productId} className="text-[11px] border rounded-full px-2 py-1">{p.name || p.productId}</span>)}</div> : null}</div>)}
          {loading && <div className="text-xs text-neutral-400">TechModa está pensando…</div>}
          {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
          <div ref={end}/>
        </div>
        <form onSubmit={submit} className="p-3 border-t flex gap-2"><input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Escribe lo que buscas…" className="flex-1 bg-neutral-100 rounded-xl px-4 py-3 text-sm outline-none"/><button disabled={!value.trim() || loading} className="w-11 h-11 rounded-xl bg-[#6d4aff] text-white grid place-items-center disabled:opacity-40"><Send size={17}/></button></form>
      </div>
    </div>}
  </>;
}
