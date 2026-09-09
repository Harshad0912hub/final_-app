import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Language,
  TranslationKey,
  t as translateHelper,
  formatNumberByLang,
  MARATHI_DAYS,
  ENGLISH_DAYS,
  MARATHI_MONTHS,
  ENGLISH_MONTHS,
} from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  formatNum: (val: number | string) => string;
  formatCurrency: (val: number | string) => string;
  formatDate: (date: Date) => { dayName: string; dateFull: string };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('shravani_lang');
      if (saved === 'en' || saved === 'mr') return saved;
    } catch {
      // ignore
    }
    return 'mr'; // Marathi by default
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('shravani_lang', lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'mr' ? 'en' : 'mr');
  };

  const t = (key: TranslationKey) => translateHelper(key, language);

  const formatNum = (val: number | string) => formatNumberByLang(val, language);

  const formatCurrency = (val: number | string) => `₹${formatNumberByLang(val, language)}`;

  const formatDate = (date: Date) => {
    const dayIndex = date.getDay();
    const monthIndex = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();

    if (language === 'mr') {
      return {
        dayName: MARATHI_DAYS[dayIndex],
        dateFull: `${formatNumberByLang(day, 'mr')} ${MARATHI_MONTHS[monthIndex]} ${formatNumberByLang(year, 'mr')}`,
      };
    } else {
      return {
        dayName: ENGLISH_DAYS[dayIndex],
        dateFull: `${day} ${ENGLISH_MONTHS[monthIndex]} ${year}`,
      };
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatNum,
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
