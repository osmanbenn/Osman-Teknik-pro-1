import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';
import { safeStorage } from '../utils/storage';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  themeLabels: Record<ThemeMode, { name: string; desc: string; previewBadge: string }>;
}

const themeLabels: Record<ThemeMode, { name: string; desc: string; previewBadge: string }> = {
  'modern-dark': {
    name: 'Tasarım 1: Modern ve Koyu',
    desc: 'Karanlık arayüz, profesyonel turuncu neon vurgular',
    previewBadge: 'Koyu'
  },
  'light-card': {
    name: 'Tasarım 2: Açık ve Kartlı',
    desc: 'Ferah açık zemin, yüksek kontrastlı kartlar ve gölgeler',
    previewBadge: 'Açık'
  },
  'colorful-minimal': {
    name: 'Tasarım 3: Renkli ve Minimal',
    desc: 'Dinamik gradyanlar, canlı istatistik rozetleri',
    previewBadge: 'Renkli'
  },
  'theme-comparison': {
    name: 'Mobil Arayüz Karşılaştırması',
    desc: '3 mobil tasarımı yan yana karşılaştırma ekranı',
    previewBadge: 'Karşılaştırma'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = safeStorage.getItem('osman_theme') as ThemeMode;
    return saved && themeLabels[saved] ? saved : 'modern-dark';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    safeStorage.setItem('osman_theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.className = theme;
    if (theme === 'light-card') {
      document.body.className = 'bg-slate-100 text-slate-900 antialiased font-sans selection:bg-orange-500 selection:text-white';
    } else if (theme === 'colorful-minimal') {
      document.body.className = 'bg-slate-950 text-slate-100 antialiased font-sans selection:bg-purple-500 selection:text-white';
    } else {
      // modern-dark
      document.body.className = 'bg-zinc-950 text-zinc-100 antialiased font-sans selection:bg-orange-500 selection:text-white';
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeLabels }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
