import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { auth, googleProvider, signInWithPopup, signOut, db } from '../firebase';
import {
  ServiceRecord,
  StockItem,
  StockMovement,
  SaleRecord,
  AppSettings,
  CustomerAccount,
  PhoneTradeRecord,
  CashMovement,
  DayEndReport,
  AiActionLog
} from '../types';

export interface CloudSyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
  itemCount?: {
    services: number;
    stock: number;
    sales: number;
    customers: number;
    phoneTrades: number;
    stockMovements: number;
    cashMovements: number;
    dayEndReports: number;
    aiLogs: number;
  };
}

export interface CloudDataPayload {
  services: ServiceRecord[];
  stock: StockItem[];
  sales: SaleRecord[];
  customers: CustomerAccount[];
  phoneTrades: PhoneTradeRecord[];
  stockMovements: StockMovement[];
  cashMovements: CashMovement[];
  dayEndReports: DayEndReport[];
  aiLogs: AiActionLog[];
  settings?: AppSettings;
}

// 1. Google ile Giriş Yap - Otomatik yönetici rolü kaldırıldı, mevcut rol korunur, varsayılan 'teknisyen'
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    let assignedRole = 'teknisyen';

    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const existingData = userSnap.data();
        if (existingData && existingData.role) {
          // Mevcut Firestore rolü korunur
          assignedRole = existingData.role;
        }
      }
    } catch (readErr) {
      console.warn('[Firebase] Mevcut kullanıcı rolü okunamadı, varsayılan teknisyen atanıyor:', readErr);
    }

    // Kullanıcı profilini güncelle (mevcut rol korunur veya ilk girişte teknisyen)
    await setDoc(userDocRef, {
      uid: user.uid,
      displayName: user.displayName || 'İsimsiz Kullanıcı',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: assignedRole,
      lastLogin: serverTimestamp()
    }, { merge: true });

    return { success: true, user, role: assignedRole };
  } catch (error: any) {
    console.error('Firebase Google Login hatası:', error);
    return { success: false, error: error.message || 'Giriş yapılamadı' };
  }
}

