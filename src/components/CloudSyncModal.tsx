import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertTriangle,
  X,
  User as UserIcon,
  LogOut,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Database
} from 'lucide-react';
import { auth, onAuthStateChanged, User } from '../firebase';
import { loginWithGoogle, logoutFirebase, pushAllToCloud, pullAllFromCloud, CloudSyncResult } from '../utils/firebaseSync';
import { useApp } from '../context/AppContext';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    services,
    stock,
    sales,
    customers,
    phoneTrades,
    stockMovements,
    cashMovements,
    dayEndReports,
    aiLogs,
    settings,
    restoreBackupData,
    currentUser: appUser,
    setCurrentUser: setAppUser
  } = useApp();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const result = await loginWithGoogle();
    setIsLoading(false);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setIsSuccess(true);
      const userRole = result.role || 'teknisyen';
      setAppUser({
        ...appUser,
        id: result.user.uid,
        name: result.user.displayName || appUser.name,
        email: result.user.email || appUser.email,
        role: userRole as any,
        avatar: result.user.photoURL || appUser.avatar
      });
      setStatusMessage(`Hoş geldiniz, ${result.user.displayName || result.user.email}! Rolünüz: ${userRole.toUpperCase()}`);
    } else {
      setIsSuccess(false);
      setStatusMessage(`Giriş başarısız: ${result.error}`);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await logoutFirebase();
    setCurrentUser(null);
    setIsLoading(false);
    setStatusMessage('Oturum kapatıldı.');
  };

  const handlePushToCloud = async () => {
    setIsLoading(true);
    setStatusMessage('Tüm veriler (servis, stok, hareketler, raporlar) Firebase Firestore bulutuna yükleniyor...');
    const res = await pushAllToCloud({
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
    });
    setIsLoading(false);
    setIsSuccess(res.success);
    setStatusMessage(res.message);
  };

  const handlePullFromCloud = async () => {
    if (!window.confirm('Buluttan veriler çekilecek. Yerel veriler güncellensin mi?')) {
      return;
    }
    setIsLoading(true);
    setStatusMessage('Buluttan tüm kayıtlar indiriliyor...');
    const res = await pullAllFromCloud();
    setIsLoading(false);
    setIsSuccess(res.success);
    setStatusMessage(res.message);

    if (res.success && res.data) {
      restoreBackupData(res.data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Cloud size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Firebase Bulut Senkronizasyon</h2>
              <p className="text-[11px] text-zinc-400">Google Kimlik Doğrulama & Firestore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* User Profile Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full border border-orange-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <UserIcon size={20} />
                    </div>
                  )}
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">{currentUser.displayName || 'Google Kullanıcısı'}</p>
                    <p className="text-[11px] text-zinc-400">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/40 text-red-400 border border-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Çıkış</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-2">
                <p className="text-xs text-zinc-300">
                  Verilerinizi bulutta saklamak ve diğer cihazlarla eşitlemek için Google hesabınızla oturum açın.
                </p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google ile Giriş Yap</span>
                </button>
              </div>
            )}
          </div>

          {/* Sync Stats Overview */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Servis</span>
              <p className="text-sm font-black text-white">{services.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Stok</span>
              <p className="text-sm font-black text-white">{stock.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Satış</span>
              <p className="text-sm font-black text-white">{sales.length}</p>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handlePushToCloud}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <CloudUpload size={16} />
              <span>Verileri Buluta Yedekle (Push)</span>
            </button>

            <button
              onClick={handlePullFromCloud}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-700"
            >
              <CloudDownload size={16} />
              <span>Buluttan Verileri Çek (Pull)</span>
            </button>
          </div>

          {/* Status Alert Message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              isSuccess
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
            }`}>
              {isSuccess ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
