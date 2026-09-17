import React, { useState } from 'react';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServiceRecord, SaleRecord } from '../types';
import { generateSvgQrCode } from '../utils/security';
import { PatternMiniature } from './PatternLockDrawer';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceRecord?: ServiceRecord | null;
  saleRecord?: SaleRecord | null;
  receiptType?: 'servis_kabul' | 'servis_teslim' | 'satis_slip';
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  serviceRecord,
  saleRecord,
  receiptType = 'servis_kabul'
}) => {
  const { settings } = useApp();
  const [printerWidth, setPrinterWidth] = useState<'58mm' | '80mm'>(settings.printerSize || '80mm');
  const [isCustomerCopy, setIsCustomerCopy] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const is58 = printerWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-orange-500" />
            <h3 className="font-bold text-white text-sm sm:text-base">Termal Fiş Önizleme</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Paper Size selector */}
            <div className="bg-zinc-800 p-0.5 rounded-lg flex text-xs">
              <button
                onClick={() => setPrinterWidth('58mm')}
                className={`px-2 py-1 rounded-md font-bold transition-colors ${
                  printerWidth === '58mm' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                58 mm
              </button>
              <button
                onClick={() => setPrinterWidth('80mm')}
                className={`px-2 py-1 rounded-md font-bold transition-colors ${
                  printerWidth === '80mm' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                80 mm
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Copy toggle */}
        <div className="flex items-center justify-between py-2 text-xs text-zinc-400 border-b border-zinc-800/80">
          <span>Nüsha Türü:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCustomerCopy(true)}
              className={`px-2.5 py-1 rounded-lg font-semibold ${isCustomerCopy ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
            >
              Müşteri Nüshası
            </button>
            <button
              onClick={() => setIsCustomerCopy(false)}
              className={`px-2.5 py-1 rounded-lg font-semibold ${!isCustomerCopy ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
            >
              Servis / Arşiv Nüshası
            </button>
          </div>
        </div>

        {/* Thermal Ticket Container (Paper Simulation) */}
        <div className="my-4 max-h-[60vh] overflow-y-auto flex justify-center p-3 bg-zinc-950 rounded-xl">
          <div
            id="printable-thermal-receipt"
            className={`bg-white text-zinc-900 font-mono text-[11px] leading-tight p-4 shadow-xl border border-zinc-300 rounded-sm transition-all ${
              is58 ? 'w-[280px]' : 'w-[360px]'
            }`}
          >
            {/* Header / Logo */}
            <div className="text-center pb-2 border-b border-dashed border-zinc-400">
              <p className="font-extrabold text-sm tracking-wider uppercase">{settings.firmName}</p>
              <p className="text-[10px] text-zinc-600 font-sans">{settings.branchName}</p>
              <p className="text-[9px] text-zinc-500 font-sans mt-0.5">{settings.address}</p>
              <p className="text-[9px] text-zinc-500 font-sans">
                Tel: {settings.phone} {settings.whatsappPhone ? `• WP: ${settings.whatsappPhone}` : ''}
              </p>
              <p className="text-[9px] text-zinc-500 font-sans">{settings.taxOffice} - V.No: {settings.taxNumber}</p>
            </div>

            {/* Document Title */}
            <div className="text-center py-2 border-b border-dashed border-zinc-400 font-bold uppercase text-[11px]">
              {receiptType === 'servis_kabul' && 'SERVİS KABUL VE CİHAZ TESLİM FİŞİ'}
              {receiptType === 'servis_teslim' && 'SERVİS ONARIM VE TESLİMAT MAKBUZU'}
              {receiptType === 'satis_slip' && 'PERAKENDE SATIŞ BİLGİ SLİPİ'}
              <div className="text-[9px] font-normal text-zinc-600 mt-0.5">
                ({isCustomerCopy ? 'MÜŞTERİ NÜSHASI' : 'SERVİS TEKNİK NÜSHASI'})
              </div>
            </div>

            {/* Service Record Details */}
            {serviceRecord && (
              <div className="py-2 space-y-1 border-b border-dashed border-zinc-400">
                <div className="flex justify-between font-bold">
                  <span>Fiş / Servis No:</span>
                  <span>{serviceRecord.serviceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kayıt Tarihi:</span>
                  <span>{serviceRecord.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>Müşteri:</span>
                  <span className="font-bold">{serviceRecord.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telefon:</span>
                  <span>{serviceRecord.customerPhone}</span>
                </div>
                <div className="border-t border-dotted border-zinc-300 my-1"></div>
                <div className="flex justify-between font-bold">
                  <span>Cihaz:</span>
                  <span>{serviceRecord.deviceBrand} {serviceRecord.deviceModel}</span>
                </div>
                <div className="flex justify-between">
                  <span>IMEI / Seri No:</span>
                  <span className="font-mono">{serviceRecord.imeiMasked}</span>
                </div>
                <div>
                  <span className="font-bold">Şikayet:</span>
                  <p className="text-[10px] text-zinc-700 font-sans mt-0.5">{serviceRecord.issueComplaint}</p>
                </div>
                <div>
                  <span className="font-bold">Kozmetik Durum:</span>
                  <span className="text-[10px] text-zinc-700 font-sans ml-1">{serviceRecord.cosmeticCondition}</span>
                </div>
                {serviceRecord.damageTags && serviceRecord.damageTags.length > 0 && (
                  <div>
                    <span className="font-bold text-red-700">Ekspertiz Kusurları:</span>
                    <span className="text-[9px] text-zinc-800 font-sans ml-1 font-semibold">{serviceRecord.damageTags.join(', ')}</span>
                  </div>
                )}
                {serviceRecord.accessoriesReceived.length > 0 && (
                  <div>
                    <span className="font-bold">Aksesuarlar:</span>
                    <span className="text-[10px] text-zinc-700 ml-1">{serviceRecord.accessoriesReceived.join(', ')}</span>
                  </div>
                )}
                {/* Safe Note: Pin/Pattern lock is NEVER exposed to customer copy! */}
                {!isCustomerCopy && serviceRecord.lockCode && (
                  <div className="bg-zinc-100 p-1.5 rounded-sm text-[10px]">
                    <span className="font-bold text-red-600">Servis İçi Not (Kilit): </span>
                    <span>{serviceRecord.lockType.toUpperCase()} - {serviceRecord.lockCode}</span>
                    {serviceRecord.patternLock && serviceRecord.patternLock.length > 0 && (
                      <div className="mt-1.5 flex flex-col items-center justify-center p-1 bg-white rounded border border-zinc-300">
                        <span className="text-[9px] text-zinc-500 mb-0.5 font-sans font-semibold">3x3 Açılış Deseni:</span>
                        <PatternMiniature pattern={serviceRecord.patternLock} size={48} />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tahmini Teslim:</span>
                  <span className="font-bold">{serviceRecord.estimatedDelivery}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-dotted border-zinc-300">
                  <span>Tahmini Tutar:</span>
                  <span>₺{serviceRecord.estimatedPrice}</span>
                </div>
              </div>
            )}

            {/* Sale Record Details */}
            {saleRecord && (
              <div className="py-2 space-y-1 border-b border-dashed border-zinc-400">
                <div className="flex justify-between font-bold">
                  <span>Slip No:</span>
                  <span>{saleRecord.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarih:</span>
                  <span>{saleRecord.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasiyer:</span>
                  <span>{saleRecord.cashierName}</span>
                </div>
                {saleRecord.customerName && (
                  <div className="flex justify-between">
                    <span>Müşteri:</span>
                    <span>{saleRecord.customerName}</span>
                  </div>
                )}
                <div className="border-t border-dotted border-zinc-300 my-1.5"></div>
                <div className="space-y-1">
                  {saleRecord.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span className="truncate pr-2">{item.name} x{item.quantity}</span>
                      <span className="font-bold">₺{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dotted border-zinc-300 my-1.5"></div>
                <div className="flex justify-between text-xs font-bold">
                  <span>TOPLAM TUTAR:</span>
                  <span className="text-sm">₺{saleRecord.total}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Ödeme Şekli:</span>
                  <span className="uppercase font-semibold">{saleRecord.paymentMethod}</span>
                </div>
              </div>
            )}

            {/* Bank IBAN Details if configured */}
            {settings.bankIban && (
              <div className="py-1.5 text-[8px] text-zinc-600 font-sans border-b border-dashed border-zinc-400">
                <p className="font-bold text-[9px] text-zinc-800">BANKA HAVALE / EFT BİLGİSİ:</p>
                <p className="text-[8px] text-zinc-700">{settings.bankAccountName || settings.firmName}</p>
                <p className="font-mono font-bold text-zinc-800">{settings.bankIban}</p>
              </div>
            )}

            {/* QR Code & Tracking Link */}
            {serviceRecord && settings.printQrCode !== false && (
              <div className="py-2.5 text-center flex flex-col items-center justify-center border-b border-dashed border-zinc-400">
                <div dangerouslySetInnerHTML={{ __html: generateSvgQrCode(serviceRecord.serviceNo, is58 ? 85 : 100) }} />
                <p className="text-[9px] font-sans text-zinc-600 mt-1">Cihaz Durumunu Buradan Sorgulayın</p>
                <p className="text-[8px] font-mono text-zinc-500">https://osmanteknik.com/takip/{serviceRecord.qrToken}</p>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="py-2 text-[8px] text-zinc-600 font-sans space-y-1 leading-tight border-b border-dashed border-zinc-400">
              {(settings.receiptFooterLegalText || '• 90 gün içinde teslim alınmayan cihazlardan firmamız sorumlu değildir.\n• Değiştirilen parçalar 90 gün garantilidir.')
                .split('\n')
                .filter(Boolean)
                .map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
            </div>

            {/* Signature Block */}
            <div className="pt-2 flex justify-between text-[9px] font-sans items-end">
              <div className="text-center w-1/2">
                <p>Teslim Eden</p>
                <div className="h-9 flex items-center justify-center">
                  <span className="text-[8px] text-zinc-400 italic">Teknik Yetkili</span>
                </div>
                <p className="border-t border-zinc-400 pt-0.5 text-zinc-500">İmza</p>
              </div>
              <div className="text-center w-1/2">
                <p>Teslim Alan (Müşteri)</p>
                <div className="h-9 flex items-center justify-center">
                  {serviceRecord?.deliverySignature || serviceRecord?.customerSignature ? (
                    <img
                      src={serviceRecord.deliverySignature || serviceRecord.customerSignature}
                      alt="Müşteri İmzası"
                      className="max-h-8 max-w-[90px] object-contain mx-auto"
                    />
                  ) : (
                    <span className="text-[8px] text-zinc-400 italic">İmza</span>
                  )}
                </div>
                <p className="border-t border-zinc-400 pt-0.5 text-zinc-500">İmza</p>
              </div>
            </div>

            <div className="text-center pt-3 text-[9px] text-zinc-500">
              *** Teşekkür Eder, İyi Günler Dileriz ***
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold transition-colors"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all"
          >
            <Printer size={15} />
            Yazdır ({printerWidth})
          </button>
        </div>
      </div>
    </div>
  );
};
