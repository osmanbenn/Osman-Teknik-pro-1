import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Building2,
  Percent,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Camera,
  Edit3,
  Check,
  X,
  Zap,
  Sparkles,
  Layers,
  FolderPlus,
  Tag,
  Keyboard
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StockItem, PaymentMethod, SaleRecord, CartItem } from '../types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { CameraScannerModal } from './CameraScannerModal';
import { SmartOcrProductModal } from './SmartOcrProductModal';
import { resolveScan } from '../utils/smartScan';

export const Satis: React.FC = () => {
  const {
    stock,
    cart,
    addToCart,
    addCustomCartItem,
    updateCartItem,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    completeSale,
    sales,
    cancelSale,
    addStockItem,
    currentUser,
    settings,
    playBeep
  } = useApp();

  // Tab: 'manuel' (Varsayılan - Serbest Ürün & Fiyat Yazma) | 'barkod' | 'katalog'
  const [activeInputTab, setActiveInputTab] = useState<'manuel' | 'barkod' | 'katalog'>('manuel');

  // Manuel Ürün & Fiyat Giriş Formu
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState<number>(1);
  const [manualNote, setManualNote] = useState('');
  const [manualCategory, setManualCategory] = useState('Aksesuar');
  const [saveToStockToo, setSaveToStockToo] = useState(false);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Barkod / Arama State
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [notFoundQuery, setNotFoundQuery] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isOcrProductOpen, setIsOcrProductOpen] = useState(false);
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Sepet İçi Fiyat/İsim Düzenleme State
  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [editNameInput, setEditNameInput] = useState<string>('');

  // Ödeme ve İskonto State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountTl, setCustomDiscountTl] = useState<number>(0);
  const [useCustomDiscount, setUseCustomDiscount] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('nakit');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [cancelModalSale, setCancelModalSale] = useState<SaleRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Sık Satılan Hızlı Aksesuarlar
  const fastSaleItems = stock.filter(s => s.isActive && ['Kablo', 'Şarj Aleti', 'Aksesuar', 'Kılıf', 'Ekran Koruyucu'].includes(s.category)).slice(0, 8);

  // Hızlı Fiyat Tuşları (Presets)
  const quickPricePresets = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

  // Esnafta En Çok Kullanılan Serbest Kalem Şablonları
  const manualTemplates = [
    { name: 'Nano Kırılmaz Cam (İşçilik Dahil)', price: 150, category: 'Ekran Koruyucu' },
    { name: 'Kamera Koruma Lensi Uygulama', price: 100, category: 'Aksesuar' },
    { name: 'Cihaz Sıfırlama & Yazılım / Veri Aktarımı', price: 350, category: 'Yazılım' },
    { name: 'Şarj Soketi Bakım & Detaylı Temizlik', price: 150, category: 'Bakım' },
    { name: 'Özel İthal Kılıf (Silikon/Deri)', price: 250, category: 'Kılıf' },
    { name: 'Hızlı İşçilik / Montaj Bedeli', price: 200, category: 'İşçilik' },
    { name: 'Hoparlör / Ahize Filtre Temizliği', price: 100, category: 'Bakım' },
    { name: 'Type-C Hızlı Şarj Kablosu', price: 180, category: 'Kablo' }
  ];

  // Toplam Hesaplamaları
  const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const discountAmount = useCustomDiscount
    ? Math.min(subtotal, customDiscountTl)
    : Math.round((subtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Manuel Ürünü Sepete Ekleme Fonksiyonu
  const handleAddManualItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = manualName.trim();
    const parsedPrice = parseFloat(manualPrice.toString().replace(',', '.'));

    if (!cleanName) {
      alert('Lütfen ürün veya hizmet adını yazınız!');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      alert('Lütfen geçerli bir fiyat yazınız!');
      priceInputRef.current?.focus();
      return;
    }

    const qty = Math.max(1, manualQty || 1);

    addCustomCartItem({
      name: cleanName,
      price: parsedPrice,
      quantity: qty,
      customNote: manualNote.trim() || undefined
    });
    playBeep();

    // Opsiyonel: Gelecek için kalıcı stoğa da kaydetme
    if (saveToStockToo) {
      const autoCode = `STK-MAN-${Date.now().toString().slice(-4)}`;
      addStockItem({
        barcode: `869${Date.now().toString().slice(-9)}`,
        stockCode: autoCode,
        name: cleanName,
        category: manualCategory,
        quantity: 15,
        minStock: 3,
        costUsd: Math.round(parsedPrice * 0.35 / 38),
        salePriceTl: parsedPrice,
        supplierName: 'Serbest / Manuel Giriş',
        isActive: true
      });
    }

    // Formu sıfırla
    setManualName('');
    setManualPrice('');
    setManualQty(1);
    setManualNote('');
    setSaveToStockToo(false);
    setNotFoundQuery(null);
  };

  // Barkod / Arama Gönderme
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = barcodeQuery.trim();
    if (!q) return;

    const found = stock.find(
      s => s.isActive && (s.barcode === q || s.stockCode.toLowerCase() === q.toLowerCase() || s.name.toLowerCase().includes(q.toLowerCase()))
    );

    if (found) {
      if (found.quantity <= 0) {
        alert('Bu ürün stokta tükenmiştir!');
        return;
      }
      addToCart(found);
      playBeep();
      setBarcodeQuery('');
      setNotFoundQuery(null);
    } else {
      setNotFoundQuery(q);
    }
  };

  // Bulunamayan sorguyu doğrudan manuel ürüne aktar
  const handleTransferNotFoundToManual = () => {
    if (!notFoundQuery) return;
    setActiveInputTab('manuel');
    setManualName(notFoundQuery);
    setNotFoundQuery(null);
    setBarcodeQuery('');
    setTimeout(() => {
      priceInputRef.current?.focus();
    }, 100);
  };

  // Kamera ile başarılı barkod okutma: kesin barkod/stok kodu eşleşmesi.
  // Ürün adında kısmi eşleşme kamera akışında kullanılmaz; yanlış ürün satışını önler.
  const handleCameraScanSuccess = (code: string) => {
    const resolution = resolveScan(code, stock);
    if (!resolution.code) return;

    if (resolution.status === 'found' && resolution.product) {
      addToCart(resolution.product);
      playBeep();
      setScanToast({
        message: `✅ "${resolution.product.name}" sepete eklendi! (₺${resolution.product.salePriceTl})`,
        type: 'success'
      });
      setNotFoundQuery(null);
      return;
    }

    if (resolution.status === 'out_of_stock' && resolution.product) {
      setScanToast({
        message: `⚠️ "${resolution.product.name}" ürünü stokta tükenmiştir!`,
        type: 'warning'
      });
      playBeep();
      return;
    }

    setBarcodeQuery(resolution.code);
    setNotFoundQuery(resolution.code);
    setActiveInputTab('barkod');
    setScanToast({
      message: `ℹ️ Barkod [${resolution.code}] kayıtlı değil! Yeni ürün tanımlayabilir veya manuel satış yapabilirsiniz.`,
      type: 'info'
    });
  };

  // Scan Toast Otomatik Kapanma
  useEffect(() => {
    if (!scanToast) return;
    const timer = setTimeout(() => {
      setScanToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [scanToast]);

  // F3 Tuşu ile Kamerayı Açma / Kapama Kısayolu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setIsScannerOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sepet İçi Düzenleme
  const handleStartEditing = (it: CartItem) => {
    setEditingCartId(it.id);
    setEditPriceInput(it.price.toString());
    setEditNameInput(it.name);
  };

  const handleSaveEditing = (id: string) => {
    const newPrice = parseFloat(editPriceInput.toString().replace(',', '.'));
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Geçersiz fiyat!');
      return;
    }
    updateCartItem(id, {
      price: newPrice,
      name: editNameInput.trim() || undefined
    });
    setEditingCartId(null);
  };

  const handleCancelEditing = () => {
    setEditingCartId(null);
  };

  // Satışı Tamamlama
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      alert('Sepetiniz boş! Lütfen en az bir ürün ekleyin.');
      return;
    }

    const calculatedDiscountRate = useCustomDiscount
      ? (subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0)
      : discountPercent;

    if (currentUser.role !== 'yonetici' && calculatedDiscountRate > (settings.maxDiscountRateForStaff || 10)) {
      alert(`Personel için tanımlı azami iskonto sınırı %${settings.maxDiscountRateForStaff || 10} dir. Lütfen yönetici onayı alınız.`);
      return;
    }

    const sale = completeSale(
      paymentMethod,
      calculatedDiscountRate,
      customerName || undefined,
      customerPhone || undefined
    );

    setReceiptSale(sale);
    setIsReceiptOpen(true);
    setDiscountPercent(0);
    setCustomDiscountTl(0);
    setUseCustomDiscount(false);
    setCustomerName('');
    setCustomerPhone('');
  };

  // Satış İptal
  const handleConfirmCancel = () => {
    if (!cancelModalSale || !cancelReason) return;
    if (currentUser.role !== 'yonetici' && !settings.allowApprenticeCancelSale) {
      alert('Satış iptali ve stoğa iade yetkisi yalnızca Yöneticilere verilmiştir. Ayarlar > Güvenlik sekmesinden bu izni açabilirsiniz.');
      return;
    }
    const ok = cancelSale(cancelModalSale.id, cancelReason);
    if (ok) {
      setCancelModalSale(null);
      setCancelReason('');
    }
  };

  // POS Hızlı Klavye Kısayolları Dinleyicisi
  useEffect(() => {
    const handlePosCompleteSale = (e: Event) => {
      const customEvt = e as CustomEvent<{ method: PaymentMethod }>;
      const requestedMethod = customEvt.detail?.method || paymentMethod;

      if (cart.length === 0) {
        alert('Sepetiniz boş! Lütfen en az bir ürün veya hizmet ekleyiniz.');
        return;
      }

      setPaymentMethod(requestedMethod);

      const calculatedDiscountRate = useCustomDiscount
        ? (subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0)
        : discountPercent;

      if (currentUser.role !== 'yonetici' && calculatedDiscountRate > (settings.maxDiscountRateForStaff || 10)) {
        alert(`Personel için tanımlı azami iskonto sınırı %${settings.maxDiscountRateForStaff || 10} dir. Lütfen yönetici onayı alınız.`);
        return;
      }

      const sale = completeSale(
        requestedMethod,
        calculatedDiscountRate,
        customerName || undefined,
        customerPhone || undefined
      );

      setReceiptSale(sale);
      setIsReceiptOpen(true);
      setDiscountPercent(0);
      setCustomDiscountTl(0);
      setUseCustomDiscount(false);
      setCustomerName('');
      setCustomerPhone('');
    };

    const handlePosClearCart = () => {
      if (cart.length > 0) {
        clearCart();
      }
    };

    window.addEventListener('osman-pos:complete-sale', handlePosCompleteSale);
    window.addEventListener('osman-pos:clear-cart', handlePosClearCart);

    return () => {
      window.removeEventListener('osman-pos:complete-sale', handlePosCompleteSale);
      window.removeEventListener('osman-pos:clear-cart', handlePosClearCart);
    };
  }, [
    cart,
    paymentMethod,
    subtotal,
    discountAmount,
    useCustomDiscount,
    discountPercent,
    currentUser,
    settings,
    customerName,
    customerPhone,
    completeSale,
    clearCart
  ]);

  return (
    <div id="pos-module" className="space-y-5 pb-8 w-full max-w-full overflow-x-hidden">
      {/* Üst Başlık & Durum */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShoppingCart className="text-orange-500" size={24} />
            Hızlı Satış (POS) & Barkod Masası
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            İster serbest manuel ürün ve fiyat yazın, ister barkod okutun; tek tıkla slip kesin ve kasaya işleyin.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
            title="Kamera ile Barkod Tara (F3)"
          >
            <Camera size={16} className="text-blue-200" />
            <span>Kamera ile Barkod Oku</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full font-mono">F3</span>
          </button>

          <div className="bg-zinc-800/90 border border-zinc-700/80 px-3 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-zinc-400 block font-medium">Sepetteki Ürün</span>
            <span className="font-mono text-xs font-bold text-orange-400">
              {cart.reduce((a, b) => a + b.quantity, 0)} Adet ({cart.length} Kalem)
            </span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-emerald-400 block font-medium">Sepet Toplamı</span>
            <span className="font-mono text-sm font-black text-emerald-400">₺{finalTotal}</span>
          </div>
        </div>
      </div>

      {/* Kamera / Barkod Geri Bildirim Bildirimi (Scan Toast) */}
      {scanToast && (
        <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border transition-all shadow-lg animate-in fade-in slide-in-from-top-2 ${
          scanToast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' :
          scanToast.type === 'warning' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' :
          'bg-blue-500/15 border-blue-500/40 text-blue-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="shrink-0 animate-spin" />
            <span className="text-sm">{scanToast.message}</span>
          </div>
          <button
            onClick={() => setScanToast(null)}
            className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50 transition-colors"
          >
            Kapat ✕
          </button>
        </div>
      )}

      {/* Hızlı POS Kısayolları İpucu Çubuğu */}
      <div className="bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <Keyboard size={15} className="text-orange-400" />
          <span className="font-bold text-white">POS Kasa Kısayolları:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 rounded-lg border border-blue-500/30">
            <kbd className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono text-[10px] font-bold">F3</kbd>
            <span className="text-[11px] text-zinc-300 font-semibold">Kamera Barkod</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 rounded-lg border border-zinc-800">
            <kbd className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">F4</kbd>
            <span className="text-[11px] text-zinc-300">Nakit Bitir</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 rounded-lg border border-zinc-800">
            <kbd className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono text-[10px] font-bold">F8</kbd>
            <span className="text-[11px] text-zinc-300">Kredi Kartı</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 rounded-lg border border-zinc-800">
            <kbd className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono text-[10px] font-bold">F9</kbd>
            <span className="text-[11px] text-zinc-300">Havale / EFT</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 rounded-lg border border-zinc-800">
            <kbd className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-[10px] font-bold">Alt+C</kbd>
            <span className="text-[11px] text-zinc-300">Sepet Boşalt</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 rounded-lg border border-zinc-800">
            <kbd className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono text-[10px] font-bold">F2</kbd>
            <span className="text-[11px] text-zinc-300">Servis Aç</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Entry Options (7 Cols) & Right Cart / Checkout (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sol Alan: Giriş Masası (7 Kolon) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mod Değiştirici Sekmeler */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveInputTab('manuel')}
              className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeInputTab === 'manuel'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Zap size={14} />
              <span>Manuel Ürün & Fiyat</span>
              <span className="bg-black/20 text-[9px] px-1 py-0.2 rounded-full font-mono hidden xs:inline">Hızlı</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInputTab('barkod')}
              className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeInputTab === 'barkod'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Barcode size={14} />
              <span>Barkod & Stok</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInputTab('katalog')}
              className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeInputTab === 'katalog'
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Layers size={14} />
              <span>Sık Satılanlar</span>
            </button>
          </div>

          {/* SEKME 1: MANUEL ÜRÜN VE FİYAT YAZMA KONSOLU */}
          {activeInputTab === 'manuel' && (
            <div className="bg-zinc-900 border border-orange-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl shadow-orange-500/5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Serbest Manuel Ürün / Hizmet & Fiyat Girişi</h3>
                    <p className="text-[11px] text-zinc-400">Barkodsuz ürünler, özel koruyucu cam, işçilik ve anlık satışlar için</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddManualItem} className="space-y-4">
                {/* Ürün Adı & Fiyatı Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Ürün / Hizmet Adı (7 Kolon) */}
                  <div className="sm:col-span-7">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-zinc-300 font-semibold block">
                        Ürün veya Hizmet Adı *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 cursor-pointer"
                        title="Kamera ile Barkod Okut"
                      >
                        <Camera size={11} /> Kamerayla Barkod Oku
                      </button>
                    </div>
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="Örn: iPhone 14 Hayalet Cam Takma, Şarj Başlığı..."
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-hidden transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Manuel Fiyat ₺ (5 Kolon) */}
                  <div className="sm:col-span-5">
                    <label className="text-xs text-zinc-300 font-semibold block mb-1">
                      Satış Fiyatı (₺) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-orange-400 text-sm">₺</span>
                      <input
                        ref={priceInputRef}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl pl-8 pr-3 py-2.5 text-base font-mono font-black text-emerald-400 placeholder:text-zinc-500 focus:outline-hidden transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Hızlı Fiyat Tuş Takımı (Presets) */}
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1.5 flex items-center justify-between">
                    <span>Hızlı Fiyat Seçimi (Tek Tıkla Yaz):</span>
                    <span className="text-[10px] text-orange-400/80">Dokununca fiyata yazar</span>
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {quickPricePresets.map((pr) => (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => setManualPrice(pr.toString())}
                        className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                          manualPrice === pr.toString()
                            ? 'bg-orange-500 text-black border-orange-400 shadow-xs'
                            : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        ₺{pr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adet ve Kategori Seçimi */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  <div className="sm:col-span-4 flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5">
                    <span className="text-xs text-zinc-300 font-medium">Satış Adedi:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setManualQty(prev => Math.max(1, prev - 1))}
                        className="p-1 text-zinc-400 hover:text-white bg-zinc-700 rounded cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={manualQty}
                        onChange={(e) => setManualQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-10 text-center font-mono font-bold text-sm text-white bg-transparent focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setManualQty(prev => prev + 1)}
                        className="p-1 text-zinc-400 hover:text-white bg-zinc-700 rounded cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-8 flex items-center gap-2">
                    <label className="text-xs text-zinc-400 shrink-0">Kategori:</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden"
                    >
                      <option value="Aksesuar">Aksesuar / Muhtelif</option>
                      <option value="Ekran Koruyucu">Ekran Koruyucu Cam/Jelatin</option>
                      <option value="Kılıf">Kılıf & Kapak</option>
                      <option value="Kablo">Şarj Kablosu / Adaptör</option>
                      <option value="İşçilik">İşçilik / Teknik Hizmet</option>
                      <option value="Bakım">Temizlik & Bakım</option>
                      <option value="Yazılım">Yazılım / Veri Aktarımı</option>
                    </select>
                  </div>
                </div>

                {/* Sık Kullanılan Serbest Kalem Şablonları */}
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" />
                    Sık Kullanılan Serbest Şablonlar (Tek Dokunuş):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {manualTemplates.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setManualName(t.name);
                          setManualPrice(t.price.toString());
                          setManualCategory(t.category);
                        }}
                        className="text-[11px] px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-orange-500/10 border border-zinc-700/80 hover:border-orange-500/40 text-zinc-300 hover:text-orange-300 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>{t.name}</span>
                        <span className="font-mono font-bold text-emerald-400">₺{t.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* İsteğe Bağlı: Kalıcı Stoğa da Kaydet */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveToStockToo}
                      onChange={(e) => setSaveToStockToo(e.target.checked)}
                      className="w-4 h-4 rounded-sm bg-zinc-800 border-zinc-700 text-orange-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Bu manuel ürünü gelecek satışlar için kalıcı stoğa da ekle</span>
                  </label>

                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Sepete Ekle (Enter)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SEKME 2: BARKOD VE STOK ARAMA */}
          {activeInputTab === 'barkod' && (
            <div className="space-y-4 animate-in fade-in">
              <form onSubmit={handleBarcodeSubmit} className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex gap-2">
                <div className="relative flex-1">
                  <Barcode size={18} className="absolute left-3 top-3 text-blue-400" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Barkod okutun veya ürün adı yazıp Enter'a basın..."
                    value={barcodeQuery}
                    onChange={(e) => setBarcodeQuery(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 font-mono focus:outline-hidden focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-blue-400 hover:text-blue-300 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-xs font-semibold"
                  title="Kamera ile Barkod Okut"
                >
                  <Camera size={16} />
                  <span className="hidden sm:inline">Kamera</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Ara / Ekle
                </button>
              </form>

              {/* Bulunamadı Uyarısı & Manuel Ürüne Dönüştürme Teklifi */}
              {notFoundQuery && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        "{notFoundQuery}" stokta kayıtlı değil!
                      </p>
                      <p className="text-[11px] text-amber-200/80">
                        Bu isimle hemen serbest manuel ürün ve fiyat yazarak satabilirsiniz.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTransferNotFoundToManual}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    ⚡ Manuel Fiyat Yaz & Ekle
                  </button>
                </div>
              )}

              {/* Stoktan Hızlı Seçim Listesi */}
              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Stoktaki Parça ve Aksesuarlar ({stock.filter(s => s.isActive).length} Çeşit)
                </span>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {stock.filter(s => s.isActive).slice(0, 10).map((st) => (
                    <div
                      key={st.id}
                      className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-semibold text-white truncate">{st.name}</p>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Kod: {st.stockCode} | Barkod: {st.barcode} | Stok: {st.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">₺{st.salePriceTl}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(st)}
                          disabled={st.quantity <= 0}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold border border-blue-500/30 disabled:opacity-40 cursor-pointer"
                        >
                          + Sepet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEKME 3: SIK SATILAN HIZLI AKSESUARLAR */}
          {activeInputTab === 'katalog' && (
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 animate-in fade-in">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Sık Satılan Hızlı Aksesuarlar & Sarf Malzemeler
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {fastSaleItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="bg-zinc-800/80 hover:bg-zinc-750 border border-zinc-700/60 p-3 rounded-xl text-left transition-all group flex flex-col justify-between cursor-pointer"
                  >
                    <p className="text-xs font-semibold text-zinc-200 line-clamp-2 group-hover:text-orange-400 transition-colors">
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-700/40">
                      <span className="text-[10px] text-zinc-400">Stok: {item.quantity}</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">₺{item.salePriceTl}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bugünkü Son Satışlar Geçmişi */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Bugünkü Son Satışlar ({sales.length} İşlem)
              </span>
              <span className="text-[10px] text-zinc-500">Termal slip ve iade yönetimi</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    sale.isCancelled
                      ? 'bg-red-950/20 border-red-900/40 text-zinc-500 line-through'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-orange-400">{sale.receiptNo}</span>
                      <span className="text-[10px] text-zinc-500">{sale.timestamp}</span>
                      {sale.isCancelled && (
                        <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                          İPTAL EDİLDİ: {sale.cancelReason}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-emerald-400">₺{sale.total}</span>
                    <button
                      onClick={() => {
                        setReceiptSale(sale);
                        setIsReceiptOpen(true);
                      }}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                      title="Slip Yazdır"
                    >
                      <Printer size={13} />
                    </button>
                    {!sale.isCancelled && currentUser.role === 'yonetici' && (
                      <button
                        onClick={() => setCancelModalSale(sale)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg cursor-pointer"
                        title="Satışı İptal Et (Stoğa İade)"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ Alan: Aktif Satış Sepeti & Ödeme Masası (5 Kolon) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-2xl">
            <div>
              {/* Sepet Başlığı */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-orange-500" />
                  <h3 className="font-bold text-white text-sm">Aktif Satış Sepeti</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Sepeti Temizle</span>
                    <kbd className="px-1 py-0.2 rounded text-[9px] bg-red-950/60 border border-red-800/60 text-red-300 font-mono">Alt+C</kbd>
                  </button>
                )}
              </div>

              {/* Sepet Kalemleri Listesi & Fiyat Düzenleme */}
              <div className="divide-y divide-zinc-800/80 my-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((it) => {
                  const isEditing = editingCartId === it.id;

                  return (
                    <div key={it.id} className="py-2.5 space-y-1.5">
                      {isEditing ? (
                        /* Canlı Düzenleme Modu (İsim ve Fiyat) */
                        <div className="p-2.5 bg-zinc-800/90 border border-orange-500/40 rounded-xl space-y-2 animate-in fade-in">
                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Ürün Adı:</label>
                            <input
                              type="text"
                              value={editNameInput}
                              onChange={(e) => setEditNameInput(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-zinc-400 block mb-0.5">Birim Fiyat (₺):</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={editPriceInput}
                                onChange={(e) => setEditPriceInput(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-400"
                              />
                            </div>
                            <div className="flex items-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveEditing(it.id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                                title="Fiyatı Kaydet"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditing}
                                className="p-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg cursor-pointer"
                                title="İptal"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Normal Sepet Satırı */
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-semibold text-white truncate">{it.name}</p>
                              {it.isCustom && (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1 py-0.2 rounded font-bold">
                                  MANUEL
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[11px] text-zinc-400 font-mono">₺{it.price} / adet</span>
                              <button
                                type="button"
                                onClick={() => handleStartEditing(it)}
                                className="text-zinc-500 hover:text-orange-400 p-0.5 transition-colors cursor-pointer"
                                title="Fiyatı veya ismi elle değiştir"
                              >
                                <Edit3 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Adet Kontrolü */}
                          <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700/60 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(it.id, -1)}
                              className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-5 text-center text-xs font-mono font-bold text-white">
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(it.id, 1)}
                              className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          {/* Kalem Toplamı */}
                          <div className="text-right w-16 shrink-0">
                            <span className="font-mono font-bold text-xs text-emerald-400">
                              ₺{it.price * it.quantity}
                            </span>
                          </div>

                          {/* Sil Butonu */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(it.id)}
                            className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {cart.length === 0 && (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    Sepetiniz henüz boş. Sol taraftan manuel ürün & fiyat yazabilir veya barkod okutabilirsiniz.
                  </div>
                )}
              </div>

              {/* Müşteri Bilgisi (İsteğe Bağlı) */}
              <div className="bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-800/80 mb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Müşteri Adı (Opsiyonel)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Telefon (Opsiyonel)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono"
                  />
                </div>
              </div>

              {/* İskonto & İndirim Alanı */}
              <div className="bg-zinc-800/60 p-2.5 rounded-xl mb-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-medium flex items-center gap-1">
                    <Percent size={13} className="text-orange-400" />
                    İskonto / İndirim:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setUseCustomDiscount(false)}
                      className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                        !useCustomDiscount ? 'bg-orange-600 text-white font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Yüzde (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomDiscount(true)}
                      className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                        useCustomDiscount ? 'bg-orange-600 text-white font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Serbest TL (₺)
                    </button>
                  </div>
                </div>

                {!useCustomDiscount ? (
                  <div className="flex items-center gap-1 justify-end">
                    {[0, 5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(pct)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                          discountPercent === pct ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        %{pct}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-zinc-400">İndirim Tutarı:</span>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1.5 text-xs text-orange-400">₺</span>
                      <input
                        type="number"
                        min="0"
                        value={customDiscountTl || ''}
                        onChange={(e) => setCustomDiscountTl(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-6 pr-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ödeme Yöntemi */}
              <div className="mb-4">
                <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">Ödeme Yöntemi:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nakit')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'nakit'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-xs'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Banknote size={15} />
                      <kbd className="px-1 py-0.2 rounded text-[9px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">F4</kbd>
                    </div>
                    <span>Nakit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('kart')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'kart'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-xs'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <CreditCard size={15} />
                      <kbd className="px-1 py-0.2 rounded text-[9px] bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono">F8</kbd>
                    </div>
                    <span>Kredi Kartı</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('havale')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'havale'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-xs'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Building2 size={15} />
                      <kbd className="px-1 py-0.2 rounded text-[9px] bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono">F9</kbd>
                    </div>
                    <span>Havale / EFT</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Toplam Hesap ve Çıkış / Fiş Kes Butonu */}
            <div className="border-t border-zinc-800 pt-3 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Ara Toplam:</span>
                <span className="font-mono">₺{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-orange-400">
                  <span>İskonto / İndirim:</span>
                  <span className="font-mono">-₺{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-black text-white pt-1">
                <span className="text-xs uppercase tracking-wider text-zinc-300">Ödenecek Tutar:</span>
                <span className="text-2xl font-mono text-emerald-400">₺{finalTotal}</span>
              </div>

              <button
                id="btn-complete-sale"
                disabled={cart.length === 0}
                onClick={handleCompleteSale}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  cart.length > 0
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={18} />
                <span>Satışı Tamamla & Slip Kes (₺{finalTotal})</span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 border border-emerald-400/40 text-emerald-200 font-mono">F4 / F8</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Satış İptal Modalı */}
      {cancelModalSale && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle size={20} />
              <h3 className="text-base font-bold text-white">Satış İptali & Ters Kayıt</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              {cancelModalSale.receiptNo} numaralı satış iptal edilecek, kayıtlı ürünler stoğa iade edilecek ve kasadan ₺{cancelModalSale.total} çıkışı yapılacaktır.
            </p>

            <label className="text-xs text-zinc-300 block mb-1">İptal / İade Nedeni *</label>
            <input
              type="text"
              placeholder="Örn: Müşteri ürünü ambalajında iade etti / Yanlış ürün girildi"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalSale(null)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!cancelReason}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                İptali Onayla & Stoğa İade Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Termal Satış Slipi Modalı */}
      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleRecord={receiptSale}
        receiptType="satis_slip"
      />

      {/* OCR ürün tanıma: sonuç kullanıcı onayı olmadan sepete girmez */}
      <SmartOcrProductModal
        isOpen={isOcrProductOpen}
        stock={stock}
        onClose={() => setIsOcrProductOpen(false)}
        onConfirm={(product) => {
          addToCart(product);
          playBeep();
          setScanToast({ message: `✅ "${product.name}" OCR adayı onaylandı ve sepete eklendi.`, type: 'success' });
          setIsOcrProductOpen(false);
        }}
      />

      {/* Kamera Barkod Okutucu Modalı */}
      {isScannerOpen && (
        <button
          type="button"
          onClick={() => { setIsScannerOpen(false); setIsOcrProductOpen(true); }}
          className="fixed z-[70] bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-orange-600 text-white text-xs font-black shadow-2xl border border-orange-400"
        >
          Barkod yok? Akıllı Ürün Tanı
        </button>
      )}

      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleCameraScanSuccess}
        title="Hızlı Satış - Kamera ile Barkod Okut"
        description="Ürünün barkodunu kameraya gösterin. Sistem ürünü otomatik bulup anında sepete ekler."
        expectedType="barcode"
        allowContinuous={true}
      />
    </div>
  );
};
