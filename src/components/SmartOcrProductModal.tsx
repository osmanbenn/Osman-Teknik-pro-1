import React, { useMemo, useState } from 'react';
import { Camera, Check, Search, X } from 'lucide-react';
import type { StockItem } from '../types';
import { rankProductsFromOcr } from '../utils/smartScan';

interface SmartOcrProductModalProps {
  isOpen: boolean;
  stock: StockItem[];
  onClose: () => void;
  onConfirm: (product: StockItem) => void;
}

export const SmartOcrProductModal: React.FC<SmartOcrProductModalProps> = ({ isOpen, stock, onClose, onConfirm }) => {
  const [text, setText] = useState('');
  const matches = useMemo(() => rankProductsFromOcr(text, stock, 5), [text, stock]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2"><Camera size={17} className="text-orange-400"/> Akıllı Ürün Tanıma</h3>
            <p className="text-[11px] text-zinc-400 mt-1">Kutudaki/model etiketindeki metni girin veya OCR çıktısını yapıştırın. Ürün yalnızca sizin onayınızla sepete eklenir.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-zinc-500"/>
            <textarea autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="Örn: INFINIX NOTE 50 PRO+ 12GB 256GB Titanium Gray" className="w-full min-h-24 rounded-2xl bg-zinc-900 border border-zinc-700 pl-10 pr-3 py-3 text-sm text-white outline-none focus:border-orange-500"/>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Eşleşen stok ürünleri</div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {matches.map(({product,score})=>(
              <button key={product.id} onClick={()=>onConfirm(product)} disabled={product.quantity<=0} className="w-full text-left p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500 disabled:opacity-50">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-sm font-bold text-white">{product.name}</div><div className="text-[11px] text-zinc-400 mt-1">{product.stockCode} · Stok {product.quantity}</div></div>
                  <div className="text-right shrink-0"><div className="text-sm font-black text-orange-400">₺{product.salePriceTl.toLocaleString('tr-TR')}</div><div className="text-[10px] text-emerald-400">%{score} eşleşme</div></div>
                </div>
                <div className="mt-2 text-[11px] font-bold text-zinc-300 flex items-center gap-1"><Check size={12}/> Seç ve sepete ekle</div>
              </button>
            ))}
            {text.trim() && matches.length===0 && <div className="p-4 rounded-2xl border border-dashed border-zinc-700 text-xs text-zinc-400 text-center">Stokta uygun aday bulunamadı.</div>}
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[10px] text-amber-200">Güvenlik: OCR sonucu otomatik satış yapmaz. Yanlış ürün eşleşmesini önlemek için ürün kartına dokunarak onay gerekir.</div>
        </div>
      </div>
    </div>
  );
};
