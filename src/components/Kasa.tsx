import React, { useState } from 'react';
import {
  Banknote,
  CreditCard,
  Building2,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Printer,
  Calendar,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DayEndReport } from '../types';

export const Kasa: React.FC = () => {
  const {
    cashMovements,
    addExpense,
    dayEndReports,
    submitDayEndReport,
    currentUser
  } = useApp();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState<number>(150);
  const [expenseCategory, setExpenseCategory] = useState('Dükkan Gideri');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseMethod, setExpenseMethod] = useState<'nakit' | 'kart' | 'havale'>('nakit');

  // Gün Sonu Sayım State
  const [isDayEndModalOpen, setIsDayEndModalOpen] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [differenceReason, setDifferenceReason] = useState('');
  const [dayEndNotes, setDayEndNotes] = useState('');
  const [lastReport, setLastReport] = useState<DayEndReport | null>(null);

  // Kasa Hesaplamaları
  const totalCashIncome = cashMovements
    .filter(c => c.method === 'nakit' && c.type !== 'gider' && c.type !== 'cihaz_alimi')
    .reduce((a, b) => a + b.amount, 0);

  const totalCashOut = cashMovements
    .filter(c => c.method === 'nakit' && (c.type === 'gider' || c.type === 'cihaz_alimi'))
    .reduce((a, b) => a + b.amount, 0);

  const expectedCashInSafe = totalCashIncome - totalCashOut;

  const totalCard = cashMovements
    .filter(c => c.method === 'kart' && c.type !== 'gider')
    .reduce((a, b) => a + b.amount, 0);

  const totalBank = cashMovements
    .filter(c => c.method === 'havale' && c.type !== 'gider')
    .reduce((a, b) => a + b.amount, 0);

  const totalServiceRevenue = cashMovements
    .filter(c => c.type === 'gelir_servis')
    .reduce((a, b) => a + b.amount, 0);

  const totalSaleRevenue = cashMovements
    .filter(c => c.type === 'gelir_satis')
    .reduce((a, b) => a + b.amount, 0);

  const totalPhoneBuyOut = cashMovements
    .filter(c => c.type === 'cihaz_alimi')
    .reduce((a, b) => a + b.amount, 0);

  const totalExpenses = cashMovements
    .filter(c => c.type === 'gider')
    .reduce((a, b) => a + b.amount, 0);

  const totalRevenue = totalServiceRevenue + totalSaleRevenue;

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) return;
    addExpense(expenseAmount, expenseCategory, expenseDesc || 'Genel masraf', expenseMethod);
    setIsExpenseModalOpen(false);
    setExpenseAmount(0);
    setExpenseDesc('');
  };

  const handleDayEndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const diff = countedCash - expectedCashInSafe;
    if (diff !== 0 && !differenceReason) {
      alert('Kasa farkı bulunmaktadır. Lütfen zorunlu açıklama giriniz!');
      return;
    }

    const rep = submitDayEndReport(countedCash, differenceReason, dayEndNotes);
    setLastReport(rep);
    setIsDayEndModalOpen(false);
  };

  return (
    <div id="kasa-module" className="space-y-5 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Banknote className="text-orange-500" size={24} />
            Kasa & Gün Sonu Raporlama
          </h1>
          <p className="text-xs text-zinc-400">
            Nakit, Pos ve Banka hareketleri, masraf takibi ve fiziksel kasa sayım mutabakatı
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <TrendingDown size={15} className="text-red-400" />
            Gider / Masraf Ekle
          </button>
          <button
            onClick={() => {
              setCountedCash(expectedCashInSafe);
              setIsDayEndModalOpen(true);
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lock size={15} />
            Gün Sonu Kasa Sayımı Yap (Z Raporu)
          </button>
        </div>
      </div>

      {/* Primary Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kasa Nakit */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold">Fiziksel Nakit Kasa:</span>
            <Banknote size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-black text-emerald-400 mt-2">
            ₺{expectedCashInSafe.toLocaleString('tr-TR')}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Çekmecede olması gereken nakit</span>
        </div>

        {/* POS Kart */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold">POS / Kredi Kartı:</span>
            <CreditCard size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-mono font-black text-blue-400 mt-2">
            ₺{totalCard.toLocaleString('tr-TR')}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Banka POS gün sonu toplamı</span>
        </div>

        {/* Havale / EFT */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-semibold">Banka Havale / EFT:</span>
            <Building2 size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-mono font-black text-purple-400 mt-2">
            ₺{totalBank.toLocaleString('tr-TR')}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Hesaba geçen IBAN ödemeleri</span>
        </div>

        {/* Toplam Ciro */}
        <div className="bg-zinc-900 border border-orange-500/40 p-4 rounded-2xl shadow-lg shadow-orange-500/10">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-bold text-orange-400">Bugünkü Toplam Ciro:</span>
            <TrendingUp size={16} className="text-orange-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white mt-2">
            ₺{totalRevenue.toLocaleString('tr-TR')}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Servis: ₺{totalServiceRevenue} • Satış: ₺{totalSaleRevenue}
          </span>
        </div>
      </div>

      {/* Cash Movements Log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
          Bugünkü Tüm Kasa Hareketleri ({cashMovements.length} İşlem)
        </h3>

        <div className="divide-y divide-zinc-800/80 max-h-80 overflow-y-auto">
          {cashMovements.map((item) => {
            const isOut = item.type === 'gider' || item.type === 'cihaz_alimi';
            return (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isOut ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.category}
                    </span>
                    <span className="font-semibold text-white">{item.description}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Yöntem: {item.method.toUpperCase()} • Yetkili: {item.user} • {item.timestamp}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`font-mono font-black text-sm ${isOut ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isOut ? `-${item.amount}` : `+${item.amount}`} ₺
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gider Ekleme Modalı */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Yeni Masraf / Gider Kaydı</h3>
            <p className="text-xs text-zinc-400 mb-4">Kasadan nakit veya kartla yapılan dükkan harcaması</p>

            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1">Gider Tutarı (₺) *</label>
                <input
                  type="number"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Kategori</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-medium"
                >
                  <option value="Dükkan Gideri">Dükkan Gideri (Çay, Temizlik, Kira vb.)</option>
                  <option value="Kargo Masrafı">Kargo & Kurye Masrafı</option>
                  <option value="Yemek">Yemek & İkram</option>
                  <option value="Tedarikçi Ödemesi">Tedarikçi Parça Peşinatı</option>
                  <option value="Diğer">Diğer Gider</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Ödeme Şekli</label>
                <select
                  value={expenseMethod}
                  onChange={(e: any) => setExpenseMethod(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white"
                >
                  <option value="nakit">Nakit Kasa</option>
                  <option value="kart">Kredi Kartı / Şirket Kartı</option>
                  <option value="havale">Banka Hesabı</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Açıklama</label>
                <input
                  type="text"
                  placeholder="Örn: Aras Kargo parça teslimatı"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                >
                  Gideri Kaydet & Kasadan Düş
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gün Sonu Kasa Sayımı ve Z Raporu Modalı */}
      {isDayEndModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-lg p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Lock className="text-emerald-400" size={20} />
              <h3 className="font-bold text-white text-base">Gün Sonu Kasa Kapanışı & Sayım (Z Raporu)</h3>
            </div>

            <form onSubmit={handleDayEndSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-zinc-400 block mb-1">Sistemdeki Nakit (Beklenen):</span>
                  <span className="font-mono font-bold text-lg text-white">₺{expectedCashInSafe}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-1">Fiziksel Sayılan Nakit *:</span>
                  <input
                    type="number"
                    required
                    value={countedCash}
                    onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-emerald-400 font-mono font-bold text-lg"
                  />
                </div>
              </div>

              {/* Difference feedback */}
              {countedCash !== expectedCashInSafe && (
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle size={15} />
                    <span>Kasa Farkı: {countedCash > expectedCashInSafe ? `+₺${countedCash - expectedCashInSafe} (Fazla)` : `-₺${expectedCashInSafe - countedCash} (Eksik)`}</span>
                  </div>
                  <label className="text-zinc-300 block mb-1">Fark Açıklaması (Zorunlu) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 20 TL bozuk para yuvarlaması / eksik teslimat"
                    value={differenceReason}
                    onChange={(e) => setDifferenceReason(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-zinc-300 block mb-1">Gün Sonu Kapanış Notları</label>
                <textarea
                  rows={2}
                  placeholder="Yönetici gün sonu notları..."
                  value={dayEndNotes}
                  onChange={(e) => setDayEndNotes(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white resize-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDayEndModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Kapanışı Onayla & Raporu Arşivle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rapor Önizleme / Z Raporu */}
      {lastReport && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-2">
          <div className="flex justify-between font-bold text-emerald-400">
            <span>✓ Gün Sonu Z Raporu Kaydedildi: {lastReport.id}</span>
            <span>Onaylayan: {lastReport.approvedBy}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 font-mono text-zinc-300 pt-1">
            <div>Sayılan Nakit: ₺{lastReport.countedCash}</div>
            <div>Kart Toplamı: ₺{lastReport.totalCard}</div>
            <div>Banka Toplamı: ₺{lastReport.totalBank}</div>
            <div>Fark: {lastReport.cashDifference === 0 ? 'Kusursuz (0)' : `${lastReport.cashDifference} TL`}</div>
          </div>
        </div>
      )}
    </div>
  );
};
