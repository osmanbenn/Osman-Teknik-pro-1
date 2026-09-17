import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Command,
  Wrench,
  ShoppingCart,
  Package,
  Users,
  Banknote,
  Award,
  ChevronRight,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Cloud,
  DollarSign,
  Palette
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { NavigationTab, ThemeMode } from '../types';

interface VoiceAssistantControllerProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenServiceIntake: () => void;
  onOpenTechnicianModal: () => void;
  onOpenCloudSync?: () => void;
  onOpenUsdCalc?: () => void;
}

export const VoiceAssistantController: React.FC<VoiceAssistantControllerProps> = ({
  activeTab,
  onNavigate,
  onOpenServiceIntake,
  onOpenTechnicianModal,
  onOpenCloudSync,
  onOpenUsdCalc
}) => {
  const {
    services,
    stock,
    sales,
    cashMovements,
    customers,
    criticalStockCount,
    addCustomCartItem,
    settings
  } = useApp();
  const { theme, setTheme } = useTheme();

  // Assistant UI States
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedbackText, setFeedbackText] = useState('Usta emrindeyim, ne yapmak istersin?');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recentLogs, setRecentLogs] = useState<Array<{ text: string; action: string; time: string }>>([
    { text: 'Sesli asistan hazırlandı', action: 'Hazır', time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
  ]);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setFeedbackText('Dinliyorum usta, konuşabilirsin...');
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        // If final result
        if (event.results[0].isFinal) {
          handleVoiceCommand(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setFeedbackText('Mikrofon erişim izni verilmedi. Tarayıcı ayarlarından mikrofonu açınız.');
        } else if (event.error === 'no-speech') {
          setFeedbackText('Ses algılanamadı, mikrofon simgesine basıp tekrar deneyiniz.');
        } else {
          setFeedbackText(`Ses algılama hatası: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Failed to initialize SpeechRecognition:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Text-To-Speech (Sesli Yanıt)
  const speak = (textToSpeak: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop prior speech
      const cleanText = textToSpeak
        .replace(/₺/g, ' Türk Lirası ')
        .replace(/TL/g, ' Türk Lirası ')
        .replace(/%/g, ' yüzde ')
        .replace(/#/g, ' numara ')
        .replace(/\*/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select Turkish voice if available
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices?.find(v => v?.lang && (v.lang.toLowerCase().includes('tr')));
      if (trVoice) {
        utterance.voice = trVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Toggle Microphone
  const toggleListening = () => {
    if (!speechSupported) {
      setFeedbackText('Tarayıcınız ses tanımayı desteklemiyor, aşağıdaki kutuya yazabilirsiniz.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        window.speechSynthesis.cancel();
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Recognition start failed:', e);
      }
    }
  };

  // 1. FAST DETERMINISTIC LOCAL DISPATCH (Zero latency)
  const handleFastLocalCommand = (rawText: string): boolean => {
    const text = rawText.toLowerCase().trim();

    // Servis Kabul
    if (
      text.includes('yeni servis') ||
      text.includes('cihaz kabul') ||
      text.includes('servis aç') ||
      text.includes('kayıt aç') ||
      text.includes('fiş aç') ||
      text.includes('servis kabul')
    ) {
      onOpenServiceIntake();
      const reply = 'Yeni servis kabul formu açıldı usta.';
      setFeedbackText(reply);
      setLastAction('Yeni Servis Açıldı');
      speak(reply);
      return true;
    }

    // Servis Ekranı
    if (
      text === 'servis' ||
      text.includes('servise git') ||
      text.includes('servisleri aç') ||
      text.includes('tamirleri aç') ||
      text.includes('cihazlar') ||
      text.includes('tamirler')
    ) {
      onNavigate('servis');
      const reply = 'Teknik servis ekranına geçildi.';
      setFeedbackText(reply);
      setLastAction('Servis Ekranına Geçildi');
      speak(reply);
      return true;
    }

    // Hızlı Satış / POS
    if (
      text === 'satış' ||
      text.includes('hızlı satış') ||
      text.includes('satış yap') ||
      text.includes('kasayı aç') ||
      text.includes('pos aç') ||
      text.includes('barkod satış') ||
      text.includes('satışa geç')
    ) {
      onNavigate('satis');
      const reply = 'Hızlı satış ve barkod POS ekranı açıldı.';
      setFeedbackText(reply);
      setLastAction('Satış Ekranına Geçildi');
      speak(reply);
      return true;
    }

    // Sepete Ürün Ekleme (örn: "sepete nano cam ekle", "sepete 150 lira işçilik ekle")
    if (text.includes('sepete') && (text.includes('ekle') || text.includes('at'))) {
      let itemName = 'Hızlı İşçilik / Ürün';
      let itemPrice = 100;

      if (text.includes('nano') || text.includes('cam') || text.includes('kırılmaz')) {
        itemName = 'Nano Ekran Koruyucu Cam';
        itemPrice = 150;
      } else if (text.includes('şarj') || text.includes('kablo')) {
        itemName = 'Type-C Hızlı Şarj Kablosu';
        itemPrice = 200;
      } else if (text.includes('kılıf')) {
        itemName = 'Silikon Koruyucu Kılıf';
        itemPrice = 120;
      } else if (text.includes('batarya')) {
        itemName = 'Batarya Değişim İşçiliği';
        itemPrice = 450;
      }

      // Fiyat sayısı tespiti (örn: "250 lira")
      const priceMatch = text.match(/(\d+)\s*(tl|lira|₺)/);
      if (priceMatch) {
        itemPrice = parseInt(priceMatch[1], 10);
      }

      addCustomCartItem({
        name: itemName,
        price: itemPrice,
        quantity: 1
      });
      onNavigate('satis');

      const reply = `${itemName} ${itemPrice} TL olarak satış sepetine eklendi.`;
      setFeedbackText(reply);
      setLastAction(`Sepete Eklendi: ${itemName}`);
      speak(reply);
      return true;
    }

    // Stok & Parça
    if (
      text === 'stok' ||
      text.includes('stoklar') ||
      text.includes('stokları aç') ||
      text.includes('yedek parça') ||
      text.includes('parçalar') ||
      text.includes('depo') ||
      text.includes('depoyu aç')
    ) {
      onNavigate('stok');
      const reply = 'Stok ve yedek parçalar listesi açıldı.';
      setFeedbackText(reply);
      setLastAction('Stok Ekranına Geçildi');
      speak(reply);
      return true;
    }

    // Kasa & Gün Sonu
    if (
      text === 'kasa' ||
      text.includes('kasa hareket') ||
      text.includes('gelir gider') ||
      text.includes('gün sonu') ||
      text.includes('z raporu')
    ) {
      onNavigate('kasa');
      const reply = 'Kasa ve gün sonu raporu ekranına geçildi.';
      setFeedbackText(reply);
      setLastAction('Kasa Ekranına Geçildi');
      speak(reply);
      return true;
    }

    // Ciro / Kasa Durumu Sesli Raporu
    if (
      text.includes('ciro') ||
      text.includes('kasada kaç para') ||
      text.includes('kasa durumu') ||
      text.includes('bugün ne kazandık') ||
      text.includes('kaç para var')
    ) {
      const todayDate = new Date().toLocaleDateString('tr-TR');
      const todaySales = sales.filter(s => {
        const dateStr = s.timestamp || (s as any).createdAt || '';
        return dateStr.includes(todayDate);
      });
      const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total ?? (s as any).totalAmount ?? 0), 0);

      // Nakit bakiye
      const cashTotal = cashMovements
        .filter(m => m.type.startsWith('gelir') || m.type === 'tahsilat_cari')
        .reduce((sum, m) => sum + m.amount, 0) -
        cashMovements
        .filter(m => m.type === 'gider' || m.type === 'cihaz_alimi')
        .reduce((sum, m) => sum + m.amount, 0);

      const reply = `Bugün toplam ${todayRevenue.toLocaleString('tr-TR')} TL satış cirosu yapıldı. Kasadaki net bakiye ${cashTotal.toLocaleString('tr-TR')} Türk Lirasıdır usta.`;
      setFeedbackText(reply);
      setLastAction('Ciro Durumu Seslendirildi');
      speak(reply);
      return true;
    }

    // Bekleyen Servis / Arıza Sayısı
    if (
      text.includes('kaç cihaz var') ||
      text.includes('bekleyen cihaz') ||
      text.includes('tamirde kaç') ||
      text.includes('servis durumu')
    ) {
      const pendingCount = services.filter(s => s.stage === 'kabul' || s.stage === 'ariza_tespiti' || s.stage === 'onarimda').length;
      const readyCount = services.filter(s => s.stage === 'hazir').length;

      const reply = `Şu an atölyede onarımı devam eden ${pendingCount} cihaz var, ${readyCount} cihaz müşteriye teslim edilmek üzere hazır bekliyor usta.`;
      setFeedbackText(reply);
      setLastAction('Servis Durumu Seslendirildi');
      speak(reply);
      return true;
    }

    // Müşteriler & Cari
    if (
      text === 'cari' ||
      text.includes('müşteriler') ||
      text.includes('veresiye') ||
      text.includes('borçlar') ||
      text.includes('alacaklar')
    ) {
      onNavigate('cari');
      const reply = 'Müşteri cari hesapları ve veresiye takip ekranına geçildi.';
      setFeedbackText(reply);
      setLastAction('Cari Ekranına Geçildi');
      speak(reply);
      return true;
    }

    // Telefon Alım / Satım
    if (
      text.includes('telefon alım') ||
      text.includes('ikinci el') ||
      text.includes('2. el') ||
      text.includes('telefon al') ||
      text.includes('telefon sat')
    ) {
      onNavigate('telefon');
      const reply = 'İkinci el telefon alım satım ve ekspertiz ekranına geçildi.';
      setFeedbackText(reply);
      setLastAction('Telefon Ekranına Geçildi');
      speak(reply);
      return true;
    }

    // Teknisyen Performansı
    if (
      text.includes('teknisyen') ||
      text.includes('usta performansı') ||
      text.includes('ustalar') ||
      text.includes('tamir raporu')
    ) {
      onOpenTechnicianModal();
      const reply = 'Teknisyen onarım performansı ve tamir başarı raporu açıldı.';
      setFeedbackText(reply);
      setLastAction('Teknisyen Raporu Açıldı');
      speak(reply);
      return true;
    }

    // Müşteri QR Takip Portalı
    if (
      text.includes('karekod takip') ||
      text.includes('qr takip') ||
      text.includes('müşteri takip') ||
      text.includes('cihaz nerede')
    ) {
      onNavigate('takip');
      const reply = 'Müşteri canlı karekod cihaz takip portalına geçildi.';
      setFeedbackText(reply);
      setLastAction('Takip Portalı Açıldı');
      speak(reply);
      return true;
    }

    // Ana Sayfa / Dashboard
    if (
      text === 'ana sayfa' ||
      text.includes('dashboard') ||
      text.includes('gösterge paneli') ||
      text.includes('ana ekrana dön')
    ) {
      onNavigate('dashboard');
      const reply = 'Ana sayfa gösterge paneline geçildi.';
      setFeedbackText(reply);
      setLastAction('Ana Sayfaya Geçildi');
      speak(reply);
      return true;
    }

    // AI Danışman
    if (
      text.includes('yapay zeka') ||
      text.includes('ai danışman') ||
      text.includes('arıza tespiti yap') ||
      text.includes('arıza şeması')
    ) {
      onNavigate('ai');
      const reply = 'AI Yapay Zeka Atölye Danışmanı ekranı açıldı.';
      setFeedbackText(reply);
      setLastAction('AI Asistan Açıldı');
      speak(reply);
      return true;
    }

    // Ayarlar
    if (text === 'ayarlar' || text.includes('ayarları aç') || text.includes('sistem ayarları')) {
      onNavigate('ayarlar');
      const reply = 'Sistem ve donanım ayarları ekranı açıldı.';
      setFeedbackText(reply);
      setLastAction('Ayarlar Açıldı');
      speak(reply);
      return true;
    }

    // Bulut Senkronizasyon
    if (text.includes('bulut') || text.includes('yedekle') || text.includes('senkronize')) {
      if (onOpenCloudSync) onOpenCloudSync();
      const reply = 'Firebase bulut veritabanı ve senkronizasyon penceresi açıldı.';
      setFeedbackText(reply);
      setLastAction('Bulut Senkronizasyon Açıldı');
      speak(reply);
      return true;
    }

    // Dolar / Döviz Çevirici
    if (text.includes('dolar') || text.includes('döviz') || text.includes('kur hesabı')) {
      if (onOpenUsdCalc) onOpenUsdCalc();
      const reply = `Canlı döviz çevirici açıldı. Güncel USD kuru ${settings.usdExchangeRate.toFixed(2)} TL'dir.`;
      setFeedbackText(reply);
      setLastAction('Döviz Çevirici Açıldı');
      speak(reply);
      return true;
    }

    // Tema Değiştirme
    if (text.includes('koyu tema') || text.includes('siyah tema') || text.includes('karanlık tema')) {
      setTheme('default-dark');
      const reply = 'Koyu tema aktif edildi.';
      setFeedbackText(reply);
      setLastAction('Koyu Tema Aktif');
      speak(reply);
      return true;
    }

    if (text.includes('açık tema') || text.includes('beyaz tema') || text.includes('aydınlık tema')) {
      setTheme('light-card');
      const reply = 'Açık tema aktif edildi.';
      setFeedbackText(reply);
      setLastAction('Açık Tema Aktif');
      speak(reply);
      return true;
    }

    if (text.includes('renkli tema') || text.includes('minimal tema')) {
      setTheme('colorful-minimal');
      const reply = 'Renkli minimal tema aktif edildi.';
      setFeedbackText(reply);
      setLastAction('Renkli Tema Aktif');
      speak(reply);
      return true;
    }

    // Fiş Yazdır
    if (text.includes('yazdır') || text.includes('print')) {
      window.print();
      const reply = 'Yazdırma penceresi açıldı.';
      setFeedbackText(reply);
      speak(reply);
      return true;
    }

    // Asistanı Kapat
    if (text.includes('kapat') || text.includes('vazgeç') || text.includes('tamamdır')) {
      setIsOpen(false);
      const reply = 'Sesli asistan kapatıldı usta, kolay gelsin!';
      speak(reply);
      return true;
    }

    return false;
  };

  // 2. CONVERSATIONAL & GEMINI AI CONTROL (Server-side API)
  const handleVoiceCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    // First try ultra-fast deterministic match
    const handledLocally = handleFastLocalCommand(commandText);
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    if (handledLocally) {
      setRecentLogs(prev => [
        { text: commandText, action: 'Yerel Komut İşlendi', time: nowStr },
        ...prev.slice(0, 9)
      ]);
      return;
    }

    // If not handled locally, invoke Gemini Voice Control API
    setIsProcessing(true);
    setFeedbackText('Yapay zeka komutunuzu analiz ediyor...');

    try {
      const todayDate = new Date().toLocaleDateString('tr-TR');
      const todaySales = sales.filter(s => {
        const dateStr = s.timestamp || (s as any).createdAt || '';
        return dateStr.includes(todayDate);
      });
      const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total ?? (s as any).totalAmount ?? 0), 0);

      const contextSummary = {
        totalServices: services.length,
        pendingServices: services.filter(s => s.stage === 'kabul' || s.stage === 'onarimda' || s.stage === 'ariza_tespiti').length,
        todayRevenue,
        criticalStockCount,
        customerCount: customers.length,
        usdRate: settings.usdExchangeRate
      };

      const res = await fetch('/api/gemini/voice-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: commandText,
          currentTab: activeTab,
          contextSummary
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sesli komut işlenemedi');
      }

      const cmd = data.command;
      const spoken = cmd.spokenResponse || 'Komut uygulandı usta.';
      setFeedbackText(spoken);
      speak(spoken);

      // Execute structured action returned by Gemini
      if (cmd.action === 'NAVIGATE' && cmd.targetTab) {
        onNavigate(cmd.targetTab as NavigationTab);
        setLastAction(`Sekmeye Geçildi: ${cmd.targetTab}`);
      } else if (cmd.action === 'OPEN_MODAL') {
        if (cmd.modalName === 'service_intake') {
          onOpenServiceIntake();
          setLastAction('Yeni Servis Açıldı');
        } else if (cmd.modalName === 'technician') {
          onOpenTechnicianModal();
          setLastAction('Teknisyen Raporu Açıldı');
        } else if (cmd.modalName === 'cloud_sync' && onOpenCloudSync) {
          onOpenCloudSync();
          setLastAction('Bulut Senkronizasyon Açıldı');
        } else if (cmd.modalName === 'usd_calc' && onOpenUsdCalc) {
          onOpenUsdCalc();
          setLastAction('Dolar Çevirici Açıldı');
        }
      } else if (cmd.action === 'ADD_CART' && cmd.cartItem) {
        addCustomCartItem({
          name: cmd.cartItem.name || 'Sesli Ürün',
          price: cmd.cartItem.price || 100,
          quantity: 1
        });
        onNavigate('satis');
        setLastAction(`Sepete Eklendi: ${cmd.cartItem.name}`);
      } else if (cmd.action === 'CHANGE_THEME' && cmd.themeName) {
        setTheme(cmd.themeName as ThemeMode);
        setLastAction(`Tema Değiştirildi: ${cmd.themeName}`);
      } else {
        setLastAction(cmd.displayText || 'Bilgi Cevaplandı');
      }

      setRecentLogs(prev => [
        { text: commandText, action: cmd.action || 'AI Cevap', time: nowStr },
        ...prev.slice(0, 9)
      ]);
    } catch (err: any) {
      console.error('Voice control error:', err);
      const errNotice = 'Komut tam anlaşılamadı usta. Örn: "Servise git", "Yeni servis aç" veya "Ciro nedir" diyebilirsin.';
      setFeedbackText(errNotice);
      speak(errNotice);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const txt = textInput;
    setTextInput('');
    setTranscript(txt);
    handleVoiceCommand(txt);
  };

  return (
    <>
      {/* 1. Global Floating Voice Trigger Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex items-center gap-2">
        <button
          id="global-voice-assistant-fab"
          onClick={() => {
            setIsOpen(true);
            if (!isListening && speechSupported) {
              toggleListening();
            }
          }}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 cursor-pointer border ${
            isListening
              ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border-orange-400 ring-4 ring-orange-500/30 scale-105 animate-pulse'
              : 'bg-zinc-900/95 hover:bg-zinc-800 text-white border-zinc-700/80 hover:border-orange-500/50 backdrop-blur-md'
          }`}
          title="Yapay Zeka Sesli Asistan (Uygulamayı Sesle Yönet)"
        >
          <div className="relative">
            {isListening ? (
              <div className="w-5 h-5 flex items-center justify-center">
                <Mic className="w-5 h-5 text-white animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              </div>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="text-left hidden sm:block">
            <span className="text-xs font-bold block leading-none">
              {isListening ? 'Dinliyor...' : 'Sesli Asistan'}
            </span>
            <span className="text-[10px] text-zinc-400 leading-none">
              {isListening ? 'Konuşun' : 'Uygulamayı Yönet'}
            </span>
          </div>
        </button>
      </div>

      {/* 2. Expanded Voice Control Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-3xl sm:rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95">
            {/* Modal Top Header */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all ${
                  isListening
                    ? 'bg-gradient-to-br from-red-500 to-orange-600 ring-4 ring-orange-500/20 animate-pulse'
                    : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20'
                }`}>
                  <Mic size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">Yapay Zeka Sesli Kontrol</h3>
                    <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                      Canlı
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Atölye ve dükkan işlemlerini elleriniz serbestken sesle yönetin</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Voice Mute Toggle */}
                <button
                  onClick={() => {
                    const newMute = !isMuted;
                    setIsMuted(newMute);
                    if (newMute) window.speechSynthesis.cancel();
                  }}
                  className={`p-2 rounded-xl border transition-colors ${
                    isMuted
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                  title={isMuted ? 'Sesi Aç (TTS)' : 'Sesi Kapat (Sessiz Mod)'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                {/* Close */}
                <button
                  onClick={() => {
                    if (recognitionRef.current) {
                      try { recognitionRef.current.abort(); } catch {}
                    }
                    window.speechSynthesis.cancel();
                    setIsOpen(false);
                  }}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Central Listening State & Soundwave Animation */}
            <div className="p-6 bg-gradient-to-b from-zinc-950 to-zinc-900 flex flex-col items-center justify-center text-center border-b border-zinc-800/80">
              {/* Animated Glowing Mic Circle */}
              <div className="relative mb-5">
                {isListening && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping"></div>
                    <div className="absolute -inset-3 rounded-full bg-orange-500/10 animate-pulse"></div>
                  </>
                )}
                <button
                  onClick={toggleListening}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-gradient-to-tr from-red-600 to-orange-500 scale-110 shadow-orange-500/40'
                      : 'bg-gradient-to-tr from-zinc-800 to-zinc-700 hover:from-orange-600 hover:to-orange-500 border border-zinc-600'
                  }`}
                >
                  {isListening ? <Mic size={36} className="animate-pulse" /> : <MicOff size={32} className="text-zinc-400" />}
                </button>
              </div>

              {/* Soundwave bars (visualizer simulation) */}
              {isListening && (
                <div className="flex items-center gap-1.5 h-8 mb-4">
                  {[40, 70, 100, 60, 90, 45, 80, 55, 95, 65, 35].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-gradient-to-t from-orange-600 to-amber-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.6s'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Real-time transcript preview */}
              <div className="min-h-[44px] flex items-center justify-center max-w-md px-4">
                {transcript ? (
                  <p className="text-base font-bold text-white font-sans bg-zinc-800/70 border border-zinc-700 px-3.5 py-1.5 rounded-2xl animate-in fade-in">
                    "{transcript}"
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 italic">
                    {isListening ? 'Sizi dinliyorum, komutu söyleyin...' : 'Mikrofona basarak konuşun veya aşağıdaki örnekleri tıklayın'}
                  </p>
                )}
              </div>

              {/* Spoken feedback banner */}
              <div className="mt-3.5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-3 w-full text-left flex items-start gap-2.5">
                <Sparkles size={16} className="text-orange-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Asistan Yanıtı:</span>
                  <p className="text-xs font-semibold text-zinc-200 mt-0.5 leading-relaxed">
                    {feedbackText}
                  </p>
                </div>
                {lastAction && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-mono font-bold shrink-0">
                    {lastAction}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="p-4 bg-zinc-900/60 border-b border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-2">
                Hızlı Sesli Komut Örnekleri (Dokun ve Çalıştır):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { text: 'Yeni servis kaydı aç', icon: Wrench, color: 'hover:border-blue-500' },
                  { text: 'Hızlı satışa geç', icon: ShoppingCart, color: 'hover:border-emerald-500' },
                  { text: 'Sepete nano cam ekle', icon: Package, color: 'hover:border-purple-500' },
                  { text: 'Bugünkü ciro nedir?', icon: Banknote, color: 'hover:border-amber-500' },
                  { text: 'Bekleyen kaç cihaz var?', icon: Wrench, color: 'hover:border-blue-500' },
                  { text: 'Stokları kontrol et', icon: Package, color: 'hover:border-purple-500' },
                  { text: 'Teknisyen performansı', icon: Award, color: 'hover:border-amber-500' },
                  { text: 'Koyu temaya geç', icon: Palette, color: 'hover:border-cyan-500' },
                  { text: 'Dolar kuru kaç lira?', icon: DollarSign, color: 'hover:border-emerald-500' }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setTranscript(item.text);
                        handleVoiceCommand(item.text);
                      }}
                      className={`flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/80 ${item.color} text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer`}
                    >
                      <Icon size={12} className="text-orange-400" />
                      <span>{item.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual text command input (fallback) */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
              <form onSubmit={handleManualSubmit} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Veya komutu buraya yazın (Örn: servise git, ciro nedir)..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Send size={14} />
                  <span className="hidden sm:inline">Gönder</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