// Çıkış Yap
export async function logoutFirebase() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Genişletilmiş Bulut Senkronizasyonu - Tüm tabloları Firestore'a Gönder (Push)
export async function pushAllToCloud(data: CloudDataPayload): Promise<CloudSyncResult> {
  try {
    // 1. Ayarları kaydet
    if (data.settings) {
      await setDoc(doc(db, 'settings', 'config'), {
        ...data.settings,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    }

    // 2. Servis kayıtları
    if (data.services && data.services.length > 0) {
      for (const srv of data.services) {
        await setDoc(doc(db, 'services', srv.id), srv, { merge: true });
      }
    }

    // 3. Stok kayıtları
    if (data.stock && data.stock.length > 0) {
      for (const item of data.stock) {
        await setDoc(doc(db, 'stock', item.id), item, { merge: true });
      }
    }

    // 4. Satış kayıtları
    if (data.sales && data.sales.length > 0) {
      for (const sale of data.sales) {
        await setDoc(doc(db, 'sales', sale.id), sale, { merge: true });
      }
    }

    // 5. Cari müşteriler
    if (data.customers && data.customers.length > 0) {
      for (const customer of data.customers) {
        await setDoc(doc(db, 'customers', customer.id), customer, { merge: true });
      }
    }

    // 6. Telefon alım-satım kayıtları
    if (data.phoneTrades && data.phoneTrades.length > 0) {
      for (const trade of data.phoneTrades) {
        await setDoc(doc(db, 'phoneTrades', trade.id), trade, { merge: true });
      }
    }

    // 7. Stok hareketleri
    if (data.stockMovements && data.stockMovements.length > 0) {
      for (const mov of data.stockMovements) {
        await setDoc(doc(db, 'stockMovements', mov.id), mov, { merge: true });
      }
    }

    // 8. Kasa hareketleri
    if (data.cashMovements && data.cashMovements.length > 0) {
      for (const cm of data.cashMovements) {
        await setDoc(doc(db, 'cashMovements', cm.id), cm, { merge: true });
      }
    }

    // 9. Gün sonu raporları
    if (data.dayEndReports && data.dayEndReports.length > 0) {
      for (const report of data.dayEndReports) {
        await setDoc(doc(db, 'dayEndReports', report.id), report, { merge: true });
      }
    }

    // 10. AI işlem logları
    if (data.aiLogs && data.aiLogs.length > 0) {
      for (const log of data.aiLogs) {
        await setDoc(doc(db, 'aiLogs', log.id), log, { merge: true });
      }
    }

    const servicesCount = data.services?.length || 0;
    const stockCount = data.stock?.length || 0;
    const salesCount = data.sales?.length || 0;
    const customersCount = data.customers?.length || 0;
    const phoneTradesCount = data.phoneTrades?.length || 0;
    const stockMovementsCount = data.stockMovements?.length || 0;
    const cashMovementsCount = data.cashMovements?.length || 0;
    const dayEndReportsCount = data.dayEndReports?.length || 0;
    const aiLogsCount = data.aiLogs?.length || 0;

    return {
      success: true,
      message: `Tüm veriler buluta başarıyla eşitlendi! (${servicesCount} servis, ${stockCount} stok, ${salesCount} satış, ${customersCount} cari, ${phoneTradesCount} telefon, ${cashMovementsCount} kasa)`,
      timestamp: new Date().toLocaleTimeString('tr-TR'),
      itemCount: {
        services: servicesCount,
        stock: stockCount,
        sales: salesCount,
        customers: customersCount,
        phoneTrades: phoneTradesCount,
        stockMovements: stockMovementsCount,
        cashMovements: cashMovementsCount,
        dayEndReports: dayEndReportsCount,
        aiLogs: aiLogsCount
      }
    };
  } catch (error: any) {
    console.error('Cloud push error:', error);
    return {
      success: false,
      message: 'Buluta veri yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata')
    };
  }
}

// 3. Genişletilmiş Buluttan Verileri Çek (Pull) - Tüm tablolar
export async function pullAllFromCloud(): Promise<{
  success: boolean;
  message: string;
  data?: CloudDataPayload;
}> {
  try {
    // 1. Ayarlar
    let settings: AppSettings | undefined = undefined;
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'config'));
      if (settingsSnap.exists()) {
        settings = settingsSnap.data() as AppSettings;
      }
    } catch (e) {
      console.warn('Settings pull warning:', e);
    }

    // 2. Servisler
    const srvSnap = await getDocs(collection(db, 'services'));
    const services: ServiceRecord[] = [];
    srvSnap.forEach(d => services.push(d.data() as ServiceRecord));

    // 3. Stok
    const stockSnap = await getDocs(collection(db, 'stock'));
    const stock: StockItem[] = [];
    stockSnap.forEach(d => stock.push(d.data() as StockItem));

    // 4. Satışlar
    const saleSnap = await getDocs(collection(db, 'sales'));
    const sales: SaleRecord[] = [];
    saleSnap.forEach(d => sales.push(d.data() as SaleRecord));

    // 5. Cari Müşteriler
    const custSnap = await getDocs(collection(db, 'customers'));
    const customers: CustomerAccount[] = [];
    custSnap.forEach(d => customers.push(d.data() as CustomerAccount));

    // 6. Telefon Alım Satım
    const ptSnap = await getDocs(collection(db, 'phoneTrades'));
    const phoneTrades: PhoneTradeRecord[] = [];
    ptSnap.forEach(d => phoneTrades.push(d.data() as PhoneTradeRecord));

    // 7. Stok Hareketleri
    const smSnap = await getDocs(collection(db, 'stockMovements'));
    const stockMovements: StockMovement[] = [];
    smSnap.forEach(d => stockMovements.push(d.data() as StockMovement));

    // 8. Kasa Hareketleri
    const cmSnap = await getDocs(collection(db, 'cashMovements'));
    const cashMovements: CashMovement[] = [];
    cmSnap.forEach(d => cashMovements.push(d.data() as CashMovement));

    // 9. Gün Sonu Raporları
    const derSnap = await getDocs(collection(db, 'dayEndReports'));
    const dayEndReports: DayEndReport[] = [];
    derSnap.forEach(d => dayEndReports.push(d.data() as DayEndReport));

    // 10. AI Logları
    const aiSnap = await getDocs(collection(db, 'aiLogs'));
    const aiLogs: AiActionLog[] = [];
    aiSnap.forEach(d => aiLogs.push(d.data() as AiActionLog));

    return {
      success: true,
      message: `Buluttan başarıyla çekildi: ${services.length} servis, ${stock.length} stok, ${sales.length} satış, ${customers.length} cari, ${phoneTrades.length} telefon, ${cashMovements.length} kasa kaydı.`,
      data: {
        services,
        stock,
        sales,
        customers,
        phoneTrades,
        stockMovements,
        cashMovements,
        dayEndReports,
        aiLogs,
        settings
      }
    };
  } catch (error: any) {
    console.error('Cloud pull error:', error);
    return {
      success: false,
      message: 'Buluttan veri çekilirken hata: ' + (error.message || 'Bilinmeyen hata')
    };
  }
}
