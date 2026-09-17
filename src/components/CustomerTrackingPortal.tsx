import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Smartphone,
  ShieldCheck,
  Phone,
  MessageCircle,
  HelpCircle,
  AlertCircle,
  Package,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServiceRecord, ServiceStage } from '../types';
import { generateSvgQrCode } from '../utils/security';

interface CustomerTrackingPortalProps {
  initialServiceNo?: string;
  onClose?: () => void;
}

const STAGES: { id: ServiceStage; title: string; desc: string; icon: any }[] = [
  { id: 'kabul', title: 'Servise Alındı', desc: 'Cihazınız teslim alındı ve kayıt açıldı.', icon: Package },
  { id: 'ariza_tespiti', title: 'Arıza Teşhisi', desc: 'Teknisyenimiz arıza tespiti ve testleri yapıyor.', icon: Search },
  { id: 'onarimda', title: 'Onarım Aşamasında', desc: 'Orijinal yedek parça montajı ve lehimleme yapılıyor.', icon: Wrench },
  { id: 'hazir', title: 'Teslime Hazır', desc: 'Testler tamamlandı! Cihazınızı mağazamızdan teslim alabilirsiniz.', icon: CheckCircle2 },
  { id: 'teslim_edildi', title: 'Teslim Edildi', desc: 'Cihaz teslim edildi. 90 gün garanti kapsamındadır.', icon: ShieldCheck }
];

