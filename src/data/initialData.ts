import {
  ServiceRecord,
  StockItem,
  SaleRecord,
  PhoneTradeRecord,
  CustomerAccount,
  SupplierRecord,
  CashMovement,
  DayEndReport,
  AiActionLog,
  AppSettings,
  UserProfile
} from '../types';

export const initialUsers: UserProfile[] = [
  { id: 'usr-1', name: 'Osman Usta', role: 'yonetici', branch: 'Merkez Şube', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60' },
  { id: 'usr-2', name: 'Ahmet Teknisyen', role: 'teknisyen', branch: 'Merkez Şube' },
  { id: 'usr-3', name: 'Emre Çırak', role: 'cirak', branch: 'Merkez Şube' }
];

export const initialSettings: AppSettings = {
  firmName: 'OSMAN TEKNİK PRO',
  branchName: 'Merkez Şube - Kadıköy',
  phone: '0850 123 45 67',
  whatsappPhone: '0532 999 88 77',
  address: 'Osmanağa Mah. Rıhtım Cad. No: 42/B Kadıköy / İstanbul',
  taxOffice: 'Kadıköy V.D.',
  taxNumber: '6480192345',
  bankIban: 'TR56 0006 2000 0001 2345 6789 01',
  bankAccountName: 'Osman Teknik İletişim Tic. Ltd. Şti.',
  printerSize: '80mm',
  customerCopyEnabled: true,
  printQrCode: true,
  receiptHeaderTitle: 'TEKNİK SERVİS & HIZLI SATIŞ FİŞİ',
  receiptFooterLegalText: '• 90 gün içinde teslim alınmayan cihazlardan firmamız sorumlu değildir.\n• Sıvı temaslı ve darbeli cihazlarda oluşabilecek anakart risklerinden servisimiz mesul tutulamaz.\n• Değiştirilen orijinal ve revize parçalar firmamız tarafından 90 gün garantilidir.',
  defaultWarrantyDays: 90,
  rmaAlertThresholdDays: 90,
  inspectionFee: 150,
  defaultDeliveryHours: 24,
  requireImeiOnService: true,
  usdExchangeRate: 34.25,
  autoUsdSyncEnabled: false,
  posCommissionRate: 2.75,
  maxDiscountRateForStaff: 10,
  dayEndReminderTime: '20:30',
  whatsappTemplateServiceIntake: 'Sayın {MUSTERI}, {CIHAZ} cihazınız {SERVIS_NO} fiş numarası ile teknik servisimize kabul edilmiştir. Canlı onarım durumunu buradan takip edebilirsiniz: {TAKIP_LINKI}',
  whatsappTemplateServiceReady: 'Müjde Sayın {MUSTERI}! {CIHAZ} cihazınızın bakım ve onarımı başarıyla tamamlandı. Servisimize uğrayarak teslim alabilirsiniz. Tutar: {TUTAR} TL.',
  whatsappTemplatePriceApproval: 'Sayın {MUSTERI}, {CIHAZ} cihazınızın arıza tespiti yapılmıştır. Onarım tutarı {TUTAR} TL dir. Onayınız için lütfen yanıtlayınız.',
  whatsappTemplateDebtReminder: 'Sayın {MUSTERI}, firmamızda bulunan {TUTAR} TL tutarındaki cari bakiyenizi havale veya mağazamızdan ödeyebilirsiniz. İletişim: {TELEFON}',
  allowApprenticeCancelSale: false,
  allowApprenticeViewCostUsd: false,
  barcodeBeepSound: true,
  fontSize: 'normal',
  highContrast: false,
};

export const initialStock: StockItem[] = [
  {
    id: 'stk-1',
    barcode: '869001234001',
    stockCode: 'EKR-IPH13-OLED',
    name: 'iPhone 13 Orijinal Revize OLED Ekran',
    category: 'Ekran & Dokunmatik',
    quantity: 4,
    minStock: 2,
    costUsd: 55,
    salePriceTl: 3250,
    supplierName: 'Asya İletişim Toptan',
    isActive: true,
    hasSalesHistory: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-09-08'
  },
  {
    id: 'stk-2',
    barcode: '869001234002',
    stockCode: 'BAT-IPH12-DEJI',
    name: 'iPhone 12 Deji Yüksek Kapasite Batarya 3210mAh',
    category: 'Batarya',
    quantity: 1, // KRİTİK STOK!
    minStock: 3,
    costUsd: 14,
    salePriceTl: 950,
    supplierName: 'Deji Türkiye',
    isActive: true,
    hasSalesHistory: true,
    createdAt: '2026-08-10',
    updatedAt: '2026-09-07'
  },
  {
    id: 'stk-3',
    barcode: '869001234003',
    stockCode: 'KBL-TYPC-60W',
    name: 'Type-C Hızlı Şarj & Veri Kablosu 60W Örgülü (1m)',
    category: 'Kablo',
    quantity: 34,
    minStock: 10,
    costUsd: 1.8,
    salePriceTl: 150,
    supplierName: 'Global Aksesuar',
    isActive: true,
    hasSalesHistory: true,
    createdAt: '2026-08-15',
    updatedAt: '2026-09-08'
  },
  {
    id: 'stk-4',
    barcode: '869001234004',
    stockCode: 'ADP-20W-APPLE',
    name: '20W Type-C Hızlı Şarj Başlığı (Orijinal Kutu)',
    category: 'Şarj Aleti',
    quantity: 15,
    minStock: 5,
    costUsd: 6.5,
    salePriceTl: 350,
    supplierName: 'Global Aksesuar',
    isActive: true,
    hasSalesHistory: true,
    createdAt: '2026-08-20',
    updatedAt: '2026-09-08'
  },
  {
    id: 'stk-5',
    barcode: '869001234005',
    stockCode: 'KIL-IPH14-ZIRH',
    name: 'iPhone 14 Darbe Emici Standlı Zırh Kılıf',
    category: 'Kılıf',
    quantity: 9,
    minStock: 4,
    costUsd: 3.2,
    salePriceTl: 350,
    supplierName: 'Mega Kılıf Dünyası',
    isActive: true,
    hasSalesHistory: true,
    createdAt: '2026-08-22',
    updatedAt: '2026-09-09'
  },
  {
    id: 'stk-6',
    barcode: '869001234006',
    stockCode: 'CAM-NANO-9D',
    name: 'Hayalet & 9D Kırılmaz Ekran Koruyucu Cam',
    category: 'Aksesuar',
    quantity: 30,
    minStock: 10,
    costUsd: 0.9,
    salePriceTl: 100,
    supplierName: 'Mega Kılıf Dünyası',
    isActive: true,
    hasSalesHistory: true,
    createdAt: '2026-08-25',
    updatedAt: '2026-09-09'
  },
  {
    id: 'stk-7',
    barcode: '869001234007',
    stockCode: 'TWS-AIRP-PRO2',
    name: 'Kablosuz Bluetooth ANC Kulaklık Pro 2',
    category: 'Kulaklık',
    quantity: 10,
    minStock: 3,
    costUsd: 9.5,
    salePriceTl: 450,
    supplierName: 'Global Aksesuar',
    isActive: true,
    hasSalesHistory: true,
    createdAt: '2026-08-25',
    updatedAt: '2026-09-09'
  },
  {
    id: 'stk-8',
    barcode: '869001234008',
    stockCode: 'KBL-LGT-IPH',
    name: 'Lightning to USB Dayanıklı Şarj Kablosu',
    category: 'Kablo',
    quantity: 21,
    minStock: 8,
    costUsd: 1.5,
    salePriceTl: 150,
    supplierName: 'Global Aksesuar',
    isActive: true,
    hasSalesHistory: true,
    createdAt: '2026-08-28',
    updatedAt: '2026-09-09'
  },
  {
    id: 'stk-9',
    barcode: '869001234009',
    stockCode: 'EKR-SAM-A54',
    name: 'Samsung Galaxy A54 5G Orijinal Çerçeveli Ekran',
    category: 'Ekran & Dokunmatik',
    quantity: 2, // KRİTİK STOK!
    minStock: 2,
    costUsd: 48,
    salePriceTl: 2800,
    supplierName: 'Asya İletişim Toptan',
    isActive: true,
    hasSalesHistory: true,
    createdAt: '2026-08-30',
    updatedAt: '2026-09-08'
  }
];

export const initialServices: ServiceRecord[] = [
  {
    id: 'srv-1',
    serviceNo: 'SRV-2026-001',
    customerName: 'Ahmet Yılmaz',
    customerPhone: '0532 555 12 34',
    deviceBrand: 'Apple',
    deviceModel: 'iPhone 13 (128GB)',
    imei: '356891094827153',
    imeiMasked: '356891********3',
    issueComplaint: 'Ekran kırık, dokunmatik alt kısımda basmıyor, kasa köşede hafif ezik.',
    cosmeticCondition: 'Kasa kenarında darbe izi mevcut, arka cam sağlam.',
    accessoriesReceived: ['Kılıf', 'SIM Kart Tepsisi'],
    lockType: 'pin',
    lockCode: '2580',
    estimatedDelivery: '2026-09-09 17:00',
    estimatedPrice: 3500,
    assignedTechnician: 'Ahmet Teknisyen',
    whatsappConsent: true,
    termsApproved: true,
    stage: 'kabul',
    stageHistory: [
      {
        stage: 'kabul',
        updatedAt: '2026-09-09 09:12',
        updatedBy: 'Osman Usta',
        note: 'Cihaz teslim alındı. Fiş kesildi.'
      }
    ],
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=60',
        type: 'kabul',
        uploadedAt: '2026-09-09 09:15',
        watermarked: true
      }
    ],
    partsUsed: [],
    laborCost: 250,
    finalPrice: 3500,
    paymentStatus: 'bekliyor',
    paidAmount: 0,
    warrantyDays: 90,
    auditLogs: [
      {
        id: 'aud-1',
        timestamp: '2026-09-09 09:12',
        user: 'Osman Usta',
        action: 'Kayıt Oluşturuldu',
        details: 'Ahmet Yılmaz adına iPhone 13 kabul edildi. Servis no: SRV-2026-001'
      }
    ],
    qrToken: 'qtk_srv_2026_001_sec882',
    createdAt: '2026-09-09 09:12',
    updatedAt: '2026-09-09 09:12',
    conflictVersion: 1
  },
  {
    id: 'srv-2',
    serviceNo: 'SRV-2026-002',
    customerName: 'Selin Demir',
    customerPhone: '0544 888 90 12',
    deviceBrand: 'Samsung',
    deviceModel: 'Galaxy S22 Ultra',
    imei: '864201092837492',
    imeiMasked: '864201********2',
    issueComplaint: 'Şarj soketi temassızlık yapıyor, hızlı şarj almıyor.',
    cosmeticCondition: 'Temiz, ekran koruyucu mevcut.',
    accessoriesReceived: ['Şarj Adaptörü'],
    lockType: 'desen',
    lockCode: 'L Şekli',
    estimatedDelivery: '2026-09-09 15:30',
    estimatedPrice: 1200,
    assignedTechnician: 'Ahmet Teknisyen',
    whatsappConsent: true,
    termsApproved: true,
    stage: 'onarimda',
    stageHistory: [
      { stage: 'kabul', updatedAt: '2026-09-09 08:30', updatedBy: 'Osman Usta', note: 'Kabul edildi' },
      { stage: 'ariza_tespiti', updatedAt: '2026-09-09 09:00', updatedBy: 'Ahmet Teknisyen', note: 'Soket bordu oksitlenmiş' },
      { stage: 'onarimda', updatedAt: '2026-09-09 10:15', updatedBy: 'Ahmet Teknisyen', note: 'Alt bord değişimi yapılıyor' }
    ],
    photos: [],
    partsUsed: [],
    laborCost: 400,
    finalPrice: 1200,
    paymentStatus: 'bekliyor',
    paidAmount: 0,
    warrantyDays: 90,
    auditLogs: [
      { id: 'aud-2a', timestamp: '2026-09-09 08:30', user: 'Osman Usta', action: 'Kayıt', details: 'Kabul edildi' },
      { id: 'aud-2b', timestamp: '2026-09-09 10:15', user: 'Ahmet Teknisyen', action: 'Durum Değişti', details: 'Aşama Onarımda yapıldı' }
    ],
    qrToken: 'qtk_srv_2026_002_sec719',
    createdAt: '2026-09-09 08:30',
    updatedAt: '2026-09-09 10:15',
    conflictVersion: 2
  },
  {
    id: 'srv-3',
    serviceNo: 'SRV-2026-003',
    customerName: 'Burak Korkmaz',
    customerPhone: '0555 432 10 98',
    deviceBrand: 'Apple',
    deviceModel: 'iPhone 11 (64GB)',
    imei: '359128091823741',
    imeiMasked: '359128********1',
    issueComplaint: 'Batarya sağlığı %71, aniden kapanıyor.',
    cosmeticCondition: 'Normal kullanım çizikleri.',
    accessoriesReceived: [],
    lockType: 'yok',
    estimatedDelivery: '2026-09-09 12:00',
    estimatedPrice: 950,
    assignedTechnician: 'Ahmet Teknisyen',
    whatsappConsent: true,
    termsApproved: true,
    stage: 'hazir',
    stageHistory: [
      { stage: 'kabul', updatedAt: '2026-09-09 08:00', updatedBy: 'Osman Usta' },
      { stage: 'ariza_tespiti', updatedAt: '2026-09-09 08:45', updatedBy: 'Ahmet Teknisyen' },
      { stage: 'onarimda', updatedAt: '2026-09-09 09:30', updatedBy: 'Ahmet Teknisyen' },
      { stage: 'hazir', updatedAt: '2026-09-09 11:30', updatedBy: 'Ahmet Teknisyen', note: 'Deji batarya montajı tamamlandı, testler başarılı.' }
    ],
    photos: [],
    partsUsed: [
      {
        id: 'pu-1',
        stockId: 'stk-2',
        name: 'iPhone 11/12 Deji Batarya',
        quantity: 1,
        unitPrice: 750,
        costPriceUsd: 14
      }
    ],
    laborCost: 200,
    finalPrice: 950,
    paymentStatus: 'bekliyor',
    paidAmount: 0,
    warrantyDays: 180,
    auditLogs: [
      { id: 'aud-3a', timestamp: '2026-09-09 11:30', user: 'Ahmet Teknisyen', action: 'Hazır Bildirimi', details: 'Cihaz teslime hazırlandı' }
    ],
    qrToken: 'qtk_srv_2026_003_sec912',
    createdAt: '2026-09-09 08:00',
    updatedAt: '2026-09-09 11:30',
    conflictVersion: 4
  }
];

