import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  RefreshCw,
  Zap,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Keyboard,
  Layers,
  Volume2,
  VolumeX,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export interface ScannedResult {
  code: string;
  format?: string;
  timestamp: string;
}

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedCode: string, result?: ScannedResult) => void;
  title?: string;
  description?: string;
  expectedType?: 'barcode' | 'imei' | 'all';
  allowContinuous?: boolean; // Seri/kesintisiz okutma desteği
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Kamera ile Barkod Okuyucu',
  description = 'Kameranızı ürünün barkoduna veya kutusundaki etikete doğrultun.',
  expectedType = 'barcode',
  allowContinuous = true
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedList, setScannedList] = useState<ScannedResult[]>([]);
  const [lastScannedFlash, setLastScannedFlash] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'osman-camera-barcode-reader';
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  // Crisp POS Scanner Beep (Synthesized Web Audio)
  const playScanBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    // Debounce rapid duplicate reads within 1.2 seconds for the same barcode
    const now = Date.now();
    if (cleanCode === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 1200) {
      return;
    }

    lastScannedCodeRef.current = cleanCode;
    lastScannedTimeRef.current = now;

    playScanBeep();
    if (navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }

    const item: ScannedResult = {
      code: cleanCode,
      format: decodedResult?.result?.format?.formatName || 'BARCODE',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setLastScannedFlash(cleanCode);
    setScannedList(prev => [item, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setLastScannedFlash(null);
    }, 1500);

    onScan(cleanCode, item);

    // If not continuous mode, close modal immediately
    if (!isContinuous) {
      setTimeout(() => {
        onClose();
      }, 350);
    }
  };

  // Initialize and start scanner when opened
  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      setScannedList([]);
      setCameraError(null);
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setCameraError(null);

    async function initCamera() {
      try {
        // Enumerate devices to find back/environment camera
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          // Prefer environment/back camera if labeled
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('arka')
          );
          const initialCamId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(initialCamId);
          await startScannerWithCamera(initialCamId);
        } else {
          // No named cameras, fallback to default environment facing mode
          await startScannerWithFacingMode('environment');
        }
      } catch (err: any) {
        console.warn('Kamera cihazları alınırken uyarı:', err);
        // Fallback to facingMode constraint directly
        try {
          await startScannerWithFacingMode('environment');
        } catch (subErr: any) {
          if (isMounted) {
            setCameraError(subErr.message || 'Kamera erişimi başlatılamadı. İzinlerin verildiğinden emin olun.');
          }
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    // Small delay to ensure modal DOM element #osman-camera-barcode-reader is ready
    const timer = setTimeout(() => {
      initCamera();
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen]);

  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // ignore cleanup error
      }
      scannerRef.current = null;
    }
    setTorchOn(false);
    setHasTorch(false);
  };

  const startScannerWithCamera = async (cameraId: string) => {
    await cleanupScanner();

    const element = document.getElementById(readerElementId);
    if (!element) return;

    const html5QrCode = new Html5Qrcode(readerElementId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.ITF
      ],
      verbose: false
    });

    scannerRef.current = html5QrCode;

    const config = {
      fps: 15,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        // Wide rectangular scanning box ideal for 1D retail barcodes
        const minEdgePercentage = 0.75;
        const width = Math.min(viewfinderWidth * minEdgePercentage, 340);
        const height = Math.min(viewfinderHeight * 0.6, 200);
        return { width, height };
      },
      aspectRatio: 1.333334
    };

    await html5QrCode.start(
      cameraId,
      config,
      (text, res) => handleScanSuccess(text, res),
      () => {
        // non-critical frame error
      }
    );

    // Check torch capabilities
    try {
      const runningTrack = (html5QrCode as any).getRunningTrackCameraCapabilities?.();
      if (runningTrack && runningTrack.torchFeature?.()) {
        setHasTorch(true);
      }
    } catch (e) {
      // torch feature check skipped
    }
  };

  const startScannerWithFacingMode = async (facingMode: 'environment' | 'user') => {
    await cleanupScanner();

    const element = document.getElementById(readerElementId);
    if (!element) return;

    const html5QrCode = new Html5Qrcode(readerElementId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE
      ],
      verbose: false
    });

    scannerRef.current = html5QrCode;

    await html5QrCode.start(
      { facingMode },
      {
        fps: 15,
        qrbox: { width: 300, height: 180 },
        aspectRatio: 1.333334
      },
      (text, res) => handleScanSuccess(text, res),
      () => {}
    );
  };

  const handleCameraChange = async (newCamId: string) => {
    setSelectedCameraId(newCamId);
    try {
      setIsInitializing(true);
      await startScannerWithCamera(newCamId);
    } catch (err: any) {
      setCameraError('Seçilen kameraya geçilemedi: ' + err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const trackCap = (scannerRef.current as any).getRunningTrackCameraCapabilities?.();
      if (trackCap && trackCap.torchFeature) {
        await trackCap.torchFeature().apply(!torchOn);
        setTorchOn(!torchOn);
      }
    } catch (e) {
      console.warn('Flaş açılamadı:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
              <Camera size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Canlı Kamera
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Controls Bar: Continuous mode, Sound toggle, Camera selector */}
        <div className="px-4 py-2 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between gap-2 text-xs flex-wrap">
          {allowContinuous && (
            <button
              type="button"
              onClick={() => setIsContinuous(!isContinuous)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] ${
                isContinuous
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
              }`}
            >
              <Layers size={13} />
              <span>{isContinuous ? 'Seri Okutma Açık (Kapanmaz)' : 'Tekli Okutma (Okut & Kapat)'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {availableCameras.length > 1 && (
              <select
                value={selectedCameraId || ''}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="bg-zinc-800 text-zinc-300 text-[11px] font-semibold rounded-lg px-2 py-1 border border-zinc-700 focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {availableCameras.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Kamera ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title={soundEnabled ? 'Bip sesini kapat' : 'Bip sesini aç'}
            >
              {soundEnabled ? <Volume2 size={15} className="text-orange-400" /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black h-72 sm:h-80 flex items-center justify-center overflow-hidden">
          {/* html5-qrcode mounts inside this div */}
          <div
            id={readerElementId}
            className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {/* Vizör ve Hedefleme Çerçevesi (Overlay) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <div
              className={`relative w-72 sm:w-80 h-44 sm:h-48 border-2 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                lastScannedFlash
                  ? 'border-emerald-400 bg-emerald-500/20 scale-102 shadow-[0_0_30px_#10b981]'
                  : 'border-orange-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]'
              }`}
            >
              {/* Köşe Vurguları */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-orange-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-orange-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />

              {/* Lazer Tarama Çizgisi */}
              {!lastScannedFlash && (
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_12px_#f97316] animate-bounce" />
              )}

              {lastScannedFlash ? (
                <div className="bg-emerald-600 text-white font-mono font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-in zoom-in">
                  <CheckCircle2 size={14} />
                  <span>OKUNDU: {lastScannedFlash}</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono tracking-wider font-bold text-white/90 bg-black/70 px-2.5 py-0.5 rounded-full border border-orange-500/40">
                  {expectedType === 'imei' ? '15 HANELİ IMEI TARA' : 'BARKODU ÇERÇEVEYE ODAKLAYIN'}
                </span>
              )}
            </div>
          </div>

          {/* Flash / Torch Toggle */}
          {hasTorch && (
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl backdrop-blur-md border transition-colors cursor-pointer ${
                  torchOn ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/60 text-white border-zinc-700'
                }`}
                title="Flaş / Işık"
              >
                <Zap size={16} />
              </button>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-4 bg-zinc-950/95 rounded-2xl border border-zinc-800 p-4 flex flex-col items-center justify-center text-center z-20">
              <AlertCircle size={32} className="text-amber-500 mb-2" />
              <p className="text-xs font-bold text-white mb-1">Kamera Başlatılamadı</p>
              <p className="text-[11px] text-zinc-400 mb-3 max-w-xs">{cameraError}</p>
              <p className="text-[11px] text-orange-400 font-semibold mb-3">
                Aşağıdaki hızlı test barkodlarını veya manuel girişi hemen kullanabilirsiniz.
              </p>
            </div>
          )}
        </div>

        {/* Scanned List (in Continuous Mode) */}
        {isContinuous && scannedList.length > 0 && (
          <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <CheckCircle2 size={12} /> Okunanlar ({scannedList.length}):
            </span>
            {scannedList.map((sc, i) => (
              <span
                key={i}
                className="text-[11px] font-mono bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-md text-zinc-200 shrink-0"
              >
                {sc.code}
              </span>
            ))}
          </div>
        )}

        {/* Quick Demo Barcodes & Manual Input */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Hızlı Barkod Simülatörü (Test & Hızlı Seçim)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleScanSuccess('8690012345678', { result: { format: { formatName: 'EAN_13' } } })}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-orange-400">
                  <Barcode size={12} /> iPhone 11 Ekran
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">8690012345678</p>
              </button>

              <button
                type="button"
                onClick={() => handleScanSuccess('8690098765432', { result: { format: { formatName: 'EAN_13' } } })}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <Barcode size={12} /> 20W Hızlı Şarj
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">8690098765432</p>
              </button>

              <button
                type="button"
                onClick={() => handleScanSuccess('869009988111', { result: { format: { formatName: 'EAN_13' } } })}
                className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400">
                  <Barcode size={12} /> iPhone 14 Revize
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">869009988111</p>
              </button>
            </div>
          </div>

          {/* Manuel Kod Girişi */}
          <div className="pt-2 border-t border-zinc-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualCode.trim()) {
                  handleScanSuccess(manualCode.trim(), { result: { format: { formatName: 'MANUAL' } } });
                  setManualCode('');
                }
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-zinc-500"><Keyboard size={15} /></span>
                <input
                  type="text"
                  placeholder="Manuel barkod veya kod yazın..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
              >
                Uygula
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
