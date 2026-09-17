import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Printer,
  DollarSign,
  Building,
  Palette,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  Volume2,
  Percent,
  Clock,
  QrCode,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Send,
  HelpCircle,
  Copy,
  Check,
  Database,
  Trash2,
  Cloud,
  CloudUpload,
  CloudDownload
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode, AppSettings } from '../types';
import { pushAllToCloud, pullAllFromCloud, loginWithGoogle } from '../utils/firebaseSync';

type SettingsTab = 'genel' | 'fis' | 'servis' | 'finans' | 'whatsapp' | 'guvenlik' | 'yedek';

export const Ayarlar: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettingsToDefault,
    restoreBackupData,
    playBeep,
    storageStats,
    clearNonEssentialCache,
    services,
    stock,
    sales,
    phoneTrades,
    customers,
    cashMovements,
    stockMovements,
    dayEndReports,
    aiLogs,
    currentUser,
    setCurrentUser
  } = useApp();
  const { theme, setTheme, themeLabels } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('genel');

  // Form State - initialized from settings
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGoogleLoginInSettings = async () => {
    setIsCloudLoading(true);
    setCloudStatus('Google ile giriş yapılıyor...');
    const res = await loginWithGoogle();
    setIsCloudLoading(false);
    if (res.success && res.user) {
      const userRole = res.role || 'teknisyen';
      setCurrentUser({
        ...currentUser,
        id: res.user.uid,
        name: res.user.displayName || currentUser.name,
        email: res.user.email || currentUser.email,
        role: userRole as any,
        avatar: res.user.photoURL || currentUser.avatar
      });
      setCloudStatus(`Google hesabı bağlandı: ${res.user.email} (Rol: ${userRole.toUpperCase()})`);
    } else {
      setCloudStatus(`Giriş hatası: ${res.error}`);
    }
    setTimeout(() => setCloudStatus(null), 6000);
  };

  const handleCloudPush = async () => {
    setIsCloudLoading(true);
    setCloudStatus('Tüm veritabanı (servis, stok, hareketler, raporlar) buluta aktarılıyor...');
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
      settings: formData
    });
    setIsCloudLoading(false);
    setCloudStatus(res.message);
    setTimeout(() => setCloudStatus(null), 5000);
  };

  const handleCloudPull = async () => {
    if (!window.confirm('Buluttan veriler çekilecek. Mevcut yerel veriler güncellensin mi?')) return;
    setIsCloudLoading(true);
    setCloudStatus('Buluttan veriler indiriliyor...');
    const res = await pullAllFromCloud();
    setIsCloudLoading(false);
    setCloudStatus(res.message);
    if (res.success && res.data) {
      restoreBackupData(res.data);
    }
    setTimeout(() => setCloudStatus(null), 5000);
  };

  const handleClearCache = () => {
    clearNonEssentialCache();
    setCacheMessage('Geçici günlükler ve rapor önbelleği başarıyla temizlendi.');
    setTimeout(() => setCacheMessage(null), 4000);
  };

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTestBeep = () => {
    playBeep();
  };

  // Yedek İndirme
  const handleExportBackup = () => {
    const fullBackup = {
      timestamp: new Date().toISOString(),
      firm: formData.firmName,
      version: '2.5',
      settings: formData,
      services,
      stock,
      sales,
      phoneTrades,
      customers,
      cashMovements,
      stockMovements,
      dayEndReports,
      aiLogs
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osman_teknik_pro_yedek_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Yedek Yükleme (Restore)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const success = restoreBackupData(parsed);
        if (success) {
          if (parsed.settings) {
            setFormData({ ...formData, ...parsed.settings });
          }
          setRestoreMessage({
            type: 'success',
            text: 'Yedek başarıyla geri yüklendi! Tüm verileriniz güncellendi.'
          });
        } else {
          setRestoreMessage({
            type: 'error',
            text: 'Dosya biçimi geçersiz veya bozuk yedek dosyası.'
          });
        }
      } catch (err) {
        setRestoreMessage({
          type: 'error',
          text: 'JSON dosyası okunamadı. Lütfen geçerli bir yedek dosyası seçin.'
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Varsayılanlara Sıfırla
  const handleResetDefaults = () => {
    if (window.confirm('Tüm ayarları fabrika varsayılanlarına döndürmek istediğinize emin misiniz? (Kayıtlı servis ve stok verileriniz silinmez)')) {
      resetSettingsToDefault();
      setIsSaved(true);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const copyTemplateTag = (tag: string) => {
    navigator.clipboard?.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  return (
    <div id="settings-module" className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Başlık ve Durum */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-3xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <SettingsIcon className="text-orange-500" size={26} />
            Sistem, Donanım & Servis Ayarları
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Firma bilgileri, 58/80 mm termal yazıcı, WhatsApp şablonları, garanti politikaları, döviz kurları ve personel yetkileri
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Tüm veritabanını JSON olarak indir"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Hızlı Yedek Al</span>
          </button>
        </div>
      </div>

      {/* Navigasyon Sekmeleri */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-800/80 scrollbar-none">
        {[
          { id: 'genel', label: 'Firma & İletişim', icon: Building },
          { id: 'fis', label: 'Termal Fiş & Yazıcı', icon: Printer },
          { id: 'servis', label: 'Teknik Servis & Garanti', icon: ShieldCheck },
          { id: 'finans', label: 'Finans, POS & Kurlar', icon: DollarSign },
          { id: 'whatsapp', label: 'WhatsApp & SMS Şablonları', icon: MessageSquare },
          { id: 'guvenlik', label: 'Güvenlik & Donanım Sesi', icon: Lock },
          { id: 'yedek', label: 'Yedekleme & Sıfırlama', icon: Download }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================== */}
        {/* SEKME 1: FİRMA & İLETİŞİM BİLGİLERİ */}
        {/* ========================================================== */}
        {activeTab === 'genel' && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl space-y-5 animate-in fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building size={18} className="text-orange-400" />
                Firma, Şube ve İletişim Bilgileri
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bu bilgiler termal fiş başlıklarında, müşteri takip portalında ve yasal belgelerde kullanılır.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Firma Ticari Unvanı *</label>
                <input
                  type="text"
                  required
                  value={formData.firmName}
                  onChange={(e) => handleChange('firmName', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-bold focus:border-orange-500 focus:outline-hidden"
                  placeholder="Örn: OSMAN TEKNİK İLETİŞİM"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Şube Adı</label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => handleChange('branchName', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white focus:border-orange-500 focus:outline-hidden"
                  placeholder="Örn: Kadıköy Rıhtım Şubesi"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Dükkan / Sabit Telefon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono focus:border-orange-500 focus:outline-hidden"
                  placeholder="Örn: 0850 123 45 67"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">WhatsApp Müşteri Destek Hattı</label>
                <input
                  type="text"
                  value={formData.whatsappPhone || ''}
                  onChange={(e) => handleChange('whatsappPhone', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono focus:border-orange-500 focus:outline-hidden"
                  placeholder="Örn: 0532 123 45 67"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Müşterilerinize tek tıkla mesaj atarken veya fişte basılırken kullanılır.</p>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Vergi Dairesi</label>
                <input
                  type="text"
                  value={formData.taxOffice}
                  onChange={(e) => handleChange('taxOffice', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white focus:border-orange-500 focus:outline-hidden"
                  placeholder="Örn: Kadıköy V.D."
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Vergi Numarası / TCKN</label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => handleChange('taxNumber', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono focus:border-orange-500 focus:outline-hidden"
                  placeholder="Örn: 6480192345"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-semibold block mb-1">Dükkan Açık Adresi</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white focus:border-orange-500 focus:outline-hidden"
                  placeholder="Örn: Osmanağa Mah. Rıhtım Cad. No: 42/B Kadıköy / İstanbul"
                />
              </div>

              {/* Banka Havale / EFT Bilgileri */}
              <div className="sm:col-span-2 pt-3 border-t border-zinc-800">
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CreditCard size={14} /> Fişte Basılacak Banka & IBAN Bilgisi (Havale İçin)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1 text-[11px]">Banka Hesap Sahibi / Unvan</label>
                    <input
                      type="text"
                      value={formData.bankAccountName || ''}
                      onChange={(e) => handleChange('bankAccountName', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white text-xs"
                      placeholder="Örn: Osman Teknik Ltd. Şti."
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1 text-[11px]">IBAN Numarası</label>
                    <input
                      type="text"
                      value={formData.bankIban || ''}
                      onChange={(e) => handleChange('bankIban', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-mono text-xs"
                      placeholder="Örn: TR56 0006 2000 0001 2345 6789 01"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Doldurulduğunda termal fiş altında müşteri havalesi için basılır.</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SEKME 2: TERMAL FİŞ & YAZICI TASARIMI */}
        {/* ========================================================== */}
        {activeTab === 'fis' && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl space-y-5 animate-in fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Printer size={18} className="text-orange-400" />
                Termal POS Yazıcı ve Fiş Metin Formatı
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                58 mm / 80 mm rulo genişliği, fiş başlığı, QR kod basımı ve yasal garanti koşulları
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Kağıt Genişliği */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5">Termal Yazıcı Kağıt Genişliği:</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => handleChange('printerSize', '58mm')}
                    className={`p-3.5 rounded-2xl border font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formData.printerSize === '58mm'
                        ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-md'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">58 mm Rulo</span>
                    <span className="text-[10px] text-zinc-400">Küçük Masaüstü / Bluetooth POS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('printerSize', '80mm')}
                    className={`p-3.5 rounded-2xl border font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formData.printerSize === '80mm'
                        ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-md'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">80 mm Rulo</span>
                    <span className="text-[10px] text-zinc-400">Standart Geniş Termal POS</span>
                  </button>
                </div>
              </div>

              {/* Fiş Seçenekleri Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.printQrCode}
                    onChange={(e) => handleChange('printQrCode', e.target.checked)}
                    className="w-4 h-4 rounded-sm bg-zinc-900 border-zinc-600 text-orange-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-white block">Fişte Canlı Takip QR Kodu Bas</span>
                    <span className="text-[10px] text-zinc-400">Müşteri kamerasıyla okutup canlı cihaz durumunu sorgulayabilir</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.customerCopyEnabled}
                    onChange={(e) => handleChange('customerCopyEnabled', e.target.checked)}
                    className="w-4 h-4 rounded-sm bg-zinc-900 border-zinc-600 text-orange-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-white block">İki Nüsha (Müşteri + Arşiv)</span>
                    <span className="text-[10px] text-zinc-400">Yazdırırken servis nüshası ve müşteri nüshası seçeneği sunar</span>
                  </div>
                </label>
              </div>

              {/* Fiş Başlık Metni */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Fiş Üst Başlık Metni</label>
                <input
                  type="text"
                  value={formData.receiptHeaderTitle || ''}
                  onChange={(e) => handleChange('receiptHeaderTitle', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  placeholder="Örn: TEKNİK SERVİS & HIZLI SATIŞ FİŞİ"
                />
              </div>

              {/* Fiş Altı Yasal Şartlar & Sorumluluk Metni */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1 flex items-center justify-between">
                  <span>Fiş Alt Bilgi & Yasal Sorumluluk Şartları:</span>
                  <span className="text-[10px] text-zinc-500">Her satır fiş altında ayrı madde basılır</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.receiptFooterLegalText || ''}
                  onChange={(e) => handleChange('receiptFooterLegalText', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white font-mono text-xs leading-relaxed focus:border-orange-500 focus:outline-hidden"
                  placeholder="• 90 gün içinde teslim alınmayan cihazlardan firmamız sorumlu değildir..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SEKME 3: TEKNİK SERVİS & GARANTİ POLİTİKASI */}
        {/* ========================================================== */}
        {activeTab === 'servis' && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl space-y-5 animate-in fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-orange-400" />
                Teknik Servis Kuralları & Garanti Politikası
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Varsayılan onarım garantisi, arıza tespit ücreti, teslimat süresi ve IMEI kuralları
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Standart Garanti Süresi */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Standart Onarım / Parça Garanti Süresi (Gün) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="730"
                    value={formData.defaultWarrantyDays}
                    onChange={(e) => handleChange('defaultWarrantyDays', parseInt(e.target.value) || 0)}
                    className="w-28 bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {[30, 60, 90, 180, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleChange('defaultWarrantyDays', d)}
                        className={`px-2.5 py-1.5 rounded-lg font-mono text-xs cursor-pointer border ${
                          formData.defaultWarrantyDays === d
                            ? 'bg-orange-600 text-white border-orange-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {d} Gün
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Servis teslim fişine otomatik basılır.</p>
              </div>

              {/* Garanti İçi / RMA Tekrar Eden Arıza Eşiği */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Tekrar Eden Arıza (RMA) Alarm Eşiği (Gün)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.rmaAlertThresholdDays || 90}
                    onChange={(e) => handleChange('rmaAlertThresholdDays', parseInt(e.target.value) || 90)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Aynı IMEI/müşteri bu gün içinde tekrar geldiğinde sistem "Garanti İçi İade" uyarısı verir.
                </p>
              </div>

              {/* Standart Arıza Tespit Ücreti */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Standart Arıza Tespit Bedeli (₺)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">₺</span>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={formData.inspectionFee || 150}
                    onChange={(e) => handleChange('inspectionFee', parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2.5 text-white font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Müşteri tamiri onaylamadığında veya iade aldığında talep edilecek kontrol bedeli.
                </p>
              </div>

              {/* Tahmini Teslim Süresi (Saat) */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Varsayılan Tahmini Onarım Süresi (Saat)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={formData.defaultDeliveryHours || 24}
                    onChange={(e) => handleChange('defaultDeliveryHours', parseInt(e.target.value) || 24)}
                    className="w-28 bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono font-bold"
                  />
                  <div className="flex gap-1.5">
                    {[2, 24, 48, 72].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleChange('defaultDeliveryHours', h)}
                        className={`px-2.5 py-1.5 rounded-lg font-mono text-xs cursor-pointer border ${
                          formData.defaultDeliveryHours === h
                            ? 'bg-orange-600 text-white border-orange-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {h}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>


              {/* IMEI Zorunluluğu */}
              <div className="flex items-center">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 cursor-pointer select-none w-full">
                  <input
                    type="checkbox"
                    checked={formData.requireImeiOnService}
                    onChange={(e) => handleChange('requireImeiOnService', e.target.checked)}
                    className="w-4 h-4 rounded-sm bg-zinc-900 border-zinc-600 text-orange-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-white block">Servis Kabulünde IMEI Zorunlu</span>
                    <span className="text-[10px] text-zinc-400">İşaretlendiğinde IMEI yazılmadan servis fişi oluşturulamaz</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SEKME 4: FİNANS, POS & DÖVİZ KURLARI */}
        {/* ========================================================== */}
        {activeTab === 'finans' && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl space-y-5 animate-in fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign size={18} className="text-orange-400" />
                Döviz Kurları, POS Komisyonu ve Kasa Politikası
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                USD/TL parça maliyeti çarpanı, POS banka kesinti oranı ve gün sonu kapanış saati
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* USD Kuru */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  USD / TL Satış & Maliyet Kuru ($ 1 = ₺) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">$ 1 = ₺</span>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    value={formData.usdExchangeRate}
                    onChange={(e) => handleChange('usdExchangeRate', parseFloat(e.target.value) || 1)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-18 pr-3 py-2.5 text-white font-mono font-bold text-sm"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[34.25, 34.50, 34.75, 35.00].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleChange('usdExchangeRate', r)}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700"
                    >
                      ₺{r.toFixed(2)}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Yedek parça stok maliyetleri bu kur üzerinden TL'ye çevrilir.</p>
              </div>

              {/* POS Komisyon Oranı */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Kredi Kartı POS Banka Kesinti Oranı (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">%</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={formData.posCommissionRate || 2.75}
                    onChange={(e) => handleChange('posCommissionRate', parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2.5 text-white font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  POS ile yapılan satışlarda net kâr ve banka maliyet analizinde kullanılır.
                </p>
              </div>

              {/* Personel Max İskonto */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Personel / Çırak Azami İskonto Limiti (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.maxDiscountRateForStaff || 10}
                    onChange={(e) => handleChange('maxDiscountRateForStaff', parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2.5 text-white font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Çırak ve teknisyenlerin yetkisiz yüksek indirim uygulamasını sınırlar.
                </p>
              </div>

              {/* Gün Sonu Z Raporu Saati */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Gün Sonu Kasa Kapanış & Z Raporu Saati
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="time"
                    value={formData.dayEndReminderTime || '20:30'}
                    onChange={(e) => handleChange('dayEndReminderTime', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-3 py-2.5 text-white font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Dükkan kapanışında kasa sayımı hatırlatması için kullanılır.</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SEKME 5: WHATSAPP & SMS BİLDİRİM ŞABLONLARI */}
        {/* ========================================================== */}
        {activeTab === 'whatsapp' && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl space-y-5 animate-in fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-400" />
                Otomatik WhatsApp & SMS Bildirim Şablonları
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Müşterinize tek dokunuşla göndereceğiniz mesaj metinlerini özelleştirin.
              </p>
            </div>

            {/* Dinamik Değişken Etiketleri Paleti */}
            <div className="bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-700/60 space-y-2">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                Kullanabileceğiniz Dinamik Değişkenler (Tıklayarak Kopyala):
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { tag: '{MUSTERI}', desc: 'Müşteri Adı' },
                  { tag: '{CIHAZ}', desc: 'Cihaz Modeli' },
                  { tag: '{SERVIS_NO}', desc: 'Fiş No' },
                  { tag: '{TUTAR}', desc: 'Fiyat (TL)' },
                  { tag: '{TAKIP_LINKI}', desc: 'Canlı Takip Linki' },
                  { tag: '{TELEFON}', desc: 'Dükkan Numarası' },
                  { tag: '{FIRMA}', desc: 'Firma Adınız' }
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => copyTemplateTag(item.tag)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-500 font-mono text-emerald-400 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>{item.tag}</span>
                    <span className="text-[10px] text-zinc-400">({item.desc})</span>
                    {copiedTag === item.tag ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Şablon 1: Servis Kabul */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  1. Servis Kabul Bildirimi (Cihaz Teslim Alındığında Gönderilen):
                </label>
                <textarea
                  rows={2}
                  value={formData.whatsappTemplateServiceIntake}
                  onChange={(e) => handleChange('whatsappTemplateServiceIntake', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white font-mono text-xs leading-relaxed focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Şablon 2: Cihaz Hazır */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  2. Cihaz Hazır Bildirimi (Onarım Tamamlandığında Gönderilen):
                </label>
                <textarea
                  rows={2}
                  value={formData.whatsappTemplateServiceReady}
                  onChange={(e) => handleChange('whatsappTemplateServiceReady', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white font-mono text-xs leading-relaxed focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Şablon 3: Fiyat Onayı */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  3. Arıza Tespiti & Fiyat Onay Talebi:
                </label>
                <textarea
                  rows={2}
                  value={formData.whatsappTemplatePriceApproval}
                  onChange={(e) => handleChange('whatsappTemplatePriceApproval', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white font-mono text-xs leading-relaxed focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Şablon 4: Bakiye Hatırlatma */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  4. Veresiye & Bakiye Hatırlatma Mesajı:
                </label>
                <textarea
                  rows={2}
                  value={formData.whatsappTemplateDebtReminder}
                  onChange={(e) => handleChange('whatsappTemplateDebtReminder', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white font-mono text-xs leading-relaxed focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SEKME 6: GÜVENLİK, PERSONEL & DONANIM SESLERİ */}
        {/* ========================================================== */}
        {activeTab === 'guvenlik' && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl space-y-5 animate-in fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-orange-400" />
                Personel Yetkileri, Güvenlik ve Donanım Sesleri
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Barkod ses efektleri, çırak yetkilendirmesi ve tema tercihleri
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Donanım Sesi & Barkod Bip */}
              <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Volume2 size={20} />
                  </div>
                  <div>
                    <span className="font-semibold text-white block text-sm">Barkod Okuma Ses Efekti (Bip Sesi)</span>
                    <span className="text-zinc-400 text-xs">
                      Barkod okutulduğunda hoparlörden gerçek fiziksel POS cihazı onay sesi çalar.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestBeep}
                    className="px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    🔊 Sesi Test Et
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.barcodeBeepSound}
                      onChange={(e) => handleChange('barcodeBeepSound', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>

              {/* Personel İzinleri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.allowApprenticeCancelSale}
                    onChange={(e) => handleChange('allowApprenticeCancelSale', e.target.checked)}
                    className="w-4 h-4 rounded-sm bg-zinc-900 border-zinc-600 text-orange-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-white block">Çırak Satış İptal Edebilsin</span>
                    <span className="text-[10px] text-zinc-400">
                      Kapalıyken yalnızca "Yönetici" rolündeki kullanıcılar satışı iptal edip stoğa iade yapabilir.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.allowApprenticeViewCostUsd}
                    onChange={(e) => handleChange('allowApprenticeViewCostUsd', e.target.checked)}
                    className="w-4 h-4 rounded-sm bg-zinc-900 border-zinc-600 text-orange-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-white block">Çırak USD Alış Maliyetini Görsün</span>
                    <span className="text-[10px] text-zinc-400">
                      Kapalıyken parça alış maliyeti gizlenir, sadece satış fiyatı gösterilir.
                    </span>
                  </div>
                </label>
              </div>

              {/* Arayüz Teması */}
              <div className="pt-3 border-t border-zinc-800">
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Palette size={15} /> Arayüz Tasarımı & Tema Tercihi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(themeLabels) as ThemeMode[]).filter(k => k !== 'theme-comparison').map((tKey) => (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setTheme(tKey)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        theme === tKey
                          ? 'bg-orange-600/20 border-orange-500 text-white'
                          : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs">{themeLabels[tKey].name}</span>
                        {theme === tKey && <CheckCircle2 size={16} className="text-orange-500" />}
                      </div>
                      <p className="text-[10px] text-zinc-500">{themeLabels[tKey].desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SEKME 7: YEDEKLEME & SIFIRLAMA */}
        {/* ========================================================== */}
        {activeTab === 'yedek' && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl space-y-5 animate-in fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Download size={18} className="text-emerald-400" />
                Veritabanı Yedekleme, Geri Yükleme & Fabrika Ayarları
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dükkanınızın tüm servis, stok, satış ve cari kayıtlarını JSON olarak yedekleyin veya başka bilgisayara aktarın.
              </p>
            </div>

            {restoreMessage && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                  restoreMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {restoreMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{restoreMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Yedek İndir Kartı */}
              <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Download size={16} className="text-emerald-400" />
                    Tam Veritabanı Yedeği İndir
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {services.length} Servis Kaydı, {stock.length} Stok Kalemi, {sales.length} Satış ve {customers.length} Cari Müşteri verisi tek bir JSON dosyasına arşivlenir.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download size={15} />
                  <span>Yedek Dosyası İndir (.JSON)</span>
                </button>
              </div>

              {/* Yedek Yükle Kartı */}
              <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Upload size={16} className="text-blue-400" />
                    Yedekten Geri Yükle (Restore)
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Daha önce indirdiğiniz bir `.json` yedek dosyasını seçerek tüm sistem verilerini tek tıkla geri getirebilirsiniz.
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload size={15} />
                    <span>Yedek Dosyası Seç (.JSON)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Firebase Bulut Depolama & Çoklu Cihaz Senkronizasyonu */}
            <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cloud size={18} className="text-orange-400" />
                  <span className="font-bold text-white text-sm">Firebase Bulut Veritabanı & Senkronizasyon</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Firestore Aktif
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLoginInSettings}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google Hesabı Bağla</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                Atölye kayıtlarınızı, yedek parça stoklarını ve kasa hareketlerini bulutta güvenle depolayın. Bilgisayar, tablet ve telefonlarınız arasında anında eşitleyin.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloudPush}
                  disabled={isCloudLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CloudUpload size={14} />
                  <span>Tüm Verileri Buluta Yedekle</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloudPull}
                  disabled={isCloudLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CloudDownload size={14} />
                  <span>Buluttaki Verileri İndir / Eşitle</span>
                </button>
              </div>

              {cloudStatus && (
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-orange-300 font-medium">
                  {cloudStatus}
                </div>
              )}
            </div>

            {/* Tarayıcı Depolama & Kota Yönetimi (QuotaExceeded Koruyucu) */}
            <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-amber-400" />
                  <span className="font-bold text-white text-sm">Tarayıcı Depolama Durumu & Kota</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Aktif & Korumalı
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Kullanılan Alan: <span className="text-zinc-200 font-mono font-bold">{storageStats.formattedSize}</span> (Tarayıcı limiti ~5 MB).
                  Sistem otomatik olarak görselleri optimize eder ve kota aşımı hatalarını önler.
                </p>
                {cacheMessage && (
                  <p className="text-[11px] text-emerald-400 font-medium mt-1 animate-in fade-in">
                    ✓ {cacheMessage}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearCache}
                className="px-3.5 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 border border-zinc-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 size={13} className="text-zinc-400" />
                <span>Geçici Günlükleri Temizle</span>
              </button>
            </div>

            {/* Fabrika Ayarlarına Sıfırla */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30">
              <div>
                <span className="font-bold text-red-400 block text-xs">Ayarları Fabrika Varsayılanlarına Döndür</span>
                <span className="text-[11px] text-zinc-400">
                  Fiş metinleri, kurlar ve yazıcı ayarları orijinal fabrika değerlerine geri alınır.
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw size={13} />
                <span>Varsayılanlara Sıfırla</span>
              </button>
            </div>
          </div>
        )}

        {/* Kaydet ve Durum Butonu */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl animate-in fade-in">
              <CheckCircle2 size={16} />
              Tüm ayarlar başarıyla kaydedildi!
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500">
              Değişikliklerin geçerli olması için "Ayarları Kaydet" butonuna tıklayınız.
            </span>
          )}

          <button
            type="submit"
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-xl shadow-orange-600/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>Ayarları Kaydet</span>
          </button>
        </div>
      </form>
    </div>
  );
};
