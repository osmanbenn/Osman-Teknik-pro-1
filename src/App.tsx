import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { Servis } from './components/Servis';
import { Satis } from './components/Satis';
import { TelefonAlimSatim } from './components/TelefonAlimSatim';
import { Stok } from './components/Stok';
import { Cari } from './components/Cari';
import { Kasa } from './components/Kasa';
import { AiAsistan } from './components/AiAsistan';
import { TemaKarsilastirma } from './components/TemaKarsilastirma';
import { Ayarlar } from './components/Ayarlar';
import { Menu } from './components/Menu';
import { ServisKabulModal } from './components/ServisKabulModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { CustomerTrackingPortal } from './components/CustomerTrackingPortal';
import { TechnicianPerformanceModal } from './components/TechnicianPerformanceModal';
import { VoiceAssistantController } from './components/VoiceAssistantController';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { UsdCalculatorModal } from './components/UsdCalculatorModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { NavigationTab, ServiceRecord, SaleRecord } from './types';
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
  Award,
  QrCode
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Modal states
  const [isServiceIntakeOpen, setIsServiceIntakeOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isUsdCalcOpen, setIsUsdCalcOpen] = useState(false);
  const [receiptService, setReceiptService] = useState<ServiceRecord | null>(null);
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null);

  // Global Klavye Kısayolları Dinleyicisi
  useKeyboardShortcuts({
    activeTab,
    onNavigate: (tab) => setActiveTab(tab),
    onOpenServiceIntake: () => setIsServiceIntakeOpen(true),
    onOpenShortcuts: () => setIsShortcutsOpen(true),
    onOpenCalculator: () => setIsUsdCalcOpen(true),
    onCloseModals: () => {
      setIsShortcutsOpen(false);
      setIsUsdCalcOpen(false);
      setIsServiceIntakeOpen(false);
      setReceiptService(null);
      setReceiptSale(null);
    },
    hasOpenModal:
      isShortcutsOpen ||
      isUsdCalcOpen ||
      isServiceIntakeOpen ||
      receiptService !== null ||
      receiptSale !== null
  });

  const desktopNavItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Alt+D' },
    { id: 'servis' as NavigationTab, label: 'Teknik Servis', icon: Wrench, shortcut: 'F2' },
    { id: 'teknisyen' as NavigationTab, label: 'Teknisyen Performans', icon: Award, shortcut: 'Alt+P' },
    { id: 'takip' as NavigationTab, label: 'Müşteri QR Takip', icon: QrCode, shortcut: 'Alt+Q' },
    { id: 'satis' as NavigationTab, label: 'Hızlı Satış', icon: ShoppingCart, shortcut: 'F3' },
    { id: 'telefon' as NavigationTab, label: 'Telefon Alım/Satım', icon: Smartphone, shortcut: 'Alt+T' },
    { id: 'stok' as NavigationTab, label: 'Stok & Parça', icon: Package, shortcut: 'Alt+3' },
    { id: 'cari' as NavigationTab, label: 'Cari & Veresiye', icon: Users, shortcut: 'Alt+4' },
    { id: 'kasa' as NavigationTab, label: 'Kasa & Gün Sonu', icon: Banknote, shortcut: 'Alt+5' },
    { id: 'ai' as NavigationTab, label: 'AI Asistan', icon: Bot, shortcut: 'Alt+A' },
    { id: 'temalar' as NavigationTab, label: 'Tema Karşılaştırma', icon: Palette },
    { id: 'ayarlar' as NavigationTab, label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col w-full max-w-full overflow-x-hidden ${
        theme === 'light-card'
          ? 'bg-slate-100 text-slate-900'
          : theme === 'colorful-minimal'
          ? 'bg-slate-950 text-slate-100'
          : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Top Header */}
      <Header onOpenShortcuts={() => setIsShortcutsOpen(true)} />

      {/* Desktop Navigation Tabs (Hidden on mobile) */}
      <div
        className={`hidden md:block border-b px-4 py-2 transition-colors ${
          theme === 'light-card'
            ? 'bg-white border-slate-200'
            : theme === 'colorful-minimal'
            ? 'bg-slate-900 border-indigo-900/40'
            : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-xs font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
                title={item.shortcut ? `Kısayol: ${item.shortcut}` : undefined}
              >
                <Icon size={15} />
                <span>{item.label}</span>
                {item.shortcut && (
                  <kbd
                    className={`hidden xl:inline px-1 py-0.2 rounded text-[9px] font-mono transition-opacity ${
                      isActive
                        ? 'bg-black/30 text-white border border-white/20'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 opacity-60'
                    }`}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-2.5 sm:p-5 max-w-7xl w-full mx-auto pb-24 md:pb-6 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenServiceIntake={() => setIsServiceIntakeOpen(true)}
            onOpenReceipt={(srv) => {
              setReceiptService(srv);
              setReceiptSale(null);
            }}
          />
        )}

        {activeTab === 'servis' && (
          <Servis
            onOpenNewIntake={() => setIsServiceIntakeOpen(true)}
            onOpenReceipt={(srv) => {
              setReceiptService(srv);
              setReceiptSale(null);
            }}
          />
        )}

        {activeTab === 'teknisyen' && (
          <TechnicianPerformanceModal
            isOpen={true}
            onClose={() => setActiveTab('servis')}
          />
        )}

        {activeTab === 'takip' && (
          <CustomerTrackingPortal
            onBack={() => setActiveTab('servis')}
          />
        )}

        {activeTab === 'satis' && (
          <Satis
            onOpenReceipt={(sale) => {
              setReceiptSale(sale);
              setReceiptService(null);
            }}
          />
        )}

        {activeTab === 'telefon' && <TelefonAlimSatim />}

        {activeTab === 'stok' && <Stok />}

        {activeTab === 'cari' && <Cari />}

        {activeTab === 'kasa' && <Kasa />}

        {activeTab === 'ai' && <AiAsistan />}

        {activeTab === 'temalar' && <TemaKarsilastirma />}

        {activeTab === 'ayarlar' && <Ayarlar />}

        {activeTab === 'menu' && (
          <Menu onSelectTab={(tab) => setActiveTab(tab)} />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation with elevated center AI Asistan */}
      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />
      </div>

      {/* Global Modals */}
      <ServisKabulModal
        isOpen={isServiceIntakeOpen}
        onClose={() => setIsServiceIntakeOpen(false)}
        onCreatedSuccess={(newSrv) => {
          setReceiptService(newSrv);
          setReceiptSale(null);
        }}
      />

      <ThermalReceiptModal
        isOpen={receiptService !== null || receiptSale !== null}
        onClose={() => {
          setReceiptService(null);
          setReceiptSale(null);
        }}
        serviceRecord={receiptService || undefined}
        saleRecord={receiptSale || undefined}
      />

      {/* Klavye Kısayolları Modalı */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenServiceIntake={() => setIsServiceIntakeOpen(true)}
        onOpenCalculator={() => setIsUsdCalcOpen(true)}
      />

      {/* USD / TL Canlı Çevirici Modalı */}
      <UsdCalculatorModal
        isOpen={isUsdCalcOpen}
        onClose={() => setIsUsdCalcOpen(false)}
      />

      {/* Global AI Voice Assistant Controller */}
      <VoiceAssistantController
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenServiceIntake={() => setIsServiceIntakeOpen(true)}
        onOpenTechnicianModal={() => setActiveTab('teknisyen')}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
