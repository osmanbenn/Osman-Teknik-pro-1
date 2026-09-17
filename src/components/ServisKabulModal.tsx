import React, { useState } from 'react';
import {
  X,
  Camera,
  Smartphone,
  Calendar,
  DollarSign,
  User,
  Phone,
  ShieldCheck,
  CheckSquare,
  Lock,
  MessageCircle,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Tag,
  PenTool
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  validateImei,
  maskImei,
  addWatermarkToImage,
  checkImeiWarranty,
  WarrantyCheckResult
} from '../utils/security';
import { PatternLockDrawer } from './PatternLockDrawer';
import { CameraScannerModal } from './CameraScannerModal';
import { SignaturePad } from './SignaturePad';
import { ServicePhoto } from '../types';

interface ServisKabulModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessPrintReceipt?: (record: any) => void;
}

const commonDamageTags = [
  'Ön Cam Çatlak',
  'Dokunmatik Basmıyor',
  'Kasa Ezik / Çizik',
  'Arka Kapak Çatlak',
  'Kamera Lensi Çizik',
  'Sıvı Teması Şüphesi',
  'Şarj Soketi Gevşek',
  'Ahize / Hoparlör Bozuk'
];

export const ServisKabulModal: React.FC<ServisKabulModalProps> = ({
  isOpen,
  onClose,
  onSuccessPrintReceipt
}) => {
  const { addServiceRecord, users, services } = useApp();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('Apple');
  const [deviceModel, setDeviceModel] = useState('');
  const [imei, setImei] = useState('');
  const [patternLock, setPatternLock] = useState<number[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRmaWarrantyClaim, setIsRmaWarrantyClaim] = useState(false);
  const [issueComplaint, setIssueComplaint] = useState('');
  const [cosmeticCondition, setCosmeticCondition] = useState('Kozmetik temiz, ekran orijinal, kılcal çizikler mevcut');
  const [damageTags, setDamageTags] = useState<string[]>([]);
  const [accessories, setAccessories] = useState<string[]>(['Kılıf']);
  const [lockType, setLockType] = useState<'yok' | 'pin' | 'desen' | 'parola'>('pin');
  const [lockCode, setLockCode] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16).replace('T', ' ')
  );
  const [estimatedPrice, setEstimatedPrice] = useState<number | string>(1500);
  const [assignedTechnician, setAssignedTechnician] = useState('Ahmet Teknisyen');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [termsApproved, setTermsApproved] = useState(true);
  const [customerSignature, setCustomerSignature] = useState<string | undefined>(undefined);
  const [photos, setPhotos] = useState<ServicePhoto[]>([]);
  const [isWatermarking, setIsWatermarking] = useState(false);

  // Sesli Form Doldurma (Hands-free AI Intake)
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceParsing, setIsVoiceParsing] = useState(false);
  const [voiceSpeechText, setVoiceSpeechText] = useState('');

  if (!isOpen) return null;

  const imeiValidation = validateImei(imei);
  const availableAccessories = ['Kılıf', 'Şarj Aleti', 'SIM Kart', 'SIM Tepsisi', 'Hafıza Kartı', 'Kutu'];

  const toggleAccessory = (acc: string) => {
    setAccessories(prev =>
      prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc]
    );
  };

  const toggleDamageTag = (tag: string) => {
    setDamageTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Sesle form doldurma tetikleyici
  const handleToggleVoiceFill = () => {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tarayıcınız Web Speech API ses tanıma özelliğini desteklemiyor. Lütfen Chrome, Edge veya Safari kullanınız.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsVoiceListening(true);
      setVoiceSpeechText('Dinleniyor... Lütfen müşteri adı, telefon, model ve arızayı söyleyin.');

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceSpeechText(`Söylenen: "${transcript}"`);
        setIsVoiceListening(false);
        setIsVoiceParsing(true);

        try {
          const res = await fetch('/api/gemini/parse-service-intake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speechText: transcript })
          });
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            if (d.customerName) setCustomerName(d.customerName);
            if (d.customerPhone) setCustomerPhone(d.customerPhone);
            if (d.deviceBrand) setDeviceBrand(d.deviceBrand);
            if (d.deviceModel) setDeviceModel(d.deviceModel);
            if (d.imei && d.imei.length >= 8) setImei(d.imei);
            if (d.issueComplaint) setIssueComplaint(d.issueComplaint);
            if (d.cosmeticCondition) setCosmeticCondition(d.cosmeticCondition);
            if (d.estimatedPrice && d.estimatedPrice > 0) setEstimatedPrice(d.estimatedPrice);
            if (d.lockCode) {
              setLockType('pin');
              setLockCode(d.lockCode);
            }
            if (d.accessories && Array.isArray(d.accessories) && d.accessories.length > 0) {
              setAccessories(prev => Array.from(new Set([...prev, ...d.accessories])));
            }
            if (d.damageTags && Array.isArray(d.damageTags) && d.damageTags.length > 0) {
              setDamageTags(prev => Array.from(new Set([...prev, ...d.damageTags])));
            }
            setVoiceSpeechText(`✓ Form başarıyla dolduruldu: ${d.summary || transcript}`);
          }
        } catch (err) {
          console.error('Voice parse request failed:', err);
          setIssueComplaint(prev => prev ? `${prev} - ${transcript}` : transcript);
        } finally {
          setIsVoiceParsing(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsVoiceListening(false);
        setVoiceSpeechText('Ses algılanamadı, lütfen tekrar deneyin.');
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsVoiceListening(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsWatermarking(true);
    try {
      const file = e.target.files[0];
      const watermarkedDataUrl = await addWatermarkToImage(file, 'OSMAN TEKNİK PRO - GÜVENLİ SERVİS');
      const newPhoto: ServicePhoto = {
        id: `p-${Date.now()}`,
        url: watermarkedDataUrl,
        type: 'kabul',
        uploadedAt: new Date().toLocaleDateString('tr-TR'),
        watermarked: true
      };
      setPhotos(prev => [...prev, newPhoto]);
    } catch (err) {
      console.error('Filigran eklenirken hata oluştu:', err);
    } finally {
      setIsWatermarking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deviceModel) {
      alert('Lütfen Müşteri Adı, Telefonu ve Cihaz Modelini eksiksiz doldurunuz.');
      return;
    }

    if (!termsApproved) {
      alert('Servis şartları onayı zorunludur.');
      return;
    }

    const warrantyCheck = checkImeiWarranty(imei, services);

    const newRecord = addServiceRecord({
      customerName,
      customerPhone,
      deviceBrand,
      deviceModel,
      imei: imei || '000000000000000',
      imeiMasked: maskImei(imei || '000000000000000'),
      issueComplaint: issueComplaint || 'Genel bakım ve kontrol',
      cosmeticCondition,
      damageTags,
      customerSignature,
      accessoriesReceived: accessories,
      lockType,
      lockCode: lockType === 'desen' ? `Desen (${patternLock.join('-')})` : (lockType !== 'yok' ? lockCode : undefined),
      patternLock: lockType === 'desen' && patternLock.length > 0 ? patternLock : undefined,
      isReturnWarranty: isRmaWarrantyClaim,
      parentServiceNo: isRmaWarrantyClaim ? warrantyCheck.priorService?.serviceNo : undefined,
      estimatedDelivery,
      estimatedPrice: Number(estimatedPrice) || 0,
      assignedTechnician,
      whatsappConsent,
      termsApproved,
      stage: 'kabul',
      photos,
      partsUsed: [],
      laborCost: 0,
      finalPrice: Number(estimatedPrice) || 0,
      paymentStatus: 'bekliyor',
      paidAmount: 0,
      warrantyDays: 90
    });

    onClose();
    if (onSuccessPrintReceipt) {
      onSuccessPrintReceipt(newRecord);
    }
  };

  const warrantyCheck: WarrantyCheckResult = checkImeiWarranty(imei, services);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl p-4 sm:p-6 shadow-2xl my-8 animate-in fade-in zoom-in-95">
        {/* Title bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-500">
              <Smartphone size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Yeni Cihaz Servis Kabulü
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-normal">
                  Ekspertiz & İmza
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Giriş kaydı, filigranlı fotoğraflar, sesle doldurma ve dijital müşteri imzası</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* 🎙️ Hands-Free AI Sesli Form Doldurma Butonu ve Barı */}
        <div className="mt-3 p-3 bg-gradient-to-r from-orange-950/40 via-zinc-900 to-amber-950/30 border border-orange-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isVoiceListening ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
              {isVoiceListening ? <Mic size={18} className="animate-bounce" /> : <Sparkles size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span>Hands-Free Sesle Doldur (Yapay Zeka)</span>
                {isVoiceParsing && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400">
                    <Loader2 size={11} className="animate-spin" /> Bilgiler ayrıştırılıyor...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {voiceSpeechText || 'Usta ellerin lehimdeyken mikrofona konuş: "Mehmet Çelik, 0532..., iPhone 11 ekran kırık, tahmini 2500 TL"'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleVoiceFill}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 ${
              isVoiceListening
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-orange-600 hover:bg-orange-500 text-white'
            }`}
          >
            {isVoiceListening ? (
              <>
                <MicOff size={14} />
                <span>Dinlemeyi Durdur</span>
              </>
            ) : (
              <>
                <Mic size={14} />
                <span>Sesle Doldur</span>
              </>
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          {/* Section 1: Customer Info */}
          <div className="bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} /> Müşteri Bilgileri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Müşteri Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Telefon Numarası *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 text-xs"><Phone size={14} /></span>
                  <input
                    type="tel"
                    required
                    placeholder="0532 123 45 67"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Device Info & IMEI */}
          <div className="bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone size={14} /> Cihaz & IMEI Doğrulama
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Marka</label>
                <select
                  value={deviceBrand}
                  onChange={(e) => setDeviceBrand(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Apple">Apple iPhone</option>
                  <option value="Samsung">Samsung Galaxy</option>
                  <option value="Xiaomi">Xiaomi / Redmi</option>
                  <option value="Huawei">Huawei</option>
                  <option value="Oppo">Oppo / Realme</option>
                  <option value="Diğer">Diğer Marka</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-300 block mb-1">Model *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: iPhone 13 128GB Gece Yarısı"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            {/* IMEI with Camera Scanner, Validation, and RMA Warranty Detector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-300">15 Haneli IMEI veya Seri Numarası</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Camera size={12} /> Kamera ile Tara
                  </button>
                  {imei && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      imeiValidation.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {imeiValidation.message}
                    </span>
                  )}
                </div>
              </div>
              <input
                type="text"
                maxLength={15}
                placeholder="Örn: 356891094827153"
                value={imei}
                onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono tracking-widest focus:outline-hidden focus:border-orange-500"
              />

              {/* Garanti ve Tekrarlayan Arıza (RMA) Akıllı Uyarısı */}
              {warrantyCheck.isUnderWarranty && warrantyCheck.priorService && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-300 space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        ⚠️ DİKKAT: CİHAZ GARANTİ KAPSAMINDA (RMA TESPİT EDİLDİ)!
                      </h4>
                      <p className="text-[11px] text-amber-200/90 mt-0.5 leading-tight">
                        Bu cihaz <strong>{warrantyCheck.daysPassed} gün önce</strong> teslim edildi (Servis No: <strong>{warrantyCheck.priorService.serviceNo}</strong>).
                        Kalan garanti: <strong className="text-white underline">{warrantyCheck.daysRemaining} Gün</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRmaWarrantyClaim(true);
                        setEstimatedPrice(0);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isRmaWarrantyClaim
                          ? 'bg-amber-500 text-black shadow-md'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      ✓ Ücretsiz Garanti (RMA) Olarak Al
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRmaWarrantyClaim(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        !isRmaWarrantyClaim
                          ? 'bg-zinc-700 text-white'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Yeni / Ücretli Arıza
                    </button>
                  </div>
                </div>
              )}

              {imei.length >= 8 && (
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-400">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Güvenli Maskelenmiş Fiş Görünümü: <strong className="text-white font-mono">{maskImei(imei)}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Complaint & Cosmetic */}
          <div className="bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Arıza & Kozmetik Durum</h3>
            <div>
              <label className="text-xs text-zinc-300 block mb-1">Müşteri Şikayeti & Arıza Tespiti *</label>
              <textarea
                rows={2}
                required
                placeholder="Örn: Ekran kırık, görüntü gelmiyor, batarya çabuk bitiyor..."
                value={issueComplaint}
                onChange={(e) => setIssueComplaint(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-hidden focus:border-orange-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-300 block mb-1">Kozmetik Durum Notu</label>
              <input
                type="text"
                value={cosmeticCondition}
                onChange={(e) => setCosmeticCondition(e.target.value)}
                placeholder="Kasa kenarlarında ezik var, arka cam sağlam vb."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>

            {/* 🔍 Hızlı Ekspertiz & Hasar Etiketleri */}
            <div>
              <label className="text-xs text-zinc-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Tag size={13} />
                  Fiziksel Hasar & Çizik Ekspertiz Etiketleri:
                </span>
                <span className="text-[10px] text-zinc-500">Çoklu seçilebilir</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {commonDamageTags.map((tag) => {
                  const isTagged = damageTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleDamageTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        isTagged
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-xs'
                          : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {isTagged ? '⚠️ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accessories Chips */}
            <div>
              <label className="text-xs text-zinc-300 block mb-1.5">Teslim Alınan Aksesuarlar</label>
              <div className="flex flex-wrap gap-2">
                {availableAccessories.map((acc) => {
                  const isSelected = accessories.includes(acc);
                  return (
                    <button
                      type="button"
                      key={acc}
                      onClick={() => toggleAccessory(acc)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-orange-600 border-orange-500 text-white shadow-xs'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {acc} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lock code / Pattern Drawer */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-300 block mb-1">Kilit / Şifre Tercihi</label>
                  <select
                    value={lockType}
                    onChange={(e: any) => setLockType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                  >
                    <option value="yok">Kilit Yok / Sıfırlanmış</option>
                    <option value="pin">PIN Kodu</option>
                    <option value="desen">Android 3×3 Desen Çizimi</option>
                    <option value="parola">Alfanümerik Parola</option>
                  </select>
                </div>
                {(lockType === 'pin' || lockType === 'parola') && (
                  <div>
                    <label className="text-xs text-zinc-300 block mb-1 flex items-center justify-between">
                      <span>Kilit Kodu (Servis İçi)</span>
                      <span className="text-[10px] text-zinc-500">WhatsApp'ta gizlenir</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-500"><Lock size={14} /></span>
                      <input
                        type="text"
                        value={lockCode}
                        onChange={(e) => setLockCode(e.target.value)}
                        placeholder="Örn: 2580 veya Parola"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3x3 Desen Kilidi Çizim Alanı */}
              {lockType === 'desen' && (
                <div className="mt-2">
                  <label className="text-xs text-zinc-300 block mb-1 font-semibold">
                    Cihazın Açılış Desenini Çizin:
                  </label>
                  <PatternLockDrawer
                    value={patternLock}
                    onChange={(p) => {
                      setPatternLock(p);
                      setLockCode(`Desen (${p.join('-')})`);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Photo with Osman Teknik Canvas Watermark */}
          <div className="bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera size={14} /> Kabul Fotoğrafları & Osman Teknik Filigranı
              </h3>
              <label className="cursor-pointer bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors">
                <UploadCloud size={14} />
                Fotoğraf Çek / Ekle
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {isWatermarking && (
              <p className="text-xs text-orange-400 animate-pulse">🔒 Osman Teknik Pro filigranı ekleniyor...</p>
            )}

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((ph, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-zinc-700 group">
                    <img src={ph.url} alt="Cihaz Kabul" className="w-full h-24 object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-orange-400 font-bold px-1.5 py-0.5 rounded">
                      Filigranlı
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Henüz fotoğraf eklenmedi. Eklenen fotoğraflara otomatik olarak tarih ve "OSMAN TEKNİK PRO - GÜVENLİ SERVİS" damgası işlenir.</p>
            )}
          </div>

          {/* Section 5: Estimation, Technician, Consents */}
          <div className="bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Tahmini Fiyat (₺)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-xs">₺</span>
                  <input
                    type="number"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-sm text-white font-mono font-bold focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Tahmini Teslim Tarihi</label>
                <input
                  type="text"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Atanan Teknisyen</label>
                <select
                  value={assignedTechnician}
                  onChange={(e) => setAssignedTechnician(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-orange-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="pt-2 border-t border-zinc-700/60 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 bg-zinc-900 border-zinc-700"
                />
                <span className="flex items-center gap-1">
                  <MessageCircle size={14} className="text-emerald-400" />
                  WhatsApp üzerinden durum bildirimi yapılmasına izin verildi
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  required
                  checked={termsApproved}
                  onChange={(e) => setTermsApproved(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 bg-zinc-900 border-zinc-700"
                />
                <span className="flex items-center gap-1">
                  <FileCheck size={14} className="text-orange-400" />
                  Müşteri servis şartlarını ve 90 günlük teslimat kurallarını onayladı
                </span>
              </label>
            </div>
          </div>

          {/* Section 6: Customer Digital Acceptance Signature */}
          <SignaturePad
            value={customerSignature}
            onChange={setCustomerSignature}
            title="Müşteri Cihaz Kabul Onay İmzası (Opsiyonel)"
            subtitle="Cihaz teslim alma şartlarını onaylamak için parmak veya kalemle imzalayınız"
            height={130}
          />

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} />
              Cihaz Kabulünü Kaydet & Fiş Oluştur
            </button>
          </div>
        </form>
      </div>

      {/* Kamera Barkod/IMEI Tarayıcı Modalı */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scanned) => setImei(scanned.replace(/\D/g, ''))}
        title="Kamera ile IMEI veya Seri No Tara"
        expectedType="imei"
      />
    </div>
  );
};
