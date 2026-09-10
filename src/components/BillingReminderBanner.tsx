import React, { useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';

interface BillingReminderBannerProps {
  reminderDay: number;
  unbilledCount: number;
  onGoToReports: () => void;
}

// Ordinal day-of-month label so a dismiss key like "2026-09" doesn't
// re-show the banner every day of the same month after being dismissed.
function monthDismissKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const BillingReminderBanner: React.FC<BillingReminderBannerProps> = ({
  reminderDay,
  unbilledCount,
  onGoToReports,
}) => {
  const { language, formatNum } = useLanguage();
  const [dismissedMonth, setDismissedMonth] = useState<string | null>(() => {
    try {
      return localStorage.getItem('shravani_billing_banner_dismissed');
    } catch {
      return null;
    }
  });

  const today = new Date();
  const isBillingDay = today.getDate() >= reminderDay;
  const currentMonth = monthDismissKey();

  if (!isBillingDay || unbilledCount <= 0 || dismissedMonth === currentMonth) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedMonth(currentMonth);
    try {
      localStorage.setItem('shravani_billing_banner_dismissed', currentMonth);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-3 mt-2 mb-1 p-3 bg-linear-to-r from-[#fff3eb] to-[#ffebd8] border border-[#ffd5bc] rounded-2xl flex items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-[#a33900] text-white flex items-center justify-center shrink-0 shadow-xs">
          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-[#0b1c30] leading-snug truncate">
            {language === 'mr' ? 'आज बिलिंग दिवस आहे' : "It's billing day"}
          </p>
          <p className="text-[11px] text-[#5a4138] leading-tight">
            {language === 'mr'
              ? `${formatNum(unbilledCount)} ग्राहकांना अजून या महिन्याचे बिल पाठवले नाही`
              : `${formatNum(unbilledCount)} customers haven't been sent this month's bill yet`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onGoToReports}
          className="h-8 px-3.5 rounded-full bg-[#a33900] hover:bg-[#852f00] text-white text-[11px] font-bold active:scale-95 transition-all shadow-xs flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          <span>{language === 'mr' ? 'बघा' : 'View'}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="w-7 h-7 rounded-full text-[#5a4138] hover:bg-black/5 flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
};
