import React from 'react';
import { ActiveTab } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom,0px)] bg-[#ffffff]/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(11,28,48,0.06)] border-t border-[#eff4ff]">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-3">
        {/* Tab 1: आज / Today */}
        <button
          type="button"
          onClick={() => onTabChange('today')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'today'
              ? 'text-[#a33900] font-headline-sm font-semibold'
              : 'text-[#5a4138] hover:text-[#0b1c30]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: activeTab === 'today' ? "'FILL' 1" : "'FILL' 0" }}
          >
            event_available
          </span>
          <span className="font-label-md text-[12px]">{t('tabToday')}</span>
        </button>

        {/* Tab 2: ग्राहक / Customers */}
        <button
          type="button"
          onClick={() => onTabChange('customers')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'customers'
              ? 'text-[#a33900] font-headline-sm font-semibold'
              : 'text-[#5a4138] hover:text-[#0b1c30]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: activeTab === 'customers' ? "'FILL' 1" : "'FILL' 0" }}
          >
            group
          </span>
          <span className="font-label-md text-[12px]">{t('tabCustomers')}</span>
        </button>

        {/* Tab 3: अहवाल / Reports */}
        <button
          type="button"
          onClick={() => onTabChange('reports')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'reports'
              ? 'text-[#a33900] font-headline-sm font-semibold'
              : 'text-[#5a4138] hover:text-[#0b1c30]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: activeTab === 'reports' ? "'FILL' 1" : "'FILL' 0" }}
          >
            bar_chart
          </span>
          <span className="font-label-md text-[12px]">{t('tabReports')}</span>
        </button>
      </div>
    </nav>
  );
};
