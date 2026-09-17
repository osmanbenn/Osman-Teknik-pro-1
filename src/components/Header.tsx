import React, { useState } from 'react';
import {
  Wrench,
  Bell,
  Palette,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Mic,
  Keyboard
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';
import { UsdCalculatorModal } from './UsdCalculatorModal';
import { CloudSyncModal } from './CloudSyncModal';

interface HeaderProps {
  onOpenVoiceAssistant?: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenVoiceAssistant, onOpenShortcuts }) => {
  const { currentUser, setCurrentUser, users, settings, criticalStockCount, overdueCustomerCount } = useApp();
  const { theme, setTheme, themeLabels } = useTheme();

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCloudOpen, setIsCloudOpen] = useState(false);

  const totalAlerts = criticalStockCount + overdueCustomerCount;

  return (
    <>
      <header className={`sticky top-0 z-40 transition-colors border-b px-2.5 sm:px-4 py-2.5 sm:py-3 w-full overflow-hidden ${
        theme === 'light-card'
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
          : theme === 'colorful-minimal'
          ? 'bg-slate-900/95 border-indigo-900/50 text-white shadow-md'
          : 'bg-zinc-950/95 border-zinc-800 text-white backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-lg sm:text-xl shrink-0">
              <Wrench size={18} className="stroke-[2.5]" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-[8px]">
                <CheckCircle2 size={9} className="text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold tracking-tight text-sm sm:text-lg">OSMAN TEKNİK</span>
                <span className="px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-black tracking-wide uppercase bg-orange-500 text-white">PRO</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">Telefon Servis & Alım Satım Sistemi</p>
            </div>
          </div>

          {/* Center / Right actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Live USD Exchange Rate Chip */}
            <button
              id="header-usd-calc-btn"
              onClick={() => setIsCalcOpen(true)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                theme === 'light-card'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
              }`}
              title="Canlı USD Kuru ve Çevirici"
            >
              <DollarSign size={13} className="text-emerald-400 shrink-0" />
              <span className="hidden md:inline text-[11px] text-zinc-400">USD:</span>
              <span className="font-mono font-bold text-[11px] sm:text-xs">₺{settings.usdExchangeRate.toFixed(2)}</span>
            </button>

            {/* Firebase Cloud Sync Button */}
            <button
              id="header-cloud-sync-btn"
              onClick={() => setIsCloudOpen(true)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                theme === 'light-card'
                  ? 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100'
                  : 'bg-orange-950/40 border-orange-500/40 text-orange-300 hover:bg-orange-900/50'
              }`}
              title="Firebase Bulut Senkronizasyonu & Google Girişi"
            >
              <Cloud size={14} className="text-orange-400 shrink-0" />
              <span className="hidden sm:inline font-bold">Bulut</span>
            </button>

            {/* AI Sesli Asistan Button (Hidden on mobile phones, accessible via Floating Voice Assistant / AI Tab) */}
            <button
              id="header-voice-assistant-btn"
              onClick={() => {
                if (onOpenVoiceAssistant) {
                  onOpenVoiceAssistant();
                } else {
                  document.getElementById('global-voice-assistant-fab')?.click();
                }
              }}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                theme === 'light-card'
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                  : 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/50'
              }`}
              title="Yapay Zeka Sesli Kontrol (Mikrofon)"
            >
              <Mic size={14} className="text-red-400 animate-pulse" />
              <span className="hidden lg:inline font-bold">Sesli Asistan</span>
            </button>

            {/* Klavye Kısayolları Rehberi Butonu (Hidden on mobile phones) */}
            <button
              id="header-keyboard-shortcuts-btn"
              onClick={onOpenShortcuts}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                theme === 'light-card'
                  ? 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
              title="Klavye Kısayolları (F1)"
            >
              <Keyboard size={15} className="text-orange-400" />
              <span className="hidden lg:inline font-bold">Kısayollar</span>
              <kbd className="hidden lg:inline px-1 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">F1</kbd>
            </button>

            {/* Quick Theme Switcher */}
            <div className="relative">
              <button
                id="header-theme-toggle-btn"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className={`p-2 rounded-xl border transition-colors flex items-center gap-1 text-xs font-semibold ${
                  theme === 'light-card'
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
                title="Tema Değiştir"
              >
                <Palette size={16} className="text-orange-400" />
                <span className="hidden md:inline">{themeLabels[theme]?.previewBadge}</span>
                <ChevronDown size={12} className="opacity-70" />
              </button>

              {isThemeMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Arayüz Tasarımı Seçin</p>
                  </div>
                  <div className="space-y-1 mt-1">
                    {(Object.keys(themeLabels) as ThemeMode[]).map((tKey) => (
                      <button
                        key={tKey}
                        onClick={() => {
                          setTheme(tKey);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex flex-col transition-colors ${
                          theme === tKey
                            ? 'bg-orange-600 text-white font-semibold'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <span className="font-bold">{themeLabels[tKey].name}</span>
                        <span className={`text-[10px] mt-0.5 ${theme === tKey ? 'text-orange-100' : 'text-zinc-500'}`}>
                          {themeLabels[tKey].desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="header-notification-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-xl border transition-colors ${
                  theme === 'light-card'
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Bell size={18} />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {totalAlerts}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-white">Sistem Uyarıları</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">{totalAlerts} Bekleyen</span>
                  </div>
                  <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                    {criticalStockCount > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                        <p className="font-bold">⚠️ {criticalStockCount} Ürün Kritik Stokta!</p>
                        <p className="text-[11px] text-amber-400/80 mt-0.5">Yeniden sipariş verilmesi veya tedarikçi alımı açılması gerekiyor.</p>
                      </div>
                    )}
                    {overdueCustomerCount > 0 && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                        <p className="font-bold">🚨 {overdueCustomerCount} Müşteri Cari Vadesi Geçti!</p>
                        <p className="text-[11px] text-red-400/80 mt-0.5">WhatsApp üzerinden taksit hatırlatma mesajı gönderebilirsiniz.</p>
                      </div>
                    )}
                    {totalAlerts === 0 && (
                      <p className="text-xs text-zinc-400 text-center py-4">Herhangi bir kritik uyarı bulunmuyor.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current User & Role Switcher */}
            <div className="relative">
              <button
                id="header-user-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border transition-colors ${
                  theme === 'light-card'
                    ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-orange-400 font-semibold uppercase">{currentUser.role}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-orange-600/30 border border-orange-500/50 flex items-center justify-center font-bold text-orange-400 text-xs">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <p className="text-[11px] text-zinc-400 uppercase font-semibold">Kullanıcı & Rol Değiştir</p>
                    <p className="text-xs text-zinc-200 mt-0.5">Yetki izinlerini test edin</p>
                  </div>
                  <div className="space-y-1 mt-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          currentUser.id === u.id
                            ? 'bg-orange-600 text-white font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          <p className={`text-[10px] ${currentUser.id === u.id ? 'text-orange-100' : 'text-zinc-400'}`}>
                            {u.role === 'yonetici' ? 'Yönetici (Tam Yetki)' : u.role === 'teknisyen' ? 'Teknisyen (Servis & Stok)' : 'Çırak (Kısıtlı Görüntüleme)'}
                          </p>
                        </div>
                        {currentUser.id === u.id && <ShieldCheck size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <UsdCalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
      <CloudSyncModal isOpen={isCloudOpen} onClose={() => setIsCloudOpen(false)} />
    </>
  );
};
