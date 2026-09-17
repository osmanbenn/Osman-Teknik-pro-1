// Osman Teknik Pro - Veri Tipleri ve Modelleri

export type UserRole = 'yonetici' | 'teknisyen' | 'cirak';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  branch: string;
  avatar?: string;
}

export type ThemeMode = 'modern-dark' | 'light-card' | 'colorful-minimal' | 'theme-comparison';

export type NavigationTab =
  | 'dashboard'
  | 'servis'
  | 'satis'
  | 'telefon'
  | 'stok'
  | 'cari'
  | 'kasa'
  | 'ai'
  | 'temalar'
  | 'ayarlar'
  | 'menu'
  | 'takip'
  | 'teknisyen';

export type ServiceStage = 'kabul' | 'ariza_tespiti' | 'onarimda' | 'hazir' | 'teslim_edildi';

export interface ServicePartUsed {
  id: string;
  stockId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPriceUsd: number;
  warrantyDays?: number; // Parça bazlı garanti süresi (örn: 90 gün)
}

export interface ServicePhoto {
  id: string;
  url: string;
  type: 'kabul' | 'onarim' | 'teslim';
  uploadedAt: string;
  watermarked: boolean;
}

export interface ServiceAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface ServiceRecord {
  id: string;
  serviceNo: string; // örn: SRV-2026-001
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  imei: string; // 15 hane
  imeiMasked: string;
  issueComplaint: string;
  cosmeticCondition: string;
  accessoriesReceived: string[]; // Kılıf, Şarj, SIM vb.
  lockType: 'yok' | 'pin' | 'desen' | 'parola';
  lockCode?: string; // Servis içi not, dışarıya/WhatsApp'a ASLA sızmaz
  patternLock?: number[]; // Android 3x3 desen noktaları örn: [1, 2, 5, 8, 9]
  estimatedDelivery: string;
  estimatedPrice: number;
  assignedTechnician: string;
  whatsappConsent: boolean;
  termsApproved: boolean;
  stage: ServiceStage;
  stageHistory: {
    stage: ServiceStage;
    updatedAt: string;
    updatedBy: string;
    note?: string;
  }[];
  photos: ServicePhoto[];
  partsUsed: ServicePartUsed[];
  laborCost: number;
  finalPrice: number;
  paymentStatus: 'odendi' | 'bekliyor' | 'kismi' | 'veresiye';
  paidAmount: number;
  deliveredTo?: string;
  deliveredAt?: string;
  deliveryReceiptNo?: string;
  customerSignature?: string; // Müşteri dijital kabul imzası (Base64)
  deliverySignature?: string; // Teslim alan müşteri imzası (Base64)
  damageTags?: string[]; // Çizik ve hasar ekspertiz etiketleri (örn: Ön Cam Çatlak, Kasa Kenar Ezik)
  warrantyDays: number; // 90 gün standart garanti
  isReturnWarranty?: boolean;
  parentServiceNo?: string;
  auditLogs: ServiceAuditLog[];
  qrToken: string;
  createdAt: string;
  updatedAt: string;
  conflictVersion: number;
}

export interface StockItem {
  id: string;
  barcode: string;
  stockCode: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  costUsd: number;
  salePriceTl: number;
  supplierName: string;
  isActive: boolean;
  hasSalesHistory?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  stockId: string;
  productName: string;
  type: 'giris' | 'satis' | 'servis' | 'iade' | 'sayim_farki';
  quantity: number;
  unitPrice: number;
  referenceNo: string;
  user: string;
  timestamp: string;
}

export interface CartItem {
  id: string;
  stockId?: string;
  name: string;
  barcode?: string;
  price: number;
  quantity: number;
  costUsd?: number;
  isCustom?: boolean; // Serbest / manuel girilen ürün veya hizmet
  customNote?: string;
}

export type PaymentMethod = 'nakit' | 'kart' | 'havale' | 'veresiye' | 'karma';

