import React, { useState } from 'react';
import { DollarSign, ArrowRightLeft, X, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface UsdCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsdCalculatorModal: React.FC<UsdCalculatorModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useApp();
  const [usdAmount, setUsdAmount] = useState<number | string>(100);
  const [tlAmount, setTlAmount] = useState<number | string>(Number((100 * settings.usdExchangeRate).toFixed(2)));
  const [customRate, setCustomRate] = useState<number>(settings.usdExchangeRate);

  if (!isOpen) return null;

  const handleUsdChange = (val: string) => {
    setUsdAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setTlAmount((num * customRate).toFixed(2));
    } else {
      setTlAmount('');
    }
  };

  const handleTlChange = (val: string) => {
    setTlAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && customRate > 0) {
      setUsdAmount((num / customRate).toFixed(2));
    } else {
      setUsdAmount('');
    }
  };

  const handleRateChange = (newRate: number) => {
    setCustomRate(newRate);
    updateSettings({ usdExchangeRate: newRate });
    const numUsd = parseFloat(String(usdAmount));
    if (!isNaN(numUsd)) {
      setTlAmount((numUsd * newRate).toFixed(2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">USD / TL Canlı Kur & Hesaplayıcı</h3>
              <p className="text-xs text-zinc-400">Parça maliyeti ve döviz çevrimi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Kur Belirleme */}
          <div className="bg-zinc-800/80 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-xs text-zinc-300 font-medium">Canlı Satış Kuru:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">$ 1 = ₺</span>
              <input
                type="number"
                step="0.05"
                value={customRate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value) || 1)}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-sm font-bold text-emerald-400 text-right focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Çift Yönlü Hesaplayıcı */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Dolar Tutarı ($ USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-400 text-sm font-bold">$</span>
                <input
                  type="number"
                  value={usdAmount}
                  onChange={(e) => handleUsdChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-lg font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-center -my-1">
              <div className="p-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                <ArrowRightLeft size={16} />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Türk Lirası Karşılığı (₺ TL)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-400 text-sm font-bold">₺</span>
                <input
                  type="number"
                  value={tlAmount}
                  onChange={(e) => handleTlChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-lg font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Hızlı Seçenekler */}
          <div>
            <span className="text-[11px] text-zinc-500 block mb-1.5">Hızlı Parça Maliyeti:</span>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 50, 80].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleUsdChange(String(preset))}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-1.5 rounded-lg border border-zinc-700/60 transition-colors"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-orange-600/20"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
