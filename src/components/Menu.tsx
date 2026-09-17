import React from 'react';
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Smartphone,
  Package,
  Users,
  Banknote,
  Bot,
  Palette,
  Settings,
  ShieldAlert,
  ChevronRight,
  LogOut,
  UserCheck,
  Award,
  QrCode
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';

interface MenuProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const Menu: React.FC<MenuProps> = ({ onSelectTab }) => {
  const { currentUser, switchUserRole, settings } = useApp();

  const menuItems = [
    { id: 'dashboard' as NavigationTab, label: 'Ana Sayfa & Gösterge Paneli', icon: LayoutDashboard, desc: 'Günlük ciro ve durum özetleri', color: 'text-orange-500' },
    { id: 'servis' as NavigationTab, label: 'Teknik Servis Yönetimi', icon: Wrench, desc: 'Kabul, arıza tespiti, onarım ve teslimat', color: 'text-blue-500' },
    { id: 'teknisyen' as NavigationTab, label: 'Teknisyen Performans', icon: Award, desc: 'Usta bazlı ciro, tamamlanan cihaz ve tamir başarı oranları', color: 'text-amber-400' },
    { id: 'takip' as NavigationTab, label: 'Müşteri Canlı Takip Portalı', icon: QrCode, desc: 'Karekod veya Servis No ile müşteri durum sorgulama', color: 'text-emerald-400' },
    { id: 'satis' as NavigationTab, label: 'Hızlı Satış & Barkod POS', icon: ShoppingCart, desc: 'Barkod tarama, sepet ve parçalı ödeme', color: 'text-emerald-500' },
    { id: 'telefon' as NavigationTab, label: 'Telefon Alım & Satım', icon: Smartphone, desc: '2. El cihaz ekspertizi, IMEI kontrolü ve kâr hesabı', color: 'text-amber-500' },
    { id: 'stok' as NavigationTab, label: 'Stok & Yedek Parça', icon: Package, desc: 'Kritik stoklar, toptancı sipariş robotu ve USD maliyet', color: 'text-purple-500' },
    { id: 'cari' as NavigationTab, label: 'Cari & Veresiye Hesaplar', icon: Users, desc: 'Müşteri bakiyeleri, vadeler ve WhatsApp hatırlatma', color: 'text-pink-500' },
    { id: 'kasa' as NavigationTab, label: 'Kasa & Gün Sonu (Z Raporu)', icon: Banknote, desc: 'Nakit/POS kasası, masraflar ve sayım mutabakatı', color: 'text-emerald-400' },
    { id: 'ai' as NavigationTab, label: 'AI Asistan & Doğal Dil', icon: Bot, desc: 'Akıllı komutlar ve çift aşamalı onay sistemi', color: 'text-indigo-400' },
    { id: 'temalar' as NavigationTab, label: 'Mobil Arayüz Karşılaştırması', icon: Palette, desc: '3 farklı mobil tema vitrini', color: 'text-cyan-400' },
    { id: 'ayarlar' as NavigationTab, label: 'Sistem & Donanım Ayarları', icon: Settings, desc: 'Termal yazıcı, 58/80mm, döviz kurları ve yedekleme', color: 'text-zinc-400' },
  ];

  return (
    <div id="mobile-menu-drawer" className="space-y-5 pb-28 max-w-xl mx-auto">
      {/* Current User Role Info & Switcher */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500 font-black text-base">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{currentUser.name}</h3>
            <p className="text-[11px] text-zinc-400 capitalize">
              Rol: <strong className="text-orange-400">{currentUser.role}</strong> ({settings.branchName})
            </p>
          </div>
        </div>

        <button
          onClick={() => switchUserRole(currentUser.role === 'yonetici' ? 'teknisyen' : 'yonetici')}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors"
        >
          <UserCheck size={14} /> Rol Değiştir ({currentUser.role === 'yonetici' ? 'Teknisyen Yap' : 'Yönetici Yap'})
        </button>
      </div>

      {/* Navigation Items */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl divide-y divide-zinc-800/80 overflow-hidden shadow-xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 group-hover:border-zinc-700 transition-colors ${item.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm group-hover:text-orange-400 transition-colors">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</p>
                </div>
              </div>

              <ChevronRight size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          );
        })}
      </div>

      <div className="text-center text-[10px] text-zinc-600">
        {settings.firmName} ERP v3.2.0 Pro • 2026
      </div>
    </div>
  );
};
