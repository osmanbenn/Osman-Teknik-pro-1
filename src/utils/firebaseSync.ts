import { doc, getDocFromServer } from 'firebase/firestore';
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

const VALID_ROLES = ['admin', 'yonetici', 'teknisyen', 'cirak'] as const;

// Canlı projede kullanıcı profilleri yalnız Admin SDK üzerinden oluşturulur.
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDocFromServer(userDocRef);
    if (!userSnap.exists()) {
      throw new Error('Bu hesap için yetkili kullanıcı profili bulunamadı. Yöneticiye başvurun.');
    }
    const storedRole = userSnap.data().role;
    if (!VALID_ROLES.includes(storedRole)) {
      throw new Error('Kullanıcı rolü geçersiz. Yöneticiye başvurun.');
    }

    return { success: true, user, role: storedRole === 'admin' ? 'yonetici' : storedRole };
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



// Canlı koleksiyon şeması yerel demo şemasıyla farklıdır. Sessizce boş veriyle
// yerel kayıtları değiştirmemek için geri yüklemeyi migrasyona kadar engelle.
export async function pullAllFromCloud(): Promise<{
  success: boolean;
  message: string;
  data?: CloudDataPayload;
}> {
  return {
    success: false,
    message: 'Canlı Firestore koleksiyonları yerel veri şemasıyla eşleşmiyor. Veri taşıma planı tamamlanana kadar buluttan geri yükleme kapalı.'
  };
}