export const initialSales: SaleRecord[] = [
  {
    id: 'sal-1',
    receiptNo: 'SAL-2026-014',
    items: [
      { id: 'c-1', stockId: 'stk-3', name: 'Type-C Hızlı Şarj Kablosu 60W', price: 150, quantity: 2, costUsd: 1.8 },
      { id: 'c-2', stockId: 'stk-5', name: 'iPhone 14 Zırh Kılıf', price: 350, quantity: 1, costUsd: 3.2 }
    ],
    subtotal: 650,
    discountRate: 0,
    discountAmount: 0,
    total: 650,
    paymentMethod: 'nakit',
    customerName: 'Caner Bey',
    customerPhone: '0533 111 22 33',
    cashierName: 'Osman Usta',
    timestamp: '2026-09-09 08:47'
  }
];

export const initialPhoneTrades: PhoneTradeRecord[] = [
  {
    id: 'ptr-1',
    tradeType: 'alim',
    deviceBrand: 'Apple',
    deviceModel: 'iPhone 12 (128GB) Mavi',
    imei: '354890123847581',
    imeiMasked: '354890********1',
    isNew: false,
    sellerName: 'Mehmet Kara',
    sellerPhone: '0542 987 65 43',
    sellerIdLast4: '8492',
    batteryHealth: 87,
    conditionGrade: 'A',
    inspectionNotes: {
      screen: 'Orijinal, kılcal çiziksiz',
      body: 'Kasada noktasal 1 adet boya atması harici kusursuz',
      battery: 'Orijinal %87',
      cameras: 'Kameralar ve 0.5x geniş açı sorunsuz',
      buttons: 'Tüm tuşlar ve sessize alma tıkırında',
      biometrics: 'Face ID aktif ve çok hızlı'
    },
    photos: [
      'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500&auto=format&fit=crop&q=60'
    ],
    purchasePrice: 16500,
    targetSalePrice: 19800,
    paymentMethod: 'nakit',
    legalDeclarationConfirmed: true,
    status: 'stokta',
    stockCode: 'TEL-2026-003',
    createdAt: '2026-09-09 08:21'
  }
];

