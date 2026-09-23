import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Edit2,
  DollarSign,
  ArrowDownUp,
  Archive,
  History,
  CheckCircle2,
  Barcode,
  Camera,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StockItem } from '../types';
import { CameraScannerModal } from './CameraScannerModal';
import { WholesaleOrderModal } from './WholesaleOrderModal';
import { StockCountModal } from './StockCountModal';

export const Stok: React.FC = () => {
  const {
    stock,
    addStockItem,
    updateStockItem,
    deactivateStockItem,
    importStockBatch,
    stockMovements,
    settings,
    currentUser
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'liste' | 'hareketler'>('liste');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'add'>('search');
  const [isOrderRobotOpen, setIsOrderRobotOpen] = useState(false);
  const [isStockCountOpen, setIsStockCountOpen] = useState(false);
  const [scannedNotFoundBarcode, setScannedNotFoundBarcode] = useState<string | null>(null);
  const [stockToast, setStockToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Form State
  const [barcode, setBarcode] = useState('');
  const [stockCode, setStockCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Ekran & Dokunmatik');
  const [quantity, setQuantity] = useState(5);
  const [minStock, setMinStock] = useState(2);
  const [costUsd, setCostUsd] = useState(20);
  const [salePriceTl, setSalePriceTl] = useState(1200);
  const [supplierName, setSupplierName] = useState('Asya İletişim');

  const categories = ['Ekran & Dokunmatik', 'Batarya', 'Kablo', 'Şarj Aleti', 'Kılıf', 'Aksesuar', 'Kulaklık', 'Telefon'];

  // Kamera Barkod Okuma İşleyicisi
  const handleScannerResult = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    if (scannerTarget === 'add') {
      setBarcode(clean);
      setStockToast({
        message: `✅ Barkod form alanına aktarıldı: ${clean}`,
        type: 'success'
      });
      return;
    }

    // Arama / Sorgulama Modu
    setSearchTerm(clean);
    const matched = stock.find(
      s => s.isActive && (s.barcode === clean || s.stockCode.toLowerCase() === clean.toLowerCase() || s.name.toLowerCase().includes(clean.toLowerCase()))
    );

    if (matched) {
      setStockToast({
        message: `🔍 Eşleşen ürün bulundu: "${matched.name}" (Mevcut Stok: ${matched.quantity} adet)`,
        type: 'success'
      });
      setScannedNotFoundBarcode(null);
    } else {
      setScannedNotFoundBarcode(clean);
      setStockToast({
        message: `⚠️ Barkod [${clean}] envanterde bulunamadı. Yeni stok kartı oluşturabilirsiniz.`,
        type: 'warning'
      });
    }
  };

  // Toast bildirim zamanlayıcısı
  React.useEffect(() => {
    if (!stockToast) return;
    const timer = setTimeout(() => {
      setStockToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [stockToast]);

  const filteredStock = stock.filter(item => {
    if (!item.isActive) return false;
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stockCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.includes(searchTerm);

    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchCritical = !showCriticalOnly || item.quantity <= item.minStock;

    return matchSearch && matchCategory && matchCritical;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !stockCode) {
      alert('Ürün adı ve stok kodu zorunludur.');
      return;
    }

    addStockItem({
      barcode: barcode || `86900${Math.floor(1000000 + Math.random() * 9000000)}`,
      stockCode,
      name,
      category,
      quantity: Number(quantity) || 0,
      minStock: Number(minStock) || 1,
      costUsd: Number(costUsd) || 0,
      salePriceTl: Number(salePriceTl) || 0,
      supplierName,
      isActive: true
    });

    setIsAddModalOpen(false);
    setName('');
    setStockCode('');
    setBarcode('');
  };

  const handleDeactivate = (id: string, name: string) => {
    if (confirm(`"${name}" ürününü pasife almak istediğinizden emin misiniz? Satış geçmişini korumak için ürün arşivlenecektir.`)) {
      deactivateStockItem(id);
    }
  };

  const handleBatchSampleImport = () => {
    const sampleBatch = [
      {
        barcode: '869009988111',
        stockCode: 'EKR-IPH14-REV',
        name: 'iPhone 14 Revize Orijinal Ekran',
        category: 'Ekran & Dokunmatik',
        quantity: 5,
        minStock: 2,
        costUsd: 65,
        salePriceTl: 3850,
        supplierName: 'Asya İletişim Toptan',
        isActive: true,
        hasSalesHistory: false
      },
      {
        barcode: '869009988222',
        stockCode: 'BAT-SAM-S21',
        name: 'Samsung Galaxy S21 Orijinal Batarya 4000mAh',
        category: 'Batarya',
        quantity: 8,
        minStock: 3,
        costUsd: 12.5,
        salePriceTl: 850,
        supplierName: 'Deji Türkiye',
        isActive: true,
        hasSalesHistory: false
      }
    ];

    importStockBatch(sampleBatch);
    setIsBatchImportOpen(false);
    alert('2 Adet ürün başarıyla içeri aktarıldı ve stok kartları oluşturuldu!');
  };

  return (
    <div id="stok-module" className="space-y-5 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Package className="text-orange-500" size={24} />
            Stok & Yedek Parça Yönetimi
          </h1>
          <p className="text-xs text-zinc-400">Kritik stok kontrolleri, USD maliyet takibi ve silinme korumalı arşivleme</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsStockCountOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5"
          >
            <Barcode size={15} />
            <span>Stok Sayım</span>
          </button>
          <button
            onClick={() => {
              setScannerTarget('search');
              setIsScannerOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Kamera ile Parça veya Ürün Barkodu Tara"
          >
            <Camera size={15} className="text-blue-200 animate-pulse" />
            <span>Kamera ile Barkod Tara</span>
          </button>
          <button
            onClick={() => setIsOrderRobotOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <MessageCircle size={15} />
            <span>Toptancı Sipariş Robotu</span>
            {stock.filter(s => s.isActive && s.quantity <= s.minStock).length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                {stock.filter(s => s.isActive && s.quantity <= s.minStock).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsBatchImportOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            Toplu İçe Aktar
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Yeni Ürün / Parça Ekle
          </button>
        </div>
      </div>

      {/* Stok Bildirim Çubuğu (Toast) */}
      {stockToast && (
        <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border transition-all shadow-lg animate-in fade-in slide-in-from-top-2 ${
          stockToast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' :
          stockToast.type === 'warning' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' :
          'bg-blue-500/15 border-blue-500/40 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span>{stockToast.message}</span>
          </div>
          <button
            onClick={() => setStockToast(null)}
            className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded bg-black/30 hover:bg-black/50"
          >
            ✕
          </button>
        </div>
      )}

      {/* Kamera ile Taranıp Bulunamayan Barkod Hızlı Stok Kartı Açma Kartı */}
      {scannedNotFoundBarcode && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={20} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">
                "{scannedNotFoundBarcode}" barkodu stok kayıtlarınızda bulunamadı!
              </p>
              <p className="text-[11px] text-amber-200/80">
                Bu barkodu kullanarak tek tıkla yeni ürün veya yedek parça kartı açabilirsiniz.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setBarcode(scannedNotFoundBarcode);
                setScannedNotFoundBarcode(null);
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors cursor-pointer"
            >
              + Bu Barkodla Stok Kartı Aç
            </button>
            <button
              onClick={() => setScannedNotFoundBarcode(null)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('liste')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'liste' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Stok Listesi ({stock.filter(s => s.isActive).length})
        </button>
        <button
          onClick={() => setActiveTab('hareketler')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'hareketler' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Stok Hareket Geçmişi ({stockMovements.length})
        </button>
      </div>

      {activeTab === 'liste' && (
        <>
          {/* Filters Bar */}
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80 flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Ürün adı, kod veya barkod ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setScannerTarget('search');
                  setIsScannerOpen(true);
                }}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-orange-400 hover:text-orange-300 transition-colors cursor-pointer shrink-0"
                title="Kamera ile Barkod Tara"
              >
                <Camera size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <button
                onClick={() => setShowCriticalOnly(!showCriticalOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  showCriticalOnly
                    ? 'bg-amber-500 text-zinc-950 font-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                }`}
              >
                <AlertTriangle size={14} className={showCriticalOnly ? 'text-zinc-950' : 'text-amber-400'} />
                Yalnızca Kritik Stok
              </button>
            </div>
          </div>

          {/* Mobile Card View (< md screens) */}
          <div className="block md:hidden space-y-3">
            {filteredStock.map((item) => {
              const isCritical = item.quantity <= item.minStock;
              const approxCostTl = (item.costUsd * settings.usdExchangeRate).toFixed(1);
              return (
                <div
                  key={item.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-white text-sm">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-zinc-400">
                        <span>{item.stockCode}</span>
                        {item.barcode && <span>• Barkod: {item.barcode}</span>}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] shrink-0">
                      {item.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-zinc-950/70 p-2 rounded-xl border border-zinc-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Stok Adedi</span>
                      <span className={`font-mono font-bold text-xs ${isCritical ? 'text-red-400 font-black' : 'text-white'}`}>
                        {item.quantity} / {item.minStock}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">USD Maliyet</span>
                      <span className="font-mono font-bold text-xs text-zinc-300">${item.costUsd}</span>
                      <span className="text-[9px] text-zinc-500 block font-mono">≈₺{approxCostTl}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Satış Fiyatı</span>
                      <span className="font-mono font-black text-xs text-emerald-400">₺{item.salePriceTl}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400 border-t border-zinc-800/60">
                    <span className="truncate max-w-[200px]">Tedarikçi: {item.supplierName}</span>
                    {currentUser.role === 'yonetici' && (
                      <button
                        onClick={() => handleDeactivate(item.id, item.name)}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                        title="Pasife Al"
                      >
                        <Archive size={12} />
                        <span>Pasife Al</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredStock.length === 0 && (
              <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                Aramanıza uygun ürün bulunamadı.
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md screens) */}
          <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300 min-w-[700px]">
                <thead className="bg-zinc-950/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5">Ürün & Kod</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5 text-center">Miktar / Min</th>
                    <th className="p-3.5">USD Maliyet</th>
                    <th className="p-3.5">Satış Fiyatı</th>
                    <th className="p-3.5">Tedarikçi</th>
                    <th className="p-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredStock.map((item) => {
                    const isCritical = item.quantity <= item.minStock;
                    const approxCostTl = (item.costUsd * settings.usdExchangeRate).toFixed(1);
                    return (
                      <tr key={item.id} className="hover:bg-zinc-850/50 transition-colors">
                        <td className="p-3.5">
                          <p className="font-bold text-white text-xs">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-zinc-500">
                            <span>{item.stockCode}</span>
                            <span>• Barkod: {item.barcode}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                              isCritical ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-white'
                            }`}>
                              {item.quantity}
                            </span>
                            <span className="text-zinc-600 text-[10px]">/ {item.minStock}</span>
                          </div>
                          {isCritical && (
                            <span className="text-[9px] text-amber-400 block font-semibold mt-0.5">
                              ⚠️ Kritik Düzey!
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-zinc-300">${item.costUsd}</span>
                          <span className="text-[10px] text-zinc-500 block font-mono">≈ ₺{approxCostTl}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-black text-emerald-400 text-sm">₺{item.salePriceTl}</span>
                        </td>
                        <td className="p-3.5 text-zinc-400 text-[11px]">
                          {item.supplierName}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {currentUser.role === 'yonetici' && (
                              <button
                                onClick={() => handleDeactivate(item.id, item.name)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                                title="Pasife Al (Arşivle)"
                              >
                                <Archive size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Stock Movements Tab */}
      {activeTab === 'hareketler' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Tüm Giriş, Çıkış ve Servis Parça Düşüm Günlüğü
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stockMovements.map((mov) => (
              <div key={mov.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      mov.type === 'giris' ? 'bg-emerald-500/20 text-emerald-400' :
                      mov.type === 'servis' ? 'bg-blue-500/20 text-blue-400' :
                      mov.type === 'satis' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {mov.type}
                    </span>
                    <span className="font-bold text-white">{mov.productName}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Ref: {mov.referenceNo} • İşlemi Yapan: {mov.user} • {mov.timestamp}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-zinc-200">
                    {mov.type === 'giris' || mov.type === 'iade' ? `+${mov.quantity}` : `-${mov.quantity}`} Adet
                  </span>
                  <span className="text-[10px] text-zinc-400 block font-mono">₺{mov.unitPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yeni Ürün Modalı */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">Yeni Ürün / Yedek Parça Kartı</h3>
            <p className="text-xs text-zinc-400 mb-4">Stok envanterine yeni kart ekleyin</p>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1">Stok Kodu *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: EKR-IPH13-REV"
                    value={stockCode}
                    onChange={(e) => setStockCode(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-300">Barkod</label>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('add');
                        setIsScannerOpen(true);
                      }}
                      className="text-[10px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 cursor-pointer"
                    >
                      <Camera size={11} /> Kamerayla Tara
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="869001234..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Ürün / Parça Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: iPhone 13 Orijinal Revize Ekran"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Başlangıç Stok</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Kritik Stok Sınırı</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1">Maliyet ($ USD)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={costUsd}
                    onChange={(e) => setCostUsd(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Satış Fiyatı (₺ TL) *</label>
                  <input
                    type="number"
                    required
                    value={salePriceTl}
                    onChange={(e) => setSalePriceTl(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Tedarikçi Firma</label>
                <input
                  type="text"
                  placeholder="Örn: Asya İletişim Toptan"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
                >
                  Stok Kartı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toplu İçe Aktarım Örnek Modalı */}
      {isBatchImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Toplu Stok İçe Aktarma</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Excel veya CSV listesindeki ürünleri tek seferde önizleyip onaylayarak stoğunuza kaydedin.
            </p>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-2 mb-4">
              <p className="font-bold text-zinc-300">Önizleme Listesi (2 Ürün):</p>
              <div className="space-y-1 text-zinc-400 text-[11px]">
                <p>• iPhone 14 Revize OLED Ekran (5 Adet - ₺3.850)</p>
                <p>• Samsung Galaxy S21 Deji Batarya (8 Adet - ₺850)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBatchImportOpen(false)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={handleBatchSampleImport}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Önizlemeyi Onayla & Stoğa Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      <StockCountModal
        isOpen={isStockCountOpen}
        stock={stock}
        onClose={() => setIsStockCountOpen(false)}
        onApply={(counts) => {
          Object.entries(counts).forEach(([id, counted]) => {
            const product = stock.find(s => s.id === id);
            if (product && product.quantity !== counted) {
              updateStockItem(id, { quantity: counted });
            }
          });
          setStockToast({ message: '✅ Stok sayımı onaylandı ve sayılan miktarlar stoğa uygulandı.', type: 'success' });
          setIsStockCountOpen(false);
        }}
      />

      {/* Kamera Barkod Tarayıcı Modalı */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScannerResult}
        title={scannerTarget === 'search' ? 'Envanter - Kamera ile Barkod Tara & Sorgula' : 'Yeni Stok Kartı - Barkod Tara'}
        description={
          scannerTarget === 'search'
            ? 'Barkodu kameraya gösterin. Sistem anında ürünü filtreler veya yeni kart açmanızı sağlar.'
            : 'Ürünün etiketindeki barkodu kameraya göstererek otomatik doldurun.'
        }
        expectedType="barcode"
        allowContinuous={scannerTarget === 'search'}
      />

      {/* Toptancı WhatsApp Sipariş Robotu Modalı */}
      <WholesaleOrderModal
        isOpen={isOrderRobotOpen}
        onClose={() => setIsOrderRobotOpen(false)}
      />
    </div>
  );
};
