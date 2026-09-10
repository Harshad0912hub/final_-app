import React from 'react';
import { useLanguage } from '../utils/LanguageContext';

interface OverdueCustomer {
  id: string;
  name: string;
  due: number;
}

interface NotificationsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  isBillingReminderActive: boolean;
  unbilledCount: number;
  pendingDuesEnabled: boolean;
  overdueCustomers: OverdueCustomer[];
  onGoToReports: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  isOpen,
  onClose,
  isBillingReminderActive,
  unbilledCount,
  pendingDuesEnabled,
  overdueCustomers,
  onGoToReports,
}) => {
  const { language, formatNum, formatCurrency } = useLanguage();

  if (!isOpen) return null;

  const showBilling = isBillingReminderActive && unbilledCount > 0;
  const showDues = pendingDuesEnabled && overdueCustomers.length > 0;
  const hasAnything = showBilling || showDues;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fixed inset-0 bg-[#0b1c30]/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#f8f9ff] rounded-t-[28px] shadow-2xl z-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
        <div className="w-full flex justify-center pt-2 pb-1 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-[#d3e4fe]" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-b border-[#eff4ff]">
          <h2 className="font-headline-md text-[18px] text-[#0b1c30] font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[#a33900]">notifications</span>
            {language === 'mr' ? 'सूचना' : 'Notifications'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#5a4138] hover:bg-[#eff4ff] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {!hasAnything && (
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-16 h-16 rounded-full bg-[#c8e6c9] flex items-center justify-center text-[#1b5e20] mb-3">
                <span className="material-symbols-outlined text-[32px]">task_alt</span>
              </div>
              <p className="font-body-md text-[13.5px] text-[#5a4138] max-w-[240px]">
                {language === 'mr' ? 'सर्व काही ठीक आहे! सध्या कोणतीही सूचना नाही.' : "All caught up! No notifications right now."}
              </p>
            </div>
          )}

          {showBilling && (
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-[#ffd5bc] flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#a33900] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#0b1c30] leading-snug">
                    {language === 'mr' ? 'आज बिलिंग दिवस आहे' : "It's billing day"}
                  </p>
                  <p className="text-[12px] text-[#5a4138] leading-tight">
                    {language === 'mr'
                      ? `${formatNum(unbilledCount)} ग्राहकांना अजून या महिन्याचे बिल पाठवले नाही`
                      : `${formatNum(unbilledCount)} customers haven't been sent this month's bill yet`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onGoToReports}
                className="w-full h-9 rounded-full bg-[#a33900] hover:bg-[#852f00] text-white text-[12px] font-bold active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                <span>{language === 'mr' ? 'अहवालात बघा' : 'View in Reports'}</span>
              </button>
            </div>
          )}

          {showDues && (
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-[#ffbcae] flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#0b1c30] leading-snug">
                    {language === 'mr' ? 'मागील महिन्याची थकीत रक्कम' : "Last month's dues still pending"}
                  </p>
                  <p className="text-[12px] text-[#5a4138] leading-tight">
                    {language === 'mr'
                      ? `${formatNum(overdueCustomers.length)} ग्राहकांनी अजून पूर्ण रक्कम दिली नाही`
                      : `${formatNum(overdueCustomers.length)} customers haven't cleared their bill yet`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-0.5">
                {overdueCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-[#fff3f0] rounded-xl px-2.5 py-1.5"
                  >
                    <span className="text-[12.5px] font-semibold text-[#0b1c30] truncate">{c.name}</span>
                    <span className="text-[12.5px] font-bold text-[#ba1a1a]">{formatCurrency(c.due)}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onGoToReports}
                className="w-full h-9 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white text-[12px] font-bold active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                <span>{language === 'mr' ? 'अहवालात बघा' : 'View in Reports'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
