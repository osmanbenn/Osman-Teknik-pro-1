import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  X,
  Wrench,
  ShoppingCart,
  LayoutDashboard,
  Package,
  Users,
  Banknote,
  DollarSign,
  QrCode,
  Award,
  Sparkles,
  Printer,
  Search,
  CheckCircle2
} from 'lucide-react';
import { NavigationTab } from '../types';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: NavigationTab) => void;
  onOpenServiceIntake?: () => void;
  onOpenCalculator?: () => void;
}

interface ShortcutItem {
  keys: string[];
  title: string;
  description: string;
  category: 'servis' | 'satis' | 'navigasyon' | 'araclar';
  action?: () => void;
  badge?: string;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenServiceIntake,
  onOpenCalculator
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'servis' | 'satis' | 'navigasyon' | 'araclar'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [lastPressedKey, setLastPressedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyStr = e.key.toUpperCase();
      setLastPressedKey(keyStr);
      const timer = setTimeout(() => setLastPressedKey(null), 1500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcuts: ShortcutItem[] = [
    // Servis
    {
      keys: ['F2'],
      title: 'Yeni Cihaz Servis Kabulü',
      description: 'Hemen yeni arızalı cihaz giriş formu açar',
      category: 'servis',
      badge: 'En Çok Kullanılan',
      action: () => {
        onClose();
        if (onOpenServiceIntake) onOpenServiceIntake();
      }
    },
    {
      keys: ['Alt', 'S'],
      title: 'Servis Kabul Formu (Alternatif)',
      description: 'F-tuşu olmayan kompakt klavyeler için hızlı açılış',
      category: 'servis',
      action: () => {
        onClose();
        if (onOpenServiceIntake) onOpenServiceIntake();
      }
    },
    {
      keys: ['Alt', '2'],
      title: 'Teknik Servis Listesi',
      description: 'Aktif tamirler, aşamalar ve yedek parça ekranına gider',
      category: 'servis',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('servis');
      }
    },
    {
      keys: ['Alt', 'Q'],
      title: 'Müşteri QR Takip Portalı',
      description: 'Müşterinin cihaz durumunu QR ile canlı sorguladığı ekran',
      category: 'servis',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('takip');
      }
    },
    {
      keys: ['Alt', 'P'],
      title: 'Teknisyen Performans Tablosu',
      description: 'Teknisyenlerin tamir sayıları ve iş yükü',
      category: 'servis',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('teknisyen');
      }
    },

