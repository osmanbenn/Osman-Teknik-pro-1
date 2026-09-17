import React from 'react';
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Menu as MenuIcon,
  Bot,
  Sparkles
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { theme } = useTheme();

  return (
    <nav
      id="mobile-bottom-navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 px-2 py-1.5 transition-colors border-t select-none ${
        theme === 'light-card'
          ? 'bg-white/95 border-slate-200 text-slate-700 shadow-xl'
          : theme === 'colorful-minimal'
          ? 'bg-slate-950/95 border-indigo-900/60 text-slate-300 backdrop-blur-md'
          : 'bg-zinc-950/95 border-zinc-800 text-zinc-400 backdrop-blur-md'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 1. Ana Sayfa */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-all rounded-xl ${
            activeTab === 'dashboard'
              ? theme === 'light-card' ? 'text-orange-600 font-bold' : 'text-orange-500 font-bold'
              : 'hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5 tracking-tight">Ana Sayfa</span>
        </button>

        {/* 2. Servis */}
        <button
          onClick={() => onSelectTab('servis')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-all rounded-xl ${
            activeTab === 'servis'
              ? theme === 'light-card' ? 'text-orange-600 font-bold' : 'text-orange-500 font-bold'
              : 'hover:text-zinc-200'
          }`}
        >
          <Wrench size={20} className={activeTab === 'servis' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5 tracking-tight">Servis</span>
        </button>

        {/* 3. ORTADA YÜKSELTİLMİŞ AI ASİSTAN */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => onSelectTab('ai')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 text-white ring-4 ring-orange-500/40 shadow-orange-500/50'
                : 'bg-gradient-to-tr from-orange-600 to-amber-600 text-white shadow-orange-600/40 hover:brightness-110'
            } border-4 ${
              theme === 'light-card' ? 'border-slate-100' : 'border-zinc-950'
            }`}
            title="AI Asistan ve Doğal Dil Komutları"
          >
            <Bot size={26} className="animate-pulse" />
          </button>
          <span className={`text-[10px] font-black mt-1 ${activeTab === 'ai' ? 'text-orange-500' : 'text-zinc-400'}`}>
            AI Asistan
          </span>
        </div>

        {/* 4. Satış */}
        <button
          onClick={() => onSelectTab('satis')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-all rounded-xl ${
            activeTab === 'satis'
              ? theme === 'light-card' ? 'text-orange-600 font-bold' : 'text-orange-500 font-bold'
              : 'hover:text-zinc-200'
          }`}
        >
          <ShoppingCart size={20} className={activeTab === 'satis' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5 tracking-tight">Satış</span>
        </button>

        {/* 5. Menü */}
        <button
          onClick={() => onSelectTab('menu')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-all rounded-xl ${
            activeTab === 'menu'
              ? theme === 'light-card' ? 'text-orange-600 font-bold' : 'text-orange-500 font-bold'
              : 'hover:text-zinc-200'
          }`}
        >
          <MenuIcon size={20} className={activeTab === 'menu' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5 tracking-tight">Menü</span>
        </button>
      </div>
    </nav>
  );
};
