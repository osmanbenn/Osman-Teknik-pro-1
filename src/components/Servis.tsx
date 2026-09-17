import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  MessageCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Eye,
  ArrowRight,
  History,
  Lock,
  UserCheck,
  Award,
  QrCode,
  Camera,
  Tag,
  ShieldAlert,
  FileSignature
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ServiceRecord, ServiceStage } from '../types';
import { ServisKabulModal } from './ServisKabulModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { PatternMiniature } from './PatternLockDrawer';
import { CameraScannerModal } from './CameraScannerModal';
import { TechnicianPerformanceModal } from './TechnicianPerformanceModal';
import { CustomerTrackingPortal } from './CustomerTrackingPortal';
import { SignaturePad } from './SignaturePad';
import { createSafeWhatsAppMessage } from '../utils/security';

const stageBadgeConfig: Record<ServiceStage, { label: string; color: string; border: string; bg: string }> = {
  kabul: { label: 'Kabul Edildi', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  ariza_tespiti: { label: 'Arıza Tespiti', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  onarimda: { label: 'Onarımda', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  hazir: { label: 'Teslime Hazır', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  teslim_edildi: { label: 'Teslim Edildi', color: 'text-zinc-400', border: 'border-zinc-600', bg: 'bg-zinc-800' }
};

export const Servis: React.FC = () => {
  const {
    services,
    updateServiceStage,
    addPartToService,
    completeServiceDelivery,
    stock,
    currentUser,
    settings
  } = useApp();
  const { theme } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [isKabulModalOpen, setIsKabulModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null);
  const [receiptRecord, setReceiptRecord] = useState<ServiceRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Geliştirme Özellik Modalları
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isTrackingPortalOpen, setIsTrackingPortalOpen] = useState(false);

  // Parça Ekleme Dialog state
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partPrice, setPartPrice] = useState<number>(0);
  const [partWarrantyDays, setPartWarrantyDays] = useState<number>(90);

  // Teslimat Dialog state
  const [isDeliverOpen, setIsDeliverOpen] = useState(false);
  const [deliveredToName, setDeliveredToName] = useState('');
  const [deliveryPaymentStatus, setDeliveryPaymentStatus] = useState<'odendi' | 'veresiye'>('odendi');
  const [deliveryPaidAmount, setDeliveryPaidAmount] = useState<number>(0);
  const [deliverySignature, setDeliverySignature] = useState<string | undefined>(undefined);

  type WhatsAppMessageType = 'kabul' | 'fiyat_onayi' | 'parca_bekliyor' | 'hazir' | 'teslim';

  // WhatsApp Onay Dialog state
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    type: WhatsAppMessageType;
    phone: string;
    text: string;
    isOpened: boolean;
    service: ServiceRecord;
  } | null>(null);

  // Filtreleme
  const filteredServices = services.filter((srv) => {
    const matchSearch =
      srv.serviceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.customerPhone.includes(searchTerm) ||
      srv.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.imei.includes(searchTerm);

    if (selectedStageFilter === 'all') return matchSearch;
    return matchSearch && srv.stage === selectedStageFilter;
  });

  const handleOpenKabul = () => {
    setIsKabulModalOpen(true);
  };

  const handleStageChange = (serviceId: string, targetStage: ServiceStage) => {
    const success = updateServiceStage(serviceId, targetStage);
    if (success && selectedService && selectedService.id === serviceId) {
      const updated = services.find(s => s.id === serviceId);
      if (updated) setSelectedService(updated);
    }
  };

  const handleOpenAddPart = (srv: ServiceRecord) => {
    setSelectedService(srv);
    if (stock.length > 0) {
      setSelectedStockId(stock[0].id);
      setPartPrice(stock[0].salePriceTl);
      setPartWarrantyDays(90);
    }
    setIsAddPartOpen(true);
  };

  const handleConfirmAddPart = () => {
    if (!selectedService || !selectedStockId) return;
    const ok = addPartToService(selectedService.id, selectedStockId, partQty, partPrice, partWarrantyDays);
    if (ok) {
      setIsAddPartOpen(false);
      setPartQty(1);
      // Güncel kaydı aç
      const updated = services.find(s => s.id === selectedService.id);
      if (updated) setSelectedService(updated);
    }
  };

  const handleOpenDeliver = (srv: ServiceRecord) => {
    setSelectedService(srv);
    setDeliveredToName(srv.customerName);
    setDeliveryPaidAmount(srv.finalPrice);
    setDeliverySignature(undefined);
    setIsDeliverOpen(true);
  };

  const handleConfirmDeliver = () => {
    if (!selectedService || !deliveredToName) return;
    const ok = completeServiceDelivery(selectedService.id, deliveredToName, deliveryPaymentStatus, deliveryPaidAmount, deliverySignature);
    if (ok) {
      setIsDeliverOpen(false);
      const updated = services.find(s => s.id === selectedService.id);
      if (updated) setSelectedService(updated);
    }
  };

  const generateWhatsAppText = (srv: ServiceRecord, type: WhatsAppMessageType) => {
    return createSafeWhatsAppMessage(type, {
      customerName: srv.customerName,
      serviceNo: srv.serviceNo,
      deviceModel: srv.deviceModel,
      totalAmount: srv.finalPrice,
      token: srv.qrToken,
      firmName: settings.firmName,
      firmPhone: settings.phone,
      warrantyDays: srv.warrantyDays || 90
    });
  };

  const handleSendWhatsApp = (srv: ServiceRecord, type: WhatsAppMessageType = 'kabul') => {
    const message = generateWhatsAppText(srv, type);

    setWhatsAppModalData({
      isOpen: true,
      type,
      phone: srv.customerPhone.replace(/\D/g, ''),
      text: message,
      isOpened: false,
      service: srv
    });
  };

  const handleSwitchWhatsAppType = (newType: WhatsAppMessageType) => {
    if (!whatsAppModalData) return;
    const newText = generateWhatsAppText(whatsAppModalData.service, newType);
    setWhatsAppModalData({
      ...whatsAppModalData,
      type: newType,
      text: newText
    });
  };

  const executeWhatsAppOpen = () => {
    if (!whatsAppModalData) return;
    const cleanPhone = whatsAppModalData.phone.startsWith('90')
      ? whatsAppModalData.phone
      : whatsAppModalData.phone.startsWith('0')
      ? '9' + whatsAppModalData.phone
      : '90' + whatsAppModalData.phone;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsAppModalData.text)}`;
    window.open(url, '_blank');
    setWhatsAppModalData(prev => prev ? { ...prev, isOpened: true } : null);
  };

  return (
    <div id="servis-module" className="space-y-5 pb-8 w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Wrench className="text-orange-500" size={24} />
            Teknik Servis İş Akışı
          </h1>
          <p className="text-xs text-zinc-400">5 Aşamalı kontrollü servis süreci, parça düşümü ve güvenli müşteri takibi</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsTechModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Teknisyen Performans ve Cihaz Tamir Sayıları (Alt+P)"
          >
            <Award size={16} />
            <span className="hidden sm:inline">Teknisyen Performans</span>
            <kbd className="hidden md:inline px-1 py-0.2 rounded text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-700 font-mono">Alt+P</kbd>
          </button>
          <button
            onClick={() => setIsTrackingPortalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Müşteri QR Durum Sorgulama Portalı (Alt+Q)"
          >
            <QrCode size={16} />
            <span className="hidden sm:inline">Müşteri Takip</span>
            <kbd className="hidden md:inline px-1 py-0.2 rounded text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-700 font-mono">Alt+Q</kbd>
          </button>
          <button
            id="btn-yeni-servis-kabul"
            onClick={handleOpenKabul}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            title="Yeni Cihaz Servis Kabulü (F2)"
          >
            <Plus size={18} />
            <span>Yeni Servis Kabulü (Fiş Kes)</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/25 text-white border border-white/20 text-xs font-mono font-black">F2</kbd>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80 flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Servis No, Müşteri, Tel, IMEI veya Model ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-orange-500 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-orange-400 hover:text-orange-300 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Kamera ile Barkod veya IMEI Okutarak Ara"
          >
            <Camera size={16} />
          </button>
        </div>

        {/* Stage Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'kabul', label: 'Kabul' },
            { key: 'ariza_tespiti', label: 'Arıza Tespiti' },
            { key: 'onarimda', label: 'Onarımda' },
            { key: 'hazir', label: 'Hazır' },
            { key: 'teslim_edildi', label: 'Teslim' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedStageFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStageFilter === item.key
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Service List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((srv) => {
          const badge = stageBadgeConfig[srv.stage];
          return (
            <div
              key={srv.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md group"
            >
              <div>
                {/* Header line */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-mono font-bold text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                    {srv.serviceNo}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.color} ${badge.border}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Device & Customer */}
                <div className="mt-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Smartphone size={16} className="text-zinc-400" />
                    {srv.deviceBrand} {srv.deviceModel}
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1 font-medium">
                    {srv.customerName} <span className="text-zinc-500 font-mono">({srv.customerPhone})</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    IMEI: {srv.imeiMasked}
                  </p>
                </div>

                {/* Complaint */}
                <div className="mt-2.5 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs">
                  <p className="text-zinc-400 line-clamp-2">{srv.issueComplaint}</p>
                </div>

                {/* Ekspertiz Hasar Etiketleri */}
                {srv.damageTags && srv.damageTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {srv.damageTags.map((dt) => (
                      <span key={dt} className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Tag size={10} /> {dt}
                      </span>
                    ))}
                  </div>
                )}

                {/* Parts Used Summary & Signatures */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 flex-wrap gap-1">
                  {srv.partsUsed.length > 0 ? (
                    <div className="flex items-center gap-1 text-orange-400">
                      <Package size={13} />
                      <span>{srv.partsUsed.length} Parça takıldı</span>
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-[10px]">Parça takılmadı</span>
                  )}

                  {(srv.customerSignature || srv.deliverySignature) && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                      <FileSignature size={11} /> İmzalı
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions & Price */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Tutar:</span>
                    <span className="font-mono font-black text-sm text-emerald-400">₺{srv.finalPrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">Teknisyen:</span>
                    <span className="text-xs font-semibold text-zinc-300">{srv.assignedTechnician}</span>
                  </div>
                </div>

                {/* Button Cluster */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => setSelectedService(srv)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    title="İşlem Detayları & Geçmiş"
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">Detay</span>
                  </button>

                  <button
                    onClick={() => {
                      setReceiptRecord(srv);
                      setIsReceiptModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    title="Termal Fiş Yazdır"
                  >
                    <Printer size={14} className="text-orange-400" />
                    <span className="hidden sm:inline">Fiş</span>
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(srv, srv.stage === 'hazir' ? 'hazir' : 'kabul')}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-emerald-950/60 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    title="Güvenli WhatsApp Bildirimi"
                  >
                    <MessageCircle size={14} />
                    <span className="hidden sm:inline">WA</span>
                  </button>

                  {/* Stage Advance Button */}
                  {srv.stage === 'kabul' && (
                    <button
                      onClick={() => handleStageChange(srv.id, 'ariza_tespiti')}
                      className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1"
                      title="Arıza Tespitine Al"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                  {srv.stage === 'ariza_tespiti' && (
                    <button
                      onClick={() => handleStageChange(srv.id, 'onarimda')}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1"
                      title="Onarıma Başla"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                  {srv.stage === 'onarimda' && (
                    <button
                      onClick={() => handleStageChange(srv.id, 'hazir')}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1"
                      title="Hazır Bildir"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                  {srv.stage === 'hazir' && (
                    <button
                      onClick={() => handleOpenDeliver(srv)}
                      className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1"
                      title="Müşteriye Teslim Et"
                    >
                      <UserCheck size={14} />
                    </button>
                  )}
                  {srv.stage === 'teslim_edildi' && (
                    <div className="p-2 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center justify-center">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
          <p className="text-sm">Aranan kriterlere uygun servis kaydı bulunamadı.</p>
        </div>
      )}

      {/* DETAY MODALI */}
      {selectedService && !isAddPartOpen && !isDeliverOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl p-5 shadow-2xl my-8 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg">
                  {selectedService.serviceNo}
                </span>
                <h2 className="font-bold text-white text-base">
                  {selectedService.deviceBrand} {selectedService.deviceModel}
                </h2>
              </div>
              <button onClick={() => setSelectedService(null)} className="p-1 text-zinc-400 hover:text-white rounded-lg">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Stage Progress Tracker */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <p className="text-[11px] font-bold text-zinc-400 mb-2">İş Akışı Aşamaları</p>
                <div className="flex items-center justify-between gap-1">
                  {(['kabul', 'ariza_tespiti', 'onarimda', 'hazir', 'teslim_edildi'] as ServiceStage[]).map((st, idx) => {
                    const isPassed = ['kabul', 'ariza_tespiti', 'onarimda', 'hazir', 'teslim_edildi'].indexOf(selectedService.stage) >= idx;
                    const isCurrent = selectedService.stage === st;
                    return (
                      <div key={st} className="flex-1 text-center">
                        <div className={`h-2 rounded-full mb-1.5 transition-all ${
                          isCurrent ? 'bg-orange-500 animate-pulse' : isPassed ? 'bg-emerald-500' : 'bg-zinc-800'
                        }`} />
                        <span className={`text-[9px] font-bold block ${isCurrent ? 'text-orange-400' : isPassed ? 'text-zinc-300' : 'text-zinc-600'}`}>
                          {stageBadgeConfig[st].label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-800/60 p-3 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-zinc-400">Müşteri:</span>
                  <p className="font-bold text-white text-sm">{selectedService.customerName}</p>
                  <p className="font-mono text-zinc-300">{selectedService.customerPhone}</p>
                </div>
                <div>
                  <span className="text-zinc-400">Maskelenmiş IMEI:</span>
                  <p className="font-mono font-bold text-white text-sm">{selectedService.imeiMasked}</p>
                  {selectedService.lockCode && (
                    <p className="text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                      <Lock size={12} /> Kilit: {selectedService.lockType.toUpperCase()} ({selectedService.lockCode})
                    </p>
                  )}
                  {selectedService.patternLock && selectedService.patternLock.length > 0 && (
                    <div className="mt-2 p-2 bg-zinc-900 rounded-xl border border-zinc-700/60 flex items-center gap-3">
                      <PatternMiniature pattern={selectedService.patternLock} size={60} />
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">Android Açılış Deseni:</span>
                        <span className="text-[11px] font-mono font-bold text-orange-400">
                          {selectedService.patternLock.join(' → ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parts Section */}
              <div className="bg-zinc-800/60 p-3 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Package size={14} className="text-orange-400" />
                    Kullanılan Yedek Parçalar & İşçilik
                  </span>
                  {selectedService.stage !== 'teslim_edildi' && (
                    <button
                      onClick={() => handleOpenAddPart(selectedService)}
                      className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] flex items-center gap-1"
                    >
                      <Plus size={12} /> Parça Ekle (Stoktan Düş)
                    </button>
                  )}
                </div>

                {selectedService.partsUsed.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedService.partsUsed.map((pu, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-900 p-2 rounded-xl">
                        <span>{pu.name} x{pu.quantity}</span>
                        <span className="font-mono font-bold text-emerald-400">₺{pu.unitPrice * pu.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-[11px]">Henüz parça kaydı eklenmedi.</p>
                )}

                <div className="mt-2 pt-2 border-t border-zinc-700/60 flex justify-between font-bold">
                  <span>Toplam Ücret (İşçilik Dahil):</span>
                  <span className="font-mono text-emerald-400 text-sm">₺{selectedService.finalPrice}</span>
                </div>
              </div>

              {/* Hasar Ekspertizi ve Dijital İmzalar */}
              {((selectedService.damageTags && selectedService.damageTags.length > 0) || selectedService.customerSignature || selectedService.deliverySignature) && (
                <div className="bg-zinc-800/60 p-3 rounded-2xl border border-zinc-800 space-y-2">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <FileSignature size={14} className="text-emerald-400" />
                    Ekspertiz Kusurları & Dijital İmzalar
                  </span>

                  {selectedService.damageTags && selectedService.damageTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedService.damageTags.map(dt => (
                        <span key={dt} className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium">
                          ⚠️ {dt}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {selectedService.customerSignature && (
                      <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-400 block mb-1 font-semibold">Kabul İmzası:</span>
                        <img
                          src={selectedService.customerSignature}
                          alt="Kabul İmzası"
                          className="max-h-12 max-w-[120px] object-contain mx-auto bg-zinc-950 p-1 rounded"
                        />
                      </div>
                    )}
                    {selectedService.deliverySignature && (
                      <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-400 block mb-1 font-semibold">Teslimat İmzası:</span>
                        <img
                          src={selectedService.deliverySignature}
                          alt="Teslimat İmzası"
                          className="max-h-12 max-w-[120px] object-contain mx-auto bg-zinc-950 p-1 rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audit Logs */}
              <div className="bg-zinc-800/60 p-3 rounded-2xl border border-zinc-800">
                <span className="font-bold text-white flex items-center gap-1 mb-2">
                  <History size={14} className="text-zinc-400" />
                  İşlem Geçmişi & Güvenlik Günlüğü (Audit Log)
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedService.auditLogs.map((log) => (
                    <div key={log.id} className="text-[10px] bg-zinc-900 p-2 rounded-lg text-zinc-300">
                      <div className="flex justify-between font-bold text-zinc-400 mb-0.5">
                        <span>{log.user} • {log.action}</span>
                        <span className="font-mono">{log.timestamp}</span>
                      </div>
                      <p>{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setReceiptRecord(selectedService);
                  setIsReceiptModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Printer size={14} /> Fiş Yazdır
              </button>
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PARÇA EKLEME DIALOG (STOKTAN DÜŞÜM) */}
      {isAddPartOpen && selectedService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Onarıma Parça Ekle</h3>
            <p className="text-xs text-zinc-400 mb-4">Seçilen parça otomatik olarak stok sayımından düşülecektir.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1">Stoktaki Parça *</label>
                <select
                  value={selectedStockId}
                  onChange={(e) => {
                    setSelectedStockId(e.target.value);
                    const found = stock.find(s => s.id === e.target.value);
                    if (found) setPartPrice(found.salePriceTl);
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-orange-500"
                >
                  {stock.filter(s => s.isActive && s.quantity > 0).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Stok: {s.quantity} Adet - ₺{s.salePriceTl})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1">Adet</label>
                  <input
                    type="number"
                    min={1}
                    value={partQty}
                    onChange={(e) => setPartQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Birim Fiyat (₺)</label>
                  <input
                    type="number"
                    value={partPrice}
                    onChange={(e) => setPartPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 flex items-center justify-between">
                  <span>Parça Garanti Süresi</span>
                  <span className="text-[10px] text-zinc-400">Fiş ve WhatsApp'ta belirtilir</span>
                </label>
                <select
                  value={partWarrantyDays}
                  onChange={(e) => setPartWarrantyDays(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white text-xs"
                >
                  <option value={30}>30 Gün Garanti</option>
                  <option value={60}>60 Gün Garanti</option>
                  <option value={90}>90 Gün Garanti (Standart)</option>
                  <option value={180}>180 Gün (6 Ay) Garanti</option>
                  <option value={365}>365 Gün (1 Yıl) Garanti</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsAddPartOpen(false)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmAddPart}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
              >
                Onayla & Stoktan Düş
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TESLİMAT DIALOG */}
      {isDeliverOpen && selectedService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl my-6 animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              Cihaz Teslim Onayı & Tesellüm Tutanağı
            </h3>
            <p className="text-xs text-zinc-400 mb-4">{selectedService.serviceNo} - {selectedService.deviceBrand} {selectedService.deviceModel}</p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1">Teslim Alan Kişi *</label>
                  <input
                    type="text"
                    value={deliveredToName}
                    onChange={(e) => setDeliveredToName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-medium"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Ödeme Durumu</label>
                  <select
                    value={deliveryPaymentStatus}
                    onChange={(e: any) => setDeliveryPaymentStatus(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="odendi">Nakit / Kart ile Ödendi</option>
                    <option value="veresiye">Cari Hesaba Aktar (Veresiye)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Tahsil Edilen Tutar (₺)</label>
                <input
                  type="number"
                  value={deliveryPaidAmount}
                  onChange={(e) => setDeliveryPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-white font-mono font-bold"
                />
              </div>

              {/* ✍️ Dijital Teslim İmzası */}
              <div className="pt-2">
                <SignaturePad
                  value={deliverySignature}
                  onChange={setDeliverySignature}
                  title="Müşteri Teslim Tesellüm İmzası (Dijital)"
                  subtitle="Cihazı sağlam, eksiksiz ve çalışır durumda teslim aldığını onaylar"
                  height={110}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsDeliverOpen(false)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmDeliver}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                Teslimatı Tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP GELİŞMİŞ BİLDİRİM VE ŞABLON YÖNETİM MODALI */}
      {whatsAppModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-emerald-400" />
                <h3 className="font-bold text-white text-sm">WhatsApp Güvenli Bildirim Gönderimi</h3>
              </div>
              <button onClick={() => setWhatsAppModalData(null)} className="text-zinc-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="mt-3 text-xs space-y-3">
              {/* Şablon Seçici Tablar */}
              <div>
                <label className="text-zinc-400 block mb-1 text-[11px] font-semibold">Hızlı Şablon Değiştir:</label>
                <div className="grid grid-cols-5 gap-1">
                  {(
                    [
                      { id: 'kabul', label: '1. Kabul Fişi' },
                      { id: 'fiyat_onayi', label: '2. Fiyat Onayı' },
                      { id: 'parca_bekliyor', label: '3. Parça Bekliyor' },
                      { id: 'hazir', label: '4. Cihaz Hazır' },
                      { id: 'teslim', label: '5. Teslimat' }
                    ] as const
                  ).map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSwitchWhatsAppType(tmpl.id)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer truncate ${
                        whatsAppModalData.type === tmpl.id
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Güvenlik Kuralı:
                </p>
                <p className="text-[11px] text-emerald-400/90 mt-0.5">
                  Müşteri gizliliği için IMEI ve kilit/şifre bilgileri WhatsApp bildirimine kesinlikle eklenmez.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400">Mesaj Metni ({whatsAppModalData.type.toUpperCase()})</label>
                  <span className="text-[10px] text-zinc-500">Göndermeden önce düzenleyebilirsiniz</span>
                </div>
                <textarea
                  rows={7}
                  value={whatsAppModalData.text}
                  onChange={(e) => setWhatsAppModalData({ ...whatsAppModalData, text: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white font-sans text-xs focus:outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>

              {whatsAppModalData.isOpened && (
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 text-center text-[11px]">
                  ✓ WhatsApp Web yeni sekmede açıldı. Mesajın iletildiğini doğrulayabilirsiniz.
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setWhatsAppModalData(null)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
              <button
                onClick={executeWhatsAppOpen}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <MessageCircle size={15} /> WhatsApp Web Aç & Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kabul Modal */}
      <ServisKabulModal
        isOpen={isKabulModalOpen}
        onClose={() => setIsKabulModalOpen(false)}
        onSuccessPrintReceipt={(rec) => {
          setReceiptRecord(rec);
          setIsReceiptModalOpen(true);
        }}
      />

      {/* Termal Fiş Modal */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        serviceRecord={receiptRecord}
        receiptType="servis_kabul"
      />

      {/* Kamera Barkod/IMEI Arama Tarayıcı */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scanned) => {
          setSearchTerm(scanned.replace(/\D/g, '') || scanned);
        }}
        title="Kamera ile Cihaz IMEI / Servis No Ara"
        expectedType="all"
      />

      {/* Teknisyen Performans ve Prim Raporu Modalı */}
      <TechnicianPerformanceModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
      />

      {/* Müşteri QR Takip Portalı Modalı / Önizleme */}
      {isTrackingPortalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl p-4 sm:p-6 shadow-2xl relative my-6">
            <button
              onClick={() => setIsTrackingPortalOpen(false)}
              className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ✕ Kapat
            </button>
            <CustomerTrackingPortal onBack={() => setIsTrackingPortalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