export const CustomerTrackingPortal: React.FC<CustomerTrackingPortalProps> = ({
  initialServiceNo = '',
  onClose
}) => {
  const { services, settings } = useApp();
  const [searchQuery, setSearchQuery] = useState(initialServiceNo);
  const [searchedRecord, setSearchedRecord] = useState<ServiceRecord | null>(() => {
    if (initialServiceNo) {
      return services.find(s => s.serviceNo.toLowerCase() === initialServiceNo.toLowerCase() || s.qrToken === initialServiceNo) || null;
    }
    return services[0] || null;
  });
  const [hasSearched, setHasSearched] = useState(Boolean(initialServiceNo));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const cleanQuery = query.replace(/\D/g, '');

    const found = services.find(s =>
      s.serviceNo.toLowerCase() === query ||
      s.qrToken.toLowerCase() === query ||
      (cleanQuery.length >= 7 && s.customerPhone.replace(/\D/g, '').includes(cleanQuery)) ||
      (cleanQuery.length >= 8 && s.imei.includes(cleanQuery))
    );

    setSearchedRecord(found || null);
    setHasSearched(true);
  };

  const currentStageIndex = searchedRecord
    ? STAGES.findIndex(s => s.id === searchedRecord.stage)
    : -1;

  const handleWhatsAppInquiry = () => {
    if (!searchedRecord) return;
    const cleanPhone = settings.phone.replace(/\D/g, '');
    const text = `Merhaba ${settings.firmName},\n\n*${searchedRecord.serviceNo}* takip numaralı *${searchedRecord.deviceBrand} ${searchedRecord.deviceModel}* cihazımın onarım durumu hakkında bilgi almak istiyorum. Teşekkürler.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div id="customer-tracking-portal" className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-5 rounded-3xl shadow-xl text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-3">
          <ShieldCheck size={14} /> Resmi Canlı Servis Takip Portalı
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          CİHAZ DURUMU SORGULAMA
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          Fişinizin üzerindeki Servis No (örn: SRV-2026-001), telefon numaranız veya QR kod ile anlık durumu sorgulayın.
        </p>

        {/* Arama Formu */}
        <form onSubmit={handleSearch} className="mt-5 max-w-lg mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-zinc-500"><Search size={18} /></span>
            <input
              type="text"
              placeholder="Servis No, Telefon veya IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-orange-500 text-white rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-hidden font-mono tracking-wide"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-orange-600/30 shrink-0 cursor-pointer"
          >
            Sorgula
          </button>
        </form>

        {/* Hızlı Örnek Arama Kısayolları */}
        {services.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-[11px] text-zinc-400">
            <span>Örnek Servisler:</span>
            {services.slice(0, 3).map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSearchQuery(s.serviceNo);
                  setSearchedRecord(s);
                  setHasSearched(true);
                }}
                className="underline hover:text-orange-400 font-mono transition-colors"
              >
                {s.serviceNo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Arama Sonucu Bulunamadı */}
      {hasSearched && !searchedRecord && (
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center">
          <AlertCircle size={40} className="mx-auto text-amber-500 mb-2" />
          <h3 className="text-base font-bold text-white">Kayıt Bulunamadı</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Girdiğiniz bilgilere ait aktif veya tamamlanmış bir servis kaydı bulunamadı. Lütfen servis fişinizdeki numarayı kontrol ediniz.
          </p>
        </div>
      )}

      {/* Cihaz Durum Kartı */}
      {searchedRecord && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          {/* Cihaz Özet Kartı */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
                <Smartphone size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">
                    {searchedRecord.deviceBrand} {searchedRecord.deviceModel}
                  </h3>
                  <span className="text-[10px] font-mono bg-zinc-950 text-orange-400 px-2 py-0.5 rounded-md border border-zinc-800 font-bold">
                    {searchedRecord.serviceNo}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  IMEI / Seri: <span className="font-mono text-zinc-300">{searchedRecord.imeiMasked}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Güncel Aşama</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl inline-block mt-0.5 ${
                  searchedRecord.stage === 'hazir'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : searchedRecord.stage === 'onarimda'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : searchedRecord.stage === 'teslim_edildi'
                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {searchedRecord.stage === 'hazir' ? '🎉 TESLİME HAZIR' : searchedRecord.stage.toUpperCase().replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* 5 Aşamalı Canlı Timeline */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-orange-400" /> Onarım & Süreç Zaman Çizelgesi
            </h3>

            <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-zinc-800 ml-3">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage.id} className="relative group">
                    {/* Yuvarlak Nokta / İkon */}
                    <div
                      className={`absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-orange-600 text-white ring-4 ring-orange-500/30 shadow-lg shadow-orange-600/40 scale-110'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                    </div>

                    <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs sm:text-sm font-bold ${isCurrent ? 'text-orange-400' : isPassed ? 'text-white' : 'text-zinc-500'}`}>
                          {stage.title}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 animate-pulse">
                            ŞU ANKİ DURUM
                          </span>
                        )}
                        {isPassed && (
                          <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Tamamlandı
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Finansal & Garanti Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Ödeme ve Tahsilat Durumu</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Toplam Onarım Tutarı:</span>
                  <span className="font-bold text-white font-mono">₺{searchedRecord.finalPrice || searchedRecord.estimatedPrice}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Ödenen Ön Avans:</span>
                  <span className="font-bold text-emerald-400 font-mono">₺{searchedRecord.paidAmount || 0}</span>
                </div>
                <div className="border-t border-zinc-800 pt-2 flex justify-between font-bold text-sm">
                  <span className="text-white">Kalan Ödenecek Bakiye:</span>
                  <span className="text-orange-400 font-mono">
                    ₺{Math.max(0, (searchedRecord.finalPrice || searchedRecord.estimatedPrice) - (searchedRecord.paidAmount || 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Garanti Güvencesi
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Yapılan tüm donanım onarımları ve değişen yedek parçalar <strong>{searchedRecord.warrantyDays || 90} Gün</strong> süreyle Osman Teknik Pro garantisi altındadır.
              </p>
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span>Teslim Edilen Aksesuar:</span>
                <span className="font-semibold text-white">
                  {searchedRecord.accessoriesReceived.join(', ') || 'Yok'}
                </span>
              </div>
            </div>
          </div>

          {/* Dükkana WhatsApp ile Sorma */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageCircle size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Sorunuz mu var?</h4>
                <p className="text-[11px] text-emerald-300/80">Teknisyenimizle WhatsApp üzerinden anında görüşün.</p>
              </div>
            </div>

            <button
              onClick={handleWhatsAppInquiry}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MessageCircle size={15} /> WhatsApp ile Bilgi Al
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
