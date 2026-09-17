import { useEffect } from 'react';
import { NavigationTab } from '../types';

interface UseKeyboardShortcutsProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenServiceIntake: () => void;
  onOpenShortcuts: () => void;
  onOpenCalculator: () => void;
  onCloseModals: () => void;
  hasOpenModal: boolean;
}

export const useKeyboardShortcuts = ({
  activeTab,
  onNavigate,
  onOpenServiceIntake,
  onOpenShortcuts,
  onOpenCalculator,
  onCloseModals,
  hasOpenModal
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input typing check: if typing in text/input/textarea, don't trigger simple letter keys
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const key = e.key;
      const alt = e.altKey;
      const ctrl = e.ctrlKey || e.metaKey;

      // 1. ESCAPE: Close any modal
      if (key === 'Escape') {
        if (hasOpenModal) {
          e.preventDefault();
          onCloseModals();
          return;
        }
      }

      // 2. F1: Help / Shortcuts modal
      if (key === 'F1' || (alt && key === '/')) {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }

      // 3. F2 or Alt+S: Yeni Servis Kabul Kaydı Aç
      if (key === 'F2' || (alt && (key === 's' || key === 'S'))) {
        e.preventDefault();
        onOpenServiceIntake();
        return;
      }

      // 4. F3 or Alt+1: Hızlı Satış (POS)
      if (key === 'F3' || (alt && key === '1')) {
        e.preventDefault();
        onNavigate('satis');
        return;
      }

      // 5. F4: In Satis -> Nakit Satış Tamamla. Outside Satis -> Go to Servis
      if (key === 'F4') {
        e.preventDefault();
        if (activeTab === 'satis') {
          window.dispatchEvent(
            new CustomEvent('osman-pos:complete-sale', {
              detail: { method: 'nakit' }
            })
          );
        } else {
          onNavigate('servis');
        }
        return;
      }

      // 6. F8: In Satis -> Kredi Kartı ile Satış Tamamla. Outside Satis -> Go to Kasa
      if (key === 'F8') {
        e.preventDefault();
        if (activeTab === 'satis') {
          window.dispatchEvent(
            new CustomEvent('osman-pos:complete-sale', {
              detail: { method: 'kart' }
            })
          );
        } else {
          onNavigate('kasa');
        }
        return;
      }

      // 7. F9: In Satis -> Havale Satış Tamamla. Outside Satis -> Go to Dashboard
      if (key === 'F9') {
        e.preventDefault();
        if (activeTab === 'satis') {
          window.dispatchEvent(
            new CustomEvent('osman-pos:complete-sale', {
              detail: { method: 'havale' }
            })
          );
        } else {
          onNavigate('dashboard');
        }
        return;
      }

      // 8. F10 or Alt+K: Canlı USD Çevirici
      if (key === 'F10' || (alt && (key === 'k' || key === 'K'))) {
        e.preventDefault();
        onOpenCalculator();
        return;
      }

      // 9. Alt + [Key] Combinations for Navigation
      if (alt) {
        switch (key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            onNavigate('dashboard');
            break;
          case '2':
            e.preventDefault();
            onNavigate('servis');
            break;
          case '3':
            e.preventDefault();
            onNavigate('stok');
            break;
          case '4':
            e.preventDefault();
            onNavigate('cari');
            break;
          case '5':
            e.preventDefault();
            onNavigate('kasa');
            break;
          case 't':
            e.preventDefault();
            onNavigate('telefon');
            break;
          case 'a':
            e.preventDefault();
            onNavigate('ai');
            break;
          case 'q':
            e.preventDefault();
            onNavigate('takip');
            break;
          case 'p':
            e.preventDefault();
            onNavigate('teknisyen');
            break;
          case 'c':
            if (activeTab === 'satis') {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('osman-pos:clear-cart'));
            }
            break;
          default:
            break;
        }
      }

      // 10. Single Question Mark '?' when not typing in an input
      if (key === '?' && !isTyping && !alt && !ctrl) {
        e.preventDefault();
        onOpenShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    onNavigate,
    onOpenServiceIntake,
    onOpenShortcuts,
    onOpenCalculator,
    onCloseModals,
    hasOpenModal
  ]);
};
