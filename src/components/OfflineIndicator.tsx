import React, { useEffect, useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const { language } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3d2010] text-white text-[11px] font-medium shadow-lg border border-[#ffd5bc]/30 animate-pulse">
      <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
      <span>
        {language === 'mr'
          ? 'ऑफलाइन मोड — डेटा मोबाईलमध्ये सुरक्षित आहे'
          : 'Offline Mode — Saved locally'}
      </span>
    </div>
  );
};
