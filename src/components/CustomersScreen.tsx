import React, { useState } from 'react';
import { Customer, DayDelivery } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { findUpcomingLeaveRange } from '../utils/dateUtils';

interface CustomersScreenProps {
  customers: Customer[];
  dayDeliveries: Record<string, DayDelivery>;
  onOpenAddModal: () => void;
  onOpenEditModal: (customer: Customer) => void;
  onToggleCustomerStatus: (customerId: string, status: 'active' | 'inactive') => void;
  onDeleteCustomer?: (customerId: string) => void;
  onMarkLeaveRange?: (
    customerId: string,
    fromDateKey: string,
    toDateKey: string,
    previousFromDateKey?: string,
    previousToDateKey?: string
  ) => void;
  onClearLeaveRange?: (customerId: string, fromDateKey: string, toDateKey: string) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  dayDeliveries,
  onOpenAddModal,
  onOpenEditModal,
  onToggleCustomerStatus,
  onDeleteCustomer,
  onMarkLeaveRange,
  onClearLeaveRange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'leave'>('all');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerForLeave, setCustomerForLeave] = useState<Customer | null>(null);
  const [existingLeaveRange, setExistingLeaveRange] = useState<{ from: string; to: string } | null>(null);
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const { language, t, formatNum } = useLanguage();

  const activeCustomers = customers.filter((c) => c.status === 'active');
  const inactiveCustomers = customers.filter((c) => c.status === 'inactive');

  const leaveRangeByCustomerId: Record<string, { from: string; to: string } | null> = {};
  activeCustomers.forEach((c) => {
    leaveRangeByCustomerId[c.id] = findUpcomingLeaveRange(c.id, dayDeliveries, c.mealTiming);
  });
  const onLeaveCustomers = activeCustomers.filter((c) => leaveRangeByCustomerId[c.id]);

  const formatLeaveBadge = (from: string, to: string): string => {
    const fmt = (key: string) => {
      const [, m, d] = key.split('-');
      const monthNamesMr = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const months = language === 'mr' ? monthNamesMr : monthNamesEn;
      return `${Number(d)} ${months[Number(m) - 1]}`;
    };
    return from === to ? fmt(from) : `${fmt(from)} - ${fmt(to)}`;
  };

  const filteredActive = activeCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInactive = inactiveCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOnLeave = onLeaveCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Under "All", on-leave customers get their own dedicated, clearly labeled
  // section instead of being mixed in with everyone else - so exclude them
  // from the regular Active list there to avoid showing each one twice.
  const activeListForDisplay =
    filter === 'all' ? filteredActive.filter((c) => !leaveRangeByCustomerId[c.id]) : filteredActive;

  const hasAnyMatches =
    filter === 'all'
      ? filteredActive.length > 0 || filteredInactive.length > 0
      : filter === 'active'
      ? filteredActive.length > 0
      : filter === 'leave'
      ? filteredOnLeave.length > 0
      : filteredInactive.length > 0;

  return (
    <div className="flex flex-col w-full pb-20 pt-1 space-y-3.5">
      {/* 1. Header Action Row */}
      <section className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="font-headline-lg-mobile text-[24px] text-[#0b1c30] font-bold tracking-tight">
            {t('customerList')}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold bg-[#ffdbce] text-[#370e00]">
            {formatNum(customers.length)} {language === 'mr' ? 'ग्राहक' : 'Customers'}
          </span>
        </div>

        <button
          type="button"
          aria-label={t('newCustomer')}
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-full bg-[#a33900] text-white font-label-lg text-[14px] font-bold shadow-sm hover:bg-[#8d4b00] active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>+ {t('newCustomer')}</span>
        </button>
      </section>

      {/* Visual Delight Micro-Banner */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#eff4ff] shadow-sm border border-[#eff4ff]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#7cf994]/60 text-[#007230] flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              soup_kitchen
            </span>
          </div>
          <div className="truncate">
            <p className="font-headline-sm text-[15px] text-[#0b1c30] font-bold truncate leading-tight">
              {language === 'mr' ? 'घरचा अस्सल स्वाद' : 'Authentic Homemade Taste'}
            </p>
            <p className="font-body-sm text-[12px] text-[#5a4138] truncate">
              {language === 'mr' ? 'दुपार डबे वाटप वेळेत पूर्ण करा!' : 'Complete lunch deliveries on time!'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-[#7cf994] text-[#007230] font-label-sm text-[11px] font-bold shrink-0">
          {formatNum(activeCustomers.length)} {t('statusActive')}
        </span>
      </div>

      {/* 2. Search & Filter Bar */}
      <section className="space-y-2">
        {/* Search Bar */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] text-[22px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchCustomerPlaceholder')}
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#ffffff] text-[#0b1c30] placeholder:text-[#5a4138]/60 font-body-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#a33900]/40 shadow-sm border border-[#eff4ff]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] hover:text-[#0b1c30]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex items-center gap-1 h-9 px-4 rounded-full font-label-md text-[12px] shrink-0 transition-all ${
              filter === 'all'
                ? 'bg-[#a33900] text-white font-bold shadow-sm'
                : 'bg-[#ffffff] text-[#5a4138] border border-[#eff4ff]'
            }`}
          >
            <span>{t('filterAll')} ({formatNum(customers.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`flex items-center gap-1 h-9 px-4 rounded-full font-label-md text-[12px] shrink-0 transition-all ${
              filter === 'active'
                ? 'bg-[#a33900] text-white font-bold shadow-sm'
                : 'bg-[#ffffff] text-[#5a4138] border border-[#eff4ff]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#006e2d]"></span>
            <span>{t('activeCustomers')} ({formatNum(activeCustomers.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('inactive')}
            className={`flex items-center gap-1 h-9 px-4 rounded-full font-label-md text-[12px] shrink-0 transition-all ${
              filter === 'inactive'
                ? 'bg-[#a33900] text-white font-bold shadow-sm'
                : 'bg-[#ffffff] text-[#5a4138] border border-[#eff4ff]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#8e7166]"></span>
            <span>{t('inactiveCustomers')} ({formatNum(inactiveCustomers.length)})</span>
          </button>

          {onLeaveCustomers.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('leave')}
              className={`flex items-center gap-1 h-9 px-4 rounded-full font-label-md text-[12px] shrink-0 transition-all ${
                filter === 'leave'
                  ? 'bg-[#8d4b00] text-white font-bold shadow-sm'
                  : 'bg-[#ffffff] text-[#8d4b00] border border-[#ffdcc3]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">flight_takeoff</span>
              <span>{language === 'mr' ? 'सुट्टीवर' : 'On Leave'} ({formatNum(onLeaveCustomers.length)})</span>
            </button>
          )}
        </div>
      </section>

      {/* Empty Search State */}
      {!hasAnyMatches && (
        <section className="rounded-2xl bg-[#ffffff] p-6 flex flex-col items-center justify-center text-center shadow-sm space-y-3 border border-[#eff4ff]">
          <div className="w-16 h-16 rounded-full bg-[#ffdbce] flex items-center justify-center text-[#a33900]">
            <span
              className="material-symbols-outlined text-[36px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              takeout_dining
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="font-headline-sm text-[16px] text-[#0b1c30] font-bold">
              {t('noCustomersAddedYet')}
            </h3>
            <p className="font-body-sm text-[12px] text-[#5a4138] max-w-xs mx-auto">
              {t('noCustomersDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-2 flex items-center gap-2 h-11 px-5 rounded-full bg-[#a33900] text-white font-label-lg text-[13px] font-bold shadow-md active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ {t('addFirstCustomer')}</span>
          </button>
        </section>
      )}

      {/* 3. Active Customers Section */}
      {(filter === 'all' || filter === 'active') && activeListForDisplay.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-sm text-[16px] text-[#0b1c30] font-bold flex items-center gap-1.5">
              <span>{t('activeCustomers')}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#7cf994] text-[#007230] font-bold">
                {formatNum(activeListForDisplay.length)}
              </span>
            </h3>
            <span className="font-label-sm text-[11px] text-[#5a4138]">
              {language === 'mr' ? 'आज चालू' : 'Active Today'}
            </span>
          </div>

          {/* Active Cards Stack */}
          <div className="space-y-2.5">
            {activeListForDisplay.map((cust) => (
              <article
                key={cust.id}
                className="bg-[#ffffff] rounded-2xl p-3.5 shadow-sm transition-all relative overflow-hidden border border-[#eff4ff]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full font-headline-sm text-[18px] flex items-center justify-center shrink-0 font-bold ${cust.avatarBg}`}
                    >
                      {cust.initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-headline-sm text-[16px] text-[#0b1c30] font-bold leading-snug truncate">
                          {cust.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7cf994] text-[#007230]">
                          {t('statusActive')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cust.dietType === 'non-veg'
                              ? 'bg-[#ffcdd2] text-[#b71c1c]'
                              : 'bg-[#c8e6c9] text-[#1b5e20]'
                          }`}
                        >
                          {cust.dietType === 'non-veg'
                            ? (language === 'mr' ? 'मांसाहारी' : 'Non-Veg')
                            : (language === 'mr' ? 'शाकाहारी' : 'Veg')}
                        </span>
                        {leaveRangeByCustomerId[cust.id] && (
                          <button
                            type="button"
                            onClick={() => {
                              const range = leaveRangeByCustomerId[cust.id];
                              setExistingLeaveRange(range);
                              setLeaveFrom(range?.from || '');
                              setLeaveTo(range?.to || '');
                              setCustomerForLeave(cust);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffdcc3] text-[#6e3900] hover:bg-[#ffcda3] active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-[11px]">flight_takeoff</span>
                            <span>
                              {language === 'mr' ? 'सुट्टी: ' : 'Leave: '}
                              {formatLeaveBadge(
                                leaveRangeByCustomerId[cust.id]!.from,
                                leaveRangeByCustomerId[cust.id]!.to
                              )}
                            </span>
                          </button>
                        )}
                      </div>
                      <a
                        href={`tel:${cust.phone}`}
                        className="inline-flex items-center gap-1 text-[#007230] font-label-md text-[13px] font-semibold mt-0.5 active:opacity-75"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>{language === 'mr' ? `मो. ${cust.phone}` : `Mob. ${cust.phone}`}</span>
                      </a>
                      <p className="font-body-sm text-[12px] text-[#5a4138] mt-0.5 flex items-center gap-1 line-clamp-1">
                        <span className="material-symbols-outlined text-[15px] shrink-0">location_on</span>
                        <span className="truncate">{cust.address}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={() => onOpenEditModal(cust)}
                      className="w-9 h-9 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#5a4138] active:scale-90 hover:bg-[#dce9ff] transition-transform"
                      title={language === 'mr' ? 'संपादन' : 'Edit'}
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    {onMarkLeaveRange && (
                      <button
                        type="button"
                        aria-label="Mark leave for a period"
                        onClick={() => {
                          const range = leaveRangeByCustomerId[cust.id];
                          setExistingLeaveRange(range);
                          setLeaveFrom(range?.from || '');
                          setLeaveTo(range?.to || '');
                          setCustomerForLeave(cust);
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                          leaveRangeByCustomerId[cust.id]
                            ? 'bg-[#ffdcc3] text-[#6e3900] hover:bg-[#ffcda3]'
                            : 'bg-[#eff4ff] text-[#8d4b00] hover:bg-[#ffdcc3]'
                        }`}
                        title={
                          leaveRangeByCustomerId[cust.id]
                            ? (language === 'mr' ? 'सुट्टी संपादित करा' : 'Edit Leave Period')
                            : (language === 'mr' ? 'सुट्टी कालावधी' : 'Mark Leave Period')
                        }
                      >
                        <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Deactivate"
                      onClick={() => onToggleCustomerStatus(cust.id, 'inactive')}
                      className="w-9 h-9 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#ba1a1a] active:scale-90 hover:bg-[#ffdad6] transition-transform"
                      title={language === 'mr' ? 'बंद करा' : 'Deactivate'}
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                    {onDeleteCustomer && (
                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => setCustomerToDelete(cust)}
                        className="w-9 h-9 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#ba1a1a] active:scale-90 hover:bg-[#ffdad6] transition-transform"
                        title={language === 'mr' ? 'कायमचा हटवा' : 'Delete'}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Plan Summary Strip */}
                <div className="mt-3 pt-2 flex items-center justify-between gap-2 bg-[#eff4ff] -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-2xl">
                  <span className="inline-flex items-center gap-1 font-label-sm text-[11px] font-semibold text-[#a33900]">
                    <span className="material-symbols-outlined text-[14px]">lunch_dining</span>
                    <span>
                      {cust.mealTiming === 'both'
                        ? t('mealTimingBoth')
                        : cust.mealTiming === 'morning'
                        ? t('mealTimingMorning')
                        : t('mealTimingNight')}
                    </span>
                  </span>
                  <span className="font-label-sm text-[11px] text-[#5a4138] font-bold">
                    {language === 'mr'
                      ? cust.monthlyCharge
                      : `₹${cust.ratePerTiffin} / tiffin`}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* On Leave Section (dedicated filter view) */}
      {(filter === 'all' || filter === 'leave') && filteredOnLeave.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-sm text-[16px] text-[#0b1c30] font-bold flex items-center gap-1.5">
              <span>{language === 'mr' ? 'सुट्टीवरील ग्राहक' : 'Customers On Leave'}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#ffdcc3] text-[#6e3900] font-bold">
                {formatNum(filteredOnLeave.length)}
              </span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {filteredOnLeave.map((cust) => {
              const range = leaveRangeByCustomerId[cust.id]!;
              return (
                <article
                  key={cust.id}
                  className="bg-[#fff8f0] rounded-2xl p-3.5 shadow-sm border border-[#ffdcc3] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full font-headline-sm text-[18px] flex items-center justify-center shrink-0 font-bold ${cust.avatarBg}`}
                    >
                      {cust.initial}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-headline-sm text-[15px] text-[#0b1c30] font-bold truncate">
                        {cust.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6e3900] mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">flight_takeoff</span>
                        {formatLeaveBadge(range.from, range.to)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExistingLeaveRange(range);
                      setLeaveFrom(range.from);
                      setLeaveTo(range.to);
                      setCustomerForLeave(cust);
                    }}
                    className="h-9 px-3 rounded-full bg-[#ffdcc3] text-[#6e3900] font-label-sm text-[12px] font-bold hover:bg-[#ffcda3] active:scale-95 transition-all shrink-0"
                  >
                    {language === 'mr' ? 'संपादन' : 'Edit'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Deactivated Customers Section */}
      {(filter === 'all' || filter === 'inactive') && filteredInactive.length > 0 && (
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-sm text-[16px] text-[#0b1c30] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#8e7166] text-[20px]">pause_circle</span>
              <span>{t('inactiveCustomers')}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#5a4138] font-bold">
                {formatNum(filteredInactive.length)}
              </span>
            </h3>
            <span className="font-label-sm text-[11px] text-[#5a4138]">
              {language === 'mr' ? 'हंगामी सुट्टी' : 'On Leave'}
            </span>
          </div>

          <div className="space-y-2">
            {filteredInactive.map((cust) => (
              <article
                key={cust.id}
                className="opacity-90 bg-[#eff4ff] rounded-2xl p-3 shadow-sm transition-all border border-[#e5eeff]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#cbdbf5] text-[#5a4138] font-headline-sm text-[18px] flex items-center justify-center shrink-0 font-bold">
                      {cust.initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-headline-sm text-[15px] text-[#5a4138] font-bold truncate">
                          {cust.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#cbdbf5] text-[#5a4138]">
                          {t('statusInactive')}
                        </span>
                      </div>
                      <p className="font-body-sm text-[12px] text-[#5a4138]">
                        {language === 'mr' ? `मो. ${cust.phone}` : `Mob. ${cust.phone}`}
                      </p>
                      <p className="font-body-sm text-[12px] text-[#5a4138]/80 truncate mt-0.5">
                        {cust.address}
                      </p>
                      <p className="font-label-sm text-[11px] text-[#ba1a1a] font-medium mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">event_busy</span>
                        <span>
                          {language === 'mr'
                            ? `बंद केल्याची तारीख: ${cust.deactivatedDate || '१५ ऑगस्ट'}`
                            : `Deactivated: ${cust.deactivatedDate || 'Aug 15'}`}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Inactive Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={() => onOpenEditModal(cust)}
                      className="w-8 h-8 rounded-full bg-[#ffffff] flex items-center justify-center text-[#5a4138] active:scale-90 hover:bg-[#dce9ff] transition-transform shadow-xs"
                      title={language === 'mr' ? 'संपादन' : 'Edit'}
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    {onDeleteCustomer && (
                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => setCustomerToDelete(cust)}
                        className="w-8 h-8 rounded-full bg-[#ffffff] flex items-center justify-center text-[#ba1a1a] active:scale-90 hover:bg-[#ffdad6] transition-transform shadow-xs"
                        title={language === 'mr' ? 'कायमचा हटवा' : 'Delete'}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Reactivate"
                      onClick={() => onToggleCustomerStatus(cust.id, 'active')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#006e2d] text-white font-label-md text-[12px] font-semibold shrink-0 shadow-sm active:scale-95 transition-transform hover:bg-[#005320]"
                    >
                      <span className="material-symbols-outlined text-[15px]">replay</span>
                      <span>{t('reactivateCustomer')}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Peace of mind footer */}
      <div className="flex items-center justify-center py-2">
        <span className="font-body-sm text-[12px] text-[#5a4138] flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px] text-[#006e2d]">verified</span>
          <span>
            {language === 'mr'
              ? 'सर्व माहिती सुरक्षित आणि तुमच्या डिव्हाइसवर साठवली आहे'
              : 'All data is securely saved on your device'}
          </span>
        </span>
      </div>

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center space-y-3.5 border border-[#eff4ff]">
            <div className="w-14 h-14 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold">
                {language === 'mr' ? 'ग्राहक कायमचा काढायचा आहे?' : 'Delete Customer?'}
              </h4>
              <p className="font-body-sm text-[13px] text-[#5a4138] mt-1.5 leading-relaxed">
                <strong className="text-[#0b1c30] font-semibold">{customerToDelete.name}</strong>
                {language === 'mr'
                  ? ' आणि त्यांच्या सर्व नोंदी कायमच्या काढून टाकल्या जातील.'
                  : ' and all their daily delivery records will be permanently removed.'}
              </p>
            </div>
            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 h-11 rounded-full bg-[#eff4ff] text-[#0b1c30] font-label-lg text-[14px] font-semibold hover:bg-[#dce9ff] active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCustomer) {
                    onDeleteCustomer(customerToDelete.id);
                  }
                  setCustomerToDelete(null);
                }}
                className="flex-1 h-11 rounded-full bg-[#ba1a1a] text-white font-label-lg text-[14px] font-bold shadow-md hover:bg-[#93000a] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>{language === 'mr' ? 'हटवा' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Leave Period Modal */}
      {customerForLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center space-y-3.5 border border-[#eff4ff]">
            <div className="w-14 h-14 rounded-full bg-[#ffdcc3] text-[#6e3900] flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[28px]">flight_takeoff</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold">
                {existingLeaveRange
                  ? (language === 'mr' ? 'सुट्टीचा कालावधी संपादित करा' : 'Edit Leave Period')
                  : (language === 'mr' ? 'सुट्टीचा कालावधी निवडा' : 'Pick Leave Period')}
              </h4>
              <p className="font-body-sm text-[13px] text-[#5a4138] mt-1.5 leading-relaxed">
                <strong className="text-[#0b1c30] font-semibold">{customerForLeave.name}</strong>
                {language === 'mr'
                  ? ' यांचे या कालावधीतील सर्व प्रलंबित डबे सुट्टी म्हणून नोंदवले जातील.'
                  : "'s pending tiffins in this date range will be marked as leave."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <label className="flex flex-col gap-1 text-left">
                <span className="font-label-sm text-[11px] text-[#5a4138] font-semibold">
                  {language === 'mr' ? 'पासून' : 'From'}
                </span>
                <input
                  type="date"
                  value={leaveFrom}
                  onChange={(e) => setLeaveFrom(e.target.value)}
                  className="h-10 px-2 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-[#dce9ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-left">
                <span className="font-label-sm text-[11px] text-[#5a4138] font-semibold">
                  {language === 'mr' ? 'पर्यंत' : 'To'}
                </span>
                <input
                  type="date"
                  value={leaveTo}
                  onChange={(e) => setLeaveTo(e.target.value)}
                  className="h-10 px-2 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-[#dce9ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]/30"
                />
              </label>
            </div>
            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => {
                  setCustomerForLeave(null);
                  setExistingLeaveRange(null);
                }}
                className="flex-1 h-11 rounded-full bg-[#eff4ff] text-[#0b1c30] font-label-lg text-[14px] font-semibold hover:bg-[#dce9ff] active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={!leaveFrom || !leaveTo}
                onClick={() => {
                  if (onMarkLeaveRange && leaveFrom && leaveTo) {
                    onMarkLeaveRange(
                      customerForLeave.id,
                      leaveFrom,
                      leaveTo,
                      existingLeaveRange?.from,
                      existingLeaveRange?.to
                    );
                  }
                  setCustomerForLeave(null);
                  setExistingLeaveRange(null);
                }}
                className="flex-1 h-11 rounded-full bg-[#8d4b00] text-white font-label-lg text-[14px] font-bold shadow-md hover:bg-[#6e3900] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">event_busy</span>
                <span>
                  {existingLeaveRange
                    ? (language === 'mr' ? 'अद्ययावत करा' : 'Update')
                    : (language === 'mr' ? 'सुट्टी नोंदवा' : 'Mark Leave')}
                </span>
              </button>
            </div>
            {existingLeaveRange && onClearLeaveRange && (
              <button
                type="button"
                onClick={() => {
                  onClearLeaveRange(customerForLeave.id, existingLeaveRange.from, existingLeaveRange.to);
                  setCustomerForLeave(null);
                  setExistingLeaveRange(null);
                }}
                className="w-full h-10 rounded-full bg-[#ffdad6]/60 text-[#ba1a1a] font-label-md text-[13px] font-semibold hover:bg-[#ffdad6] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>{language === 'mr' ? 'सुट्टी पूर्णपणे रद्द करा' : 'Cancel Leave Entirely'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
