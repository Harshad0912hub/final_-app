import React, { useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';

interface OverdueCustomer {
  id: string;
  name: string;
  due: number;
}

interface PendingDuesBannerProps {
  enabled: boolean;
  overdueCustomers: OverdueCustomer[];
  onGoToReports: () => void;
}

function monthDismissKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const PendingDuesBanner: React.FC<PendingDuesBannerProps> = ({
  enabled,
  overdueCustomers,
  onGoToReports,
}) => {
  const { language, formatCurrency } = useLanguage();
  const [dismissedMonth, setDismissedMonth] = useState<string | null>(() => {
    try {
      return localStorage.getItem('shravani_dues_banner_dismissed');
    } catch {
      return null;
    }
  });

  const currentMonth = monthDismissKey();

  if (!enabled || overdueCustomers.length === 0 || dismissedMonth === currentMonth) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedMonth(currentMonth);
    try {
      localStorage.setItem('shravani_dues_banner_dismissed', currentMonth);
    } catch {
      // ignore
    }
  };

  const visible = overdueCustomers.slice(0, 4);
  const remaining = overdueCustomers.length - visible.length;

  return (
    <div className="mx-3 mt-2 mb-1 p-3 bg-linear-to-r from-[#ffece4] to-[#ffdcd6] border border-[#ffbcae] rounded-2xl shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-[#0b1c30] leading-snug truncate">
              {language === 'mr' ? 'मागील महिन्याची थकीत रक्कम' : "Last month's dues still pending"}
            </p>
            <p className="text-[11px] text-[#5a4138] leading-tight">
              {language === 'mr'
                ? `${overdueCustomers.length} ग्राहकांनी अजून पूर्ण रक्कम दिली नाही`
                : `${overdueCustomers.length} customers haven't cleared their bill yet`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="w-7 h-7 rounded-full text-[#5a4138] hover:bg-black/5 flex items-center justify-center transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      <div className="flex flex-col gap-1 mt-2.5">
        {visible.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between bg-white/70 rounded-xl px-2.5 py-1.5"
          >
            <span className="text-[12.5px] font-semibold text-[#0b1c30] truncate">{c.name}</span>
            <span className="text-[12.5px] font-bold text-[#ba1a1a]">{formatCurrency(c.due)}</span>
          </div>
        ))}
        {remaining > 0 && (
          <p className="text-[11px] text-[#5a4138] text-center">
            {language === 'mr' ? `+ आणखी ${remaining} ग्राहक` : `+ ${remaining} more`}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onGoToReports}
        className="w-full mt-2.5 h-9 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white text-[12px] font-bold active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1"
      >
        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        <span>{language === 'mr' ? 'अहवालात बघा' : 'View in Reports'}</span>
      </button>
    </div>
  );
};
