import React, { useState } from 'react';
import {
  X,
  Package,
  MessageCircle,
  Copy,
  Check,
  Plus,
  Minus,
  Building2,
  DollarSign,
  AlertTriangle,
  Send
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StockItem } from '../types';

interface WholesaleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrderItem {
  stockItem: StockItem;
  orderQty: number;
}

export const WholesaleOrderModal: React.FC<WholesaleOrderModalProps> = ({
  isOpen,
  onClose
}) => {
  const { stock, settings } = useApp();

  // Kritik stoktaki ürünleri hazırla
  const initialOrderItems: OrderItem[] = stock
    .filter(s => s.isActive && s.quantity <= s.minStock)
    .map(s => ({
      stockItem: s,
      orderQty: Math.max(1, (s.minStock * 2) - s.quantity)
    }));

  const [orderList, setOrderList] = useState<OrderItem[]>(initialOrderItems);
  const [copied, setCopied] = useState(false);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Benzersiz tedarikçiler
  const suppliers = Array.from(new Set(orderList.map(o => o.stockItem.supplierName || 'Genel Toptancı')));

  const updateQty = (stockId: string, delta: number) => {
    setOrderList(prev =>
      prev
        .map(item => {
          if (item.stockItem.id === stockId) {
            const newQty = Math.max(1, item.orderQty + delta);
            return { ...item, orderQty: newQty };
          }
          return item;
        })
    );
  };

  const removeItem = (stockId: string) => {
    setOrderList(prev => prev.filter(i => i.stockItem.id !== stockId));
  };

  // Tedarikçiye göre filtrelenmiş liste
  const filteredList = selectedSupplierFilter === 'all'
    ? orderList
    : orderList.filter(o => (o.stockItem.supplierName || 'Genel Toptancı') === selectedSupplierFilter);

  // Toplam USD ve TL
  const totalCostUsd = filteredList.reduce((acc, it) => acc + (it.stockItem.costUsd * it.orderQty), 0);
  const totalCostTl = totalCostUsd * settings.usdExchangeRate;

  // WhatsApp Mesajı Oluşturucu
  const generateWhatsAppMessage = (supplierName: string): string => {
    const itemsForSupplier = orderList.filter(
      o => (o.stockItem.supplierName || 'Genel Toptancı') === supplierName
    );

    const dateStr = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let msg = `📦 *${settings.firmName.toUpperCase()} - ACİL PARÇA SİPARİŞİ*\n`;
    msg += `🏢 Toptancı: *${supplierName}*\n`;
    msg += `📅 Tarih: ${dateStr}\n\n`;
    msg += `Selamlar, aşağıdaki kritik stok kalemlerinin kargoya verilmesini rica ederiz:\n\n`;

    itemsForSupplier.forEach((it, idx) => {
      msg += `${idx + 1}. *${it.orderQty} Adet* - ${it.stockItem.name} [Stok Kodu: ${it.stockItem.stockCode}] (Mevcut: ${it.stockItem.quantity})\n`;
    });

    const supplierUsd = itemsForSupplier.reduce((acc, it) => acc + (it.stockItem.costUsd * it.orderQty), 0);

    msg += `\n📊 Toplam: *${itemsForSupplier.length} Kalem* | *${itemsForSupplier.reduce((a, b) => a + b.orderQty, 0)} Adet*\n`;
    msg += `💵 Tahmini Maliyet: $${supplierUsd.toFixed(2)} (~₺${(supplierUsd * settings.usdExchangeRate).toFixed(0)})\n\n`;
    msg += `Faturayı şirketimize kesmenizi rica ederiz.\n`;
    msg += `📍 *${settings.firmName}* • ${settings.branchName}\n`;
    msg += `📞 İletişim: ${settings.phone}`;

    return msg;
  };

  const handleSendWhatsApp = (supplierName: string) => {
    const text = generateWhatsAppMessage(supplierName);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = (supplierName: string) => {
    const text = generateWhatsAppMessage(supplierName);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Toptancı Parça Sipariş Robotu</h3>
              <p className="text-xs text-zinc-400">Kritik stokları otomatik topla ve tek tıkla WhatsApp siparişi oluştur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tedarikçi Seçim Filtre Sekmeleri */}
        {suppliers.length > 1 && (
          <div className="px-4 pt-3 pb-1 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedSupplierFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedSupplierFilter === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Tüm Tedarikçiler ({orderList.length})
            </button>
            {suppliers.map(sup => (
              <button
                key={sup}
                onClick={() => setSelectedSupplierFilter(sup)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedSupplierFilter === sup
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 size={13} /> {sup}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle size={36} className="mx-auto text-amber-400 mb-2" />
              <p className="text-sm font-bold text-white">Sipariş Edilecek Kritik Ürün Yok</p>
              <p className="text-xs text-zinc-400 mt-1">Stoktaki tüm ürünler yeterli seviyededir.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((item) => (
                <div
                  key={item.stockItem.id}
                  className="bg-zinc-800/80 border border-zinc-700/80 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{item.stockItem.name}</span>
                      <span className="text-[10px] font-mono bg-zinc-900 text-orange-400 px-2 py-0.5 rounded-md">
                        {item.stockItem.stockCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                      <span>Toptancı: <strong className="text-zinc-300">{item.stockItem.supplierName || 'Genel'}</strong></span>
                      <span>Mevcut: <strong className={item.stockItem.quantity === 0 ? 'text-red-400 font-bold' : 'text-amber-400'}>{item.stockItem.quantity}</strong></span>
                      <span>Kritik Eşik: {item.stockItem.minStock}</span>
                      <span>Birim: ${item.stockItem.costUsd}</span>
                    </div>
                  </div>

                  {/* Stepper controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQty(item.stockItem.id, -1)}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-mono text-white">
                        {item.orderQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.stockItem.id, 1)}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right min-w-[75px]">
                      <p className="text-xs font-bold text-emerald-400 font-mono">
                        ${(item.stockItem.costUsd * item.orderQty).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        ₺{((item.stockItem.costUsd * item.orderQty) * settings.usdExchangeRate).toFixed(0)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.stockItem.id)}
                      className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Siparişten Çıkar"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sipariş Özeti Kutusu */}
          {filteredList.length > 0 && (
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-zinc-400">
                <span>Toplam <strong className="text-white">{filteredList.length} Kalem</strong> parça seçildi.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">Tahmini Toplam:</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">
                    ${totalCostUsd.toFixed(2)} (~₺{totalCostTl.toFixed(0)})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleCopyText(selectedSupplierFilter === 'all' ? suppliers[0] || 'Genel' : selectedSupplierFilter)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? 'Kopyalandı!' : 'Sipariş Metnini Kopyala'}
          </button>

          <button
            type="button"
            onClick={() => handleSendWhatsApp(selectedSupplierFilter === 'all' ? suppliers[0] || 'Genel' : selectedSupplierFilter)}
            disabled={filteredList.length === 0}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Send size={16} />
            WhatsApp ile Sipariş Gönder
          </button>
        </div>
      </div>
    </div>
  );
};
