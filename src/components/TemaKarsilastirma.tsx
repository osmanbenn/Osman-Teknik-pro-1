import React from 'react';
import { Palette, CheckCircle2, Smartphone, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';

export const TemaKarsilastirma: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div id="theme-comparison-module" className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Palette className="text-orange-500" size={24} />
            Mobil Arayüz & Tema Karşılaştırması
          </h1>
          <p className="text-xs text-zinc-400">
            Osman Teknik Pro için özel olarak tasarlanmış 3 mobil tasarım vizyonunu yan yana inceleyin ve dilediğinizi tek tıkla aktif hale getirin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Şu Anki Aktif Tema:</span>
          <span className="px-3 py-1 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-xs">
            {theme === 'modern-dark' ? 'Modern ve Koyu' : theme === 'light-card' ? 'Açık ve Kartlı' : theme === 'colorful-minimal' ? 'Renkli ve Minimal' : 'Karşılaştırma Modu'}
          </span>
        </div>
      </div>

      {/* 3 Phone Mockups Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* THEME 1: Modern ve Koyu */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[320px] bg-zinc-950 border-4 border-zinc-800 rounded-[38px] p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[560px]">
            {/* Phone notch */}
            <div className="w-24 h-4 bg-zinc-800 rounded-b-xl mx-auto mb-2"></div>

            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-black text-orange-500">OSMAN TEKNİK PRO</span>
                <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-mono font-bold">KOYU</span>
              </div>

              {/* Sample Stat Card */}
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-[10px] text-zinc-400">Bugünkü Ciro:</span>
                <p className="text-lg font-mono font-black text-emerald-400">₺24.850</p>
                <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                  <span>Servis: ₺12.400</span>
                  <span>Satış: ₺12.450</span>
                </div>
              </div>

              {/* Service Cards */}
              <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-orange-400 font-mono">SRV-2026-001</span>
                  <span className="text-emerald-400">Hazır</span>
                </div>
                <p className="text-[11px] font-bold text-white">iPhone 13 - Ekran Onarımı</p>
                <p className="text-[9px] text-zinc-400">Ahmet Yılmaz (0532 555...)</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="bg-zinc-800 p-2 rounded-xl text-center text-[10px] font-bold text-zinc-200">
                  + Servis Kabulü
                </div>
                <div className="bg-zinc-800 p-2 rounded-xl text-center text-[10px] font-bold text-zinc-200">
                  + Hızlı POS
                </div>
              </div>
            </div>

            {/* Bottom Nav Mock */}
            <div className="bg-zinc-900 border-t border-zinc-800 p-2 rounded-2xl mt-3 flex justify-around text-[9px] text-zinc-400 font-bold">
              <span className="text-orange-500">Ana Sayfa</span>
              <span>Servis</span>
              <span className="text-orange-400">● AI</span>
              <span>Satış</span>
              <span>Menü</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="font-bold text-white text-sm">Tasarım 1: Modern ve Koyu</h3>
            <p className="text-[11px] text-zinc-400 mb-2">Turuncu neon aksanlar, göz yormayan karanlık zemin</p>
            <button
              onClick={() => setTheme('modern-dark')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                theme === 'modern-dark'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-orange-600 hover:bg-orange-500 text-white'
              }`}
            >
              {theme === 'modern-dark' ? '✓ Aktif Tema' : 'Bu Temayı Uygula'}
            </button>
          </div>
        </div>

        {/* THEME 2: Açık ve Kartlı */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[320px] bg-slate-100 border-4 border-slate-300 rounded-[38px] p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[560px]">
            {/* Phone notch */}
            <div className="w-24 h-4 bg-slate-300 rounded-b-xl mx-auto mb-2"></div>

            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-black text-slate-900">OSMAN TEKNİK PRO</span>
                <span className="text-[9px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">AÇIK</span>
              </div>

              {/* Sample Stat Card */}
              <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
                <span className="text-[10px] text-slate-500">Bugünkü Ciro:</span>
                <p className="text-lg font-mono font-black text-emerald-600">₺24.850</p>
                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                  <span>Servis: ₺12.400</span>
                  <span>Satış: ₺12.450</span>
                </div>
              </div>

              {/* Service Cards */}
              <div className="bg-white border border-slate-200 p-2.5 rounded-xl space-y-1 shadow-xs">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-orange-600 font-mono">SRV-2026-001</span>
                  <span className="text-emerald-600">Hazır</span>
                </div>
                <p className="text-[11px] font-bold text-slate-900">iPhone 13 - Ekran Onarımı</p>
                <p className="text-[9px] text-slate-500">Ahmet Yılmaz (0532 555...)</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="bg-white border border-slate-200 p-2 rounded-xl text-center text-[10px] font-bold text-slate-800 shadow-xs">
                  + Servis Kabulü
                </div>
                <div className="bg-white border border-slate-200 p-2 rounded-xl text-center text-[10px] font-bold text-slate-800 shadow-xs">
                  + Hızlı POS
                </div>
              </div>
            </div>

            {/* Bottom Nav Mock */}
            <div className="bg-white border-t border-slate-200 p-2 rounded-2xl mt-3 flex justify-around text-[9px] text-slate-600 font-bold shadow-xs">
              <span className="text-orange-600">Ana Sayfa</span>
              <span>Servis</span>
              <span className="text-orange-600">● AI</span>
              <span>Satış</span>
              <span>Menü</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="font-bold text-white text-sm">Tasarım 2: Açık ve Kartlı</h3>
            <p className="text-[11px] text-zinc-400 mb-2">Ferah açık zemin, yüksek kontrastlı kartlar</p>
            <button
              onClick={() => setTheme('light-card')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                theme === 'light-card'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
              }`}
            >
              {theme === 'light-card' ? '✓ Aktif Tema' : 'Bu Temayı Uygula'}
            </button>
          </div>
        </div>

        {/* THEME 3: Renkli ve Minimal */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[320px] bg-slate-950 border-4 border-indigo-900/60 rounded-[38px] p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[560px]">
            {/* Phone notch */}
            <div className="w-24 h-4 bg-indigo-950 rounded-b-xl mx-auto mb-2"></div>

            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  OSMAN TEKNİK PRO
                </span>
                <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-mono font-bold">RENKLİ</span>
              </div>

              {/* Sample Stat Card */}
              <div className="bg-gradient-to-br from-indigo-950 to-purple-950 border border-purple-800/40 p-3 rounded-2xl shadow-lg shadow-purple-900/20">
                <span className="text-[10px] text-purple-300">Bugünkü Ciro:</span>
                <p className="text-lg font-mono font-black text-white">₺24.850</p>
                <div className="flex justify-between text-[9px] text-purple-400/80 mt-1">
                  <span>Servis: ₺12.400</span>
                  <span>Satış: ₺12.450</span>
                </div>
              </div>

              {/* Service Cards */}
              <div className="bg-slate-900/80 border border-indigo-900/40 p-2.5 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-pink-400 font-mono">SRV-2026-001</span>
                  <span className="text-emerald-400">Hazır</span>
                </div>
                <p className="text-[11px] font-bold text-white">iPhone 13 - Ekran Onarımı</p>
                <p className="text-[9px] text-slate-400">Ahmet Yılmaz (0532 555...)</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-xl text-center text-[10px] font-bold text-white shadow-xs">
                  + Servis Kabulü
                </div>
                <div className="bg-slate-900 border border-indigo-900/50 p-2 rounded-xl text-center text-[10px] font-bold text-white">
                  + Hızlı POS
                </div>
              </div>
            </div>

            {/* Bottom Nav Mock */}
            <div className="bg-slate-900 border-t border-indigo-900/50 p-2 rounded-2xl mt-3 flex justify-around text-[9px] text-slate-400 font-bold">
              <span className="text-purple-400">Ana Sayfa</span>
              <span>Servis</span>
              <span className="text-pink-400">● AI</span>
              <span>Satış</span>
              <span>Menü</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="font-bold text-white text-sm">Tasarım 3: Renkli ve Minimal</h3>
            <p className="text-[11px] text-zinc-400 mb-2">Canlı gradyanlar, dinamik rozetler</p>
            <button
              onClick={() => setTheme('colorful-minimal')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                theme === 'colorful-minimal'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {theme === 'colorful-minimal' ? '✓ Aktif Tema' : 'Bu Temayı Uygula'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
