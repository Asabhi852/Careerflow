'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type LanguageCode = 'en' | 'hi' | 'te' | 'ta';

type Translations = Record<string, string>;

const DICTS: Record<LanguageCode, Translations> = {
  en: {
    nav_jobs: 'Jobs',
    nav_posts: 'Posts',
    nav_ai_match: 'AI Match',
    nav_candidates: 'Candidates',
  },
  hi: {
    nav_jobs: 'नौकरियां',
    nav_posts: 'पोस्ट',
    nav_ai_match: 'एआई मिलान',
    nav_candidates: 'उम्मीदवार',
  },
  te: {
    nav_jobs: 'ఉద్యోగాలు',
    nav_posts: 'పోస్టులు',
    nav_ai_match: 'ఏఐ మ్యాచ్',
    nav_candidates: 'అభ్యర్థులు',
  },
  ta: {
    nav_jobs: 'வேலைகள்',
    nav_posts: 'பதிவுகள்',
    nav_ai_match: 'ஏஐ பொருத்தம்',
    nav_candidates: 'வேட்பாளர்கள்',
  },
};

type I18nContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('app_language') as LanguageCode | null) : null;
    if (saved) setLanguageState(saved);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') localStorage.setItem('app_language', lang);
  };

  const t = (key: string, fallback?: string) => {
    const dict = DICTS[language] || DICTS.en;
    return dict[key] ?? fallback ?? key;
  };

  const value = useMemo(() => ({ language, setLanguage, t }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


