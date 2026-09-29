import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
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

const VALID_ROLES = ['yonetici', 'teknisyen', 'cirak'] as const;

// Google girişi: mevcut rol sunucudan okunur, yeni hesap yalnız teknisyen olabilir.
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDocFromServer(userDocRef);
    const storedRole = userSnap.exists() ? userSnap.data().role : 'teknisyen';
    if (!VALID_ROLES.includes(storedRole)) {
      throw new Error('Kullanıcı rolü geçersiz. Yöneticiye başvurun.');
    }

    const profile = {
      uid: user.uid,
      displayName: user.displayName || 'İsimsiz Kullanıcı',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastLogin: serverTimestamp()
    };
    if (userSnap.exists()) {
      await setDoc(userDocRef, profile, { merge: true });
    } else {
      await setDoc(userDocRef, { ...profile, role: 'teknisyen' });
    }

    return { success: true, user, role: storedRole };
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
export async function pushAllToCloud(_data: CloudDataPayload): Promise<CloudSyncResult> {
  // Toplu istemci yazımı kısmi aktarım ve mali kayıt değişikliği yaratabilir.
  // Sunucu fonksiyonu ile atomik aktarım tamamlanana kadar veri göndermeyin.
  return {
    success: false,
    message: 'Buluta toplu yükleme güvenli sunucu aktarımı tamamlanana kadar kapalı. Yerel veriler değiştirilmedi.'
  };
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
