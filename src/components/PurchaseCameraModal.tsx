import React, { useState } from 'react';
import { Barcode, PackagePlus, X } from 'lucide-react';
import type { StockItem } from '../types';
import { CameraScannerModal } from './CameraScannerModal';
import { resolveScan } from '../utils/smartScan';

interface Props {
  isOpen: boolean; stock: StockItem[]; onClose: () => void;
  onReceiveExisting: (product: StockItem, quantity: number, costUsd: number, supplier: string) => void;
  onCreateNew: (draft: { barcode: string; quantity: number; costUsd: number; supplier: string }) => void;
}
export const PurchaseCameraModal: React.FC<Props> = ({ isOpen, stock, onClose, onReceiveExisting, onCreateNew }) => {
  const [scannerOpen,setScannerOpen]=useState(false); const [barcode,setBarcode]=useState(''); const [product,setProduct]=useState<StockItem|null>(null);
  const [quantity,setQuantity]=useState(1); const [costUsd,setCostUsd]=useState(0); const [supplier,setSupplier]=useState('');
  if(!isOpen) return null;
  const scan=(code:string)=>{const r=resolveScan(code,stock);setBarcode(r.code);setProduct(r.product||null);if(r.product){setCostUsd(r.product.costUsd);setSupplier(r.product.supplierName||'');}setScannerOpen(false);};
  const reset=()=>{setBarcode('');setProduct(null);setQuantity(1);setCostUsd(0);setSupplier('');};
  return <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3"><div className="w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden">
    <div className="p-4 border-b border-zinc-800 flex justify-between"><div><h3 className="font-black text-white flex gap-2 items-center"><PackagePlus size={18} className="text-emerald-400"/> Mal Alış - Kamera</h3><p className="text-[11px] text-zinc-400">Barkodu okutun, adet ve USD alış maliyetini girin.</p></div><button onClick={onClose}><X className="text-zinc-400"/></button></div>
    <div className="p-4 space-y-3"><button onClick={()=>setScannerOpen(true)} className="w-full p-3 rounded-2xl bg-emerald-600 text-white text-xs font-black flex justify-center gap-2"><Barcode size={16}/> Ürün Barkodu Tara</button>
    {barcode && <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3"><div className="text-[10px] text-zinc-500 font-mono">{barcode}</div>{product?<><div className="text-sm text-white font-bold mt-1">{product.name}</div><div className="text-[11px] text-zinc-400">Mevcut stok: {product.quantity} · Eski maliyet: ${product.costUsd}</div></>:<div className="text-xs text-amber-300 mt-1">Yeni barkod. Yeni stok kartı taslağı açılacak.</div>}</div>}
    {barcode && <><div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-zinc-400">Alınan Adet<input type="number" min={1} value={quantity} onChange={e=>setQuantity(Math.max(1,Number(e.target.value)||1))} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-700 p-2 text-white"/></label><label className="text-[11px] text-zinc-400">Birim Maliyet ($)<input type="number" min={0} step="0.01" value={costUsd} onChange={e=>setCostUsd(Math.max(0,Number(e.target.value)||0))} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-700 p-2 text-white"/></label></div><label className="text-[11px] text-zinc-400">Tedarikçi<input value={supplier} onChange={e=>setSupplier(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-700 p-2 text-white"/></label><button onClick={()=>{if(product){onReceiveExisting(product,quantity,costUsd,supplier);reset();}else{onCreateNew({barcode,quantity,costUsd,supplier});reset();}}} className="w-full p-3 rounded-2xl bg-orange-600 text-white text-xs font-black">{product?'Mevcut Ürüne Stoğa Giriş Yap':'Yeni Stok Kartını Tamamla'}</button></>}
    </div></div><CameraScannerModal isOpen={scannerOpen} onClose={()=>setScannerOpen(false)} onScan={scan} title="Mal Alış - Barkod Tara" description="Gelen ürünün barkodunu kameraya gösterin." expectedType="barcode" allowContinuous={false}/></div>;
};