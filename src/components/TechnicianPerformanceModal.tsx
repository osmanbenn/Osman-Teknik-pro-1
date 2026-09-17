import React, { useState } from 'react';
import {
  X,
  Users,
  Award,
  TrendingUp,
  DollarSign,
  Wrench,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Percent,
  Printer,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServiceRecord } from '../types';

interface TechnicianPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicianPerformanceModal: React.FC<TechnicianPerformanceModalProps> = ({
  isOpen,
  onClose
}) => {
  const { services, users, settings } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'today'>('all');

  if (!isOpen) return null;

  // Benzersiz teknisyenler
  const technicianNames = Array.from(
    new Set([
      ...users.filter(u => u.role === 'teknisyen' || u.role === 'yonetici' || u.role === 'cirak').map(u => u.name),
      ...services.map(s => s.assignedTechnician)
    ])
  );

  // Filtreleme
  const filteredServices = services.filter(srv => {
    if (selectedPeriod === 'today') {
      const todayDate = new Date().toLocaleDateString('tr-TR');
      return srv.createdAt.includes(todayDate) || (srv.deliveredAt && srv.deliveredAt.includes(todayDate));
    }
    return true;
  });

  // Metrikleri hesapla
  const stats = technicianNames.map(techName => {
    const techServices = filteredServices.filter(s => s.assignedTechnician === techName);
    const completedServices = techServices.filter(s => s.stage === 'teslim_edildi' || s.stage === 'hazir');
    const inProgressServices = techServices.filter(s => s.stage === 'onarimda' || s.stage === 'ariza_tespiti' || s.stage === 'kabul');
    
    // Tekrarlayan arıza (RMA) sayısı
    const rmaCount = techServices.filter(s => s.isReturnWarranty).length;

    // Toplam ciro & Parça maliyeti
    const totalRevenue = completedServices.reduce((sum, s) => sum + (s.finalPrice || s.estimatedPrice || 0), 0);
    const totalLaborCost = completedServices.reduce((sum, s) => sum + (s.laborCost || 0), 0);
    const totalPartsCost = completedServices.reduce((sum, s) => {
      const partsSum = s.partsUsed.reduce((pAcc, p) => pAcc + (p.unitPrice * p.quantity), 0);
      return sum + partsSum;
    }, 0);

    // Başarı oranı
    const successRate = techServices.length > 0
      ? Math.max(0, Math.round(((techServices.length - rmaCount) / techServices.length) * 100))
      : 100;

    return {
      name: techName,
      totalCount: techServices.length,
      completedCount: completedServices.length,
      inProgressCount: inProgressServices.length,
      rmaCount,
      totalRevenue,
      totalLaborCost,
      totalPartsCost,
      successRate
    };
  });

  // En yüksek ciroya göre sırala (Leaderboard)
  stats.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const grandTotalRevenue = stats.reduce((acc, s) => acc + s.totalRevenue, 0);
  const grandTotalLaborCost = stats.reduce((acc, s) => acc + s.totalLaborCost, 0);
  const grandTotalCompleted = stats.reduce((acc, s) => acc + s.completedCount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Teknisyen Performans Raporu</h3>
              <p className="text-xs text-zinc-400">Atölye ustalarının tamamlama oranları, işçilik cirosu ve tamir başarı oranları</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Filter */}
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-semibold">Dönem:</span>
            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-1 text-xs">
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedPeriod === 'all' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tüm Zamanlar
              </button>
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedPeriod === 'today' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Bugün
              </button>
            </div>
          </div>

          <div className="text-xs text-zinc-400 font-medium">
            Toplam <strong className="text-white">{technicianNames.length}</strong> Teknisyen
          </div>
        </div>

        {/* Summary Overview */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-zinc-900/40 border-b border-zinc-800/80">
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 font-semibold block">Toplam Onarılan</span>
            <p className="text-base font-extrabold text-white font-mono mt-0.5">{grandTotalCompleted} Cihaz</p>
          </div>
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 font-semibold block">Toplam Servis Cirosu</span>
            <p className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">₺{grandTotalRevenue.toLocaleString('tr-TR')}</p>
          </div>
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 font-semibold block">Toplam İşçilik Değeri</span>
            <p className="text-base font-extrabold text-amber-400 font-mono mt-0.5">₺{grandTotalLaborCost.toLocaleString('tr-TR')}</p>
          </div>
        </div>

        {/* Technician Cards List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {stats.map((tech, idx) => (
            <div
              key={tech.name}
              className="bg-zinc-800/70 border border-zinc-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-600 transition-all"
            >
              {/* Leaderboard Rank & Avatar */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  idx === 0
                    ? 'bg-amber-500 text-black ring-2 ring-amber-400/40'
                    : idx === 1
                    ? 'bg-zinc-300 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  #{idx + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{tech.name}</h4>
                    {idx === 0 && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                        🏆 Ayın Ustası
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                    <span>Tamamlanan: <strong className="text-emerald-400">{tech.completedCount}</strong></span>
                    <span>Onarımda: <strong className="text-blue-400">{tech.inProgressCount}</strong></span>
                    <span>RMA/İade: <strong className={tech.rmaCount > 0 ? 'text-red-400' : 'text-zinc-400'}>{tech.rmaCount}</strong></span>
                    <span>Başarı: <strong className="text-emerald-400 font-mono">%{tech.successRate}</strong></span>
                  </div>
                </div>
              </div>

              {/* Financial Performance */}
              <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-700/50">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-zinc-500 block">Üretilen Ciro:</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    ₺{tech.totalRevenue.toLocaleString('tr-TR')}
                  </span>
                </div>

                <div className="text-right bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800">
                  <span className="text-[9px] text-zinc-400 block font-semibold">İşçilik Katkısı:</span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    ₺{tech.totalLaborCost.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {settings.firmName} • Şeffaf Atölye Performans Raporlama
          </span>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
          >
            <Printer size={15} /> Raporu Yazdır
          </button>
        </div>
      </div>
    </div>
  );
};
