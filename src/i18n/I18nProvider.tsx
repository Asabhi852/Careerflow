'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'kn';

type Translations = Record<string, string>;

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  te: 'తెలుగు (Telugu)',
  ta: 'தமிழ் (Tamil)',
  kn: 'ಕನ್ನಡ (Kannada)',
};

const DICTS: Record<LanguageCode, Translations> = {
  en: {
    nav_jobs: 'Jobs',
    nav_posts: 'Posts',
    nav_ai_match: 'AI Match',
    nav_candidates: 'Candidates',
    chatbot_welcome: "👋 Hi! I'm your AI career assistant. How can I help you today?",
    chatbot_placeholder: 'Type your message...',
    chatbot_typing: 'Typing...',
    chatbot_online: 'Online now',
    chatbot_select_language: 'Select Language',
  },
  hi: {
    nav_jobs: 'नौकरियां',
    nav_posts: 'पोस्ट',
    nav_ai_match: 'एआई मिलान',
    nav_candidates: 'उम्मीदवार',
    chatbot_welcome: '👋 नमस्ते! मैं आपका एआई करियर असिस्टेंट हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?',
    chatbot_placeholder: 'अपना संदेश लिखें...',
    chatbot_typing: 'लिख रहे हैं...',
    chatbot_online: 'अभी ऑनलाइन',
    chatbot_select_language: 'भाषा चुनें',
  },
  te: {
    nav_jobs: 'ఉద్యోగాలు',
    nav_posts: 'పోస్టులు',
    nav_ai_match: 'ఏఐ మ్యాచ్',
    nav_candidates: 'అభ్యర్థులు',
    chatbot_welcome: '👋 హలో! నేను మీ AI కెరీర్ సహాయకుడు. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?',
    chatbot_placeholder: 'మీ సందేశాన్ని టైప్ చేయండి...',
    chatbot_typing: 'టైప్ చేస్తున్నాను...',
    chatbot_online: 'ఇప్పుడు ఆన్‌లైన్',
    chatbot_select_language: 'భాషను ఎంచుకోండి',
  },
  ta: {
    nav_jobs: 'வேலைகள்',
    nav_posts: 'பதிவுகள்',
    nav_ai_match: 'ஏஐ பொருத்தம்',
    nav_candidates: 'வேட்பாளர்கள்',
    chatbot_welcome: '👋 வணக்கம்! நான் உங்கள் AI தொழில் உதவியாளர். இன்று உங்களுக்கு எப்படி உதவலாம்?',
    chatbot_placeholder: 'உங்கள் செய்தியை தட்டச்சு செய்யுங்கள்...',
    chatbot_typing: 'தட்டச்சு செய்கிறது...',
    chatbot_online: 'இப்போது ஆன்லைனில்',
    chatbot_select_language: 'மொழியைத் தேர்ந்தெடுக்கவும்',
  },
  kn: {
    nav_jobs: 'ಉದ್ಯೋಗಗಳು',
    nav_posts: 'ಪೋಸ್ಟ್‌ಗಳು',
    nav_ai_match: 'ಎಐ ಹೊಂದಾಣಿಕೆ',
    nav_candidates: 'ಅಭ್ಯರ್ಥಿಗಳು',
    chatbot_welcome: '👋 ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ವೃತ್ತಿ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    chatbot_placeholder: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
    chatbot_typing: 'ಟೈಪ್ ಮಾಡುತ್ತಿದೆ...',
    chatbot_online: 'ಈಗ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿದೆ',
    chatbot_select_language: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
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