export interface SaleRecord {
  id: string;
  receiptNo: string;
  items: CartItem[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  splitPayments?: {
    nakit?: number;
    kart?: number;
    havale?: number;
    veresiye?: number;
  };
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  isCancelled?: boolean;
  cancelReason?: string;
  cancelledAt?: string;
  timestamp: string;
}

export interface PhoneTradeRecord {
  id: string;
  tradeType: 'alim' | 'satis';
  deviceBrand: string;
  deviceModel: string;
  imei: string;
  imeiMasked: string;
  isNew: boolean; // sıfır mı 2. el mi
  sellerName: string;
  sellerPhone: string;
  sellerIdLast4: string; // T.C. Kimlik son 4 hanesi
  batteryHealth: number; // örn: 88%
  conditionGrade: 'A+' | 'A' | 'B' | 'C';
  inspectionNotes: {
    screen: string;
    body: string;
    battery: string;
    cameras: string;
    buttons: string;
    biometrics: string;
  };
  photos: string[];
  purchasePrice: number;
  targetSalePrice: number;
  actualSalePrice?: number;
  profit?: number;
  paymentMethod: PaymentMethod;
  legalDeclarationConfirmed: boolean; // Çalıntı/hacizli olmadığına dair beyan
  status: 'stokta' | 'satildi' | 'ayrildi';
  stockCode: string;
  buyerName?: string;
  buyerPhone?: string;
  soldAt?: string;
  createdAt: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  installments: {
    id: string;
    dueDate: string;
    amount: number;
    paidAmount: number;
    isPaid: boolean;
    description: string;
  }[];
  notes: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalPayableUsd: number;
  invoices: {
    id: string;
    invoiceNo: string;
    date: string;
    totalUsd: number;
    lockedExchangeRate: number;
    shippingCostUsd: number;
    isPaid: boolean;
  }[];
}

export interface CashMovement {
  id: string;
  type: 'gelir_satis' | 'gelir_servis' | 'tahsilat_cari' | 'gider' | 'cihaz_alimi';
  amount: number;
  method: 'nakit' | 'kart' | 'havale';
  category: string;
  description: string;
  user: string;
  timestamp: string;
}

export interface DayEndReport {
  id: string;
  date: string;
  expectedCash: number;
  countedCash: number;
  cashDifference: number;
  differenceReason?: string;
  totalCard: number;
  totalBank: number;
  totalExpense: number;
  totalServiceRevenue: number;
  totalSaleRevenue: number;
  approvedBy: string;
  notes?: string;
  timestamp: string;
}

export interface AiActionLog {
  id: string;
  timestamp: string;
  user: string;
  prompt: string;
  actionType: 'stok_guncelleme' | 'cihaz_kabul_taslagi' | 'satis_sepeti' | 'rapor_ozeti';
  status: 'onay_bekliyor' | 'onaylandi' | 'reddedildi' | 'hata';
  correlationId: string;
  previewData: any;
}

export interface AppSettings {
  // 1. Kurumsal & İletişim
  firmName: string;
  branchName: string;
  phone: string;
  whatsappPhone?: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  bankIban?: string;
  bankAccountName?: string;

  // 2. Termal Fiş & Yazıcı
  printerSize: '58mm' | '80mm';
  customerCopyEnabled: boolean;
  printQrCode: boolean;
  receiptHeaderTitle: string;
  receiptFooterLegalText: string;

  // 3. Teknik Servis & Garanti Politikası
  defaultWarrantyDays: number;
  rmaAlertThresholdDays: number;
  inspectionFee: number; // Standart arıza tespit ücreti (₺)
  defaultDeliveryHours: number; // Saat (örn: 24 saat)
  requireImeiOnService: boolean;
  defaultTechnicianCommissionRate?: number; // (Kaldırıldı)

  // 4. Finans, POS & Kasa
  usdExchangeRate: number;
  autoUsdSyncEnabled?: boolean;
  posCommissionRate: number; // POS komisyon oranı %
  maxDiscountRateForStaff: number; // Personel azami iskonto %
  dayEndReminderTime: string; // "20:00"

  // 5. WhatsApp & SMS Bildirim Şablonları
  whatsappTemplateServiceIntake: string;
  whatsappTemplateServiceReady: string;
  whatsappTemplatePriceApproval: string;
  whatsappTemplateDebtReminder: string;

  // 6. Güvenlik & Personel İzinleri
  allowApprenticeCancelSale: boolean;
  allowApprenticeViewCostUsd: boolean;

  // 7. Arayüz & Donanım Sesleri
  barcodeBeepSound: boolean;
  fontSize: 'normal' | 'large';
  highContrast: boolean;
}

