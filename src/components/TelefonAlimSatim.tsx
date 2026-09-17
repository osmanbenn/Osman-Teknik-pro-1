import React, { useState } from 'react';
import {
  Smartphone,
  Plus,
  Search,
  CheckCircle2,
  ShieldCheck,
  Battery,
  Camera,
  FileText,
  DollarSign,
  TrendingUp,
  User,
  Phone,
  Printer,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PhoneTradeRecord, PaymentMethod } from '../types';
import { validateImei, maskImei, maskTcKimlik, addWatermarkToImage } from '../utils/security';

export const TelefonAlimSatim: React.FC = () => {
  const { phoneTrades, addPhoneTradeBuy, sellTradedPhone, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'stoktaki' | 'satilanlar'>('stoktaki');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlimModalOpen, setIsAlimModalOpen] = useState(false);
  const [sellModalTrade, setSellModalTrade] = useState<PhoneTradeRecord | null>(null);

  // Satış formu state
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [actualSalePrice, setActualSalePrice] = useState<number>(0);
  const [sellPaymentMethod, setSellPaymentMethod] = useState<PaymentMethod>('nakit');

  // Alım Formu State
  const [deviceBrand, setDeviceBrand] = useState('Apple');
  const [deviceModel, setDeviceModel] = useState('');
  const [imei, setImei] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerIdLast4, setSellerIdLast4] = useState('');
  const [batteryHealth, setBatteryHealth] = useState<number>(88);
  const [conditionGrade, setConditionGrade] = useState<'A' | 'B' | 'C'>('A');
  const [purchasePrice, setPurchasePrice] = useState<number | string>(15000);
  const [targetSalePrice, setTargetSalePrice] = useState<number | string>(18000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('nakit');
  const [legalDeclarationConfirmed, setLegalDeclarationConfirmed] = useState(true);

  // Ekspertiz Notları
  const [screenNote, setScreenNote] = useState('Orijinal, çiziksiz');
  const [bodyNote, setBodyNote] = useState('Temiz, darbesiz');
  const [batteryNote, setBatteryNote] = useState('Orijinal batarya');
  const [camerasNote, setCamerasNote] = useState('Kameralar ve odaklama kusursuz');
  const [buttonsNote, setButtonsNote] = useState('Tüm tuşlar aktif');
  const [biometricsNote, setBiometricsNote] = useState('Face ID / Parmak İzi çalışıyor');

  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const imeiValidation = validateImei(imei);

  const filteredTrades = phoneTrades.filter(t => {
    const matchSearch =
      t.stockCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.imei.includes(searchTerm) ||
      t.sellerName.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'stoktaki') return matchSearch && t.status === 'stokta';
    return matchSearch && t.status === 'satildi';
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingPhoto(true);
    try {
      const file = e.target.files[0];
      const watermarked = await addWatermarkToImage(file, 'OSMAN TEKNİK - TELEFON EKSPERTİZ');
      setPhotos(prev => [...prev, watermarked]);
    } catch (err) {
      console.error('Fotoğraf filigranı hatası:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAlimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceModel || !imei || !sellerName || !sellerPhone || !sellerIdLast4) {
      alert('Lütfen cihaz modelini, IMEI numarasını ve satıcı kimlik bilgilerini eksiksiz giriniz.');
      return;
    }

    if (!legalDeclarationConfirmed) {
      alert('Yasal taahhütname onayı zorunludur.');
      return;
    }

    addPhoneTradeBuy({
      deviceBrand,
      deviceModel,
      imei,
      imeiMasked: maskImei(imei),
      isNew,
      sellerName,
      sellerPhone,
      sellerIdLast4,
      batteryHealth: isNew ? 100 : Number(batteryHealth) || 85,
      conditionGrade,
      inspectionNotes: {
        screen: screenNote,
        body: bodyNote,
        battery: batteryNote,
        cameras: camerasNote,
        buttons: buttonsNote,
        biometrics: biometricsNote
      },
      photos,
      purchasePrice: Number(purchasePrice) || 0,
      targetSalePrice: Number(targetSalePrice) || 0,
      paymentMethod,
      legalDeclarationConfirmed
    });

    setIsAlimModalOpen(false);
    // Formu sıfırla
    setDeviceModel('');
    setImei('');
    setSellerName('');
    setSellerPhone('');
    setSellerIdLast4('');
    setPhotos([]);
  };

  const handleOpenSellModal = (trade: PhoneTradeRecord) => {
    setSellModalTrade(trade);
    setActualSalePrice(trade.targetSalePrice);
    setBuyerName('');
    setBuyerPhone('');
  };

  const handleConfirmSale = () => {
    if (!sellModalTrade || !buyerName || !buyerPhone || !actualSalePrice) {
      alert('Lütfen alıcı adı, telefon ve satış tutarını giriniz.');
      return;
    }

    const ok = sellTradedPhone(
      sellModalTrade.id,
      actualSalePrice,
      buyerName,
      buyerPhone,
      sellPaymentMethod
    );

    if (ok) {
      setSellModalTrade(null);
    }
  };

  return (
    <div id="phone-trade-module" className="space-y-5 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Smartphone className="text-orange-500" size={24} />
            Telefon Alım & Satım Yönetimi
          </h1>
          <p className="text-xs text-zinc-400">
            2. El & Sıfır cihaz ekspertizi, yasal sözleşme, kâr hesabı ve otomatik stok entegrasyonu
          </p>
        </div>

        <button
          onClick={() => setIsAlimModalOpen(true)}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Yeni Telefon Alımı Yap (Ekspertiz)
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('stoktaki')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stoktaki'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Vitrin & Stoktaki Cihazlar ({phoneTrades.filter(t => t.status === 'stokta').length})
          </button>
          <button
            onClick={() => setActiveTab('satilanlar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'satilanlar'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Satılan Cihazlar & Kâr Raporu ({phoneTrades.filter(t => t.status === 'satildi').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Model, Kod, IMEI veya Satıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Phone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrades.map((item) => {
          const isSold = item.status === 'satildi';
          return (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                    {item.stockCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                      {item.isNew ? 'Sıfır Kutu' : `2. El (${item.conditionGrade} Kalite)`}
                    </span>
                    {isSold ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                        Satıldı
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        Stokta
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-sm text-white">{item.deviceBrand} {item.deviceModel}</h3>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    IMEI: {item.imeiMasked}
                  </p>
                </div>

                {/* Specs / Condition preview */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Battery size={14} className="text-emerald-400" />
                    <span>Pil: <strong>%{item.batteryHealth}</strong></span>
                  </div>
                  <div className="text-zinc-300">
                    Kasa: <strong className="text-orange-400">{item.conditionGrade} Sınıf</strong>
                  </div>
                  <div className="col-span-2 text-[11px] text-zinc-400 truncate">
                    Ekran: {item.inspectionNotes.screen}
                  </div>
                </div>

                {/* Seller info */}
                <div className="mt-2.5 text-[11px] text-zinc-400">
                  <span>Alınan Kişi: <strong className="text-zinc-300">{item.sellerName}</strong> (T.C. ...{item.sellerIdLast4})</span>
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Alış Fiyatı:</span>
                    <span className="font-mono font-bold text-xs text-zinc-300">₺{item.purchasePrice}</span>
                  </div>

                  {!isSold ? (
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Hedef Satış:</span>
                      <span className="font-mono font-bold text-sm text-emerald-400">₺{item.targetSalePrice}</span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Net Kâr:</span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        +₺{item.profit || (item.actualSalePrice! - item.purchasePrice)}
                      </span>
                    </div>
                  )}
                </div>

                {!isSold ? (
                  <button
                    onClick={() => handleOpenSellModal(item)}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    Cihazı Satışa Çıkar / Sat
                  </button>
                ) : (
                  <div className="p-2 rounded-xl bg-zinc-800 text-center text-xs text-zinc-400">
                    Alıcı: <strong className="text-zinc-200">{item.buyerName}</strong> ({item.soldAt})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTrades.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-xs">
          Kayıtlı telefon bulunamadı.
        </div>
      )}

      {/* CİHAZ ALIM MODALI (EKSPERTİZ FORMU) */}
      {isAlimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl p-5 shadow-2xl my-8 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Smartphone className="text-orange-500" size={20} />
                <h2 className="font-bold text-white text-base">2. El / Sıfır Cihaz Alımı & Ekspertiz</h2>
              </div>
              <button onClick={() => setIsAlimModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAlimSubmit} className="mt-4 space-y-4 text-xs">
              {/* Cihaz Temel */}
              <div className="bg-zinc-800/60 p-3 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-orange-400 uppercase tracking-wider">Cihaz Bilgileri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-300 block mb-1">Marka</label>
                    <select
                      value={deviceBrand}
                      onChange={(e) => setDeviceBrand(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white"
                    >
                      <option value="Apple">Apple iPhone</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Xiaomi">Xiaomi</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-zinc-300 block mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: iPhone 13 128GB Gece Yarısı"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-zinc-300">15 Haneli IMEI *</label>
                    {imei && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${imeiValidation.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {imeiValidation.message}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="354890123847581"
                    value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white font-mono tracking-wider"
                  />
                </div>
              </div>

              {/* Satıcı Kimlik Bilgileri */}
              <div className="bg-zinc-800/60 p-3 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-orange-400 uppercase tracking-wider">Satıcı Bilgileri & Yasal Kimlik</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-300 block mb-1">Satıcı Adı Soyadı *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Mehmet Kara"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-300 block mb-1">Telefon Numarası *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0542 987 65 43"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-300 block mb-1">T.C. Son 4 Hanesi *</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="8492"
                      value={sellerIdLast4}
                      onChange={(e) => setSellerIdLast4(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white font-mono tracking-widest text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Ekspertiz & Kondisyon */}
              <div className="bg-zinc-800/60 p-3 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-orange-400 uppercase tracking-wider">Ekspertiz Kontrol Listesi</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-300 block mb-1">Pil Sağlığı (%)</label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={batteryHealth}
                      onChange={(e) => setBatteryHealth(parseInt(e.target.value) || 85)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-300 block mb-1">Kozmetik Derece</label>
                    <select
                      value={conditionGrade}
                      onChange={(e: any) => setConditionGrade(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white font-bold"
                    >
                      <option value="A">A Sınıfı (Kusursuz / Sıfır Ayarı)</option>
                      <option value="B">B Sınıfı (Hafif Kılcal Çizikler)</option>
                      <option value="C">C Sınıfı (Kasa Ezikleri / Aşınmış)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-300 block mb-1">Durum</label>
                    <select
                      value={isNew ? 'yeni' : 'ikinci_el'}
                      onChange={(e) => setIsNew(e.target.value === 'yeni')}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white font-bold"
                    >
                      <option value="ikinci_el">2. El Kullanılmış</option>
                      <option value="yeni">Sıfır Kapalı Kutu</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Ekran Durumu (Orijinal / Çiziksiz)"
                    value={screenNote}
                    onChange={(e) => setScreenNote(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Kasa Durumu"
                    value={bodyNote}
                    onChange={(e) => setBodyNote(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Kamera & Odak"
                    value={camerasNote}
                    onChange={(e) => setCamerasNote(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Face ID / Biyometrik"
                    value={biometricsNote}
                    onChange={(e) => setBiometricsNote(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-[11px]"
                  />
                </div>
              </div>

              {/* Fiyatlandırma & Kasa Çıkışı */}
              <div className="bg-zinc-800/60 p-3 rounded-2xl border border-zinc-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-300 block mb-1 font-bold">Alış Fiyatı (Kasadan Düşer) ₺ *</label>
                    <input
                      type="number"
                      required
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-white font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-300 block mb-1 font-bold">Hedef Satış Fiyatı ₺ *</label>
                    <input
                      type="number"
                      required
                      value={targetSalePrice}
                      onChange={(e) => setTargetSalePrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-emerald-400 font-mono font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-700/60">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      required
                      checked={legalDeclarationConfirmed}
                      onChange={(e) => setLegalDeclarationConfirmed(e.target.checked)}
                      className="rounded text-orange-600 bg-zinc-900 border-zinc-700"
                    />
                    <span className="text-[11px]">
                      Satıcı, cihazın çalıntı, hacizli veya taksit borçlu olmadığını ve mülkiyetin kendisine ait olduğunu beyan ve taahhüt etmiştir.
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAlimModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30"
                >
                  Alımı Kaydet & Stoğa Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CİHAZ SATIŞ DIALOG */}
      {sellModalTrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Cihaz Satış Onayı</h3>
            <p className="text-xs text-zinc-400 mb-4">
              {sellModalTrade.stockCode} - {sellModalTrade.deviceModel} (Maliyet: ₺{sellModalTrade.purchasePrice})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1">Alıcı Müşteri Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ayşe Kaya"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Alıcı Telefon Numarası *</label>
                <input
                  type="tel"
                  required
                  placeholder="0532 999 88 77"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Satış Fiyatı (₺) *</label>
                <input
                  type="number"
                  value={actualSalePrice}
                  onChange={(e) => setActualSalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold text-base"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs flex justify-between">
                <span className="text-zinc-300">Hesaplanan Net Kâr:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₺{actualSalePrice - sellModalTrade.purchasePrice}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSellModalTrade(null)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmSale}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
              >
                Satışı Onayla & Kasaya Giriş Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
