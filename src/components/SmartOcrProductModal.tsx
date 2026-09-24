import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, Loader2, Search, X } from 'lucide-react';
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const matches = useMemo(() => rankProductsFromOcr(text, stock, 5), [text, stock]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => () => stopCamera(), []);
  useEffect(() => { if (!isOpen) stopCamera(); }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(()=>{}); } }, 0);
    } catch {
      setError('Kamera açılamadı. Tarayıcı kamera iznini kontrol edin.');
    }
  };

  const captureAndRead = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setBusy(true); setError(null);
    try {
      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Görüntü işlenemedi.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const response = await fetch('/api/gemini/product-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, mimeType: 'image/jpeg' })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Etiket okunamadı.');
      setText(String(payload.text || '').trim());
      stopCamera();
    } catch (e: any) {
      setError(e?.message || 'OCR işlemi başarısız oldu.');
    } finally { setBusy(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div><h3 className="text-sm font-black text-white flex items-center gap-2"><Camera size={17} className="text-orange-400"/> Akıllı Ürün Tanıma</h3><p className="text-[11px] text-zinc-400 mt-1">Etiketi kamerayla çekin. Okunan metin stokla eşleştirilir; satış için ürün onayı zorunludur.</p></div>
          <button onClick={()=>{stopCamera();onClose();}} className="p-2 text-zinc-400 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-4 space-y-3">
          {cameraOpen ? <div className="rounded-2xl overflow-hidden bg-black border border-zinc-800"><video ref={videoRef} playsInline muted className="w-full aspect-[4/3] object-cover"/><div className="p-2 grid grid-cols-2 gap-2"><button onClick={stopCamera} className="p-2 rounded-xl bg-zinc-800 text-xs font-bold text-white">Vazgeç</button><button disabled={busy} onClick={captureAndRead} className="p-2 rounded-xl bg-orange-600 text-xs font-black text-white flex justify-center gap-2">{busy?<Loader2 size={15} className="animate-spin"/>:<Camera size={15}/>} Etiketi Oku</button></div></div> :
          <button onClick={startCamera} className="w-full p-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-xs font-black text-white flex justify-center items-center gap-2"><Camera size={16}/> Kamerayı Aç ve Etiketi Tara</button>}
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-[11px] text-red-300">{error}</div>}
          <div className="relative"><Search size={16} className="absolute left-3 top-3 text-zinc-500"/><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Örn: INFINIX NOTE 50 PRO+ 12GB 256GB Titanium Gray" className="w-full min-h-20 rounded-2xl bg-zinc-900 border border-zinc-700 pl-10 pr-3 py-3 text-sm text-white outline-none focus:border-orange-500"/></div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Eşleşen stok ürünleri</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {matches.map(({product,score})=><button key={product.id} onClick={()=>onConfirm(product)} disabled={product.quantity<=0} className="w-full text-left p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500 disabled:opacity-50"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-white">{product.name}</div><div className="text-[11px] text-zinc-400 mt-1">{product.stockCode} · Stok {product.quantity}</div></div><div className="text-right shrink-0"><div className="text-sm font-black text-orange-400">₺{product.salePriceTl.toLocaleString('tr-TR')}</div><div className="text-[10px] text-emerald-400">%{score} eşleşme</div></div></div><div className="mt-2 text-[11px] font-bold text-zinc-300 flex items-center gap-1"><Check size={12}/> Seç ve sepete ekle</div></button>)}
            {text.trim() && matches.length===0 && <div className="p-4 rounded-2xl border border-dashed border-zinc-700 text-xs text-zinc-400 text-center">Stokta uygun aday bulunamadı.</div>}
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[10px] text-amber-200">OCR yalnızca görüntüde görülen metni çıkarır. Ürün otomatik satılmaz; stok kartını siz onaylarsınız.</div>
        </div>
      </div>
    </div>
  );
};
