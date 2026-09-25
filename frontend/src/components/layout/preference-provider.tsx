'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { settingsService } from '@/service/api/v2/auth';

type Locale = 'en' | 'zh';
type PreferenceContextValue = {
  locale: Locale;
  changeLocale: (next: Locale) => Promise<void>;
  applyLocale: (next: Locale) => void;
  applyTheme: (next: 'light' | 'dark' | 'system') => void;
};

const PreferenceContext = createContext<PreferenceContextValue | null>(null);

export function PreferenceProvider({ children, initialLocale = 'en', initialTheme = 'system', hasInitialPreferences = false }: {
  children: ReactNode;
  initialLocale?: Locale;
  initialTheme?: 'light' | 'dark' | 'system';
  hasInitialPreferences?: boolean;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const { setTheme } = useTheme();
  const applyLocale = useCallback((next: Locale) => {
    setLocale(next);
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  }, []);
  const applyTheme = useCallback((next: 'light' | 'dark' | 'system') => setTheme(next), [setTheme]);

  useEffect(() => {
    applyLocale(initialLocale);
    applyTheme(initialTheme);
  }, [applyLocale, applyTheme, initialLocale, initialTheme]);

  useEffect(() => {
    if (hasInitialPreferences) return;
    let active = true;
    settingsService.getPreferences().then((response) => {
      if (!active) return;
      applyLocale(response.data.language === 'zh' ? 'zh' : 'en');
      applyTheme(response.data.theme);
    }).catch(() => { /* The page remains usable if preferences are unavailable. */ });
    return () => { active = false; };
  }, [applyLocale, applyTheme, hasInitialPreferences]);

  const changeLocale = useCallback(async (next: Locale) => {
    const previous = locale;
    applyLocale(next);
    try {
      await settingsService.updatePreferences({ language: next });
    } catch (error) {
      applyLocale(previous);
      throw error;
    }
  }, [applyLocale, locale]);

  return <PreferenceContext.Provider value={{ locale, changeLocale, applyLocale, applyTheme }}>{children}</PreferenceContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferenceContext);
  if (!value) throw new Error('usePreferences requires PreferenceProvider');
  return value;
}
