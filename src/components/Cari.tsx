import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  AlertCircle,
  MessageCircle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Phone,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomerAccount } from '../types';
import { createSafeWhatsAppMessage } from '../utils/security';

export const Cari: React.FC = () => {
  const { customers, addCustomerDebt, collectCustomerPayment, settings } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null);
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectNote, setCollectNote] = useState('');

  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [newDebtAmount, setNewDebtAmount] = useState<number>(1000);
  const [newDebtDesc, setNewDebtDesc] = useState('');
  const [newDebtInstallments, setNewDebtInstallments] = useState(2);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleOpenCollect = (c: CustomerAccount) => {
    setSelectedCustomer(c);
    setCollectAmount(c.totalDebt);
    setCollectNote('Elden Nakit Tahsilat');
    setIsCollectOpen(true);
  };

  const handleConfirmCollect = () => {
    if (!selectedCustomer || collectAmount <= 0) return;
    collectCustomerPayment(selectedCustomer.id, collectAmount, collectNote);
    setIsCollectOpen(false);
    setSelectedCustomer(null);
  };

  const handleOpenAddDebt = (c: CustomerAccount) => {
    setSelectedCustomer(c);
    setIsAddDebtOpen(true);
  };

  const handleConfirmAddDebt = () => {
    if (!selectedCustomer || newDebtAmount <= 0) return;
    addCustomerDebt(selectedCustomer.id, newDebtAmount, newDebtDesc || 'Veresiye Mal/İşlem', newDebtInstallments);
    setIsAddDebtOpen(false);
  };

  const handleSendReminder = (customer: CustomerAccount, installmentDueDate: string, installmentAmount: number) => {
    const text = createSafeWhatsAppMessage('cari_borc', {
      customerName: customer.name,
      totalAmount: installmentAmount,
      dueDate: installmentDueDate,
      firmName: settings.firmName,
      firmPhone: settings.phone
    });

    const cleanPhone = customer.phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone;
    const url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div id="cari-module" className="space-y-5 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Users className="text-orange-500" size={24} />
            Cari & Veresiye Hesap Takibi
          </h1>
          <p className="text-xs text-zinc-400">
            Taksitli veresiye alacaklar, geciken vadelere kırmızı uyarı ve WhatsApp hatırlatması
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Müşteri adı veya telefon numarası ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Customer Accounts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.map((customer) => {
          const hasOverdue = customer.installments.some(
            ins => !ins.isPaid && ins.dueDate < todayStr
          );

          return (
            <div
              key={customer.id}
              className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col justify-between shadow-md transition-all ${
                hasOverdue ? 'border-red-500/50 bg-red-950/10' : 'border-zinc-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div>
                    <h3 className="font-bold text-white text-sm">{customer.name}</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                      <Phone size={12} /> {customer.phone}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">Toplam Bakiye:</span>
                    <span className={`font-mono font-black text-base ${customer.totalDebt > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ₺{customer.totalDebt}
                    </span>
                  </div>
                </div>

                {hasOverdue && (
                  <div className="my-2.5 p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span className="font-bold">Gecikmiş Taksit Bulunmaktadır!</span>
                  </div>
                )}

                {/* Installments List */}
                <div className="mt-3 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Taksit Planı:
                  </span>
                  {customer.installments.map((ins) => {
                    const isOverdue = !ins.isPaid && ins.dueDate < todayStr;
                    return (
                      <div
                        key={ins.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          ins.isPaid
                            ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500 line-through'
                            : isOverdue
                            ? 'bg-red-950/30 border-red-800/60 text-red-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className={isOverdue ? 'text-red-400' : 'text-zinc-500'} />
                            <span className="font-semibold">{ins.description}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                            Vade: {ins.dueDate} {isOverdue && '(Vadesi Geçti)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">₺{ins.amount}</span>
                          {!ins.isPaid && (
                            <button
                              onClick={() => handleSendReminder(customer, ins.dueDate, ins.amount)}
                              className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                              title="WhatsApp Hatırlatması Gönder"
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenAddDebt(customer)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  + Yeni Borç Ekle
                </button>
                <button
                  disabled={customer.totalDebt <= 0}
                  onClick={() => handleOpenCollect(customer)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <DollarSign size={14} /> Tahsilat Yap
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tahsilat Modalı */}
      {isCollectOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Cari Tahsilat Kaydı</h3>
            <p className="text-xs text-zinc-400 mb-4">{selectedCustomer.name} (Açık Borç: ₺{selectedCustomer.totalDebt})</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1">Tahsil Edilen Tutar (₺) *</label>
                <input
                  type="number"
                  max={selectedCustomer.totalDebt}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold text-lg"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Açıklama / Makbuz Notu</label>
                <input
                  type="text"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsCollectOpen(false)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmCollect}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Tahsilatı Onayla & Kasaya Giriş Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Borç Modalı */}
      {isAddDebtOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Yeni Veresiye / Borç Kaydı</h3>
            <p className="text-xs text-zinc-400 mb-4">{selectedCustomer.name}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1">Toplam Borç Tutarı (₺) *</label>
                <input
                  type="number"
                  value={newDebtAmount}
                  onChange={(e) => setNewDebtAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Taksit Sayısı</label>
                <select
                  value={newDebtInstallments}
                  onChange={(e) => setNewDebtInstallments(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-bold"
                >
                  <option value={1}>1 Taksit (Peşin Vade)</option>
                  <option value={2}>2 Taksit (Aylık)</option>
                  <option value={3}>3 Taksit (Aylık)</option>
                  <option value={4}>4 Taksit (Aylık)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">İşlem Açıklaması</label>
                <input
                  type="text"
                  placeholder="Örn: 2 Adet Ekran Toptan Alımı"
                  value={newDebtDesc}
                  onChange={(e) => setNewDebtDesc(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsAddDebtOpen(false)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmAddDebt}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
              >
                Borç Kaydını Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
