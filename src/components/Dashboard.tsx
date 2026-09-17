import React, { useState } from 'react';
import {
  Wrench,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  DollarSign,
  ArrowRight,
  Package,
  Calendar,
  Layers,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavigationTab, ServiceRecord } from '../types';
import { UsdCalculatorModal } from './UsdCalculatorModal';

interface DashboardProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenServiceIntake: () => void;
  onOpenReceipt: (service: ServiceRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenServiceIntake,
  onOpenReceipt
}) => {
  const {
    services,
    stock,
    sales,
    phoneTrades,
    cashMovements,
    customers,
    settings
  } = useApp();

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Status counts for services
  const pendingCount = services.filter(s => s.stage === 'kabul' || s.stage === 'ariza_tespiti').length;
  const repairingCount = services.filter(s => s.stage === 'onarimda').length;
  const readyCount = services.filter(s => s.stage === 'hazir').length;

  // Financial totals today
  const serviceRevenue = cashMovements
    .filter(c => c.type === 'gelir_servis')
    .reduce((a, b) => a + b.amount, 0);

  const saleRevenue = cashMovements
    .filter(c => c.type === 'gelir_satis')
    .reduce((a, b) => a + b.amount, 0);

  const phoneBuyAmount = cashMovements
    .filter(c => c.type === 'cihaz_alimi')
    .reduce((a, b) => a + b.amount, 0);

  const totalCiro = serviceRevenue + saleRevenue;

  // Alerts
  const criticalStockItems = stock.filter(s => s.isActive && s.quantity <= s.minStock);
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCustomers = customers.filter(c =>
    c.installments.some(ins => !ins.isPaid && ins.dueDate < todayStr)
  );

  return (
    <div id="dashboard-module" className="space-y-6 pb-8 w-full max-w-full overflow-x-hidden">
      {/* Top Banner / Currency & Calculator */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
            ₺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-semibold">T.C. Merkez Bankası / Serbest Piyasa:</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">CANLI</span>
            </div>
            <p className="text-sm sm:text-base font-mono font-bold text-white mt-0.5">
              1 USD = <span className="text-emerald-400">₺{settings.usdExchangeRate.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCalculatorOpen(true)}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Calculator size={15} className="text-orange-400" />
          <span>USD ⇄ TL Hesap Makinesi</span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-[10px]">F10</kbd>
        </button>
      </div>

      {/* Main Stats: 4 Top Ciro Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Toplam Ciro */}
        <div className="bg-zinc-900 border border-orange-500/30 p-4 rounded-2xl sm:rounded-3xl shadow-lg shadow-orange-500/5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-bold text-orange-400">Bugünkü Ciro</span>
            <TrendingUp size={16} className="text-orange-400" />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-white mt-2">
            ₺{totalCiro.toLocaleString('tr-TR')}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Servis + Hızlı Satış</span>
        </div>

        {/* Servis Cirosu */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl sm:rounded-3xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold">Servis Cirosu</span>
            <Wrench size={16} className="text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-blue-400 mt-2">
            ₺{serviceRevenue.toLocaleString('tr-TR')}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Tamamlanan onarımlar</span>
        </div>

        {/* Hızlı Satış Cirosu */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl sm:rounded-3xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold">Mağaza Satışı</span>
            <ShoppingCart size={16} className="text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-emerald-400 mt-2">
            ₺{saleRevenue.toLocaleString('tr-TR')}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Aksesuar & parça</span>
        </div>

        {/* Telefon Alım Hacmi */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl sm:rounded-3xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold">Telefon Alımı</span>
            <Smartphone size={16} className="text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-amber-400 mt-2">
            ₺{phoneBuyAmount.toLocaleString('tr-TR')}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">2. El & Sıfır Cihaz Girişi</span>
        </div>
      </div>

      {/* Quick Action Cards (4 Fast Buttons) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={onOpenServiceIntake}
          className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-transform active:scale-98 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Plus size={18} />
          </div>
          <div className="flex items-center justify-center flex-wrap gap-1 text-center">
            <span>Yeni Servis Kabulü</span>
            <kbd className="hidden sm:inline-block text-[9px] bg-white/25 text-white font-mono px-1 py-0.2 rounded font-black border border-white/30">F2</kbd>
          </div>
        </button>

        <button
          onClick={() => onNavigate('satis')}
          className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-transform active:scale-98 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <ShoppingCart size={18} />
          </div>
          <div className="flex items-center justify-center flex-wrap gap-1 text-center">
            <span>Hızlı Satış (POS)</span>
            <kbd className="hidden sm:inline-block text-[9px] bg-white/25 text-white font-mono px-1 py-0.2 rounded font-black border border-white/30">F3</kbd>
          </div>
        </button>

        <button
          onClick={() => onNavigate('telefon')}
          className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-600/20 flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-transform active:scale-98 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Smartphone size={18} />
          </div>
          <div className="flex items-center justify-center flex-wrap gap-1 text-center">
            <span>Telefon Alım/Satım</span>
            <kbd className="hidden sm:inline-block text-[9px] bg-white/25 text-white font-mono px-1 py-0.2 rounded font-black border border-white/30">Alt+T</kbd>
          </div>
        </button>

        <button
          onClick={() => onNavigate('kasa')}
          className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-zinc-800 hover:from-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-transform active:scale-98 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <DollarSign size={18} />
          </div>
          <div className="flex items-center justify-center flex-wrap gap-1 text-center">
            <span>Kasa & Gün Sonu</span>
            <kbd className="hidden sm:inline-block text-[9px] bg-white/25 text-white font-mono px-1 py-0.2 rounded font-black border border-white/30">Alt+5</kbd>
          </div>
        </button>
      </div>

      {/* Service Status Breakdown (Bekleyen, Onarımda, Hazır) */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="text-orange-500" size={18} />
            Atölye Durum Takibi
          </h2>
          <button
            onClick={() => onNavigate('servis')}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
          >
            Tüm Servisleri Gör <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => onNavigate('servis')}
            className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 p-4 rounded-2xl cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold">Kabul & Teşhis Bekleyen</span>
              <Clock size={15} className="text-amber-400" />
            </div>
            <p className="text-3xl font-mono font-black text-amber-400 mt-2">{pendingCount}</p>
            <span className="text-[10px] text-zinc-500 mt-1 block">Arıza tespiti yapılacak</span>
          </div>

          <div
            onClick={() => onNavigate('servis')}
            className="bg-zinc-950 border border-zinc-800 hover:border-blue-500/40 p-4 rounded-2xl cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold">Masmada Onarımda</span>
              <Wrench size={15} className="text-blue-400" />
            </div>
            <p className="text-3xl font-mono font-black text-blue-400 mt-2">{repairingCount}</p>
            <span className="text-[10px] text-zinc-500 mt-1 block">Parça montajı & test sürecinde</span>
          </div>

          <div
            onClick={() => onNavigate('servis')}
            className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 p-4 rounded-2xl cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold">Teslime Hazır</span>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-mono font-black text-emerald-400 mt-2">{readyCount}</p>
            <span className="text-[10px] text-zinc-500 mt-1 block">Müşteri teslimatını bekliyor</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Warnings & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Critical Stock & Overdue Cari Alerts */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-3xl space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-amber-400" size={17} />
            Kritik Stok & Geciken Cari Uyarıları
          </h2>

          {/* Critical Stock list */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Tükenmek Üzere Olan Parçalar ({criticalStockItems.length})
            </span>
            {criticalStockItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('stok')}
                className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-white">{item.name}</p>
                  <p className="text-[10px] font-mono text-zinc-400">Kod: {item.stockCode}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                    Kalan: {item.quantity} Adet
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Min: {item.minStock}</span>
                </div>
              </div>
            ))}
            {criticalStockItems.length === 0 && (
              <p className="text-xs text-zinc-500 italic">Kritik stok seviyesinde ürün bulunmamaktadır.</p>
            )}
          </div>

          {/* Overdue Debt list */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Vadesi Gecikmiş Cari Hesaplar ({overdueCustomers.length})
            </span>
            {overdueCustomers.slice(0, 2).map((cust) => (
              <div
                key={cust.id}
                onClick={() => onNavigate('cari')}
                className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/50 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-white">{cust.name}</p>
                  <p className="text-[10px] font-mono text-zinc-400">{cust.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-red-400">
                    ₺{cust.totalDebt}
                  </span>
                  <span className="text-[9px] text-red-400 block font-semibold">Gecikmiş Vade</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Son İşlemler (Son Servisler ve Satışlar) */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="text-orange-500" size={17} />
              Son Servis & Atölye İşlemleri
            </h2>
            <button
              onClick={() => onNavigate('servis')}
              className="text-xs text-orange-400 font-bold"
            >
              Tümü
            </button>
          </div>

          <div className="space-y-2.5">
            {services.slice(0, 4).map((srv) => (
              <div
                key={srv.id}
                onClick={() => onOpenReceipt(srv)}
                className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-400 font-mono text-xs font-bold">
                    {srv.deviceBrand.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{srv.deviceBrand} {srv.deviceModel}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        srv.stage === 'hazir' ? 'bg-emerald-500/20 text-emerald-400' :
                        srv.stage === 'onarimda' ? 'bg-blue-500/20 text-blue-400' :
                        srv.stage === 'teslim_edildi' ? 'bg-zinc-800 text-zinc-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {srv.stage.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate max-w-[220px]">
                      {srv.customerName} • {srv.faultDescription}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-emerald-400">₺{srv.finalPrice || srv.estimatedPrice}</span>
                  <span className="text-[9px] font-mono text-zinc-500 block">{srv.serviceNo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Currency Conversion Modal */}
      <UsdCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
};
