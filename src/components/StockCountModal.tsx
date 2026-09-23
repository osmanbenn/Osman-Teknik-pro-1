import React, { useMemo, useState } from 'react';
import { Camera, CheckCircle2, RotateCcw, X } from 'lucide-react';
import type { StockItem } from '../types';
import { CameraScannerModal } from './CameraScannerModal';
import { resolveScan, stockCountDifference } from '../utils/smartScan';

interface Props {
  isOpen: boolean;
  stock: StockItem[];
  onClose: () => void;
  onApply: (counts: Record<string, number>) => void;
}

export const StockCountModal: React.FC<Props> = ({ isOpen, stock, onClose, onApply }) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [unknown, setUnknown] = useState<string[]>([]);

  const rows = useMemo(() => Object.entries(counts).map(([id, counted]) => {
    const product = stock.find(s => s.id === id);
    return product ? { product, counted, diff: stockCountDifference(product.quantity, counted) } : null;
  }).filter(Boolean) as Array<{product: StockItem; counted: number; diff: number}>, [counts, stock]);

  if (!isOpen) return null;

  const scan = (code: string) => {
    const result = resolveScan(code, stock);
    if (result.product) {
      setCounts(prev => ({ ...prev, [result.product!.id]: (prev[result.product!.id] || 0) + 1 }));
    } else {
      setUnknown(prev => prev.includes(result.code) ? prev : [result.code, ...prev].slice(0, 8));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between gap-3">
          <div><h3 className="text-base font-black text-white">Kamera ile Stok Sayımı</h3><p className="text-[11px] text-zinc-400">Her okutma sayılan adedi +1 artırır. Kaydetmeden önce sistem farkını kontrol edin.</p></div>
          <button onClick={onClose} className="text-zinc-400"><X size={20}/></button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={()=>setScannerOpen(true)} className="rounded-2xl bg-orange-600 p-3 text-xs font-black text-white flex items-center justify-center gap-2"><Camera size={16}/> Seri Sayımı Başlat</button>
            <button onClick={()=>{setCounts({});setUnknown([])}} className="rounded-2xl bg-zinc-800 p-3 text-xs font-bold text-zinc-200 flex items-center justify-center gap-2"><RotateCcw size={15}/> Sayımı Sıfırla</button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-zinc-900 p-2"><div className="text-[10px] text-zinc-500">Ürün</div><b className="text-white">{rows.length}</b></div>
            <div className="rounded-xl bg-zinc-900 p-2"><div className="text-[10px] text-zinc-500">Okutma</div><b className="text-white">{Object.values(counts).reduce((a,b)=>a+b,0)}</b></div>
            <div className="rounded-xl bg-zinc-900 p-2"><div className="text-[10px] text-zinc-500">Farklı</div><b className="text-amber-400">{rows.filter(r=>r.diff!==0).length}</b></div>
          </div>
          <div className="space-y-2">
            {rows.map(({product,counted,diff})=><div key={product.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 flex items-center justify-between gap-3">
              <div><div className="text-xs font-bold text-white">{product.name}</div><div className="text-[10px] text-zinc-500">{product.barcode} · Sistem: {product.quantity}</div></div>
              <div className="flex items-center gap-2"><input type="number" min={0} value={counted} onChange={e=>setCounts(p=>({...p,[product.id]:Math.max(0,Number(e.target.value)||0)}))} className="w-16 rounded-lg bg-zinc-950 border border-zinc-700 p-1.5 text-center text-xs text-white"/><span className={`w-12 text-right text-xs font-black ${diff===0?'text-emerald-400':diff>0?'text-blue-400':'text-red-400'}`}>{diff>0?'+':''}{diff}</span></div>
            </div>)}
            {!rows.length && <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-xs text-zinc-500">Henüz ürün okutulmadı.</div>}
          </div>
          {unknown.length>0 && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200">Kayıtsız barkodlar: {unknown.join(', ')}</div>}
          <button disabled={!rows.length} onClick={()=>onApply(counts)} className="w-full rounded-2xl bg-emerald-600 disabled:opacity-40 p-3 text-xs font-black text-white flex justify-center items-center gap-2"><CheckCircle2 size={16}/> Sayım Farklarını Onayla ve Stoğa Uygula</button>
        </div>
      </div>
      <CameraScannerModal isOpen={scannerOpen} onClose={()=>setScannerOpen(false)} onScan={scan} title="Stok Sayım - Seri Barkod Okutma" description="Raflardaki ürünleri sırayla okutun. Aynı ürün her okutulduğunda +1 sayılır." expectedType="barcode" allowContinuous={true}/>
    </div>
  );
};