export const initialCustomers: CustomerAccount[] = [
  {
    id: 'cus-1',
    name: 'Kemal Akın (Toptan İletişim)',
    phone: '0532 999 44 22',
    totalDebt: 3400,
    installments: [
      {
        id: 'ins-1',
        dueDate: '2026-09-05', // GECİKEN CARİ UYARISI!
        amount: 1700,
        paidAmount: 0,
        isPaid: false,
        description: 'Ekran toptan alımı 1. Taksit (Gecikmiş)'
      },
      {
        id: 'ins-2',
        dueDate: '2026-09-25',
        amount: 1700,
        paidAmount: 0,
        isPaid: false,
        description: 'Ekran toptan alımı 2. Taksit'
      }
    ],
    notes: 'Kefilsiz açık hesap. Düzenli öder, hatırlatma WhatsApp iletisi gönderilecek.'
  }
];

export const initialCashMovements: CashMovement[] = [
  {
    id: 'cm-1',
    type: 'gelir_satis',
    amount: 650,
    method: 'nakit',
    category: 'Aksesuar Satışı',
    description: 'SAL-2026-014 No satış nakit',
    user: 'Osman Usta',
    timestamp: '2026-09-09 08:47'
  },
  {
    id: 'cm-2',
    type: 'cihaz_alimi',
    amount: 16500,
    method: 'nakit',
    category: 'Telefon Alımı',
    description: 'iPhone 12 alımı Mehmet Kara',
    user: 'Osman Usta',
    timestamp: '2026-09-09 08:21'
  }
];

export const initialAiLogs: AiActionLog[] = [
  {
    id: 'ai-1',
    timestamp: '2026-09-09 09:38',
    user: 'Osman Usta',
    prompt: 'Bu Excel dosyasındaki ürünleri stok önizlemesine hazırla',
    actionType: 'stok_guncelleme',
    status: 'onaylandi',
    correlationId: 'c8b7f2aa-1d3e-4f6c-9a7b-5e3d9b1a2c4f',
    previewData: { count: 3, stockIncrease: 24, totalValue: 8500 }
  },
  {
    id: 'ai-2',
    timestamp: '2026-09-09 09:28',
    user: 'Osman Usta',
    prompt: 'Type-C kabloyu 250 TL\'den sepete ekle',
    actionType: 'satis_sepeti',
    status: 'onay_bekliyor',
    correlationId: '31d9a6f7-2b11-4d5a-a2c1-7b2e9d4f6a11',
    previewData: { itemName: 'Type-C Kablo', price: 250, qty: 1 }
  }
];
