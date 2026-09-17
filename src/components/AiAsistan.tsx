import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  History,
  Terminal,
  FileText,
  AlertCircle,
  Package,
  ShoppingCart,
  Banknote,
  Search,
  MapPin,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ExternalLink,
  Cpu,
  HelpCircle,
  Zap,
  RotateCcw,
  Clock,
  Loader2,
  ArrowRight,
  MessageSquare,
  Compass,
  Navigation,
  Radio,
  Layers,
  Wrench,
  Smartphone,
  Briefcase
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

type AiMode = 'chat' | 'search' | 'maps' | 'diagnose' | 'voice';
type ChatRole = 'technician' | 'parts' | 'valuation' | 'customer';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: Array<{ title: string; url: string }>;
  model?: string;
  role?: string;
}

interface MapsSource {
  title: string;
  uri: string;
  placeId?: string;
  snippets?: string[];
}

export const AiAsistan: React.FC = () => {
  const {
    stock,
    services,
    sales,
    cashMovements,
    currentUser,
    settings
  } = useApp();

  const { theme } = useTheme();

  // Active Tab Mode
  const [activeMode, setActiveMode] = useState<AiMode>('chat');

  // Selected Model for Chatbot (gemini-3.5-flash general, gemini-3.1-flash-lite fast, gemini-3.1-pro-preview complex)
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-3.1-pro-preview'
  >('gemini-3.5-flash');

  // Selected Role for Multi-turn Chat
  const [selectedRole, setSelectedRole] = useState<ChatRole>('technician');

  // Chatbot State
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'Selam Usta! Ben Osman Teknik Pro Akıllı Atölye ve ERP Danışmanıyım. Anakart lehimleme, entegre teşhisi (U2/Tristar, PMIC), ekran ve batarya revizyonu, güncel toptancı piyasası ve yakındaki tedarikçiler konusunda sana yardımcı olabilirim. Hangi konuda danışmak istersin?',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      model: 'gemini-3.5-flash',
      role: 'technician'
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Search Grounding State (gemini-3.5-flash with googleSearch)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    text: string;
    sources: Array<{ title: string; url: string }>;
    model: string;
  } | null>(null);

  // Maps Grounding State (gemini-3.5-flash with googleMaps)
  const [mapsLocation, setMapsLocation] = useState('Kadıköy, İstanbul');
  const [mapsQuery, setMapsQuery] = useState('En yakın telefon ekranı toptancıları ve lehim malzeme dükkanları');
  const [mapsUserCoords, setMapsUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [mapsResult, setMapsResult] = useState<{
    text: string;
    sources: MapsSource[];
    model: string;
  } | null>(null);

  // Diagnose State
  const [diagBrand, setDiagBrand] = useState('iPhone 12');
  const [diagComplaint, setDiagComplaint] = useState('Cihaz şarj almıyor, şarj aletine takınca 0.02A çekip kesiyor');
  const [diagResult, setDiagResult] = useState<any | null>(null);

  // Live Voice (gemini-3.1-flash-live-preview) State
  const [isListening, setIsListening] = useState(false);
  const [liveWsConnected, setLiveWsConnected] = useState(false);
  const [voiceSpeechSupported, setVoiceSpeechSupported] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [liveVoiceReply, setLiveVoiceReply] = useState<string | null>(null);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(true);
  const [liveDialogueHistory, setLiveDialogueHistory] = useState<Array<{ role: 'user' | 'model'; text: string; time: string }>>([
    {
      role: 'model',
      text: 'Canlı sesli atölye asistanı hazır usta! Elleriniz lehimdeyken mikrofona konuşun, anında sesli cevap vereyim.',
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const liveWsRef = useRef<WebSocket | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initialize Speech Recognition for Live Voice
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'tr-TR';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        handleLiveVoiceTurn(transcript);
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setVoiceSpeechSupported(false);
    }
  }, []);

  // Initialize WebSocket for Gemini Live API (gemini-3.1-flash-live-preview)
  useEffect(() => {
    if (activeMode !== 'voice') {
      if (liveWsRef.current) {
        liveWsRef.current.close();
        liveWsRef.current = null;
        setLiveWsConnected(false);
      }
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Gemini Live API WebSocket bağlantısı açıldı');
        setLiveWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.text) {
            setLiveVoiceReply(payload.text);
            setLiveDialogueHistory(prev => [
              ...prev,
              { role: 'model', text: payload.text, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
            ]);
            if (speechSynthesisEnabled) {
              speakText(payload.text);
            }
          }
        } catch (err) {
          console.warn('Live API WS parse error:', err);
        }
      };

      ws.onerror = (e) => {
        console.warn('Live API WS bağlantı uyarısı (HTTP fallback devrede):', e);
        setLiveWsConnected(false);
      };

      ws.onclose = () => {
        setLiveWsConnected(false);
      };

      liveWsRef.current = ws;

      return () => {
        ws.close();
      };
    } catch (e) {
      console.warn('WebSocket init exception:', e);
    }
  }, [activeMode, speechSynthesisEnabled]);

  const speakText = (text: string) => {
    if (!speechSynthesisEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`[\]()]/g, '').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // 1. Send Chat Message (Multi-turn with specific Role and Model)
  const handleSendChat = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Build conversation history
      const history = [...messages, userMsg].map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          model: selectedModel,
          role: selectedRole
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: data.text || 'Cevap alınamadı.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        model: data.model || selectedModel,
        role: selectedRole
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errMsg = error.message || 'Gemini servisine erişilemedi.';
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: `⚠️ Yanıt alınamadı: ${errMsg}. Lütfen bağlantınızı veya GEMINI_API_KEY ayarlarınızı kontrol ediniz.`,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          model: selectedModel
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Google Search Grounding - gemini-3.5-flash with googleSearch tool
  const handleSearchGrounding = async (customQuery?: string) => {
    const q = (customQuery || searchQuery).trim();
    if (!q) return;

    setIsLoading(true);
    setSearchResults(null);

    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSearchResults({
        text: data.text,
        sources: data.sources || [],
        model: data.model || 'gemini-3.5-flash'
      });
    } catch (err: any) {
      setSearchResults({
        text: 'Arama sırasında hata oluştu: ' + (err.message || 'Bilinmeyen hata'),
        sources: [],
        model: 'gemini-3.5-flash'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Google Maps Grounding - gemini-3.5-flash with googleMaps tool
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setMapsUserCoords(coords);
        setMapsLocation(`Enlem: ${coords.latitude.toFixed(4)}, Boylam: ${coords.longitude.toFixed(4)} (GPS)`);
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('GPS location error:', err);
        setIsDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  const handleMapsGrounding = async () => {
    if (!mapsQuery.trim()) return;
    setIsLoading(true);
    setMapsResult(null);

    try {
      const res = await fetch('/api/gemini/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: mapsLocation,
          query: mapsQuery,
          latLng: mapsUserCoords
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMapsResult({
        text: data.text,
        sources: data.sources || [],
        model: data.model || 'gemini-3.5-flash'
      });
    } catch (err: any) {
      setMapsResult({
        text: 'Harita araması sırasında hata: ' + (err.message || 'Bilinmeyen hata'),
        sources: [],
        model: 'gemini-3.5-flash'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Fault Diagnosis & Cost Calculation
  const handleDiagnose = async () => {
    if (!diagBrand.trim() || !diagComplaint.trim()) return;
    setIsLoading(true);
    setDiagResult(null);

    try {
      const res = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceModel: diagBrand,
          faultDescription: diagComplaint
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDiagResult(data.diagnosis);
    } catch (err: any) {
      setDiagResult({ error: err.message || 'Teşhis servisi yanıt vermedi.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Live Voice Conversations Handler (Live API: gemini-3.1-flash-live-preview)
  const handleLiveVoiceTurn = async (transcriptText: string) => {
    if (!transcriptText.trim()) return;

    const userTurn = {
      role: 'user' as const,
      text: transcriptText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    setLiveDialogueHistory(prev => [...prev, userTurn]);
    setIsLoading(true);

    // If WebSocket is connected, also send via WS
    if (liveWsRef.current && liveWsRef.current.readyState === WebSocket.OPEN) {
      liveWsRef.current.send(JSON.stringify({ text: transcriptText }));
    }

    // Call live-voice turn endpoint (resilient HTTP backup for gemini-3.1-flash-live-preview)
    try {
      const res = await fetch('/api/gemini/live-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText,
          history: liveDialogueHistory.map(h => ({ role: h.role, text: h.text }))
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setLiveVoiceReply(data.text);
      setLiveDialogueHistory(prev => [
        ...prev,
        {
          role: 'model',
          text: data.text,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (speechSynthesisEnabled) {
        speakText(data.text);
      }
    } catch (err: any) {
      console.error('Live voice error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setVoiceTranscript('Dinleniyor... Konuşun...');
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  // Role descriptions for Multi-turn Chat
  const roleMeta = {
    technician: {
      name: 'Atölye Baş Teknisyeni',
      desc: 'Anakart lehimleme, SMD/BGA entegreleri (PMIC, Tristar, Baseband) ve diyot ölçümleri',
      icon: Wrench,
      prompts: [
        'iPhone 11 şarj entegresi (Hydra/Tristar) arıza belirtileri ve diyot ölçüm değerleri nelerdir?',
        'Samsung A52 ekranda dikey çizgi var, panel mi yoksa flex kablo mu?',
        'Sıvı temaslı anakart temizliğinde ultrasonik banyo ve izopropil alkol adımları',
        'Kısa devre tespiti için multimetre diyot modunda VDD_MAIN hattı nasıl test edilir?'
      ]
    },
    parts: {
      name: 'Yedek Parça & Tedarik Danışmanı',
      desc: 'Orijinal vs Revize ekranlar, toptancı fiyatları ve tavsiye edilen kâr marjları',
      icon: Package,
      prompts: [
        'iPhone 13 OLED ekran ile Incell ekran arasındaki toptancı ve müşteri fiyat farkı ne olmalı?',
        'Deji ve Wopow bataryaların orijinal servis bataryasına göre performans ve garanti durumu',
        'Tahtakale ve Kadıköy piyasasında güncel iPhone 12 arka cam değişim işçilik tarifesi',
        'Yedek parça stoğunda tutulması gereken en kritik 5 telefon modeli'
      ]
    },
    valuation: {
      name: '2. El Ekspertiz & Değerleme',
      desc: 'Kozmetik notlandırma, batarya sağlığı yıpranması, dükkan alım-satım kâr hesabı',
      icon: Smartphone,
      prompts: [
        'Pil sağlığı %81 olan, kasada ufak kılcal çizikli iPhone 11 64GB dükkan alış ve satış fiyatı',
        'Ekranı değişmiş True Tone çalışmayan iPhone 12 ne kadar değer kaybeder?',
        'Kayıtsız yurt dışı cihaz alımında IMEI ve e-Devlet sorgulama risk analizi',
        '2. el telefon alırken müşteriden alınması gereken yasal taahhütname maddeleri'
      ]
    },
    customer: {
      name: 'Müşteri Kabul & Garanti Danışmanı',
      desc: 'Müşteriye şeffaf fiyat teklifi hazırlama, 6 ay servis garantisi ve risk onay metinleri',
      icon: Briefcase,
      prompts: [
        'Müşteriye ekran değişimi öncesi Face ID ve veri kaybı risk uyarısı metni hazırla',
        'Müşteriye anakart onarımı için 3 gün süre ve şeffaf tamir teklif metni yaz',
        'Sıvı temaslı cihaz tamirinde garanti verilmeyeceğine dair müşteriye kibar bilgilendirme',
        '6 ay ekran dokunmatik garantisi şartlarını listeleyen dükkan fiş metni'
      ]
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Feature Navigation */}
      <div
        className={`p-4 rounded-2xl border transition-colors ${
          theme === 'light-card'
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
              <Bot size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight">Osman Usta AI Danışmanı & Workspace</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles size={10} /> Gemini 3.5 & Live API
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Rol bazlı çok turlu sohbet, Google Arama ile canlı piyasa fiyatları, Google Haritalar ile toptancılar ve eller serbest canlı sesli asistan
              </p>
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <span className="text-xs font-semibold text-zinc-400">Gemini Modeli:</span>
            <select
              value={selectedModel}
              onChange={(e: any) => setSelectedModel(e.target.value)}
              className="text-xs font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Genel Görevler - Dengeli & Hızlı)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Hızlı Yanıtlar)</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Gelişmiş Zeka & Muhakeme)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Karmaşık Anakart & Şema Analizi)</option>
            </select>
          </div>
        </div>

        {/* Feature Mode Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto mt-4 pt-3 border-t border-zinc-800">
          <button
            onClick={() => setActiveMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeMode === 'chat'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <MessageSquare size={14} />
            <span>Çok Turlu Usta Sohbeti</span>
          </button>

          <button
            onClick={() => setActiveMode('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeMode === 'search'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Search size={14} />
            <span>Google Arama & Fiyat (Grounding)</span>
          </button>

          <button
            onClick={() => setActiveMode('maps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeMode === 'maps'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <MapPin size={14} />
            <span>Google Harita Toptancılar (Grounding)</span>
          </button>

          <button
            onClick={() => setActiveMode('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeMode === 'voice'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Radio size={14} />
            <span>Canlı Sesli Sohbet (Live API)</span>
          </button>

          <button
            onClick={() => setActiveMode('diagnose')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeMode === 'diagnose'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Cpu size={14} />
            <span>Arıza & Maliyet Çıkarıcı</span>
          </button>
        </div>
      </div>

      {/* MODE 1: MULTI-TURN GEMINI CHATBOT WITH SPECIFIC ROLES */}
      {activeMode === 'chat' && (
        <div
          className={`rounded-2xl border flex flex-col h-[650px] overflow-hidden ${
            theme === 'light-card' ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          {/* Chatbot Role Switcher Banner */}
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Layers size={13} /> Chatbot Uzmanlık Rolü:
              </span>
              <span className="text-[11px] text-zinc-400 italic">
                {roleMeta[selectedRole].desc}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(roleMeta) as ChatRole[]).map((r) => {
                const Icon = roleMeta[r].icon;
                const isSel = selectedRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isSel
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">{roleMeta[r].name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages Thread (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-orange-600 text-white rounded-br-none shadow-xs'
                      : theme === 'light-card'
                      ? 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                      : 'bg-zinc-800/80 text-zinc-100 rounded-bl-none border border-zinc-700/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] opacity-60">
                    <span>{msg.timestamp}</span>
                    <div className="flex items-center gap-2">
                      {msg.role && <span className="capitalize">{msg.role}</span>}
                      {msg.model && <span className="font-mono">{msg.model}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Loader2 size={16} className="animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 flex items-center gap-2">
                  <Sparkles size={14} className="text-orange-400" />
                  <span>Usta {selectedModel} modeliyle yanıt hazırlıyor...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Bar based on selected role */}
          <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/40 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0">Örnekler:</span>
            {roleMeta[selectedRole].prompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendChat(qp)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 whitespace-nowrap transition-colors cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-zinc-800 flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder={`${roleMeta[selectedRole].name} için bir soru yazın...`}
              className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm rounded-xl px-4 py-2.5 border border-zinc-700 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={() => handleSendChat()}
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Send size={15} />
              <span>Gönder</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: GOOGLE SEARCH GROUNDING */}
      {activeMode === 'search' && (
        <div
          className={`p-5 rounded-2xl border space-y-4 ${
            theme === 'light-card' ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400">
              <Search size={18} />
              <h2 className="font-bold text-sm sm:text-base">Google Arama ile Canlı Piyasa & Parça Fiyat Sorgulama</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              gemini-3.5-flash + googleSearch
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Telefon tamir parçaları (ekran, batarya, kasa, soket) için Türkiye toptancı piyasasını ve güncel parça fiyatlarını Google Search Grounding ile tarar ve kaynak bağlantılarını listeler.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchGrounding()}
              placeholder="Örn: iPhone 13 Pro Max OLED ekran toptancı fiyatı ve müşteri satış tavsiyesi"
              className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm rounded-xl px-4 py-2.5 border border-zinc-700 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSearchGrounding()}
              disabled={isLoading || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>Piyasayı Ara</span>
            </button>
          </div>

          {/* Search Result Display with Grounding URLs */}
          {searchResults && (
            <div className="mt-4 p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Google Arama Doğrulamalı Sonuç
                </span>
                <span className="text-[11px] font-mono text-zinc-400">{searchResults.model}</span>
              </div>
              <div className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {searchResults.text}
              </div>

              {searchResults.sources && searchResults.sources.length > 0 && (
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Doğrulanan Web Kaynakları ({searchResults.sources.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-blue-300 border border-zinc-700 hover:border-blue-500 transition-colors"
                      >
                        <ExternalLink size={12} className="shrink-0" />
                        <span className="max-w-[240px] truncate">{s.title || s.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: GOOGLE MAPS GROUNDING */}
      {activeMode === 'maps' && (
        <div
          className={`p-5 rounded-2xl border space-y-4 ${
            theme === 'light-card' ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <MapPin size={18} />
              <h2 className="font-bold text-sm sm:text-base">Google Haritalar ile Yakındaki Toptancı & Tedarikçileri Bul</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              gemini-3.5-flash + googleMaps
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Acil ekran, batarya, anakart lehim ekipmanı veya mikroskop gerektiğinde çevrenizdeki açık toptancıları Google Maps verisiyle listeler ve doğrudan harita bağlantılarını sunar.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Konum / Bölge</label>
                <button
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <Navigation size={10} />
                  <span>{isDetectingLocation ? 'Konum Alınıyor...' : 'GPS Konumumu Al'}</span>
                </button>
              </div>
              <input
                type="text"
                value={mapsLocation}
                onChange={(e) => setMapsLocation(e.target.value)}
                placeholder="Örn: Kadıköy, İstanbul veya Tahtakale"
                className="w-full bg-zinc-800 text-zinc-100 text-xs sm:text-sm rounded-xl px-3 py-2 border border-zinc-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Ne Arıyorsunuz?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mapsQuery}
                  onChange={(e) => setMapsQuery(e.target.value)}
                  placeholder="Örn: Telefon yedek parça toptancıları, ekran ithalatçıları veya lehim malzemesi"
                  className="flex-1 bg-zinc-800 text-zinc-100 text-xs sm:text-sm rounded-xl px-3 py-2 border border-zinc-700 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleMapsGrounding}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Compass size={16} />}
                  <span>Haritada Bul</span>
                </button>
              </div>
            </div>
          </div>

          {/* Maps Grounding Output with Direct Google Maps Links */}
          {mapsResult && (
            <div className="mt-4 p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <MapPin size={14} /> Tedarikçi ve Konum Önerileri
                </span>
                <span className="text-[11px] font-mono text-zinc-400">{mapsResult.model}</span>
              </div>
              <div className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {mapsResult.text}
              </div>

              {mapsResult.sources && mapsResult.sources.length > 0 && (
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Google Harita Konum Bağlantıları ({mapsResult.sources.length}):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mapsResult.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col gap-1 text-xs p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-emerald-500 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5 truncate">
                            <MapPin size={13} className="shrink-0" />
                            {s.title}
                          </span>
                          <ExternalLink size={12} className="text-zinc-500 shrink-0" />
                        </div>
                        {s.snippets && s.snippets.length > 0 && (
                          <p className="text-[11px] text-zinc-400 line-clamp-2 italic">
                            "{s.snippets[0]}"
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 4: LIVE VOICE CONVERSATIONS (gemini-3.1-flash-live-preview) */}
      {activeMode === 'voice' && (
        <div
          className={`p-6 rounded-2xl border text-center space-y-6 ${
            theme === 'light-card' ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Radio size={14} className="animate-pulse" />
              <span>Live API Canlı Ses: gemini-3.1-flash-live-preview</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-zinc-100">
              Eller Serbest Canlı Atölye Asistanı
            </h2>
            <p className="text-xs text-zinc-400">
              Elleriniz lehim makinesi, mikroskop veya cımbızla meşgulken dilediğiniz teknik arızayı veya fiyatı sesli sorun.
              Canlı Gemini Live API gerçek zamanlı dinler ve hoparlörden anında sesli yanıt verir.
            </p>
          </div>

          {/* Connection & Live Status Pill */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                liveWsConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-zinc-400">
              {liveWsConnected
                ? 'WebSocket Canlı Ses Oturumu Aktif (/live)'
                : 'Canlı Ses Servisi Hazır (gemini-3.1-flash-live-preview)'}
            </span>
          </div>

          {/* Giant Mic Interactive Control */}
          <div className="flex flex-col items-center justify-center py-2">
            <button
              onClick={toggleListening}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all cursor-pointer relative shadow-2xl ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-500/40 scale-105'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-4 border-zinc-700'
              }`}
            >
              {isListening ? <Mic size={50} /> : <MicOff size={50} className="opacity-70" />}
            </button>

            <span className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {isListening ? '🔴 Dinleniyor... Konuşun (Bitince otomatik yanıtlar)' : 'Konuşmaya Başlamak İçin Mikrofona Dokunun'}
            </span>

            {voiceTranscript && (
              <div className="mt-3 max-w-lg p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono">
                🎙️ "{voiceTranscript}"
              </div>
            )}
          </div>

          {/* Voice Response Toggle */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-zinc-800">
            <button
              onClick={() => setSpeechSynthesisEnabled(!speechSynthesisEnabled)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {speechSynthesisEnabled ? (
                <Volume2 size={16} className="text-emerald-400" />
              ) : (
                <VolumeX size={16} className="text-zinc-500" />
              )}
              <span>{speechSynthesisEnabled ? 'Hoparlörden Sesli Yanıt Açık' : 'Sesli Yanıt Kapalı'}</span>
            </button>
          </div>

          {/* Live Dialogue Thread */}
          <div className="max-w-2xl mx-auto text-left space-y-2 pt-4">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Canlı Sesli Görüşme Kayıtları:</p>
            <div className="space-y-2 max-h-52 overflow-y-auto p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              {liveDialogueHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-xs flex gap-2 ${
                    item.role === 'user'
                      ? 'bg-orange-600/20 text-orange-200 border border-orange-500/30 justify-end'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] opacity-60">
                      <span className="font-bold">{item.role === 'user' ? 'Usta' : 'Gemini Live Asistan'}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                    <div>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 5: DIAGNOSIS & COST ESTIMATOR */}
      {activeMode === 'diagnose' && (
        <div
          className={`p-5 rounded-2xl border space-y-4 ${
            theme === 'light-card' ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2 text-purple-400">
            <Cpu size={18} />
            <h2 className="font-bold text-sm sm:text-base">Yapay Zeka Destekli Arıza Teşhis & Maliyet Çıkarıcı</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Cihaz modeli ve müşteri şikayetini girin; olası arıza nedenini, kontrol edilecek entegreleri ve tavsiye edilen işçilik fiyatını anında hesaplasın.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Cihaz Modeli</label>
              <input
                type="text"
                value={diagBrand}
                onChange={(e) => setDiagBrand(e.target.value)}
                placeholder="Örn: iPhone 11 Pro veya Xiaomi Redmi Note 10"
                className="w-full bg-zinc-800 text-zinc-100 text-xs sm:text-sm rounded-xl px-3 py-2 border border-zinc-700 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Müşteri Şikayeti / Belirti</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={diagComplaint}
                  onChange={(e) => setDiagComplaint(e.target.value)}
                  placeholder="Örn: Cihaz şarj almıyor, USB tester'da 0.02A çekip kesiyor"
                  className="flex-1 bg-zinc-800 text-zinc-100 text-xs sm:text-sm rounded-xl px-3 py-2 border border-zinc-700 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleDiagnose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  <span>Teşhis Et</span>
                </button>
              </div>
            </div>
          </div>

          {diagResult && (
            <div className="mt-4 p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Cpu size={15} /> Atölye Teşhis Raporu
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">Otomatik Analiz</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Muhtemel Kök Neden:</p>
                  <p className="text-xs sm:text-sm text-zinc-100 font-medium bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    {diagResult.rootCause || diagResult.rawText || 'Analiz tamamlandı.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Şüpheli Entegre / Parçalar:</p>
                  <div className="flex flex-wrap gap-1.5 bg-zinc-900 p-3 rounded-lg border border-zinc-800 min-h-[50px]">
                    {diagResult.suspectedParts && Array.isArray(diagResult.suspectedParts) ? (
                      diagResult.suspectedParts.map((p: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400">Entegre listesi ayrıştırılamadı.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-medium">Tahmini Tamir Süresi</span>
                  <p className="text-sm font-bold text-zinc-100 mt-0.5">{diagResult.estimatedTime || '1-2 Saat'}</p>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-medium">Tahmini Parça Maliyeti</span>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">
                    ₺{diagResult.estimatedPartCostTl ? diagResult.estimatedPartCostTl.toLocaleString('tr-TR') : '400 - 800'}
                  </p>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-medium">Tavsiye Edilen Müşteri Fiyatı</span>
                  <p className="text-base font-black text-emerald-400 mt-0.5">
                    ₺{diagResult.recommendedSalePriceTl ? diagResult.recommendedSalePriceTl.toLocaleString('tr-TR') : '1.200 - 1.600'}
                  </p>
                </div>
              </div>

              {diagResult.technicianNote && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Teknisyen Uyarısı: </span>
                    <span>{diagResult.technicianNote}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
