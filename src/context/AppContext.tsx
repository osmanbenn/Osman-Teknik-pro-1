import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ServiceRecord,
  ServiceStage,
  StockItem,
  StockMovement,
  SaleRecord,
  CartItem,
  PhoneTradeRecord,
  CustomerAccount,
  CashMovement,
  DayEndReport,
  AiActionLog,
  AppSettings,
  UserProfile,
  PaymentMethod
} from '../types';
import {
  initialUsers,
  initialSettings,
  initialStock,
  initialServices,
  initialSales,
  initialPhoneTrades,
  initialCustomers,
  initialCashMovements,
  initialAiLogs
} from '../data/initialData';
import { safeStorage } from '../utils/storage';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (u: UserProfile) => void;
  users: UserProfile[];
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  resetSettingsToDefault: () => void;
  restoreBackupData: (backupJson: string | object) => boolean;
  playBeep: () => void;
  storageStats: { usedBytes: number; usedKb: number; formattedSize: string };
  clearNonEssentialCache: () => void;
  // Servis
  services: ServiceRecord[];
  addServiceRecord: (record: Omit<ServiceRecord, 'id' | 'serviceNo' | 'createdAt' | 'updatedAt' | 'conflictVersion' | 'qrToken' | 'stageHistory' | 'auditLogs'>) => ServiceRecord;
  updateServiceStage: (serviceId: string, newStage: ServiceStage, note?: string) => boolean;
  addPartToService: (serviceId: string, stockId: string, qty: number, unitPrice: number, warrantyDays?: number) => boolean;
  completeServiceDelivery: (serviceId: string, deliveredTo: string, paymentStatus: 'odendi' | 'veresiye', paidAmount: number, deliverySignature?: string, paymentMethod?: 'nakit' | 'kart' | 'havale') => boolean;
  // Stok
  stock: StockItem[];
  stockMovements: StockMovement[];
  addStockItem: (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStockItem: (id: string, item: Partial<StockItem>) => void;
  receiveStockPurchase: (id: string, quantity: number, costUsd: number, supplierName?: string) => boolean;
  applyStockCount: (counts: Record<string, number>) => number;
  deactivateStockItem: (id: string) => boolean;
  importStockBatch: (items: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  // POS & Satış
  cart: CartItem[];
  addToCart: (item: StockItem | { id: string; name: string; price: number; quantity: number }) => void;
  addCustomCartItem: (item: { name: string; price: number; quantity?: number; barcode?: string; customNote?: string }) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  sales: SaleRecord[];
  completeSale: (paymentMethod: PaymentMethod, discountRate: number, customerName?: string, customerPhone?: string, splitPayments?: SaleRecord['splitPayments']) => SaleRecord;
  cancelSale: (saleId: string, reason: string) => boolean;
  // Telefon Alım Satım
  phoneTrades: PhoneTradeRecord[];
  addPhoneTradeBuy: (trade: Omit<PhoneTradeRecord, 'id' | 'tradeType' | 'createdAt' | 'stockCode' | 'status'>) => PhoneTradeRecord;
  sellTradedPhone: (id: string, salePrice: number, buyerName: string, buyerPhone: string, paymentMethod: PaymentMethod) => boolean;
  // Cari & Veresiye
  customers: CustomerAccount[];
  addCustomerDebt: (customerId: string, amount: number, description: string, installmentsCount: number) => void;
  collectCustomerPayment: (customerId: string, amount: number, note: string) => void;
  // Kasa & Gün Sonu
  cashMovements: CashMovement[];
  addExpense: (amount: number, category: string, description: string, method: 'nakit' | 'kart' | 'havale') => void;
  dayEndReports: DayEndReport[];
  submitDayEndReport: (countedCash: number, differenceReason?: string, notes?: string) => DayEndReport;
  // AI Asistan
  aiLogs: AiActionLog[];
  pendingAiAction: {
    title: string;
    description: string;
    details: any;
    action: () => void;
  } | null;
  setPendingAiAction: (action: any) => void;
  executePendingAiAction: () => void;
  dismissPendingAiAction: () => void;
  // Modal / Quick Action trigger
  activeModal: 'service-kabul' | 'pos' | 'phone-trade' | 'stock-add' | 'qr-track' | 'usd-calc' | 'none';
  setActiveModal: (m: 'service-kabul' | 'pos' | 'phone-trade' | 'stock-add' | 'qr-track' | 'usd-calc' | 'none') => void;
  selectedServiceForModal: ServiceRecord | null;
  setSelectedServiceForModal: (s: ServiceRecord | null) => void;
  // Alert helpers
  criticalStockCount: number;
  overdueCustomerCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // İlk çalıştırmada kota aşımına yol açabilecek eski devasa görselleri temizle
  useEffect(() => {
    safeStorage.sanitizeExistingData();
  }, []);

  const [storageStats, setStorageStats] = useState(() => safeStorage.getStorageStats());

  const refreshStorageStats = () => {
    setStorageStats(safeStorage.getStorageStats());
  };

  const clearNonEssentialCache = () => {
    safeStorage.clearNonEssential();
    setAiLogs([]);
    refreshStorageStats();
  };

  // Safe Persistence with safeStorage
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = safeStorage.getItem('osman_current_user');
    if (!saved) return initialUsers[0];
    try { return JSON.parse(saved); } catch { return initialUsers[0]; }
  });

  const [users] = useState<UserProfile[]>(initialUsers);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = safeStorage.getItem('osman_settings');
    if (!saved) return initialSettings;
    try {
      const parsed = JSON.parse(saved);
      return { ...initialSettings, ...parsed };
    } catch {
      return initialSettings;
    }
  });

  const [services, setServices] = useState<ServiceRecord[]>(() => {
    const saved = safeStorage.getItem('osman_services');
    if (!saved) return initialServices;
    try { return JSON.parse(saved); } catch { return initialServices; }
  });

  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = safeStorage.getItem('osman_stock');
    if (!saved) return initialStock;
    try { return JSON.parse(saved); } catch { return initialStock; }
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = safeStorage.getItem('osman_stock_movements');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = safeStorage.getItem('osman_sales');
    if (!saved) return initialSales;
    try { return JSON.parse(saved); } catch { return initialSales; }
  });

  const [phoneTrades, setPhoneTrades] = useState<PhoneTradeRecord[]>(() => {
    const saved = safeStorage.getItem('osman_phone_trades');
    if (!saved) return initialPhoneTrades;
    try { return JSON.parse(saved); } catch { return initialPhoneTrades; }
  });

  const [customers, setCustomers] = useState<CustomerAccount[]>(() => {
    const saved = safeStorage.getItem('osman_customers');
    if (!saved) return initialCustomers;
    try { return JSON.parse(saved); } catch { return initialCustomers; }
  });

  const [cashMovements, setCashMovements] = useState<CashMovement[]>(() => {
    const saved = safeStorage.getItem('osman_cash_movements');
    if (!saved) return initialCashMovements;
    try { return JSON.parse(saved); } catch { return initialCashMovements; }
  });

  const [dayEndReports, setDayEndReports] = useState<DayEndReport[]>(() => {
    const saved = safeStorage.getItem('osman_day_end_reports');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  const [aiLogs, setAiLogs] = useState<AiActionLog[]>(() => {
    const saved = safeStorage.getItem('osman_ai_logs');
    if (!saved) return initialAiLogs;
    try { return JSON.parse(saved); } catch { return initialAiLogs; }
  });

  const [pendingAiAction, setPendingAiAction] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<'service-kabul' | 'pos' | 'phone-trade' | 'stock-add' | 'qr-track' | 'usd-calc' | 'none'>('none');
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<ServiceRecord | null>(null);

  // Sync to safeStorage
  useEffect(() => {
    safeStorage.setItem('osman_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    safeStorage.setItem('osman_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    safeStorage.setItem('osman_services', JSON.stringify(services));
    refreshStorageStats();
  }, [services]);

  useEffect(() => {
    safeStorage.setItem('osman_stock', JSON.stringify(stock));
    refreshStorageStats();
  }, [stock]);

  useEffect(() => {
    safeStorage.setItem('osman_stock_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    safeStorage.setItem('osman_sales', JSON.stringify(sales));
    refreshStorageStats();
  }, [sales]);

  useEffect(() => {
    safeStorage.setItem('osman_phone_trades', JSON.stringify(phoneTrades));
    refreshStorageStats();
  }, [phoneTrades]);

  useEffect(() => {
    safeStorage.setItem('osman_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    safeStorage.setItem('osman_cash_movements', JSON.stringify(cashMovements));
  }, [cashMovements]);

  useEffect(() => {
    safeStorage.setItem('osman_day_end_reports', JSON.stringify(dayEndReports));
  }, [dayEndReports]);

  useEffect(() => {
    safeStorage.setItem('osman_ai_logs', JSON.stringify(aiLogs));
  }, [aiLogs]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const resetSettingsToDefault = () => {
    setSettings(initialSettings);
  };

  const playBeep = () => {
    if (!settings.barcodeBeepSound) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const restoreBackupData = (backupData: string | object): boolean => {
    try {
      const data = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
      if (!data || typeof data !== 'object') return false;

      if (Array.isArray(data.services)) setServices(data.services);
      if (Array.isArray(data.stock)) setStock(data.stock);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.phoneTrades)) setPhoneTrades(data.phoneTrades);
      if (Array.isArray(data.customers)) setCustomers(data.customers);
      if (Array.isArray(data.cashMovements)) setCashMovements(data.cashMovements);
      if (Array.isArray(data.stockMovements)) setStockMovements(data.stockMovements);
      if (Array.isArray(data.dayEndReports)) setDayEndReports(data.dayEndReports);
      if (Array.isArray(data.aiLogs)) setAiLogs(data.aiLogs);
      if (data.settings && typeof data.settings === 'object') {
        setSettings({ ...initialSettings, ...data.settings });
      }
      return true;
    } catch {
      return false;
    }
  };

  // Critical stock & Overdue alerts
  const criticalStockCount = stock.filter(s => s.isActive && s.quantity <= s.minStock).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCustomerCount = customers.filter(c =>
    c.installments.some(ins => !ins.isPaid && ins.dueDate < todayStr)
  ).length;

  // Servis Kabul
  const addServiceRecord = (data: Omit<ServiceRecord, 'id' | 'serviceNo' | 'createdAt' | 'updatedAt' | 'conflictVersion' | 'qrToken' | 'stageHistory' | 'auditLogs'>): ServiceRecord => {
    const nextNum = services.length + 1;
    const srvNumStr = `SRV-2026-${String(nextNum).padStart(3, '0')}`;
    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const qrToken = `qtk_${srvNumStr.toLowerCase()}_sec${Math.floor(100 + Math.random() * 900)}`;

    const newRec: ServiceRecord = {
      ...data,
      id: `srv-${Date.now()}`,
      serviceNo: srvNumStr,
      stage: 'kabul',
      stageHistory: [
        {
          stage: 'kabul',
          updatedAt: new Date().toISOString().split('T')[0],
          updatedBy: currentUser.name,
          note: 'Cihaz kabul kaydı açıldı.'
        }
      ],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          timestamp: nowStr,
          user: currentUser.name,
          action: 'Servis Kabulü',
          details: `${data.customerName} için ${data.deviceBrand} ${data.deviceModel} kabul edildi.`
        }
      ],
      qrToken,
      createdAt: nowStr,
      updatedAt: nowStr,
      conflictVersion: 1
    };

    setServices(prev => [newRec, ...prev]);
    return newRec;
  };

  // Stage transition with validation (Kabul -> Arıza Tespiti -> Onarımda -> Hazır -> Teslim Edildi)
  const stageOrder: ServiceStage[] = ['kabul', 'ariza_tespiti', 'onarimda', 'hazir', 'teslim_edildi'];

  const updateServiceStage = (serviceId: string, newStage: ServiceStage, note?: string): boolean => {
    const srv = services.find(s => s.id === serviceId);
    if (!srv) return false;

    const currentIndex = stageOrder.indexOf(srv.stage);
    const targetIndex = stageOrder.indexOf(newStage);

    // Çırak yetki kontrolü: Çırak sadece arıza tespiti görebilir, teslim edemez
    if (currentUser.role === 'cirak' && (newStage === 'teslim_edildi' || newStage === 'hazir')) {
      alert('Çırak rolü cihazı hazır veya teslim edildi durumuna alamaz! Yönetici veya Teknisyen onayı gerekir.');
      return false;
    }

    // Aşama atlamayı engelleme (Sadece sıradaki aşamaya geçilebilir veya 1 geri alınabilir)
    if (targetIndex > currentIndex + 1) {
      alert(`Aşama atlanamaz! Önce sıradaki aşamaya geçilmelidir.`);
      return false;
    }

    // Yetkisiz geriye alma koruması (Sadece Yönetici geriye alabilir)
    if (targetIndex < currentIndex && currentUser.role !== 'yonetici') {
      alert('Sadece Yönetici yetkisine sahip kullanıcı servis aşamasını geriye alabilir!');
      return false;
    }

    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    setServices(prev => prev.map(item => {
      if (item.id !== serviceId) return item;
      return {
        ...item,
        stage: newStage,
        updatedAt: nowStr,
        conflictVersion: item.conflictVersion + 1,
        stageHistory: [
          ...item.stageHistory,
          {
            stage: newStage,
            updatedAt: nowStr,
            updatedBy: currentUser.name,
            note: note || `Durum ${newStage.toUpperCase()} olarak güncellendi.`
          }
        ],
        auditLogs: [
          ...item.auditLogs,
          {
            id: `aud-${Date.now()}`,
            timestamp: nowStr,
            user: currentUser.name,
            action: 'Aşama Değişikliği',
            details: `Aşama: ${item.stage} -> ${newStage} (${note || 'Açıklama girilmedi'})`
          }
        ]
      };
    }));

    return true;
  };

  // Add part to service and automatically decrement from stock
  const addPartToService = (serviceId: string, stockId: string, qty: number, unitPrice: number, warrantyDays: number = 90): boolean => {
    const srv = services.find(s => s.id === serviceId);
    if (!srv) {
      alert('Servis kaydı bulunamadı!');
      return false;
    }

    // 1. Teslim edilmiş servise parça eklenemez
    if (srv.stage === 'teslim_edildi') {
      alert('Teslim edilmiş servise yeni parça eklenemez!');
      return false;
    }

    const stockProduct = stock.find(s => s.id === stockId);
    if (!stockProduct) {
      alert('Parça bulunamadı!');
      return false;
    }

    // 2. Pasif stok kullanılamaz
    if (!stockProduct.isActive) {
      alert(`Pasif stok kullanılamaz: "${stockProduct.name}" satışa veya servise kapalıdır.`);
      return false;
    }

    // 3. Negatif/sıfır/kesirli adet engellenir
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty <= 0) {
      alert('Parça adedi sıfırdan büyük bir tam sayı olmalıdır (kesirli veya negatif adet girilemez)!');
      return false;
    }

    // 4. Geçersiz fiyat engellenir
    if (typeof unitPrice !== 'number' || isNaN(unitPrice) || unitPrice < 0) {
      alert('Geçersiz parça satış fiyatı! Fiyat sıfır veya pozitif bir sayı olmalıdır.');
      return false;
    }

    // 5. Yetersiz stok engellenir
    if (stockProduct.quantity < qty) {
      alert(`Yetersiz stok! Envanterde ${stockProduct.quantity} adet mevcut, istenen: ${qty} adet.`);
      return false;
    }

    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // 1. Stoktan düş
    setStock(prev => prev.map(s => {
      if (s.id === stockId) {
        return { ...s, quantity: s.quantity - qty, hasSalesHistory: true, updatedAt: nowStr };
      }
      return s;
    }));

    // 2. Stok hareketi kaydet
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      stockId,
      productName: stockProduct.name,
      type: 'servis',
      quantity: qty,
      unitPrice,
      referenceNo: srv.serviceNo || serviceId,
      user: currentUser.name,
      timestamp: nowStr
    };
    setStockMovements(prev => [newMovement, ...prev]);

    // 3. Servis kaydına parçayı ekle
    setServices(prev => prev.map(currentSrv => {
      if (currentSrv.id !== serviceId) return currentSrv;
      const newPart = {
        id: `pu-${Date.now()}`,
        stockId,
        name: stockProduct.name,
        quantity: qty,
        unitPrice,
        costPriceUsd: stockProduct.costUsd,
        warrantyDays: warrantyDays || 90
      };
      const updatedParts = [...currentSrv.partsUsed, newPart];
      const partsTotal = updatedParts.reduce((acc, p) => acc + (p.unitPrice * p.quantity), 0);
      const newFinalPrice = partsTotal + currentSrv.laborCost;

      return {
        ...currentSrv,
        partsUsed: updatedParts,
        finalPrice: newFinalPrice,
        updatedAt: nowStr,
        auditLogs: [
          ...currentSrv.auditLogs,
          {
            id: `aud-${Date.now()}`,
            timestamp: nowStr,
            user: currentUser.name,
            action: 'Parça Kullanımı',
            details: `${qty} adet ${stockProduct.name} eklendi (₺${unitPrice * qty})`
          }
        ]
      };
    }));

    return true;
  };

  // Complete Service Delivery
  const completeServiceDelivery = (
    serviceId: string,
    deliveredTo: string,
    paymentStatus: 'odendi' | 'veresiye',
    paidAmount: number,
    deliverySignature?: string,
    paymentMethod: 'nakit' | 'kart' | 'havale' = 'nakit'
  ): boolean => {
    const srv = services.find(s => s.id === serviceId);
    if (!srv) {
      alert('Servis kaydı bulunamadı!');
      return false;
    }

    // 1. Yalnızca hazir durumundaki cihaz teslim edilebilir
    if (srv.stage !== 'hazir') {
      alert(`Yalnızca "Hazır" durumundaki cihazlar teslim edilebilir! Cihazın şu anki durumu: "${srv.stage}". Lütfen önce durumu Hazır yapınız.`);
      return false;
    }

    // 2. Teslim alan kişi zorunlu
    if (!deliveredTo || deliveredTo.trim().length === 0) {
      alert('Teslim alan kişi bilgisi zorunludur!');
      return false;
    }

    // 3. Negatif/fazla tahsilat engellenir
    if (typeof paidAmount !== 'number' || isNaN(paidAmount) || paidAmount < 0) {
      alert('Tahsilat tutarı negatif veya geçersiz olamaz!');
      return false;
    }

    if (paidAmount > srv.finalPrice) {
      alert(`Tahsilat tutarı (₺${paidAmount}), servis toplam onarım bedelini (₺${srv.finalPrice}) aşamaz!`);
      return false;
    }

    // 4. Ödendi seçeneğinde eksik tahsilat engellenir
    if (paymentStatus === 'odendi' && paidAmount < srv.finalPrice) {
      alert(`"Ödendi" seçildiğinde eksik tahsilat yapılamaz! Servis toplam bedeli: ₺${srv.finalPrice}, girilen: ₺${paidAmount}. Kalan bakiye için ödeme durumunu "Veresiye (Cari)" olarak seçiniz.`);
      return false;
    }

    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const receiptNo = `TSL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    setServices(prev => prev.map(s => {
      if (s.id !== serviceId) return s;
      return {
        ...s,
        stage: 'teslim_edildi',
        deliveredTo: deliveredTo.trim(),
        deliveredAt: nowStr,
        deliveryReceiptNo: receiptNo,
        deliverySignature: deliverySignature || s.deliverySignature,
        paymentStatus,
        paidAmount,
        updatedAt: nowStr,
        stageHistory: [
          ...s.stageHistory,
          {
            stage: 'teslim_edildi',
            updatedAt: nowStr,
            updatedBy: currentUser.name,
            note: `Cihaz ${deliveredTo.trim()} kişisine teslim edildi. Ödeme: ${paymentStatus} (₺${paidAmount} / ${paymentMethod.toUpperCase()})`
          }
        ],
        auditLogs: [
          ...s.auditLogs,
          {
            id: `aud-${Date.now()}`,
            timestamp: nowStr,
            user: currentUser.name,
            action: 'Cihaz Teslim Edildi',
            details: `Teslim Alan: ${deliveredTo.trim()}, Tahsilat: ₺${paidAmount}, Ödeme Yöntemi: ${paymentMethod}`
          }
        ]
      };
    }));

    // 5. Nakit / Kart / Havale-EFT ayrı kayıt edilir
    if (paidAmount > 0) {
      setCashMovements(prev => [
        {
          id: `cm-${Date.now()}`,
          type: 'gelir_servis',
          amount: paidAmount,
          method: paymentMethod,
          category: 'Teknik Servis Onarımı',
          description: `${srv.serviceNo} No'lu ${srv.deviceModel} teslimat tahsilatı (${deliveredTo.trim()})`,
          user: currentUser.name,
          timestamp: nowStr
        },
        ...prev
      ]);
    }

    // Veresiye kalan bakiye varsa cari hesaba aktar
    const remainingDebt = srv.finalPrice - paidAmount;
    if (paymentStatus === 'veresiye' && remainingDebt > 0) {
      const existingCustomer = customers.find(c => c.phone === srv.customerPhone);
      if (existingCustomer) {
        addCustomerDebt(
          existingCustomer.id,
          remainingDebt,
          `${srv.serviceNo} - ${srv.deviceBrand} ${srv.deviceModel} onarım teslimatı kalan bakiyesi`,
          1
        );
      }
    }

    return true;
  };

  // Stock management
  const addStockItem = (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const newItem: StockItem = {
      ...item,
      id: `stk-${Date.now()}`,
      hasSalesHistory: false,
      createdAt: nowStr,
      updatedAt: nowStr
    };
    setStock(prev => [newItem, ...prev]);

    setStockMovements(prev => [
      {
        id: `mov-${Date.now()}`,
        stockId: newItem.id,
        productName: newItem.name,
        type: 'giris',
        quantity: newItem.quantity,
        unitPrice: newItem.salePriceTl,
        referenceNo: 'YENI_GIRIS',
        user: currentUser.name,
        timestamp: new Date().toLocaleDateString('tr-TR')
      },
      ...prev
    ]);
  };

  const updateStockItem = (id: string, updates: Partial<StockItem>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    setStock(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: nowStr } : s));
  };

  const receiveStockPurchase = (id: string, quantity: number, costUsd: number, supplierName?: string): boolean => {
    const item = stock.find(s => s.id === id);
    const qty = Math.max(1, Math.floor(Number(quantity) || 0));
    const unitCost = Math.max(0, Number(costUsd) || 0);
    if (!item || !item.isActive || qty < 1) return false;
    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setStock(prev => prev.map(s => s.id === id ? { ...s, quantity: s.quantity + qty, costUsd: unitCost, supplierName: supplierName || s.supplierName, updatedAt: new Date().toISOString().split('T')[0] } : s));
    setStockMovements(prev => [{
      id: `mov-${Date.now()}-purchase`, stockId: id, productName: item.name, type: 'giris', quantity: qty,
      unitPrice: unitCost, referenceNo: `ALIS-${Date.now()}`, user: currentUser.name, timestamp: nowStr
    }, ...prev]);
    return true;
  };

  const applyStockCount = (counts: Record<string, number>): number => {
    const changes = stock.flatMap(item => {
      if (!item.isActive || counts[item.id] === undefined) return [];
      const counted = Math.max(0, Math.floor(Number(counts[item.id]) || 0));
      const difference = counted - item.quantity;
      return difference === 0 ? [] : [{ item, counted, difference }];
    });
    if (!changes.length) return 0;
    const isoDate = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const ref = `SAYIM-${Date.now()}`;
    setStock(prev => prev.map(item => {
      const change = changes.find(ch => ch.item.id === item.id);
      return change ? { ...item, quantity: change.counted, updatedAt: isoDate } : item;
    }));
    setStockMovements(prev => [
      ...changes.map(({ item, difference }, index) => ({
        id: `mov-${Date.now()}-count-${index}`,
        stockId: item.id,
        productName: item.name,
        type: 'sayim_farki' as const,
        quantity: difference,
        unitPrice: item.salePriceTl,
        referenceNo: ref,
        user: currentUser.name,
        timestamp
      })),
      ...prev
    ]);
    return changes.length;
  };

  const deactivateStockItem = (id: string): boolean => {
    const item = stock.find(s => s.id === id);
    if (!item) return false;
    // Satış geçmişi olan ürünü fiziksel silmeme kuralı
    setStock(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s));
    return true;
  };

  const importStockBatch = (items: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const newItems: StockItem[] = items.map((it, idx) => ({
      ...it,
      id: `stk-${Date.now()}-${idx}`,
      createdAt: nowStr,
      updatedAt: nowStr
    }));
    setStock(prev => [...newItems, ...prev]);
  };

  // POS & Cart
  const addToCart = (product: StockItem | { id: string; name: string; price: number; quantity: number }) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id || (product as StockItem).barcode === p.barcode);
      if (existing) {
        return prev.map(p => p.id === existing.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [
        ...prev,
        {
          id: product.id,
          stockId: (product as StockItem).stockCode ? product.id : undefined,
          name: product.name,
          barcode: (product as StockItem).barcode,
          price: (product as StockItem).salePriceTl || (product as any).price,
          quantity: 1,
          costUsd: (product as StockItem).costUsd || 0
        }
      ];
    });
  };

  const addCustomCartItem = (item: { name: string; price: number; quantity?: number; barcode?: string; customNote?: string }) => {
    const newItem: CartItem = {
      id: `man-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: item.name.trim() || 'Serbest Satış / Özel Ürün',
      price: Math.max(0, Number(item.price) || 0),
      quantity: Math.max(1, Number(item.quantity) || 1),
      barcode: item.barcode || undefined,
      costUsd: 0,
      isCustom: true,
      customNote: item.customNote
    };
    setCart(prev => [newItem, ...prev]);
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          price: updates.price !== undefined ? Math.max(0, Number(updates.price)) : item.price,
          quantity: updates.quantity !== undefined ? Math.max(1, Number(updates.quantity)) : item.quantity
        };
      }
      return item;
    }));
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const completeSale = (
    paymentMethod: PaymentMethod,
    discountRate: number,
    customerName?: string,
    customerPhone?: string,
    splitPayments?: SaleRecord['splitPayments']
  ): SaleRecord => {
    // 1. Boş sepet satılamaz
    if (!cart || cart.length === 0) {
      alert('Boş sepet ile satış yapılamaz! Lütfen sepete en az bir ürün ekleyiniz.');
      throw new Error('Boş sepet satılamaz!');
    }

    // 2. Personel iskonto üst limiti doğrulanır
    const maxAllowedDiscount = settings.maxDiscountRateForStaff ?? 10;
    if (currentUser.role !== 'yonetici' && discountRate > maxAllowedDiscount) {
      alert(`Personel için izin verilen azami iskonto sınırı %${maxAllowedDiscount}'dir. %${discountRate} iskonto uygulamak için Yönetici yetkisi gereklidir.`);
      throw new Error('İskonto yetki sınırı aşıldı');
    }

    // 3. Aktif olmayan veya yetersiz stok satılamaz
    for (const item of cart) {
      if (item.stockId) {
        const stockItem = stock.find(s => s.id === item.stockId);
        if (!stockItem) {
          alert(`Satış durduruldu: "${item.name}" stok kartı sistemde bulunamadı.`);
          throw new Error(`Stok kartı bulunamadı: ${item.name}`);
        }
        if (!stockItem.isActive) {
          alert(`Satış durduruldu: "${stockItem.name}" pasife alınmış veya satışa kapalıdır!`);
          throw new Error(`Pasif stok satılamaz: ${stockItem.name}`);
        }
        if (stockItem.quantity < item.quantity) {
          alert(`Yetersiz stok! "${stockItem.name}" için mevcut stok: ${stockItem.quantity} adet, sepetteki talep: ${item.quantity} adet.`);
          throw new Error(`Yetersiz stok: ${stockItem.name}`);
        }
      }
    }

    const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const discountAmount = (subtotal * discountRate) / 100;
    const total = subtotal - discountAmount;

    // Ödeme doğrulaması herhangi bir stok/kasa/cari state değişikliğinden önce yapılır.
    if (paymentMethod === 'karma') {
      const raw = splitPayments || {};
      const values = [raw.nakit, raw.kart, raw.havale, raw.veresiye].map(value => Number(value || 0));
      if (values.some(value => !Number.isFinite(value) || value < 0)) {
        throw new Error('Karma ödeme tutarları geçerli ve negatif olmayan sayılar olmalıdır.');
      }
      const paidTotal = values.reduce((sum, value) => sum + value, 0);
      if (Math.abs(paidTotal - total) > 0.01) {
        throw new Error(`Karma ödeme toplamı satış tutarıyla eşleşmiyor. Beklenen ₺${total}, girilen ₺${paidTotal}.`);
      }
    }
    const creditAmountToValidate = paymentMethod === 'veresiye' ? total : paymentMethod === 'karma' ? Number(splitPayments?.veresiye || 0) : 0;
    if (creditAmountToValidate > 0) {
      const normalizedPhone = (customerPhone || '').replace(/\D/g, '');
      const customerExists = !!normalizedPhone && customers.some(customer => customer.phone.replace(/\D/g, '') === normalizedPhone);
      if (!customerExists) throw new Error('Veresiye satış için kayıtlı müşteri telefonu gereklidir.');
    }
    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const receiptNo = `SAL-${new Date().getFullYear()}-${String(sales.length + 15).padStart(3, '0')}`;
    const normalizedSplitPayments: SaleRecord['splitPayments'] | undefined = paymentMethod === 'karma' ? {
      nakit: Math.max(0, Number(splitPayments?.nakit || 0)),
      kart: Math.max(0, Number(splitPayments?.kart || 0)),
      havale: Math.max(0, Number(splitPayments?.havale || 0)),
      veresiye: Math.max(0, Number(splitPayments?.veresiye || 0))
    } : undefined;

    const newSale: SaleRecord = {
      id: `sal-${Date.now()}`,
      receiptNo,
      items: [...cart],
      subtotal,
      discountRate,
      discountAmount,
      total,
      paymentMethod,
      splitPayments: normalizedSplitPayments,
      customerName: customerName || 'Perakende Müşteri',
      customerPhone,
      cashierName: currentUser.name,
      timestamp: nowStr
    };

    // 4. Stok düşümü - Doğrulanmış stoktan tam adet düşülür, Math.max(0) ile gizlenmez
    setStock(prev => prev.map(s => {
      const soldItem = cart.find(ci => ci.stockId === s.id);
      if (soldItem) {
        const remainingQty = s.quantity - soldItem.quantity;
        return {
          ...s,
          quantity: remainingQty,
          hasSalesHistory: true,
          updatedAt: nowStr
        };
      }
      return s;
    }));

    // 5. Stok hareketleri kaydet
    cart.forEach(item => {
      if (item.stockId) {
        setStockMovements(prev => [
          {
            id: `mov-${Date.now()}-${Math.random()}`,
            stockId: item.stockId!,
            productName: item.name,
            type: 'satis',
            quantity: item.quantity,
            unitPrice: item.price,
            referenceNo: receiptNo,
            user: currentUser.name,
            timestamp: nowStr
          },
          ...prev
        ]);
      }
    });

    // Veresiye tutarı varsa kayıtlı müşteri carisine otomatik borç yaz.
    const creditAmount = paymentMethod === 'veresiye' ? total : paymentMethod === 'karma' ? (normalizedSplitPayments?.veresiye || 0) : 0;
    if (creditAmount > 0) {
      const normalizedPhone = (customerPhone || '').replace(/\D/g, '');
      const customer = customers.find(c => c.phone.replace(/\D/g, '') === normalizedPhone);
      if (!customer || !normalizedPhone) {
        throw new Error('Veresiye satış için kayıtlı müşteri telefonu gereklidir.');
      }
      const due = new Date();
      due.setMonth(due.getMonth() + 1);
      setCustomers(prev => prev.map(c => c.id === customer.id ? {
        ...c,
        totalDebt: c.totalDebt + creditAmount,
        installments: [...c.installments, {
          id: `ins-${Date.now()}-pos`,
          dueDate: due.toISOString().split('T')[0],
          amount: creditAmount,
          paidAmount: 0,
          isPaid: false,
          description: `${receiptNo} POS veresiye satış`
        }]
      } : c));
    }

    // 6. Kasa hareketi kaydet. Karma ödemede her tahsilat kanalı ayrı hareket olur.
    if (paymentMethod === 'karma') {
      const parts = normalizedSplitPayments || {};
      const cashParts = [
        ['nakit', parts.nakit || 0],
        ['kart', parts.kart || 0],
        ['havale', parts.havale || 0]
      ] as const;
      cashParts.filter(([, amount]) => amount > 0).forEach(([method, amount], index) => {
        setCashMovements(prev => [{
          id: `cm-${Date.now()}-${index}`, type: 'gelir_satis', amount, method,
          category: 'Hızlı Satış / POS - Karma',
          description: `${receiptNo} karma ödeme (${customerName || 'Perakende'})`,
          user: currentUser.name, timestamp: nowStr
        }, ...prev]);
      });
    } else if (paymentMethod !== 'veresiye') {
      setCashMovements(prev => [{
        id: `cm-${Date.now()}`, type: 'gelir_satis', amount: total,
        method: paymentMethod === 'nakit' ? 'nakit' : paymentMethod === 'kart' ? 'kart' : 'havale',
        category: 'Hızlı Satış / POS',
        description: `${receiptNo} no perakende satış (${customerName || 'Perakende'})`,
        user: currentUser.name, timestamp: nowStr
      }, ...prev]);
    }

    setSales(prev => [newSale, ...prev]);
    clearCart();
    return newSale;
  };

  const cancelSale = (saleId: string, reason: string): boolean => {
    if (currentUser.role !== 'yonetici') {
      alert('Satış iptali ve ters kayıt yetkisi sadece Yöneticidedir!');
      return false;
    }
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.isCancelled) return false;

    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // 1. Satışı iptal olarak işaretle
    setSales(prev => prev.map(s => s.id === saleId ? {
      ...s,
      isCancelled: true,
      cancelReason: reason,
      cancelledAt: nowStr
    } : s));

    // 2. Stokları geri al (Ters hareket)
    sale.items.forEach(it => {
      if (it.stockId) {
        setStock(prev => prev.map(s => s.id === it.stockId ? { ...s, quantity: s.quantity + it.quantity } : s));
        setStockMovements(prev => [
          {
            id: `mov-${Date.now()}-${Math.random()}`,
            stockId: it.stockId!,
            productName: it.name,
            type: 'iade',
            quantity: it.quantity,
            unitPrice: it.price,
            referenceNo: `IPTAL-${sale.receiptNo}`,
            user: currentUser.name,
            timestamp: nowStr
          },
          ...prev
        ]);
      }
    });

    // 3. Kasa ters kaydı: yalnızca gerçekten tahsil edilmiş ödeme kanallarını geri çıkar.
    if (sale.paymentMethod === 'karma') {
      const cashParts = [
        ['nakit', sale.splitPayments?.nakit || 0],
        ['kart', sale.splitPayments?.kart || 0],
        ['havale', sale.splitPayments?.havale || 0]
      ] as const;
      cashParts.filter(([, amount]) => amount > 0).forEach(([method, amount], index) => {
        setCashMovements(prev => [{
          id: `cm-${Date.now()}-cancel-${index}`,
          type: 'gider',
          amount,
          method,
          category: 'Satış İptali (Karma İade)',
          description: `${sale.receiptNo} no satış iptal edildi: ${reason}`,
          user: currentUser.name,
          timestamp: nowStr
        }, ...prev]);
      });
    } else if (sale.paymentMethod !== 'veresiye') {
      setCashMovements(prev => [{
        id: `cm-${Date.now()}-cancel`,
        type: 'gider',
        amount: sale.total,
        method: sale.paymentMethod === 'nakit' ? 'nakit' : sale.paymentMethod === 'kart' ? 'kart' : 'havale',
        category: 'Satış İptali (İade)',
        description: `${sale.receiptNo} no satış iptal edildi: ${reason}`,
        user: currentUser.name,
        timestamp: nowStr
      }, ...prev]);
    }

    // 4. Veresiye kısmını müşteri carisinden ters kayıtla kaldır.
    const creditAmount = sale.paymentMethod === 'veresiye'
      ? sale.total
      : sale.paymentMethod === 'karma'
        ? (sale.splitPayments?.veresiye || 0)
        : 0;
    if (creditAmount > 0 && sale.customerPhone) {
      const normalizedPhone = sale.customerPhone.replace(/\D/g, '');
      setCustomers(prev => prev.map(customer => {
        if (customer.phone.replace(/\D/g, '') !== normalizedPhone) return customer;
        const matchingInstallments = customer.installments.filter(ins => ins.description.includes(sale.receiptNo));
        const removableDebt = matchingInstallments.reduce((sum, ins) => sum + Math.max(0, ins.amount - ins.paidAmount), 0);
        return {
          ...customer,
          totalDebt: Math.max(0, customer.totalDebt - Math.min(creditAmount, removableDebt)),
          installments: customer.installments.filter(ins => !ins.description.includes(sale.receiptNo))
        };
      }));
    }

    return true;
  };

  // Telefon Alım Satım
  const addPhoneTradeBuy = (tradeData: Omit<PhoneTradeRecord, 'id' | 'tradeType' | 'createdAt' | 'stockCode' | 'status'>): PhoneTradeRecord => {
    const nextNum = phoneTrades.length + 1;
    const stockCode = `TEL-2026-${String(nextNum).padStart(3, '0')}`;
    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const newTrade: PhoneTradeRecord = {
      ...tradeData,
      id: `ptr-${Date.now()}`,
      tradeType: 'alim',
      status: 'stokta',
      stockCode,
      createdAt: nowStr
    };

    setPhoneTrades(prev => [newTrade, ...prev]);

    // Otomatik stoğa telefon kartı olarak ekle
    addStockItem({
      barcode: tradeData.imei,
      stockCode,
      name: `${tradeData.deviceBrand} ${tradeData.deviceModel} (${tradeData.isNew ? 'Sıfır' : '2. El - ' + tradeData.conditionGrade})`,
      category: 'Telefon',
      quantity: 1,
      minStock: 1,
      costUsd: Number((tradeData.purchasePrice / settings.usdExchangeRate).toFixed(2)),
      salePriceTl: tradeData.targetSalePrice,
      supplierName: `${tradeData.sellerName} (Bireysel Satıcı)`,
      isActive: true
    });

    // Kasa çıkışı
    setCashMovements(prev => [
      {
        id: `cm-${Date.now()}`,
        type: 'cihaz_alimi',
        amount: tradeData.purchasePrice,
        method: tradeData.paymentMethod === 'nakit' ? 'nakit' : tradeData.paymentMethod === 'kart' ? 'kart' : 'havale',
        category: 'Telefon Alımı',
        description: `${stockCode} ${tradeData.deviceModel} alımı (${tradeData.sellerName})`,
        user: currentUser.name,
        timestamp: nowStr
      },
      ...prev
    ]);

    return newTrade;
  };

  const sellTradedPhone = (id: string, salePrice: number, buyerName: string, buyerPhone: string, paymentMethod: PaymentMethod): boolean => {
    const trade = phoneTrades.find(t => t.id === id);
    if (!trade || trade.status === 'satildi') {
      alert('Bu cihaz zaten satılmış veya stokta bulunamadı!');
      return false;
    }

    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const profit = salePrice - trade.purchasePrice;

    setPhoneTrades(prev => prev.map(t => t.id === id ? {
      ...t,
      status: 'satildi',
      actualSalePrice: salePrice,
      profit,
      buyerName,
      buyerPhone,
      soldAt: nowStr
    } : t));

    // Stoğu 0 yap
    setStock(prev => prev.map(s => s.stockCode === trade.stockCode ? { ...s, quantity: 0, hasSalesHistory: true } : s));

    // Kasa girişi
    setCashMovements(prev => [
      {
        id: `cm-${Date.now()}`,
        type: 'gelir_satis',
        amount: salePrice,
        method: paymentMethod === 'nakit' ? 'nakit' : paymentMethod === 'kart' ? 'kart' : 'havale',
        category: 'Telefon Satışı',
        description: `${trade.stockCode} ${trade.deviceModel} satışı (${buyerName})`,
        user: currentUser.name,
        timestamp: nowStr
      },
      ...prev
    ]);

    return true;
  };

  // Cari & Veresiye
  const addCustomerDebt = (customerId: string, amount: number, description: string, installmentsCount: number = 1) => {
    const perInst = Math.round(amount / installmentsCount);
    const today = new Date();

    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      const newInsts = Array.from({ length: installmentsCount }).map((_, i) => {
        const d = new Date(today);
        d.setMonth(d.getMonth() + (i + 1));
        return {
          id: `ins-${Date.now()}-${i}`,
          dueDate: d.toISOString().split('T')[0],
          amount: perInst,
          paidAmount: 0,
          isPaid: false,
          description: `${description} (${i + 1}/${installmentsCount})`
        };
      });

      return {
        ...c,
        totalDebt: c.totalDebt + amount,
        installments: [...c.installments, ...newInsts]
      };
    }));
  };

  const collectCustomerPayment = (customerId: string, amount: number, note: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    if (amount > customer.totalDebt) {
      alert('Açık borcu aşan tahsilat yapılamaz!');
      return;
    }

    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    let remainingToDeduct = amount;

    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      const updatedInstallments = c.installments.map(ins => {
        if (ins.isPaid || remainingToDeduct <= 0) return ins;
        const unpaid = ins.amount - ins.paidAmount;
        if (remainingToDeduct >= unpaid) {
          remainingToDeduct -= unpaid;
          return { ...ins, paidAmount: ins.amount, isPaid: true };
        } else {
          const newPaid = ins.paidAmount + remainingToDeduct;
          remainingToDeduct = 0;
          return { ...ins, paidAmount: newPaid };
        }
      });

      return {
        ...c,
        totalDebt: Math.max(0, c.totalDebt - amount),
        installments: updatedInstallments
      };
    }));

    setCashMovements(prev => [
      {
        id: `cm-${Date.now()}`,
        type: 'tahsilat_cari',
        amount,
        method: 'nakit',
        category: 'Cari Tahsilat',
        description: `${customer.name} cari tahsilatı (${note})`,
        user: currentUser.name,
        timestamp: nowStr
      },
      ...prev
    ]);
  };

  // Kasa & Gider
  const addExpense = (amount: number, category: string, description: string, method: 'nakit' | 'kart' | 'havale') => {
    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setCashMovements(prev => [
      {
        id: `cm-${Date.now()}`,
        type: 'gider',
        amount,
        method,
        category,
        description,
        user: currentUser.name,
        timestamp: nowStr
      },
      ...prev
    ]);
  };

  const submitDayEndReport = (countedCash: number, differenceReason?: string, notes?: string): DayEndReport => {
    const totalCashIncome = cashMovements
      .filter(c => c.method === 'nakit' && c.type !== 'gider')
      .reduce((a, b) => a + b.amount, 0);
    const totalCashExpense = cashMovements
      .filter(c => c.method === 'nakit' && c.type === 'gider')
      .reduce((a, b) => a + b.amount, 0);
    const expectedCash = totalCashIncome - totalCashExpense;
    const diff = countedCash - expectedCash;

    const totalCard = cashMovements.filter(c => c.method === 'kart' && c.type !== 'gider').reduce((a, b) => a + b.amount, 0);
    const totalBank = cashMovements.filter(c => c.method === 'havale' && c.type !== 'gider').reduce((a, b) => a + b.amount, 0);
    const totalExpense = cashMovements.filter(c => c.type === 'gider').reduce((a, b) => a + b.amount, 0);
    const totalServiceRevenue = cashMovements.filter(c => c.type === 'gelir_servis').reduce((a, b) => a + b.amount, 0);
    const totalSaleRevenue = cashMovements.filter(c => c.type === 'gelir_satis').reduce((a, b) => a + b.amount, 0);

    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const report: DayEndReport = {
      id: `der-${Date.now()}`,
      date: nowStr,
      expectedCash,
      countedCash,
      cashDifference: diff,
      differenceReason: diff !== 0 ? differenceReason : undefined,
      totalCard,
      totalBank,
      totalExpense,
      totalServiceRevenue,
      totalSaleRevenue,
      approvedBy: currentUser.name,
      notes,
      timestamp: nowStr
    };

    setDayEndReports(prev => [report, ...prev]);
    return report;
  };

  // AI Asistan Actions
  const executePendingAiAction = () => {
    if (pendingAiAction && pendingAiAction.action) {
      pendingAiAction.action();
      setAiLogs(prev => [
        {
          id: `ai-${Date.now()}`,
          timestamp: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          user: currentUser.name,
          prompt: pendingAiAction.title,
          actionType: 'stok_guncelleme',
          status: 'onaylandi',
          correlationId: `corr-${Math.random().toString(36).substring(2, 11)}`,
          previewData: pendingAiAction.details
        },
        ...prev
      ]);
      setPendingAiAction(null);
    }
  };

  const dismissPendingAiAction = () => {
    if (pendingAiAction) {
      setAiLogs(prev => [
        {
          id: `ai-${Date.now()}`,
          timestamp: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          user: currentUser.name,
          prompt: pendingAiAction.title,
          actionType: 'stok_guncelleme',
          status: 'reddedildi',
          correlationId: `corr-${Math.random().toString(36).substring(2, 11)}`,
          previewData: pendingAiAction.details
        },
        ...prev
      ]);
      setPendingAiAction(null);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        settings,
        updateSettings,
        resetSettingsToDefault,
        restoreBackupData,
        playBeep,
        storageStats,
        clearNonEssentialCache,
        services,
        addServiceRecord,
        updateServiceStage,
        addPartToService,
        completeServiceDelivery,
        stock,
        stockMovements,
        addStockItem,
        updateStockItem,
        receiveStockPurchase,
        applyStockCount,
        deactivateStockItem,
        importStockBatch,
        cart,
        addToCart,
        addCustomCartItem,
        updateCartItem,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        sales,
        completeSale,
        cancelSale,
        phoneTrades,
        addPhoneTradeBuy,
        sellTradedPhone,
        customers,
        addCustomerDebt,
        collectCustomerPayment,
        cashMovements,
        addExpense,
        dayEndReports,
        submitDayEndReport,
        aiLogs,
        pendingAiAction,
        setPendingAiAction,
        executePendingAiAction,
        dismissPendingAiAction,
        activeModal,
        setActiveModal,
        selectedServiceForModal,
        setSelectedServiceForModal,
        criticalStockCount,
        overdueCustomerCount
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