    // Hızlı Satış / POS
    {
      keys: ['F3'],
      title: 'Hızlı Satış (Kasa / POS)',
      description: 'Aksesuar satışı, kılıf, cam ve slip kesme ekranına geçer',
      category: 'satis',
      badge: 'Satış & Kasa',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('satis');
      }
    },
    {
      keys: ['Alt', '1'],
      title: 'Hızlı Satışa Git (Alternatif)',
      description: 'Satış masasına hızlı geçiş',
      category: 'satis',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('satis');
      }
    },
    {
      keys: ['F4'],
      title: 'Nakit Satışı Tamamla',
      description: 'Satış sepetini nakit ödeme ile kaydeder ve 58/80 mm slip keser',
      category: 'satis',
      badge: 'POS Kasa'
    },
    {
      keys: ['F8'],
      title: 'Kredi Kartı ile Satışı Tamamla',
      description: 'Satış sepetini pos/kredi kartı tahsilatı ile sonlandırır',
      category: 'satis',
      badge: 'POS Kasa'
    },
    {
      keys: ['F9'],
      title: 'Havale / EFT ile Satış',
      description: 'Satış sepetini banka havalesi ile onaylar',
      category: 'satis',
      badge: 'POS Kasa'
    },
    {
      keys: ['Alt', 'C'],
      title: 'Sepeti Temizle / Sıfırla',
      description: 'Aktif satış sepetindeki tüm ürünleri boşaltır',
      category: 'satis'
    },

    // Navigasyon
    {
      keys: ['Alt', 'D'],
      title: 'Dashboard / Ana Ekran',
      description: 'Günlük ciro, bekleyen servisler ve kritik uyarılar',
      category: 'navigasyon',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('dashboard');
      }
    },
    {
      keys: ['Alt', '3'],
      title: 'Stok & Yedek Parça',
      description: 'Ekran, batarya, kılıf ve aksesuar stok takibi',
      category: 'navigasyon',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('stok');
      }
    },
    {
      keys: ['Alt', '4'],
      title: 'Cari & Veresiye Defteri',
      description: 'Müşteri borçları, taksitler ve toptancı hesapları',
      category: 'navigasyon',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('cari');
      }
    },
    {
      keys: ['Alt', '5'],
      title: 'Kasa & Gün Sonu',
      description: 'Nakit giriş-çıkışları, Z raporu ve kasa devri',
      category: 'navigasyon',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('kasa');
      }
    },
    {
      keys: ['Alt', 'T'],
      title: 'Telefon Alım / Satım',
      description: '2. el cihaz alım tutanağı, IMEI kontrolü ve vitrin satışı',
      category: 'navigasyon',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('telefon');
      }
    },
    {
      keys: ['Alt', 'A'],
      title: 'AI Akıllı Asistan',
      description: 'Gemini destekli arıza tespit ve teknik rehber',
      category: 'navigasyon',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('ai');
      }
    },

    // Araçlar & Sistem
    {
      keys: ['F1'],
      title: 'Klavye Kısayolları Rehberi',
      description: 'Bu yardım penceresini açar',
      category: 'araclar',
      badge: 'Yardım'
    },
    {
      keys: ['F10'],
      title: 'Canlı USD ⇄ TL Çevirici',
      description: 'Döviz kurlu parça maliyet hesaplama penceresi',
      category: 'araclar',
      action: () => {
        onClose();
        if (onOpenCalculator) onOpenCalculator();
      }
    },
    {
      keys: ['Alt', 'K'],
      title: 'USD Çevirici (Alternatif)',
      description: 'Döviz çevirici ve kar hesaplama',
      category: 'araclar',
      action: () => {
        onClose();
        if (onOpenCalculator) onOpenCalculator();
      }
    },
    {
      keys: ['Esc'],
      title: 'Pencereyi / Modalı Kapat',
      description: 'Açık olan herhangi bir diyaloğu veya fiş önizlemesini kapatır',
      category: 'araclar'
    }
  ];

  const filteredShortcuts = shortcuts.filter(s => {
    if (activeCategory !== 'all' && s.category !== activeCategory) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchDesc = s.description.toLowerCase().includes(q);
      const matchKeys = s.keys.join(' ').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchKeys;
    }
    return true;
  });

  const handlePrintCheatSheet = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Keyboard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Hızlı Klavye Kısayolları</h3>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                  POS & Servis Hızlandırma
                </span>
              </div>
              <p className="text-xs text-zinc-400">Fare kullanmadan tek tuşla yeni servis açın, satış yapın ve modüller arasında geçiş yapın</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCheatSheet}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Kısayol Tablosunu Yazdır / Çıktı Al"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'servis', label: '🛠️ Servis' },
              { id: 'satis', label: '🛒 Hızlı Satış' },
              { id: 'navigasyon', label: '🧭 Sayfalar' },
              { id: 'araclar', label: '⚡ Araçlar' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Kısayol veya işlem ara..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-orange-500"
            />
          </div>
        </div>

        {/* Key Press Test Banner (Interactive) */}
        {lastPressedKey && (
          <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 text-xs text-orange-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-orange-400" />
              <span>Algılanan Tuş:</span>
              <kbd className="px-2 py-0.5 rounded bg-orange-500 text-black font-mono font-black text-xs">
                {lastPressedKey}
              </kbd>
            </div>
            <span className="text-[11px] text-orange-400/80">Klavye dinleyicisi aktif</span>
          </div>
        )}

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredShortcuts.map((s, idx) => {
              const isHighlighted = lastPressedKey && s.keys.some(k => k.toUpperCase() === lastPressedKey);

              return (
                <div
                  key={idx}
                  onClick={s.action}
                  className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    s.action ? 'cursor-pointer hover:border-orange-500/60 hover:bg-zinc-800/80' : 'bg-zinc-900/60 border-zinc-800'
                  } ${
                    isHighlighted ? 'border-orange-500 bg-orange-500/15 shadow-md shadow-orange-500/10' : 'border-zinc-800 bg-zinc-950/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white">{s.title}</span>
                      {s.badge && (
                        <span className="text-[9px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.2 rounded font-medium">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{s.description}</p>
                  </div>

                  {/* Keycaps */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {s.keys.map((k, ki) => (
                      <React.Fragment key={ki}>
                        <kbd
                          className={`min-w-[28px] h-7 px-2 rounded-lg font-mono text-xs font-black inline-flex items-center justify-center shadow-xs border transition-all ${
                            isHighlighted
                              ? 'bg-orange-500 text-black border-orange-400'
                              : 'bg-zinc-800 text-zinc-200 border-zinc-700 shadow-zinc-950'
                          }`}
                        >
                          {k}
                        </kbd>
                        {ki < s.keys.length - 1 && (
                          <span className="text-zinc-500 text-xs font-bold">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredShortcuts.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Aramanıza uygun klavye kısayolu bulunamadı.
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Kısayollar tüm sayfalarda ve formlarda arka planda hazırdır.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">Pencereyi kapatmak için:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono text-[10px]">ESC</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
